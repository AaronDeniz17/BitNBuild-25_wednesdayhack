// Trending and Recommendations page
// Shows trending projects, skills, and personalized recommendations

import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import Layout from '../../components/Layout/Layout';
import ProjectCard from '../../components/ProjectCard';
import toast from 'react-hot-toast';

const TrendingPage = () => {
  const { user } = useAuth();
  const [trendingData, setTrendingData] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('trending');

  useEffect(() => {
    fetchTrendingData();
    if (user) {
      fetchRecommendations();
    }
  }, [user]);

  const fetchTrendingData = async () => {
    try {
      const response = await fetch('/api/projects/trending');
      const data = await response.json();
      if (data.success) {
        setTrendingData(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch trending data:', error);
      toast.error('Failed to load trending data');
    } finally {
      setLoading(false);
    }
  };

  const fetchRecommendations = async () => {
    try {
      const response = await fetch('/api/projects/recommendations');
      const data = await response.json();
      if (data.success) {
        setRecommendations(data.data.recommended || []);
      }
    } catch (error) {
      console.error('Failed to fetch recommendations:', error);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <div className="loading-spinner-lg"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-6xl mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Discover Projects
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Find trending projects and personalized recommendations
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="mb-6">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('trending')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'trending'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                🔥 Trending
              </button>
              {user && (
                <button
                  onClick={() => setActiveTab('recommended')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'recommended'
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  ✨ Recommended
                </button>
              )}
              <button
                onClick={() => setActiveTab('skills')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'skills'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                🎯 Skills
              </button>
            </nav>
          </div>
        </div>

        {/* Trending Tab */}
        {activeTab === 'trending' && (
          <div className="space-y-8">
            {/* Trending Projects */}
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                🔥 Trending Projects
              </h2>
              {trendingData?.projects?.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {trendingData.projects.map((project) => (
                    <TrendingProjectCard key={project.id} project={project} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="text-gray-400 mb-4">
                    <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    No trending projects
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400">
                    Check back later for trending projects
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Recommended Tab */}
        {activeTab === 'recommended' && user && (
          <div className="space-y-8">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                ✨ Recommended for You
              </h2>
              {recommendations.length > 0 ? (
                <div className="space-y-6">
                  {recommendations.map((project) => (
                    <RecommendedProjectCard key={project.id} project={project} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="text-gray-400 mb-4">
                    <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    No recommendations yet
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400 mb-4">
                    Complete your profile and skills to get personalized recommendations
                  </p>
                  <button
                    onClick={() => window.location.href = '/profile'}
                    className="btn btn-primary"
                  >
                    Complete Profile
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Skills Tab */}
        {activeTab === 'skills' && (
          <div className="space-y-8">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                🎯 Trending Skills
              </h2>
              {trendingData?.skills?.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {trendingData.skills.map((skill, index) => (
                    <SkillCard key={index} skill={skill} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="text-gray-400 mb-4">
                    <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    No trending skills
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400">
                    Skills will appear here as projects are created
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

// Trending Project Card Component
const TrendingProjectCard = ({ project }) => {
  return (
    <div className="card hover:shadow-lg transition-shadow">
      <div className="card-body">
        <div className="flex items-start justify-between mb-3">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white line-clamp-2">
            {project.title}
          </h3>
          <div className="flex items-center space-x-1 text-yellow-500">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            <span className="text-sm font-medium">{project.trendingScore?.toFixed(1) || '0.0'}</span>
          </div>
        </div>

        <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-3">
          {project.description}
        </p>

        <div className="flex items-center justify-between mb-4">
          <div className="text-lg font-bold text-gray-900 dark:text-white">
            ${project.budget_min || project.budget_max || 0}
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {project.bid_count || 0} proposals
          </div>
        </div>

        {project.required_skills && project.required_skills.length > 0 && (
          <div className="mb-4">
            <div className="flex flex-wrap gap-1">
              {project.required_skills.slice(0, 3).map((skill, index) => (
                <span key={index} className="badge badge-gray text-xs">
                  {skill}
                </span>
              ))}
              {project.required_skills.length > 3 && (
                <span className="text-xs text-gray-500">
                  +{project.required_skills.length - 3} more
                </span>
              )}
            </div>
          </div>
        )}

        <div className="flex justify-between items-center">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {new Date(project.created_at?.toDate?.() || project.created_at).toLocaleDateString()}
          </div>
          <button
            onClick={() => window.location.href = `/projects/${project.id}`}
            className="btn btn-primary btn-sm"
          >
            View Project
          </button>
        </div>
      </div>
    </div>
  );
};

// Recommended Project Card Component
const RecommendedProjectCard = ({ project }) => {
  return (
    <div className="card">
      <div className="card-body">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              {project.title}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-3 line-clamp-2">
              {project.description}
            </p>
          </div>
          <div className="ml-4 text-right">
            <div className="text-lg font-bold text-gray-900 dark:text-white">
              ${project.budget_min || project.budget_max || 0}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {project.eta_days || 0} days
            </div>
          </div>
        </div>

        {/* Recommendation Score */}
        {project.recommendationScore && (
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Match Score
              </span>
              <span className="text-sm font-bold text-primary-600">
                {(project.recommendationScore * 100).toFixed(0)}%
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${project.recommendationScore * 100}%` }}
              ></div>
            </div>
          </div>
        )}

        {/* Score Breakdown */}
        {project.scoreBreakdown && (
          <div className="mb-4">
            <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Why this matches you:
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex justify-between">
                <span>Skill Match:</span>
                <span className="font-medium">{(project.scoreBreakdown.skillMatch * 100).toFixed(0)}%</span>
              </div>
              <div className="flex justify-between">
                <span>Budget Fit:</span>
                <span className="font-medium">{(project.scoreBreakdown.budgetFit * 100).toFixed(0)}%</span>
              </div>
              <div className="flex justify-between">
                <span>Availability:</span>
                <span className="font-medium">{(project.scoreBreakdown.availability * 100).toFixed(0)}%</span>
              </div>
              <div className="flex justify-between">
                <span>Similarity:</span>
                <span className="font-medium">{(project.scoreBreakdown.similarity * 100).toFixed(0)}%</span>
              </div>
            </div>
          </div>
        )}

        {project.required_skills && project.required_skills.length > 0 && (
          <div className="mb-4">
            <div className="flex flex-wrap gap-1">
              {project.required_skills.slice(0, 5).map((skill, index) => (
                <span key={index} className="badge badge-primary text-xs">
                  {skill}
                </span>
              ))}
              {project.required_skills.length > 5 && (
                <span className="text-xs text-gray-500">
                  +{project.required_skills.length - 5} more
                </span>
              )}
            </div>
          </div>
        )}

        <div className="flex justify-between items-center">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {new Date(project.created_at?.toDate?.() || project.created_at).toLocaleDateString()}
          </div>
          <button
            onClick={() => window.location.href = `/projects/${project.id}`}
            className="btn btn-primary btn-sm"
          >
            View Project
          </button>
        </div>
      </div>
    </div>
  );
};

// Skill Card Component
const SkillCard = ({ skill }) => {
  return (
    <div className="card">
      <div className="card-body text-center">
        <div className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          {skill.count}
        </div>
        <div className="text-sm text-gray-500 dark:text-gray-400 mb-3">
          projects
        </div>
        <div className="font-medium text-gray-900 dark:text-white mb-2">
          {skill.skill}
        </div>
        {skill.trending && (
          <span className="badge badge-primary text-xs">
            🔥 Trending
          </span>
        )}
      </div>
    </div>
  );
};

export default TrendingPage;
