// Dynamic Profile Page for viewing any user's profile
// /profile/[userId].js

import { useState } from 'react';
import { useRouter } from 'next/router';
import { useQuery } from 'react-query';
import {
  UserIcon,
  StarIcon,
  BriefcaseIcon,
  CurrencyDollarIcon,
  AcademicCapIcon,
  LinkIcon,
  TrophyIcon,
  ChatBubbleLeftIcon
} from '@heroicons/react/24/outline';

import Layout from '../../components/Layout/Layout';
import { useAuth } from '../../contexts/AuthContext';
import { authAPI, reviewsAPI } from '../../lib/api';
import { formatCurrency, formatDate, getInitials } from '../../lib/utils';

const UserProfilePage = () => {
  const { user } = useAuth();
  const router = useRouter();
  const { userId } = router.query;
  
  const [activeTab, setActiveTab] = useState('overview');

  // Fetch profile data
  const { data: profile, isLoading } = useQuery(
    ['profile', userId],
    () => authAPI.getUserProfile(userId),
    {
      enabled: !!userId
    }
  );

  // Fetch user reviews
  const { data: reviews } = useQuery(
    ['user-reviews', userId],
    () => reviewsAPI.getUserReviews(userId),
    {
      enabled: !!userId
    }
  );

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

  const isOwnProfile = user?.id === userId;

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
                {!isOwnProfile && (
                  <div className="flex space-x-3">
                    <button
                      onClick={() => router.push(`/messages?user=${userId}`)}
                      className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                    >
                      <ChatBubbleLeftIcon className="h-4 w-4 mr-2" />
                      Message
                    </button>
                  </div>
                )}
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
                    </div>
                  </div>

                  {/* Work Preferences */}
                  {(profileUser.availability || profileUser.hourly_rate) && (
                    <div className="bg-white shadow rounded-lg">
                      <div className="px-6 py-6">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Work Preferences</h3>
                        
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
                      </div>
                    </div>
                  )}
                </>
              )}

              {activeTab === 'portfolio' && (
                <div className="bg-white shadow rounded-lg">
                  <div className="px-6 py-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Portfolio Links</h3>
                    
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
                          This user hasn't received any reviews yet.
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
              {(profileUser.linkedin_url || profileUser.github_url) && (
                <div className="bg-white shadow rounded-lg">
                  <div className="px-6 py-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Connect</h3>
                    
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
                  </div>
                </div>
              )}

              {/* Languages */}
              {profileUser.languages && profileUser.languages.length > 0 && (
                <div className="bg-white shadow rounded-lg">
                  <div className="px-6 py-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Languages</h3>
                    
                    <div className="flex flex-wrap gap-2">
                      {profileUser.languages.map((language, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-gray-100 text-gray-800"
                        >
                          {language}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default UserProfilePage;