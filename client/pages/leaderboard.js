// Leaderboard Page for GigCampus
// Shows rankings of students by various metrics

import { useState, useEffect } from 'react';
import { useQuery } from 'react-query';
import {
  TrophyIcon,
  StarIcon,
  BriefcaseIcon,
  ClockIcon,
  CurrencyDollarIcon,
  AcademicCapIcon,
  UserGroupIcon,
  FireIcon
} from '@heroicons/react/24/outline';

import Layout from '../components/Layout/Layout';
import { useAuth } from '../contexts/AuthContext';
import { leaderboardAPI } from '../lib/api';
import { formatCurrency } from '../lib/utils';

const LeaderboardPage = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('students');
  const [timeFrame, setTimeFrame] = useState('month');
  
  // Mock data for demonstration
  const [leaderboardData, setLeaderboardData] = useState({
    students: [
      {
        id: 1,
        name: 'Alex Chen',
        university: 'Stanford University',
        rating: 4.9,
        projectsCompleted: 15,
        totalEarnings: 2500,
        avatar: '/placeholder-avatar.jpg'
      },
      {
        id: 2,
        name: 'Sarah Johnson',
        university: 'MIT',
        rating: 4.8,
        projectsCompleted: 12,
        totalEarnings: 2200,
        avatar: '/placeholder-avatar.jpg'
      },
      {
        id: 3,
        name: 'Michael Rodriguez',
        university: 'UC Berkeley',
        rating: 4.7,
        projectsCompleted: 10,
        totalEarnings: 1900,
        avatar: '/placeholder-avatar.jpg'
      },
      {
        id: 4,
        name: 'Emily Wang',
        university: 'Harvard University',
        rating: 4.6,
        projectsCompleted: 9,
        totalEarnings: 1800,
        avatar: '/placeholder-avatar.jpg'
      },
      {
        id: 5,
        name: 'David Kim',
        university: 'Carnegie Mellon',
        rating: 4.5,
        projectsCompleted: 8,
        totalEarnings: 1600,
        avatar: '/placeholder-avatar.jpg'
      }
    ],
    teams: [
      {
        id: 1,
        name: 'Code Crusaders',
        memberCount: 4,
        rating: 4.9,
        projectsCompleted: 8,
        totalEarnings: 4500
      },
      {
        id: 2,
        name: 'Tech Titans',
        memberCount: 3,
        rating: 4.8,
        projectsCompleted: 6,
        totalEarnings: 3200
      },
      {
        id: 3,
        name: 'Innovation Squad',
        memberCount: 5,
        rating: 4.7,
        projectsCompleted: 5,
        totalEarnings: 2800
      }
    ]
  });

  const getTrophyColor = (position) => {
    switch (position) {
      case 1: return 'text-yellow-500';
      case 2: return 'text-gray-400';
      case 3: return 'text-amber-600';
      default: return 'text-gray-300';
    }
  };

  const getRankBadge = (position) => {
    if (position <= 3) {
      return (
        <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
          position === 1 ? 'bg-yellow-100' : position === 2 ? 'bg-gray-100' : 'bg-amber-100'
        }`}>
          <TrophyIcon className={`h-5 w-5 ${getTrophyColor(position)}`} />
        </div>
      );
    }
    return (
      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100">
        <span className="text-gray-600 font-medium">#{position}</span>
      </div>
    );
  };

  if (!user) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <p className="text-gray-600">Please log in to view the leaderboard.</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Leaderboard</h1>
            <p className="text-gray-600 mt-2">
              See who's leading the pack in projects and earnings
            </p>
          </div>

          {/* Controls */}
          <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
            {/* Tabs */}
            <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
              <button
                onClick={() => setActiveTab('students')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'students'
                    ? 'bg-white text-primary-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Students
              </button>
              <button
                onClick={() => setActiveTab('teams')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'teams'
                    ? 'bg-white text-primary-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Teams
              </button>
            </div>

            {/* Time Frame */}
            <select
              value={timeFrame}
              onChange={(e) => setTimeFrame(e.target.value)}
              className="input"
            >
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="quarter">This Quarter</option>
              <option value="all">All Time</option>
            </select>
          </div>

          {/* Leaderboard */}
          <div className="card">
            {activeTab === 'students' ? (
              <div className="divide-y divide-gray-200">
                {leaderboardData.students.map((student, index) => (
                  <div key={student.id} className="p-6 flex items-center space-x-4">
                    {/* Rank */}
                    <div className="flex-shrink-0">
                      {getRankBadge(index + 1)}
                    </div>

                    {/* Avatar */}
                    <div className="flex-shrink-0">
                      <div className="h-12 w-12 bg-primary-600 rounded-full flex items-center justify-center">
                        <span className="text-white font-medium">
                          {student.name.charAt(0)}
                        </span>
                      </div>
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <h3 className="font-medium text-gray-900">{student.name}</h3>
                        {index + 1 === 1 && (
                          <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                            Top Performer
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500">{student.university}</p>
                    </div>

                    {/* Stats */}
                    <div className="flex items-center space-x-6">
                      <div className="text-center">
                        <div className="flex items-center text-yellow-500">
                          <StarIcon className="h-4 w-4 mr-1" />
                          <span className="font-medium">{student.rating}</span>
                        </div>
                        <p className="text-xs text-gray-500">Rating</p>
                      </div>

                      <div className="text-center">
                        <div className="flex items-center text-blue-600">
                          <ChartBarIcon className="h-4 w-4 mr-1" />
                          <span className="font-medium">{student.projectsCompleted}</span>
                        </div>
                        <p className="text-xs text-gray-500">Projects</p>
                      </div>

                      <div className="text-center">
                        <div className="flex items-center text-green-600">
                          <CurrencyDollarIcon className="h-4 w-4 mr-1" />
                          <span className="font-medium">
                            {formatCurrency(student.totalEarnings)}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500">Earned</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {leaderboardData.teams.map((team, index) => (
                  <div key={team.id} className="p-6 flex items-center space-x-4">
                    {/* Rank */}
                    <div className="flex-shrink-0">
                      {getRankBadge(index + 1)}
                    </div>

                    {/* Team Icon */}
                    <div className="flex-shrink-0">
                      <div className="h-12 w-12 bg-green-600 rounded-full flex items-center justify-center">
                        <UserGroupIcon className="h-6 w-6 text-white" />
                      </div>
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <h3 className="font-medium text-gray-900">{team.name}</h3>
                        {index + 1 === 1 && (
                          <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                            Top Team
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500">{team.memberCount} members</p>
                    </div>

                    {/* Stats */}
                    <div className="flex items-center space-x-6">
                      <div className="text-center">
                        <div className="flex items-center text-yellow-500">
                          <StarIcon className="h-4 w-4 mr-1" />
                          <span className="font-medium">{team.rating}</span>
                        </div>
                        <p className="text-xs text-gray-500">Rating</p>
                      </div>

                      <div className="text-center">
                        <div className="flex items-center text-blue-600">
                          <ChartBarIcon className="h-4 w-4 mr-1" />
                          <span className="font-medium">{team.projectsCompleted}</span>
                        </div>
                        <p className="text-xs text-gray-500">Projects</p>
                      </div>

                      <div className="text-center">
                        <div className="flex items-center text-green-600">
                          <CurrencyDollarIcon className="h-4 w-4 mr-1" />
                          <span className="font-medium">
                            {formatCurrency(team.totalEarnings)}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500">Earned</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* User's Position */}
          <div className="mt-8 card p-6">
            <h3 className="font-medium text-gray-900 mb-4">Your Position</h3>
            <div className="flex items-center space-x-4">
              <div className="h-12 w-12 bg-primary-600 rounded-full flex items-center justify-center">
                <span className="text-white font-medium">
                  {user.name?.charAt(0) || 'U'}
                </span>
              </div>
              <div className="flex-1">
                <h4 className="font-medium text-gray-900">{user.name}</h4>
                <p className="text-sm text-gray-500">Rank #42 this month</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">Keep going to climb the rankings!</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default LeaderboardPage;