// Profile Page for GigCampus
// User profile with skills, portfolio, badges, and reviews

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { toast } from 'react-hot-toast';
import {
  UserIcon,
  StarIcon,
  BriefcaseIcon,
  CurrencyDollarIcon,
  AcademicCapIcon,
  MapPinIcon,
  ClockIcon,
  PencilIcon,
  PlusIcon,
  XMarkIcon,
  LinkIcon,
  TrophyIcon
} from '@heroicons/react/24/outline';

import Layout from '../components/Layout/Layout';
import { useAuth } from '../contexts/AuthContext';
import { authAPI, reviewsAPI } from '../lib/api';
import { formatCurrency, formatDate, SKILL_CATEGORIES, getInitials } from '../lib/utils';

const ProfilePage = () => {
  const { user } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { userId } = router.query;
  
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [profileData, setProfileData] = useState({
    name: '',
    bio: '',
    skills: [],
    hourly_rate: '',
    availability: 'part-time',
    portfolio_links: [''],
    university_major: '',
    graduation_year: new Date().getFullYear() + 1,
    languages: [],
    linkedin_url: '',
    github_url: ''
  });

  const isOwnProfile = !userId || userId === user?.id;
  const profileUserId = userId || user?.id;

  // Fetch profile data
  const { data: profile, isLoading } = useQuery(
    ['profile', profileUserId],
    () => isOwnProfile ? authAPI.getProfile() : authAPI.getUserProfile(profileUserId),
    {
      enabled: !!profileUserId,
      onSuccess: (data) => {
        if (isOwnProfile && data?.data) {
          setProfileData({
            name: data.data.name || '',
            bio: data.data.bio || '',
            skills: data.data.skills || [],
            hourly_rate: data.data.hourly_rate || '',
            availability: data.data.availability || 'part-time',
            portfolio_links: data.data.portfolio_links?.length ? data.data.portfolio_links : [''],
            university_major: data.data.university_major || '',
            graduation_year: data.data.graduation_year || new Date().getFullYear() + 1,
            languages: data.data.languages || [],
            linkedin_url: data.data.linkedin_url || '',
            github_url: data.data.github_url || ''
          });
        }
      }
    }
  );

  // Fetch user reviews
  const { data: reviews } = useQuery(
    ['user-reviews', profileUserId],
    () => reviewsAPI.getUserReviews(profileUserId),
    {
      enabled: !!profileUserId
    }
  );

  // Update profile mutation
  const updateProfileMutation = useMutation(
    (updates) => authAPI.updateProfile(updates),
    {
      onSuccess: () => {
        toast.success('Profile updated successfully!');
        setIsEditing(false);
        queryClient.invalidateQueries(['profile', profileUserId]);
      },
      onError: (error) => {
        toast.error(error.response?.data?.error || 'Failed to update profile');
      }
    }
  );

  const handleSaveProfile = () => {
    // Filter out empty portfolio links
    const cleanedData = {
      ...profileData,
      portfolio_links: profileData.portfolio_links.filter(link => link.trim()),
      hourly_rate: profileData.hourly_rate ? parseFloat(profileData.hourly_rate) : null
    };
    
    updateProfileMutation.mutate(cleanedData);
  };

  const addSkill = (skill) => {
    if (!profileData.skills.includes(skill)) {
      setProfileData(prev => ({
        ...prev,
        skills: [...prev.skills, skill]
      }));
    }
  };

  const removeSkill = (skillToRemove) => {
    setProfileData(prev => ({
      ...prev,
      skills: prev.skills.filter(skill => skill !== skillToRemove)
    }));
  };

  const addPortfolioLink = () => {
    setProfileData(prev => ({
      ...prev,
      portfolio_links: [...prev.portfolio_links, '']
    }));
  };

  const removePortfolioLink = (index) => {
    setProfileData(prev => ({
      ...prev,
      portfolio_links: prev.portfolio_links.filter((_, i) => i !== index)
    }));
  };

  const updatePortfolioLink = (index, value) => {
    setProfileData(prev => ({
      ...prev,
      portfolio_links: prev.portfolio_links.map((link, i) => i === index ? value : link)
    }));
  };

  const addLanguage = (language) => {
    if (language.trim() && !profileData.languages.includes(language.trim())) {
      setProfileData(prev => ({
        ...prev,
        languages: [...prev.languages, language.trim()]
      }));
    }
  };

  const removeLanguage = (languageToRemove) => {
    setProfileData(prev => ({
      ...prev,
      languages: prev.languages.filter(lang => lang !== languageToRemove)
    }));
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      </Layout>
    );
  }

  const profileUser = profile?.data;
  if (!profileUser) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <UserIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Profile not found</h3>
            <p className="mt-1 text-sm text-gray-500">The user profile you're looking for doesn't exist.</p>
          </div>
        </div>
      </Layout>
    );
  }

  const averageRating = reviews?.data?.length > 0 
    ? reviews.data.reduce((sum, review) => sum + review.rating, 0) / reviews.data.length 
    : 0;

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Profile Header */}
          <div className="bg-white shadow rounded-lg mb-6">
            <div className="px-6 py-6">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-6">
                  {/* Avatar */}
                  <div className="h-24 w-24 rounded-full bg-blue-500 flex items-center justify-center text-white text-3xl font-bold">
                    {getInitials(profileUser.name)}
                  </div>

                  {/* Basic Info */}
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900">{profileUser.name}</h1>
                    <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                      {profileUser.university && (
                        <div className="flex items-center">
                          <AcademicCapIcon className="h-4 w-4 mr-1" />
                          <span>{profileUser.university}</span>
                          {profileUser.university_verified && (
                            <span className="ml-1 text-green-500">✓</span>
                          )}
                        </div>
                      )}
                      {profileUser.university_major && (
                        <span>• {profileUser.university_major}</span>
                      )}
                      {profileUser.graduation_year && (
                        <span>• Class of {profileUser.graduation_year}</span>
                      )}
                    </div>
                    
                    {profileUser.bio && (
                      <p className="mt-3 text-gray-700 max-w-2xl">{profileUser.bio}</p>
                    )}

                    {/* Quick Stats */}
                    <div className="flex items-center space-x-6 mt-4">
                      <div className="flex items-center text-sm">
                        <StarIcon className="h-4 w-4 text-yellow-500 mr-1" />
                        <span className="font-medium">{averageRating.toFixed(1)}</span>
                        <span className="text-gray-500 ml-1">({reviews?.data?.length || 0} reviews)</span>
                      </div>
                      <div className="flex items-center text-sm">
                        <BriefcaseIcon className="h-4 w-4 text-gray-400 mr-1" />
                        <span>{profileUser.completed_projects || 0} projects completed</span>
                      </div>
                      {profileUser.total_earnings && (
                        <div className="flex items-center text-sm">
                          <CurrencyDollarIcon className="h-4 w-4 text-green-500 mr-1" />
                          <span>{formatCurrency(profileUser.total_earnings)} earned</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-3">
                  {isOwnProfile && (
                    <button
                      onClick={() => isEditing ? handleSaveProfile() : setIsEditing(true)}
                      disabled={updateProfileMutation.isLoading}
                      className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white ${
                        isEditing
                          ? 'bg-green-600 hover:bg-green-700'
                          : 'bg-blue-600 hover:bg-blue-700'
                      } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50`}
                    >
                      <PencilIcon className="h-4 w-4 mr-2" />
                      {updateProfileMutation.isLoading ? 'Saving...' : isEditing ? 'Save Profile' : 'Edit Profile'}
                    </button>
                  )}
                  
                  {isEditing && (
                    <button
                      onClick={() => setIsEditing(false)}
                      className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="mb-6">
            <nav className="flex space-x-8">
              <button
                onClick={() => setActiveTab('overview')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'overview'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Overview
              </button>
              <button
                onClick={() => setActiveTab('portfolio')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'portfolio'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Portfolio
              </button>
              <button
                onClick={() => setActiveTab('reviews')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'reviews'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Reviews ({reviews?.data?.length || 0})
              </button>
              {isOwnProfile && (
                <button
                  onClick={() => setActiveTab('settings')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'settings'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Settings
                </button>
              )}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {activeTab === 'overview' && (
                <>
                  {/* Skills */}
                  <div className="bg-white shadow rounded-lg">
                    <div className="px-6 py-6">
                      <h3 className="text-lg font-medium text-gray-900 mb-4">Skills</h3>
                      
                      {isEditing ? (
                        <div>
                          {/* Skill Categories */}
                          <div className="grid grid-cols-2 gap-4 mb-4 max-h-48 overflow-y-auto border border-gray-200 rounded-lg p-4">
                            {Object.entries(SKILL_CATEGORIES).map(([category, skills]) => (
                              <div key={category}>
                                <h4 className="font-medium text-sm text-gray-600 mb-2">{category}</h4>
                                {skills.map(skill => (
                                  <button
                                    key={skill}
                                    type="button"
                                    onClick={() => addSkill(skill)}
                                    className={`text-xs px-2 py-1 rounded-full mr-1 mb-1 ${
                                      profileData.skills.includes(skill)
                                        ? 'bg-blue-100 text-blue-800'
                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                    }`}
                                  >
                                    {skill}
                                  </button>
                                ))}
                              </div>
                            ))}
                          </div>

                          {/* Selected Skills */}
                          {profileData.skills.length > 0 && (
                            <div className="border-t pt-4">
                              <p className="text-sm font-medium text-gray-700 mb-2">Selected Skills:</p>
                              <div className="flex flex-wrap gap-2">
                                {profileData.skills.map(skill => (
                                  <span
                                    key={skill}
                                    className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800"
                                  >
                                    {skill}
                                    <button
                                      type="button"
                                      onClick={() => removeSkill(skill)}
                                      className="ml-2 text-blue-600 hover:text-blue-800"
                                    >
                                      <XMarkIcon className="h-4 w-4" />
                                    </button>
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          {(profileUser.skills || []).map((skill, index) => (
                            <span
                              key={index}
                              className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800"
                            >
                              {skill}
                            </span>
                          ))}
                          {(!profileUser.skills || profileUser.skills.length === 0) && (
                            <p className="text-gray-500 text-sm">No skills added yet</p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Work Preferences */}
                  {(isOwnProfile || profileUser.availability || profileUser.hourly_rate) && (
                    <div className="bg-white shadow rounded-lg">
                      <div className="px-6 py-6">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Work Preferences</h3>
                        
                        {isEditing ? (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Availability
                              </label>
                              <select
                                value={profileData.availability}
                                onChange={(e) => setProfileData(prev => ({ ...prev, availability: e.target.value }))}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              >
                                <option value="full-time">Full Time</option>
                                <option value="part-time">Part Time</option>
                                <option value="weekends-only">Weekends Only</option>
                                <option value="freelance">Freelance Projects</option>
                              </select>
                            </div>
                            
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Hourly Rate (USD)
                              </label>
                              <div className="relative">
                                <CurrencyDollarIcon className="absolute left-3 top-2 h-5 w-5 text-gray-400" />
                                <input
                                  type="number"
                                  min="5"
                                  step="5"
                                  value={profileData.hourly_rate}
                                  onChange={(e) => setProfileData(prev => ({ ...prev, hourly_rate: e.target.value }))}
                                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                  placeholder="25"
                                />
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {profileUser.availability && (
                              <div>
                                <p className="text-sm font-medium text-gray-700">Availability</p>
                                <p className="text-gray-900 capitalize">{profileUser.availability.replace('-', ' ')}</p>
                              </div>
                            )}
                            
                            {profileUser.hourly_rate && (
                              <div>
                                <p className="text-sm font-medium text-gray-700">Hourly Rate</p>
                                <p className="text-gray-900">{formatCurrency(profileUser.hourly_rate)}/hour</p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </>
              )}

              {activeTab === 'portfolio' && (
                <div className="bg-white shadow rounded-lg">
                  <div className="px-6 py-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Portfolio Links</h3>
                    
                    {isEditing ? (
                      <div className="space-y-3">
                        {profileData.portfolio_links.map((link, index) => (
                          <div key={index} className="flex items-center space-x-2">
                            <div className="flex-1">
                              <input
                                type="url"
                                value={link}
                                onChange={(e) => updatePortfolioLink(index, e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="https://github.com/username/project"
                              />
                            </div>
                            {profileData.portfolio_links.length > 1 && (
                              <button
                                type="button"
                                onClick={() => removePortfolioLink(index)}
                                className="text-red-600 hover:text-red-800"
                              >
                                <XMarkIcon className="h-5 w-5" />
                              </button>
                            )}
                          </div>
                        ))}
                        
                        <button
                          type="button"
                          onClick={addPortfolioLink}
                          className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                        >
                          <PlusIcon className="h-4 w-4 mr-1" />
                          Add Link
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {(profileUser.portfolio_links || []).map((link, index) => (
                          <div key={index} className="flex items-center space-x-2">
                            <LinkIcon className="h-5 w-5 text-gray-400" />
                            <a
                              href={link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800 hover:underline"
                            >
                              {link}
                            </a>
                          </div>
                        ))}
                        
                        {(!profileUser.portfolio_links || profileUser.portfolio_links.length === 0) && (
                          <p className="text-gray-500 text-sm">No portfolio links added yet</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'reviews' && (
                <div className="bg-white shadow rounded-lg">
                  <div className="px-6 py-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Reviews & Ratings</h3>
                    
                    {reviews?.data && reviews.data.length > 0 ? (
                      <div className="space-y-6">
                        {reviews.data.map((review, index) => (
                          <div key={index} className="border-b border-gray-200 pb-6 last:border-b-0">
                            <div className="flex items-start justify-between">
                              <div className="flex items-center space-x-3">
                                <div className="h-10 w-10 rounded-full bg-gray-500 flex items-center justify-center text-white font-medium">
                                  {getInitials(review.reviewer_name)}
                                </div>
                                <div>
                                  <p className="font-medium text-gray-900">{review.reviewer_name}</p>
                                  <p className="text-sm text-gray-500">{formatDate(review.created_at)}</p>
                                </div>
                              </div>
                              
                              <div className="flex items-center space-x-1">
                                {[...Array(5)].map((_, i) => (
                                  <StarIcon
                                    key={i}
                                    className={`h-5 w-5 ${
                                      i < review.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
                                    }`}
                                  />
                                ))}
                              </div>
                            </div>
                            
                            <p className="mt-3 text-gray-700">{review.text}</p>
                            
                            {review.project_title && (
                              <p className="mt-2 text-sm text-gray-500">
                                Project: <span className="font-medium">{review.project_title}</span>
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <StarIcon className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className="mt-2 text-sm font-medium text-gray-900">No reviews yet</h3>
                        <p className="mt-1 text-sm text-gray-500">
                          Complete some projects to start receiving reviews!
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Badges */}
              {profileUser.badges && profileUser.badges.length > 0 && (
                <div className="bg-white shadow rounded-lg">
                  <div className="px-6 py-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Badges</h3>
                    <div className="grid grid-cols-3 gap-3">
                      {profileUser.badges.map((badge, index) => (
                        <div key={index} className="text-center">
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center mx-auto mb-2">
                            <TrophyIcon className="h-6 w-6 text-white" />
                          </div>
                          <p className="text-xs text-gray-600 capitalize">{badge.replace('-', ' ')}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Contact Links */}
              {(profileUser.linkedin_url || profileUser.github_url || isEditing) && (
                <div className="bg-white shadow rounded-lg">
                  <div className="px-6 py-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Connect</h3>
                    
                    {isEditing ? (
                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            LinkedIn URL
                          </label>
                          <input
                            type="url"
                            value={profileData.linkedin_url}
                            onChange={(e) => setProfileData(prev => ({ ...prev, linkedin_url: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="https://linkedin.com/in/username"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            GitHub URL
                          </label>
                          <input
                            type="url"
                            value={profileData.github_url}
                            onChange={(e) => setProfileData(prev => ({ ...prev, github_url: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="https://github.com/username"
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {profileUser.linkedin_url && (
                          <a
                            href={profileUser.linkedin_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center space-x-2 text-blue-600 hover:text-blue-800"
                          >
                            <LinkIcon className="h-5 w-5" />
                            <span>LinkedIn</span>
                          </a>
                        )}
                        
                        {profileUser.github_url && (
                          <a
                            href={profileUser.github_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center space-x-2 text-gray-700 hover:text-gray-900"
                          >
                            <LinkIcon className="h-5 w-5" />
                            <span>GitHub</span>
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Languages */}
              {(profileUser.languages && profileUser.languages.length > 0) || isEditing ? (
                <div className="bg-white shadow rounded-lg">
                  <div className="px-6 py-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Languages</h3>
                    
                    {isEditing ? (
                      <div>
                        <div className="flex flex-wrap gap-2 mb-3">
                          {profileData.languages.map(language => (
                            <span
                              key={language}
                              className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-gray-100 text-gray-800"
                            >
                              {language}
                              <button
                                type="button"
                                onClick={() => removeLanguage(language)}
                                className="ml-2 text-gray-600 hover:text-gray-800"
                              >
                                <XMarkIcon className="h-4 w-4" />
                              </button>
                            </span>
                          ))}
                        </div>
                        
                        <div className="flex space-x-2">
                          <input
                            type="text"
                            placeholder="Add language"
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                            onKeyPress={(e) => {
                              if (e.key === 'Enter') {
                                addLanguage(e.target.value);
                                e.target.value = '';
                              }
                            }}
                          />
                          <button
                            type="button"
                            onClick={(e) => {
                              const input = e.target.previousElementSibling;
                              addLanguage(input.value);
                              input.value = '';
                            }}
                            className="px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                          >
                            <PlusIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {(profileUser.languages || []).map((language, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-gray-100 text-gray-800"
                          >
                            {language}
                          </span>
                        ))}
                        {(!profileUser.languages || profileUser.languages.length === 0) && (
                          <p className="text-gray-500 text-sm">No languages specified</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ProfilePage;