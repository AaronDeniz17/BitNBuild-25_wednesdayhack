// Browse Students page for GigCampus
// Allows clients to browse and search for talented students

import { useState, useEffect } from 'react';
import { useQuery } from 'react-query';
import Link from 'next/link';
import { 
  MagnifyingGlassIcon,
  Cog6ToothIcon,
  StarIcon,
  MapPinIcon,
  ClockIcon,
  AcademicCapIcon,
  UserIcon
} from '@heroicons/react/24/outline';

import Layout from '../components/Layout/Layout';
import { useAuth } from '../contexts/AuthContext';
import { projectsAPI } from '../lib/api';
import { formatCurrency } from '../lib/auth';

const StudentsPage = () => {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    skills: [],
    university: '',
    availability: '',
    minRating: 0,
    maxHourlyRate: 100
  });
  const [showFilters, setShowFilters] = useState(false);

  // Fetch students data
  const { data: studentsData, isLoading, error } = useQuery(
    ['students', searchQuery, filters],
    async () => {
      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);
      if (filters.university) params.append('university', filters.university);
      if (filters.availability) params.append('availability', filters.availability);
      if (filters.minRating > 0) params.append('min_rating', filters.minRating);
      if (filters.maxHourlyRate < 100) params.append('max_rate', filters.maxHourlyRate);
      params.append('limit', '50');
      
      const response = await fetch(`http://localhost:5000/api/analytics/students/browse?${params}`);
      if (!response.ok) throw new Error('Failed to fetch students');
      return response.json();
    },
    {
      enabled: !!user,
      retry: 1
    }
  );

  // Mock student data for demonstration (remove when API is working)
  const mockStudents = [
    {
      id: '1',
      name: 'Alice Johnson',
      email: 'alice@university.edu',
      university: 'MIT',
      university_major: 'Computer Science',
      graduation_year: 2024,
      bio: 'Full-stack developer with experience in React, Node.js, and Python. Passionate about creating innovative web applications.',
      skills: ['React', 'Node.js', 'Python', 'MongoDB', 'AWS'],
      hourly_rate: 25,
      availability: 'part-time',
      average_rating: 4.8,
      total_reviews: 12,
      completed_projects: 8,
      university_verified: true,
      portfolio_links: ['https://github.com/alice', 'https://aliceportfolio.com']
    },
    {
      id: '2',
      name: 'Bob Smith',
      email: 'bob@stanford.edu',
      university: 'Stanford University',
      university_major: 'Data Science',
      graduation_year: 2025,
      bio: 'Data scientist specializing in machine learning and AI. Experience with Python, R, and TensorFlow.',
      skills: ['Python', 'Machine Learning', 'TensorFlow', 'R', 'SQL'],
      hourly_rate: 30,
      availability: 'full-time',
      average_rating: 4.9,
      total_reviews: 18,
      completed_projects: 15,
      university_verified: true,
      portfolio_links: ['https://github.com/bobsmith']
    },
    {
      id: '3',
      name: 'Carol Davis',
      email: 'carol@berkeley.edu',
      university: 'UC Berkeley',
      university_major: 'Design',
      graduation_year: 2024,
      bio: 'UI/UX designer with a passion for creating beautiful and functional user interfaces.',
      skills: ['UI/UX Design', 'Figma', 'Adobe Creative Suite', 'Prototyping'],
      hourly_rate: 22,
      availability: 'part-time',
      average_rating: 4.7,
      total_reviews: 9,
      completed_projects: 6,
      university_verified: true,
      portfolio_links: ['https://caroldesigns.com']
    }
  ];

  const students = studentsData?.data?.students || mockStudents;

  // Filter students based on search and filters
  const filteredStudents = students.filter(student => {
    const matchesSearch = !searchQuery || 
      student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.skills.some(skill => skill.toLowerCase().includes(searchQuery.toLowerCase())) ||
      student.university.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesSkills = filters.skills.length === 0 || 
      filters.skills.some(skill => student.skills.includes(skill));

    const matchesUniversity = !filters.university || 
      student.university.toLowerCase().includes(filters.university.toLowerCase());

    const matchesAvailability = !filters.availability || 
      student.availability === filters.availability;

    const matchesRating = student.average_rating >= filters.minRating;

    const matchesRate = student.hourly_rate <= filters.maxHourlyRate;

    return matchesSearch && matchesSkills && matchesUniversity && 
           matchesAvailability && matchesRating && matchesRate;
  });

  if (!user) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
          <div className="text-center animate-fade-in-up">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Please log in to browse students
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              This page is only accessible to logged-in clients.
            </p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8 animate-fade-in-up">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Browse Students
            </h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Find talented students for your next project
            </p>
          </div>

          {/* Search and Filters */}
          <div className="mb-8 animate-slide-in-left">
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Search Bar */}
              <div className="flex-1 relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-gray-500" />
                <input
                  type="text"
                  placeholder="Search by name, skills, or university..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                />
              </div>

              {/* Filter Toggle */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium py-3 px-4 rounded-lg transition-all duration-200 transform hover:scale-105 active:scale-95 flex items-center gap-2 border border-gray-300 dark:border-gray-600"
              >
                <Cog6ToothIcon className="h-5 w-5" />
                Filters
              </button>
            </div>

            {/* Filters Panel */}
            {showFilters && (
              <div className="mt-4 p-6 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 animate-slide-down shadow-sm">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="animate-fade-in-up" style={{ animationDelay: '100ms' }}>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      University
                    </label>
                    <input
                      type="text"
                      placeholder="Filter by university"
                      value={filters.university}
                      onChange={(e) => setFilters({...filters, university: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    />
                  </div>

                  <div className="animate-fade-in-up" style={{ animationDelay: '200ms' }}>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Availability
                    </label>
                    <select
                      value={filters.availability}
                      onChange={(e) => setFilters({...filters, availability: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    >
                      <option value="">Any</option>
                      <option value="full-time">Full-time</option>
                      <option value="part-time">Part-time</option>
                    </select>
                  </div>

                  <div className="animate-fade-in-up" style={{ animationDelay: '300ms' }}>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Min Rating
                    </label>
                    <select
                      value={filters.minRating}
                      onChange={(e) => setFilters({...filters, minRating: parseFloat(e.target.value)})}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    >
                      <option value={0}>Any</option>
                      <option value={4.0}>4.0+</option>
                      <option value={4.5}>4.5+</option>
                      <option value={4.8}>4.8+</option>
                    </select>
                  </div>

                  <div className="animate-fade-in-up" style={{ animationDelay: '400ms' }}>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Max Rate (${filters.maxHourlyRate}/hr)
                    </label>
                    <input
                      type="range"
                      min="10"
                      max="100"
                      value={filters.maxHourlyRate}
                      onChange={(e) => setFilters({...filters, maxHourlyRate: parseInt(e.target.value)})}
                      className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Results */}
          <div className="mb-4 flex items-center justify-between animate-fade-in-up">
            <p className="text-gray-600 dark:text-gray-400">
              {filteredStudents.length} student{filteredStudents.length !== 1 ? 's' : ''} found
            </p>
          </div>

          {/* Students Grid */}
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : error ? (
            <div className="text-center py-12 animate-fade-in-up">
              <p className="text-gray-500 dark:text-gray-400 mb-4">Unable to load students at the moment</p>
              <p className="text-sm text-gray-400 dark:text-gray-500">Showing sample data instead</p>
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="text-center py-12 animate-fade-in-up">
              <UserIcon className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400">No students found matching your criteria</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredStudents.map((student, index) => (
                <div 
                  key={student.id} 
                  className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm hover:shadow-xl dark:shadow-gray-900/20 transition-all duration-300 transform hover:scale-105 hover:-translate-y-2 animate-fade-in-up border border-gray-200 dark:border-gray-700 group"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  {/* Student Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-200">{student.name}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1">
                        <AcademicCapIcon className="h-4 w-4" />
                        {student.university}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-500">{student.university_major}</p>
                    </div>
                    {student.university_verified && (
                      <span className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 text-xs px-2 py-1 rounded-full animate-pulse">
                        Verified
                      </span>
                    )}
                  </div>

                  {/* Bio */}
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-3">
                    {student.bio}
                  </p>

                  {/* Skills */}
                  <div className="mb-4">
                    <div className="flex flex-wrap gap-1">
                      {student.skills.slice(0, 4).map((skill, skillIndex) => (
                        <span
                          key={skillIndex}
                          className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs px-2 py-1 rounded-full hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors duration-200 animate-scale-in"
                          style={{ animationDelay: `${skillIndex * 50}ms` }}
                        >
                          {skill}
                        </span>
                      ))}
                      {student.skills.length > 4 && (
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          +{student.skills.length - 4} more
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400 mb-4">
                    <div className="flex items-center gap-1 hover:text-yellow-500 transition-colors duration-200">
                      <StarIcon className="h-4 w-4 text-yellow-400 animate-pulse" />
                      <span>{student.average_rating}</span>
                      <span>({student.total_reviews})</span>
                    </div>
                    <div className="flex items-center gap-1 hover:text-green-500 transition-colors duration-200">
                      <ClockIcon className="h-4 w-4" />
                      <span className="capitalize">{student.availability}</span>
                    </div>
                  </div>

                  {/* Rate and Action */}
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-lg font-semibold text-gray-900 dark:text-white group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors duration-200">
                        ${student.hourly_rate}/hr
                      </span>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {student.completed_projects} projects completed
                      </p>
                    </div>
                    <Link
                      href={`/auth/user/${student.id}`}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-all duration-200 transform hover:scale-105 active:scale-95 text-sm"
                    >
                      View Profile
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default StudentsPage;
