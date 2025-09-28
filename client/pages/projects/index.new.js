// Projects listing page for GigCampus
import { useState } from 'react';
import { useQuery } from 'react-query';
import Link from 'next/link';
import { 
  MagnifyingGlassIcon,
  FunnelIcon,
  ClockIcon,
  CurrencyDollarIcon,
  UserGroupIcon,
  StarIcon,
  MapPinIcon,
  BriefcaseIcon
} from '@heroicons/react/24/outline';

import Layout from '../../components/Layout/Layout';
import { useAuth } from '../../contexts/AuthContext';
import { formatCurrency, formatDate, getRelativeTime } from '../../lib/utils';

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

  // Fetch projects with improved error handling
  const { data: projectsData, isLoading, error, refetch } = useQuery(
    ['projects', filters],
    async () => {
      try {
        // Get auth token
        let token = null;
        try {
          const authData = localStorage.getItem('gigcampus_auth');
          if (authData) {
            const parsed = JSON.parse(authData);
            token = parsed.token;
          }
        } catch (err) {
          console.warn('Error reading auth token:', err);
        }

        // Build query string from filters
        const queryParams = new URLSearchParams();
        if (filters.category) queryParams.append('category', filters.category);
        if (filters.status) queryParams.append('status', filters.status);
        if (filters.search) queryParams.append('search', filters.search);
        if (filters.minBudget) queryParams.append('min_budget', filters.minBudget);
        if (filters.maxBudget) queryParams.append('max_budget', filters.maxBudget);
        if (filters.skills?.length) queryParams.append('skills', filters.skills.join(','));

        // Make API request
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api'}/projects?${queryParams.toString()}`,
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              ...(token ? { 'Authorization': `Bearer ${token}` } : {})
            }
          }
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to load projects');
        }

        const data = await response.json();
        console.log('Projects API response:', data); // Debug log

        return {
          success: true,
          data: Array.isArray(data.projects) ? data.projects : [],
          pagination: data.pagination || { total: 0, currentPage: 1, totalPages: 1 }
        };
      } catch (error) {
        console.error('Error fetching projects:', error);
        return {
          success: false,
          data: [],
          error: error.message || 'Failed to load projects'
        };
      }
    },
    {
      enabled: true,
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 30000 // Cache results for 30 seconds
    }
  );

  const projects = projectsData?.success ? projectsData.data : [];
  const pagination = projectsData?.pagination;

  // Filter options
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
      [key]: value
    }));
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        {/* Error Message */}
        {(!projectsData?.success || error) && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-red-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <h3 className="text-sm font-medium text-red-800">Failed to load projects</h3>
            </div>
            <p className="mt-2 text-sm text-red-700">{projectsData?.error || error?.message || 'Please try again later'}</p>
            <button 
              onClick={() => refetch()}
              className="mt-3 text-sm font-medium text-red-600 hover:text-red-500 focus:outline-none focus:underline"
            >
              Try again
            </button>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        )}

        {/* Search and filter header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div className="flex-1 w-full md:w-auto">
            <div className="relative">
              <input
                type="text"
                placeholder="Search projects..."
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
              />
              <MagnifyingGlassIcon className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
            </div>
          </div>
          
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <FunnelIcon className="h-5 w-5 mr-2" />
            Filters
          </button>
        </div>

        {/* Filter panel */}
        {showFilters && (
          <div className="mb-8 p-4 bg-gray-50 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Category filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category
                </label>
                <select
                  className="w-full p-2 border rounded-lg"
                  value={filters.category}
                  onChange={(e) => handleFilterChange('category', e.target.value)}
                >
                  <option value="">All Categories</option>
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category.charAt(0).toUpperCase() + category.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Budget range */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Budget Range
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    placeholder="Min"
                    className="w-full p-2 border rounded-lg"
                    value={filters.minBudget}
                    onChange={(e) => handleFilterChange('minBudget', e.target.value)}
                  />
                  <span className="text-gray-500">-</span>
                  <input
                    type="number"
                    placeholder="Max"
                    className="w-full p-2 border rounded-lg"
                    value={filters.maxBudget}
                    onChange={(e) => handleFilterChange('maxBudget', e.target.value)}
                  />
                </div>
              </div>

              {/* Skills */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Skills
                </label>
                <select
                  multiple
                  className="w-full p-2 border rounded-lg"
                  value={filters.skills}
                  onChange={(e) => handleFilterChange('skills', 
                    Array.from(e.target.selectedOptions, option => option.value)
                  )}
                >
                  {skills.map((skill) => (
                    <option key={skill} value={skill}>
                      {skill}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Projects grid */}
        {!isLoading && projects.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">No projects found matching your criteria.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <Link
                key={project.id}
                href={`/projects/${project.id}`}
                className="block hover:shadow-lg transition-shadow duration-200"
              >
                <div className="border rounded-lg p-6 h-full">
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">
                      {project.title}
                    </h3>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      {project.status}
                    </span>
                  </div>
                  
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                    {project.description}
                  </p>
                  
                  <div className="space-y-2">
                    <div className="flex items-center text-sm text-gray-500">
                      <CurrencyDollarIcon className="h-4 w-4 mr-2" />
                      {formatCurrency(project.budget)}
                    </div>
                    
                    <div className="flex items-center text-sm text-gray-500">
                      <ClockIcon className="h-4 w-4 mr-2" />
                      {getRelativeTime(project.deadline)}
                    </div>

                    {project.teamSize && (
                      <div className="flex items-center text-sm text-gray-500">
                        <UserGroupIcon className="h-4 w-4 mr-2" />
                        {project.teamSize} team members
                      </div>
                    )}
                  </div>

                  {project.skills && project.skills.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {project.skills.slice(0, 3).map((skill) => (
                        <span
                          key={skill}
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                        >
                          {skill}
                        </span>
                      ))}
                      {project.skills.length > 3 && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          +{project.skills.length - 3} more
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="mt-8 flex justify-center">
            <nav className="inline-flex rounded-md shadow">
              <button
                onClick={() => handleFilterChange('page', Math.max(1, pagination.currentPage - 1))}
                disabled={pagination.currentPage === 1}
                className="px-3 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Previous
              </button>
              <button
                onClick={() => handleFilterChange('page', Math.min(pagination.totalPages, pagination.currentPage + 1))}
                disabled={pagination.currentPage === pagination.totalPages}
                className="px-3 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Next
              </button>
            </nav>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default ProjectsPage;