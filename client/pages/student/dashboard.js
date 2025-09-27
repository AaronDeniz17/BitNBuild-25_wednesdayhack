// Student Dashboard for GigCampus
// Main dashboard for student users

import { useState, useEffect } from 'react';
import { useQuery } from 'react-query';
import Link from 'next/link';
import { 
  PlusIcon,
  BriefcaseIcon,
  CurrencyDollarIcon,
  StarIcon,
  ClockIcon,
  UserGroupIcon,
  ChartBarIcon,
  BellIcon
} from '@heroicons/react/outline';

import Layout from '../../components/Layout/Layout';
import { useAuth } from '../../contexts/AuthContext';
import { projectsAPI, contractsAPI, reviewsAPI } from '../../lib/api';
import { formatCurrency, formatDate, getRelativeTime } from '../../lib/auth';

const StudentDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    activeProjects: 0,
    totalEarnings: 0,
    completedProjects: 0,
    averageRating: 0,
  });

  // Fetch recommended projects
  const { data: recommendedProjects, isLoading: projectsLoading } = useQuery(
    'recommended-projects',
    () => projectsAPI.getRecommended(),
    {
      enabled: !!user,
    }
  );

  // Fetch user's contracts
  const { data: contracts, isLoading: contractsLoading } = useQuery(
    'student-contracts',
    () => contractsAPI.getContracts({ type: 'freelancer' }),
    {
      enabled: !!user,
    }
  );

  // Fetch user's reviews
  const { data: reviews, isLoading: reviewsLoading } = useQuery(
    'student-reviews',
    () => reviewsAPI.getReviewStats(user?.id),
    {
      enabled: !!user,
    }
  );

  // Calculate stats
  useEffect(() => {
    if (contracts?.contracts) {
      const activeProjects = contracts.contracts.filter(c => c.status === 'active').length;
      const completedProjects = contracts.contracts.filter(c => c.status === 'completed').length;
      const totalEarnings = contracts.contracts
        .filter(c => c.status === 'completed')
        .reduce((sum, c) => sum + (c.total_amount || 0), 0);

      setStats({
        activeProjects,
        totalEarnings,
        completedProjects,
        averageRating: reviews?.average_rating || 0,
      });
    }
  }, [contracts, reviews]);

  const quickActions = [
    {
      name: 'Browse Projects',
      href: '/projects',
      icon: BriefcaseIcon,
      description: 'Find new opportunities',
      color: 'bg-blue-500',
    },
    {
      name: 'Create Team',
      href: '/teams/create',
      icon: UserGroupIcon,
      description: 'Start collaborating',
      color: 'bg-green-500',
    },
    {
      name: 'View Portfolio',
      href: '/student/portfolio',
      icon: ChartBarIcon,
      description: 'Showcase your work',
      color: 'bg-purple-500',
    },
    {
      name: 'Leaderboard',
      href: '/leaderboard',
      icon: StarIcon,
      description: 'See rankings',
      color: 'bg-yellow-500',
    },
  ];

  const recentActivity = [
    {
      type: 'project',
      title: 'New project match',
      description: 'Web development project matches your skills',
      time: '2 hours ago',
      icon: BriefcaseIcon,
    },
    {
      type: 'payment',
      title: 'Payment received',
      description: '$150 milestone payment from Project Alpha',
      time: '1 day ago',
      icon: CurrencyDollarIcon,
    },
    {
      type: 'review',
      title: 'New review',
      description: '5-star review from satisfied client',
      time: '2 days ago',
      icon: StarIcon,
    },
  ];

  if (!user) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="loading-spinner-lg"></div>
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
            <h1 className="text-3xl font-bold text-gray-900">
              Welcome back, {user.name}!
            </h1>
            <p className="text-gray-600 mt-2">
              Here's what's happening with your projects and opportunities.
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="card p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <BriefcaseIcon className="h-8 w-8 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Active Projects</p>
                  <p className="text-2xl font-semibold text-gray-900">{stats.activeProjects}</p>
                </div>
              </div>
            </div>

            <div className="card p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <CurrencyDollarIcon className="h-8 w-8 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Total Earnings</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {formatCurrency(stats.totalEarnings)}
                  </p>
                </div>
              </div>
            </div>

            <div className="card p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <ChartBarIcon className="h-8 w-8 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Completed</p>
                  <p className="text-2xl font-semibold text-gray-900">{stats.completedProjects}</p>
                </div>
              </div>
            </div>

            <div className="card p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <StarIcon className="h-8 w-8 text-yellow-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Average Rating</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {stats.averageRating.toFixed(1)} ⭐
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Quick Actions */}
            <div className="lg:col-span-1">
              <div className="card p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
                <div className="space-y-3">
                  {quickActions.map((action, index) => (
                    <Link
                      key={index}
                      href={action.href}
                      className="flex items-center p-3 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className={`flex-shrink-0 w-10 h-10 ${action.color} rounded-lg flex items-center justify-center`}>
                        <action.icon className="h-5 w-5 text-white" />
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-900">{action.name}</p>
                        <p className="text-sm text-gray-500">{action.description}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            {/* Recommended Projects */}
            <div className="lg:col-span-2">
              <div className="card p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Recommended Projects</h3>
                  <Link href="/projects" className="text-sm text-primary-600 hover:text-primary-500">
                    View all
                  </Link>
                </div>
                
                {projectsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="loading-spinner"></div>
                  </div>
                ) : recommendedProjects?.projects?.length > 0 ? (
                  <div className="space-y-4">
                    {recommendedProjects.projects.slice(0, 3).map((project) => (
                      <div key={project.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="text-sm font-medium text-gray-900">{project.title}</h4>
                            <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                              {project.description}
                            </p>
                            <div className="flex items-center mt-2 space-x-4">
                              <span className="text-sm text-gray-500">
                                {formatCurrency(project.budget)}
                              </span>
                              <span className="text-sm text-gray-500">
                                Due {formatDate(project.deadline)}
                              </span>
                              <span className="text-sm text-primary-600">
                                {project.skill_match_score}% match
                              </span>
                            </div>
                          </div>
                          <Link
                            href={`/projects/${project.id}`}
                            className="ml-4 text-primary-600 hover:text-primary-500 text-sm font-medium"
                          >
                            View
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <BriefcaseIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No recommended projects yet</p>
                    <Link href="/projects" className="text-primary-600 hover:text-primary-500 text-sm">
                      Browse all projects
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="mt-8">
            <div className="card p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
              <div className="space-y-4">
                {recentActivity.map((activity, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      <activity.icon className="h-5 w-5 text-gray-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                      <p className="text-sm text-gray-500">{activity.description}</p>
                      <p className="text-xs text-gray-400 mt-1">{activity.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default StudentDashboard;
