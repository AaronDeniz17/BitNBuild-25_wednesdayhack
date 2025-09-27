// Client Analytics page for GigCampus
// Analytics dashboard specifically for client users

import { useState, useEffect } from 'react';
import { useQuery } from 'react-query';
import { 
  ChartBarIcon,
  CurrencyDollarIcon,
  UserGroupIcon,
  ClockIcon,
  CheckCircleIcon,
  BriefcaseIcon
} from '@heroicons/react/24/outline';

import Layout from '../../components/Layout/Layout';
import { useAuth } from '../../contexts/AuthContext';
import { projectsAPI, contractsAPI } from '../../lib/api';
import { formatCurrency, formatDate } from '../../lib/auth';

const ClientAnalytics = () => {
  const { user } = useAuth();
  const [timeFilter, setTimeFilter] = useState('30d');
  const [analytics, setAnalytics] = useState({
    totalSpent: 0,
    projectsPosted: 0,
    avgProjectCost: 0,
    successRate: 0,
    topSkills: [],
    monthlySpending: []
  });

  // Fetch client projects
  const { data: projects, isLoading: projectsLoading } = useQuery(
    'client-analytics-projects',
    () => projectsAPI.getProjects({ type: 'client' }),
    {
      enabled: !!user,
    }
  );

  // Fetch client contracts
  const { data: contracts, isLoading: contractsLoading } = useQuery(
    'client-analytics-contracts',
    () => contractsAPI.getContracts({ type: 'client' }),
    {
      enabled: !!user,
    }
  );

  // Mock analytics data for demonstration
  const mockAnalytics = {
    totalSpent: 15750,
    projectsPosted: 12,
    avgProjectCost: 1312.50,
    successRate: 85,
    topSkills: [
      { name: 'React', count: 8, avgCost: 1200 },
      { name: 'Node.js', count: 6, avgCost: 1100 },
      { name: 'Python', count: 5, avgCost: 1400 },
      { name: 'UI/UX Design', count: 4, avgCost: 900 },
      { name: 'Mobile Development', count: 3, avgCost: 1800 }
    ],
    monthlySpending: [
      { month: 'Jan', amount: 2400 },
      { month: 'Feb', amount: 1800 },
      { month: 'Mar', amount: 3200 },
      { month: 'Apr', amount: 2100 },
      { month: 'May', amount: 2800 },
      { month: 'Jun', amount: 3400 }
    ],
    projectsByStatus: [
      { status: 'Completed', count: 8, percentage: 67 },
      { status: 'In Progress', count: 3, percentage: 25 },
      { status: 'Cancelled', count: 1, percentage: 8 }
    ],
    avgTimeToCompletion: 18, // days
    studentSatisfaction: 4.6
  };

  // Calculate analytics from real data when available
  useEffect(() => {
    if (projects?.projects && contracts?.contracts) {
      const totalSpent = contracts.contracts
        .filter(c => c.status === 'completed')
        .reduce((sum, c) => sum + (c.total_amount || 0), 0);

      const projectsPosted = projects.projects.length;
      const avgProjectCost = projectsPosted > 0 ? totalSpent / projectsPosted : 0;
      
      const completedProjects = contracts.contracts.filter(c => c.status === 'completed').length;
      const successRate = projectsPosted > 0 ? (completedProjects / projectsPosted) * 100 : 0;

      setAnalytics({
        totalSpent,
        projectsPosted,
        avgProjectCost,
        successRate,
        topSkills: mockAnalytics.topSkills, // Use mock data for skills
        monthlySpending: mockAnalytics.monthlySpending // Use mock data for monthly spending
      });
    } else {
      setAnalytics(mockAnalytics);
    }
  }, [projects, contracts]);

  const statCards = [
    {
      title: 'Total Spent',
      value: formatCurrency(analytics.totalSpent),
      icon: CurrencyDollarIcon,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      change: '+12%',
      changeType: 'increase'
    },
    {
      title: 'Projects Posted',
      value: analytics.projectsPosted.toString(),
      icon: BriefcaseIcon,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
      change: '+3',
      changeType: 'increase'
    },
    {
      title: 'Avg Project Cost',
      value: formatCurrency(analytics.avgProjectCost),
      icon: ChartBarIcon,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
      change: '-5%',
      changeType: 'decrease'
    },
    {
      title: 'Success Rate',
      value: `${Math.round(analytics.successRate)}%`,
      icon: CheckCircleIcon,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100',
      change: '+8%',
      changeType: 'increase'
    }
  ];

  if (!user) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
          <div className="text-center animate-fade-in-up">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Please log in to view analytics
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
              Client Analytics
            </h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Insights into your project spending and performance
            </p>
          </div>

          {/* Time Filter */}
          <div className="mb-8 animate-slide-in-left">
            <div className="flex space-x-4">
              {['7d', '30d', '90d', '1y'].map((period, index) => (
                <button
                  key={period}
                  onClick={() => setTimeFilter(period)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 transform hover:scale-105 active:scale-95 ${
                    timeFilter === period
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25 animate-glow'
                      : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700'
                  }`}
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  {period === '7d' && 'Last 7 days'}
                  {period === '30d' && 'Last 30 days'}
                  {period === '90d' && 'Last 90 days'}
                  {period === '1y' && 'Last year'}
                </button>
              ))}
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {statCards.map((stat, index) => (
              <div 
                key={index} 
                className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm hover:shadow-lg dark:shadow-gray-900/20 transition-all duration-300 transform hover:scale-105 hover:-translate-y-1 animate-fade-in-up border border-gray-200 dark:border-gray-700"
                style={{ animationDelay: `${index * 150}ms` }}
              >
                <div className="flex items-center">
                  <div className={`flex-shrink-0 p-3 rounded-lg ${stat.bgColor} dark:bg-opacity-20 transition-all duration-300 hover:scale-110`}>
                    <stat.icon className={`h-6 w-6 ${stat.color} dark:text-opacity-90`} />
                  </div>
                  <div className="ml-4 flex-1">
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{stat.title}</p>
                    <div className="flex items-baseline">
                      <p className="text-2xl font-semibold text-gray-900 dark:text-white">{stat.value}</p>
                      <span className={`ml-2 text-sm font-medium ${
                        stat.changeType === 'increase' 
                          ? 'text-green-600 dark:text-green-400' 
                          : 'text-red-600 dark:text-red-400'
                      }`}>
                        {stat.change}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Monthly Spending Chart */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm hover:shadow-lg dark:shadow-gray-900/20 transition-all duration-300 animate-slide-in-left border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Monthly Spending</h3>
              <div className="space-y-4">
                {mockAnalytics.monthlySpending.map((item, index) => (
                  <div key={index} className="flex items-center justify-between group animate-fade-in-up" style={{ animationDelay: `${index * 100}ms` }}>
                    <span className="text-sm text-gray-600 dark:text-gray-400">{item.month}</span>
                    <div className="flex items-center space-x-3">
                      <div className="w-32 bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                        <div 
                          className="bg-blue-600 dark:bg-blue-500 h-2 rounded-full transition-all duration-1000 ease-out hover:bg-blue-500 dark:hover:bg-blue-400" 
                          style={{ 
                            width: `${(item.amount / 3400) * 100}%`,
                            animationDelay: `${index * 200}ms`
                          }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium text-gray-900 dark:text-white w-16 text-right group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-200">
                        {formatCurrency(item.amount)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Top Skills */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm hover:shadow-lg dark:shadow-gray-900/20 transition-all duration-300 animate-slide-in-right border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Most Requested Skills</h3>
              <div className="space-y-4">
                {mockAnalytics.topSkills.map((skill, index) => (
                  <div key={index} className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200 group animate-fade-in-up" style={{ animationDelay: `${index * 100}ms` }}>
                    <div>
                      <span className="text-sm font-medium text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-200">{skill.name}</span>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{skill.count} projects</p>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {formatCurrency(skill.avgCost)}
                      </span>
                      <p className="text-xs text-gray-500 dark:text-gray-400">avg cost</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Project Status Distribution */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm hover:shadow-lg dark:shadow-gray-900/20 transition-all duration-300 animate-fade-in-up border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Project Status</h3>
              <div className="space-y-3">
                {mockAnalytics.projectsByStatus.map((item, index) => (
                  <div key={index} className="flex items-center justify-between group animate-slide-in-left" style={{ animationDelay: `${index * 150}ms` }}>
                    <span className="text-sm text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white transition-colors duration-200">{item.status}</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-16 bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                        <div 
                          className={`h-2 rounded-full transition-all duration-1000 ease-out ${
                            item.status === 'Completed' ? 'bg-green-500 dark:bg-green-400' :
                            item.status === 'In Progress' ? 'bg-blue-500 dark:bg-blue-400' : 'bg-red-500 dark:bg-red-400'
                          }`}
                          style={{ 
                            width: `${item.percentage}%`,
                            animationDelay: `${index * 200}ms`
                          }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium text-gray-900 dark:text-white w-8 group-hover:scale-110 transition-transform duration-200">
                        {item.count}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Performance Metrics */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm hover:shadow-lg dark:shadow-gray-900/20 transition-all duration-300 animate-scale-in border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Performance</h3>
              <div className="space-y-4">
                <div className="animate-fade-in-up" style={{ animationDelay: '100ms' }}>
                  <div className="flex justify-between text-sm p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200">
                    <span className="text-gray-600 dark:text-gray-400">Avg Completion Time</span>
                    <span className="font-medium text-gray-900 dark:text-white">{mockAnalytics.avgTimeToCompletion} days</span>
                  </div>
                </div>
                <div className="animate-fade-in-up" style={{ animationDelay: '200ms' }}>
                  <div className="flex justify-between text-sm p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200">
                    <span className="text-gray-600 dark:text-gray-400">Student Satisfaction</span>
                    <span className="font-medium text-gray-900 dark:text-white">{mockAnalytics.studentSatisfaction}/5.0</span>
                  </div>
                </div>
                <div className="animate-fade-in-up" style={{ animationDelay: '300ms' }}>
                  <div className="flex justify-between text-sm p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200">
                    <span className="text-gray-600 dark:text-gray-400">Repeat Hires</span>
                    <span className="font-medium text-gray-900 dark:text-white">23%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm hover:shadow-lg dark:shadow-gray-900/20 transition-all duration-300 animate-bounce-gentle border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-all duration-200 transform hover:scale-105 active:scale-95 animate-fade-in-up" style={{ animationDelay: '100ms' }}>
                  Export Analytics Report
                </button>
                <button className="w-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-medium py-2 px-4 rounded-lg transition-all duration-200 transform hover:scale-105 active:scale-95 animate-fade-in-up" style={{ animationDelay: '200ms' }}>
                  View Detailed Reports
                </button>
                <button className="w-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-medium py-2 px-4 rounded-lg transition-all duration-200 transform hover:scale-105 active:scale-95 animate-fade-in-up" style={{ animationDelay: '300ms' }}>
                  Compare with Industry
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ClientAnalytics;
