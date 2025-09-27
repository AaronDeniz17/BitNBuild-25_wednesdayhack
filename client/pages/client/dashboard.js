// Client Dashboard for GigCampus
// Main dashboard for client users

import { useState, useEffect } from 'react';
import { useQuery } from 'react-query';
import Link from 'next/link';
import { 
  PlusIcon,
  BriefcaseIcon,
  CurrencyDollarIcon,
  ClockIcon,
  UserGroupIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';

import Layout from '../../components/Layout/Layout';
import { useAuth } from '../../contexts/AuthContext';
import { projectsAPI, contractsAPI } from '../../lib/api';
import { formatCurrency, formatDate, getRelativeTime } from '../../lib/auth';

const ClientDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    activeProjects: 0,
    totalSpent: 0,
    completedProjects: 0,
    pendingBids: 0,
  });

  // Fetch user's projects
  const { data: projectsResponse, isLoading: projectsLoading, error: projectsError } = useQuery(
    'client-projects',
    () => projectsAPI.getMyProjects(),
    {
      enabled: !!user,
    }
  );

  // Fetch user's contracts
  const { data: contracts, isLoading: contractsLoading } = useQuery(
    'client-contracts',
    () => contractsAPI.getContracts({ type: 'client' }),
    {
      enabled: !!user,
    }
  );

  // Calculate stats
  useEffect(() => {
    if (projects?.projects && contracts?.contracts) {
      const activeProjects = projects.projects.filter(p => p.status === 'open').length;
      const completedProjects = contracts.contracts.filter(c => c.status === 'completed').length;
      const totalSpent = contracts.contracts
        .filter(c => c.status === 'completed')
        .reduce((sum, c) => sum + (c.total_amount || 0), 0);

      setStats({
        activeProjects,
        totalSpent,
        completedProjects,
        pendingBids: 0, // TODO: Calculate from bids
      });
    }
  }, [projects, contracts]);

  const quickActions = [
    {
      name: 'Post New Project',
      href: '/projects/create',
      icon: PlusIcon,
      description: 'Create a new project',
      color: 'bg-blue-500',
    },
    {
      name: 'Browse Students',
      href: '/students',
      icon: UserGroupIcon,
      description: 'Find talented students',
      color: 'bg-green-500',
    },
    {
      name: 'View Projects',
      href: '/projects',
      icon: BriefcaseIcon,
      description: 'Manage your projects',
      color: 'bg-purple-500',
    },
    {
      name: 'Analytics',
      href: '/client/analytics',
      icon: ChartBarIcon,
      description: 'View insights',
      color: 'bg-yellow-500',
    },
  ];

  const recentActivity = [
    {
      type: 'project',
      title: 'New project posted',
      description: 'Web development project is now live',
      time: '1 hour ago',
      icon: BriefcaseIcon,
    },
    {
      type: 'bid',
      title: 'New bid received',
      description: '3 students have bid on your project',
      time: '3 hours ago',
      icon: UserGroupIcon,
    },
    {
      type: 'milestone',
      title: 'Milestone completed',
      description: 'First milestone of Project Alpha is ready for review',
      time: '1 day ago',
      icon: CheckCircleIcon,
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
              Manage your projects and find talented students for your next project.
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
                  <p className="text-sm font-medium text-gray-500">Total Spent</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {formatCurrency(stats.totalSpent)}
                  </p>
                </div>
              </div>
            </div>

            <div className="card p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <CheckCircleIcon className="h-8 w-8 text-purple-600" />
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
                  <ClockIcon className="h-8 w-8 text-yellow-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Pending Bids</p>
                  <p className="text-2xl font-semibold text-gray-900">{stats.pendingBids}</p>
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

            {/* Recent Projects */}
            <div className="lg:col-span-2">
              <div className="card p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Recent Projects</h3>
                  <Link href="/projects" className="text-sm text-primary-600 hover:text-primary-500">
                    View all
                  </Link>
                </div>
                
                {projectsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="loading-spinner"></div>
                  </div>
                ) : projects?.projects?.length > 0 ? (
                  <div className="space-y-4">
                    {projects.projects.slice(0, 3).map((project) => (
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
                              <span className={`text-sm ${
                                project.status === 'open' ? 'text-green-600' : 
                                project.status === 'in_progress' ? 'text-blue-600' : 
                                'text-gray-600'
                              }`}>
                                {project.status}
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
                    <p className="text-gray-500">No projects yet</p>
                    <Link href="/projects/create" className="text-primary-600 hover:text-primary-500 text-sm">
                      Create your first project
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

export default ClientDashboard;
