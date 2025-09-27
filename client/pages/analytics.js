// Analytics dashboard page
import { useState } from 'react';
import Layout from '../../components/Layout/Layout';
import SkillsOverview from '../../components/Skills/SkillsOverview';
import { useAuth } from '../../contexts/AuthContext';

const AnalyticsPage = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('skills');

  if (!user) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Please log in to view analytics
            </h2>
            <p className="text-gray-600">
              This page is only accessible to logged-in users.
            </p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">
              Marketplace Analytics
            </h1>
            <p className="mt-2 text-gray-600">
              Insights into skills, trends, and student performance
            </p>
          </div>

          {/* Tab Navigation */}
          <div className="border-b border-gray-200 mb-8">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('skills')}
                className={`${
                  activeTab === 'skills'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium`}
              >
                Skills & Trends
              </button>
              <button
                onClick={() => setActiveTab('students')}
                className={`${
                  activeTab === 'students'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium`}
              >
                Student Rankings
              </button>
              <button
                onClick={() => setActiveTab('insights')}
                className={`${
                  activeTab === 'insights'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium`}
              >
                Market Insights
              </button>
            </nav>
          </div>

          {/* Tab Content */}
          <div className="space-y-8">
            {activeTab === 'skills' && (
              <div>
                <SkillsOverview />
              </div>
            )}

            {activeTab === 'students' && (
              <div>
                {/* Add StudentRankings component here */}
                <p className="text-gray-500">Student rankings coming soon...</p>
              </div>
            )}

            {activeTab === 'insights' && (
              <div>
                {/* Add MarketInsights component here */}
                <p className="text-gray-500">Market insights coming soon...</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default AnalyticsPage;