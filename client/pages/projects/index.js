// Projects listing page for GigCampus
// Browse and filter projects

import { useState, useEffect } from 'react';
import { useQuery } from 'react-query';
import Link from 'next/link';
import { 
  MagnifyingGlassIcon,
  FunnelIcon,
  ClockIcon,
  CurrencyDollarIcon,
  UserGroupIcon,
  StarIcon,
  MapPinIcon
} from '@heroicons/react/outline';

import Layout from '../../components/Layout/Layout';
import { useAuth } from '../../contexts/AuthContext';
import { projectsAPI } from '../../lib/api';
import { formatCurrency, formatDate, getRelativeTime } from '../../lib/auth';

const ProjectsPage = () => {
  const { user, isAuthenticated } = useAuth();
  const [filters, setFilters] = useState({
    search: '',
    category: '',
    minBudget: '',
    maxBudget: '',
    skills: [],
    status: 'open',
  });
  const [showFilters, setShowFilters] = useState(false);

  // Fetch projects
  const { data: projectsData, isLoading, refetch } = useQuery(
    ['projects', filters],
    () => projectsAPI.getProjects(filters),
    {
      enabled: isAuthenticated,
    }
  );

  const projects = projectsData?.projects || [];
  const pagination = projectsData?.pagination;

  const categories = [
    'web-development',
    'mobile-development',
    'design',
    'writing',
    'marketing',
    'data-science',
    'other',
  ];

  const skills = [
    'React',
    'Node.js',
    'Python',
    'JavaScript',
    'UI/UX',
    'Graphic Design',
    'Content Writing',
    'Social Media',
    'Data Analysis',
    'Machine Learning',
  ];

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleSearch = (e) => {
    e.preventDefault();
    refetch();
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      category: '',
      minBudget: '',
      maxBudget: '',
      skills: [],
      status: 'open',
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'open':
        return 'badge-success';
      case 'in_progress':
        return 'badge-primary';
      case 'completed':
        return 'badge-gray';
      default:
        return 'badge-gray';
    }
  };

  const getUrgencyColor = (urgency) => {
    switch (urgency) {
      case 'high':
        return 'text-red-600';
      case 'medium':
        return 'text-yellow-600';
      case 'low':
        return 'text-green-600';
      default:
        return 'text-gray-600';
    }
  };

  if (!isAuthenticated) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Please sign in</h1>
            <p className="text-gray-600 mb-8">You need to be signed in to view projects.</p>
            <Link href="/login" className="btn-primary">
              Sign In
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Projects</h1>
            <p className="text-gray-600 mt-2">
              Find your next opportunity or post a new project.
            </p>
          </div>

          {/* Search and Filters */}
          <div className="card p-6 mb-8">
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Search */}
              <form onSubmit={handleSearch} className="flex-1">
                <div className="relative">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search projects..."
                    value={filters.search}
                    onChange={(e) => handleFilterChange('search', e.target.value)}
                    className="input pl-10 w-full"
                  />
                </div>
              </form>

              {/* Filter Toggle */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="btn-secondary flex items-center"
              >
                <FunnelIcon className="h-5 w-5 mr-2" />
                Filters
              </button>

              {/* Post Project Button */}
              {user?.role === 'client' && (
                <Link href="/projects/create" className="btn-primary">
                  Post Project
                </Link>
              )}
            </div>

            {/* Advanced Filters */}
            {showFilters && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Category */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Category
                    </label>
                    <select
                      value={filters.category}
                      onChange={(e) => handleFilterChange('category', e.target.value)}
                      className="input"
                    >
                      <option value="">All Categories</option>
                      {categories.map(category => (
                        <option key={category} value={category}>
                          {category.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Budget Range */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Min Budget
                    </label>
                    <input
                      type="number"
                      placeholder="Min amount"
                      value={filters.minBudget}
                      onChange={(e) => handleFilterChange('minBudget', e.target.value)}
                      className="input"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Max Budget
                    </label>
                    <input
                      type="number"
                      placeholder="Max amount"
                      value={filters.maxBudget}
                      onChange={(e) => handleFilterChange('maxBudget', e.target.value)}
                      className="input"
                    />
                  </div>

                  {/* Skills */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Skills
                    </label>
                    <select
                      multiple
                      value={filters.skills}
                      onChange={(e) => handleFilterChange('skills', Array.from(e.target.selectedOptions, option => option.value))}
                      className="input"
                    >
                      {skills.map(skill => (
                        <option key={skill} value={skill}>{skill}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex justify-end mt-4 space-x-3">
                  <button
                    onClick={clearFilters}
                    className="btn-secondary"
                  >
                    Clear Filters
                  </button>
                  <button
                    onClick={() => {
                      refetch();
                      setShowFilters(false);
                    }}
                    className="btn-primary"
                  >
                    Apply Filters
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Projects Grid */}
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="loading-spinner-lg"></div>
            </div>
          ) : projects.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.map((project) => (
                <div key={project.id} className="card hover:shadow-lg transition-shadow">
                  <div className="card-body">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">
                        {project.title}
                      </h3>
                      <span className={`badge ${getStatusColor(project.status)} ml-2`}>
                        {project.status}
                      </span>
                    </div>

                    {/* Description */}
                    <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                      {project.description}
                    </p>

                    {/* Skills */}
                    <div className="flex flex-wrap gap-1 mb-4">
                      {project.required_skills?.slice(0, 3).map((skill, index) => (
                        <span key={index} className="badge-gray text-xs">
                          {skill}
                        </span>
                      ))}
                      {project.required_skills?.length > 3 && (
                        <span className="badge-gray text-xs">
                          +{project.required_skills.length - 3} more
                        </span>
                      )}
                    </div>

                    {/* Details */}
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center text-sm text-gray-600">
                        <CurrencyDollarIcon className="h-4 w-4 mr-2" />
                        <span className="font-medium">{formatCurrency(project.budget)}</span>
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <ClockIcon className="h-4 w-4 mr-2" />
                        <span>Due {formatDate(project.deadline)}</span>
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <UserGroupIcon className="h-4 w-4 mr-2" />
                        <span>
                          {project.requires_team ? 'Team project' : 'Individual project'}
                        </span>
                      </div>
                      {project.urgency && (
                        <div className="flex items-center text-sm">
                          <span className={`font-medium ${getUrgencyColor(project.urgency)}`}>
                            {project.urgency} priority
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                      <div className="flex items-center text-sm text-gray-500">
                        <span>Posted {getRelativeTime(project.created_at)}</span>
                      </div>
                      <Link
                        href={`/projects/${project.id}`}
                        className="btn-primary btn-sm"
                      >
                        View Details
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <BriefcaseIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No projects found</h3>
              <p className="text-gray-500 mb-6">
                Try adjusting your search criteria or check back later for new projects.
              </p>
              {user?.role === 'client' && (
                <Link href="/projects/create" className="btn-primary">
                  Post Your First Project
                </Link>
              )}
            </div>
          )}

          {/* Pagination */}
          {pagination && pagination.pages > 1 && (
            <div className="mt-8 flex justify-center">
              <nav className="flex items-center space-x-2">
                <button
                  disabled={pagination.page === 1}
                  className="btn-secondary btn-sm disabled:opacity-50"
                >
                  Previous
                </button>
                <span className="text-sm text-gray-600">
                  Page {pagination.page} of {pagination.pages}
                </span>
                <button
                  disabled={pagination.page === pagination.pages}
                  className="btn-secondary btn-sm disabled:opacity-50"
                >
                  Next
                </button>
              </nav>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default ProjectsPage;
