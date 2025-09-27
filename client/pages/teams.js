// Teams Page for GigCampus
// Create, join, and manage student teams

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { toast } from 'react-hot-toast';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import {
  PlusIcon,
  UserGroupIcon,
  StarIcon,
  BriefcaseIcon,
  CurrencyDollarIcon,
  XMarkIcon,
  CheckIcon,
  UsersIcon,
  AcademicCapIcon
} from '@heroicons/react/24/outline';

import Layout from '../components/Layout/Layout';
import { useAuth } from '../contexts/AuthContext';
import { teamsAPI } from '../lib/api';
import { formatCurrency, SKILL_CATEGORIES } from '../lib/utils';

const TeamsPage = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [activeTab, setActiveTab] = useState('discover'); // discover, my-teams
  
  const [createTeamData, setCreateTeamData] = useState({
    name: '',
    description: '',
    skills: [],
    max_members: 5
  });

  // Fetch all teams
  const { data: allTeams, isLoading: teamsLoading } = useQuery(
    'all-teams',
    () => teamsAPI.getAllTeams(),
    {
      enabled: !!user,
      retry: 1
    }
  );

  // Fetch user's teams
  const { data: myTeams, isLoading: myTeamsLoading } = useQuery(
    'my-teams',
    () => teamsAPI.getMyTeams(),
    {
      enabled: !!user,
      retry: 1
    }
  );

  // Create team mutation
  const createTeamMutation = useMutation(
    (teamData) => teamsAPI.createTeam(teamData),
    {
      onSuccess: () => {
        toast.success('Team created successfully!');
        setIsCreateModalOpen(false);
        setCreateTeamData({
          name: '',
          description: '',
          skills: [],
          max_members: 5
        });
        queryClient.invalidateQueries('all-teams');
        queryClient.invalidateQueries('my-teams');
      },
      onError: (error) => {
        toast.error(error.response?.data?.error || 'Failed to create team');
      }
    }
  );

  // Join team mutation
  const joinTeamMutation = useMutation(
    (teamId) => teamsAPI.joinTeam(teamId),
    {
      onSuccess: () => {
        toast.success('Successfully joined team!');
        setIsJoinModalOpen(false);
        setSelectedTeam(null);
        queryClient.invalidateQueries('all-teams');
        queryClient.invalidateQueries('my-teams');
      },
      onError: (error) => {
        toast.error(error.response?.data?.error || 'Failed to join team');
      }
    }
  );

  // Leave team mutation
  const leaveTeamMutation = useMutation(
    (teamId) => teamsAPI.leaveTeam(teamId),
    {
      onSuccess: () => {
        toast.success('Left team successfully');
        queryClient.invalidateQueries('all-teams');
        queryClient.invalidateQueries('my-teams');
      },
      onError: (error) => {
        toast.error(error.response?.data?.error || 'Failed to leave team');
      }
    }
  );

  const addSkill = (skill) => {
    if (!createTeamData.skills.includes(skill)) {
      setCreateTeamData(prev => ({
        ...prev,
        skills: [...prev.skills, skill]
      }));
    }
  };

  const removeSkill = (skillToRemove) => {
    setCreateTeamData(prev => ({
      ...prev,
      skills: prev.skills.filter(skill => skill !== skillToRemove)
    }));
  };

  const handleCreateTeam = (e) => {
    e.preventDefault();
    
    if (!createTeamData.name || !createTeamData.description) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (createTeamData.skills.length === 0) {
      toast.error('Please select at least one skill');
      return;
    }

    createTeamMutation.mutate(createTeamData);
  };

  const handleJoinTeam = (team) => {
    setSelectedTeam(team);
    setIsJoinModalOpen(true);
  };

  const confirmJoinTeam = () => {
    if (selectedTeam) {
      joinTeamMutation.mutate(selectedTeam.id);
    }
  };

  const handleLeaveTeam = (teamId) => {
    if (window.confirm('Are you sure you want to leave this team?')) {
      leaveTeamMutation.mutate(teamId);
    }
  };

  // Filter teams user is not already part of
  const availableTeams = allTeams?.data?.filter(team => 
    !team.member_ids.includes(user?.id) && team.member_ids.length < (team.max_members || 5)
  ) || [];

  const userTeams = myTeams?.data || [];

  if (!user) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Please log in to view teams</h1>
            <Link href="/login" className="text-blue-600 hover:text-blue-800">
              Go to Login
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Teams</h1>
                <p className="text-gray-600 mt-2">Collaborate with other students on projects</p>
              </div>
              {user.role === 'student' && (
                <button
                  onClick={() => setIsCreateModalOpen(true)}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <PlusIcon className="h-5 w-5 mr-2" />
                  Create Team
                </button>
              )}
            </div>

            {/* Tabs */}
            <div className="mt-6">
              <nav className="flex space-x-8">
                <button
                  onClick={() => setActiveTab('discover')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'discover'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Discover Teams ({availableTeams.length})
                </button>
                <button
                  onClick={() => setActiveTab('my-teams')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'my-teams'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  My Teams ({userTeams.length})
                </button>
              </nav>
            </div>
          </div>

          {/* Tab Content */}
          {activeTab === 'discover' && (
            <div>
              {teamsLoading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
                  <p className="mt-4 text-gray-600">Loading teams...</p>
                </div>
              ) : availableTeams.length === 0 ? (
                <div className="text-center py-12">
                  <UserGroupIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-4 text-lg font-medium text-gray-900">No teams available</h3>
                  <p className="mt-2 text-gray-600">Be the first to create a team!</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {availableTeams.map((team) => (
                    <div key={team.id} className="bg-white rounded-lg shadow-md overflow-hidden">
                      <div className="p-6">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-lg font-semibold text-gray-900">{team.name}</h3>
                          <div className="flex items-center text-sm text-gray-500">
                            <UsersIcon className="h-4 w-4 mr-1" />
                            {team.member_ids.length}/{team.max_members || 5}
                          </div>
                        </div>

                        <p className="text-gray-600 text-sm mb-4 line-clamp-3">{team.description}</p>

                        {/* Skills */}
                        <div className="mb-4">
                          <h4 className="text-sm font-medium text-gray-700 mb-2">Skills</h4>
                          <div className="flex flex-wrap gap-1">
                            {team.skills.slice(0, 4).map((skill, index) => (
                              <span
                                key={index}
                                className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800"
                              >
                                {skill}
                              </span>
                            ))}
                            {team.skills.length > 4 && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-600">
                                +{team.skills.length - 4} more
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Stats */}
                        <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                          <div className="flex items-center">
                            <StarIcon className="h-4 w-4 mr-1" />
                            {team.reputation_score || 0}/100
                          </div>
                          <div className="flex items-center">
                            <BriefcaseIcon className="h-4 w-4 mr-1" />
                            {team.completed_projects || 0} projects
                          </div>
                        </div>

                        {/* Leader */}
                        <div className="flex items-center mb-4">
                          <div className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm font-medium">
                            {team.leader_name?.charAt(0) || 'L'}
                          </div>
                          <div className="ml-3">
                            <p className="text-sm font-medium text-gray-900">{team.leader_name || 'Team Leader'}</p>
                            <p className="text-xs text-gray-500">Team Leader</p>
                          </div>
                        </div>

                        <button
                          onClick={() => handleJoinTeam(team)}
                          disabled={joinTeamMutation.isLoading}
                          className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                        >
                          {joinTeamMutation.isLoading ? 'Joining...' : 'Join Team'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'my-teams' && (
            <div>
              {myTeamsLoading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
                  <p className="mt-4 text-gray-600">Loading your teams...</p>
                </div>
              ) : userTeams.length === 0 ? (
                <div className="text-center py-12">
                  <UserGroupIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-4 text-lg font-medium text-gray-900">You're not part of any teams yet</h3>
                  <p className="mt-2 text-gray-600">Join a team or create your own to start collaborating!</p>
                  <button
                    onClick={() => setActiveTab('discover')}
                    className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-blue-600 bg-blue-100 hover:bg-blue-200"
                  >
                    Discover Teams
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {userTeams.map((team) => (
                    <div key={team.id} className="bg-white rounded-lg shadow-md overflow-hidden">
                      <div className="p-6">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-lg font-semibold text-gray-900">{team.name}</h3>
                          <div className="flex items-center">
                            {team.leader_id === user.id && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800 mr-2">
                                Leader
                              </span>
                            )}
                            <div className="flex items-center text-sm text-gray-500">
                              <UsersIcon className="h-4 w-4 mr-1" />
                              {team.member_ids.length}/{team.max_members || 5}
                            </div>
                          </div>
                        </div>

                        <p className="text-gray-600 text-sm mb-4">{team.description}</p>

                        {/* Skills */}
                        <div className="mb-4">
                          <h4 className="text-sm font-medium text-gray-700 mb-2">Team Skills</h4>
                          <div className="flex flex-wrap gap-1">
                            {team.skills.slice(0, 4).map((skill, index) => (
                              <span
                                key={index}
                                className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800"
                              >
                                {skill}
                              </span>
                            ))}
                            {team.skills.length > 4 && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-600">
                                +{team.skills.length - 4} more
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Stats */}
                        <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                          <div className="flex items-center">
                            <StarIcon className="h-4 w-4 mr-1" />
                            {team.reputation_score || 0}/100
                          </div>
                          <div className="flex items-center">
                            <BriefcaseIcon className="h-4 w-4 mr-1" />
                            {team.completed_projects || 0} projects
                          </div>
                          <div className="flex items-center">
                            <CurrencyDollarIcon className="h-4 w-4 mr-1" />
                            {formatCurrency(team.team_wallet_balance || 0)}
                          </div>
                        </div>

                        {/* Members */}
                        <div className="mb-4">
                          <h4 className="text-sm font-medium text-gray-700 mb-2">Members</h4>
                          <div className="flex -space-x-2">
                            {team.members?.slice(0, 5).map((member, index) => (
                              <div
                                key={index}
                                className="h-8 w-8 rounded-full bg-gray-500 border-2 border-white flex items-center justify-center text-white text-xs font-medium"
                                title={member.name}
                              >
                                {member.name?.charAt(0) || 'M'}
                              </div>
                            ))}
                            {team.member_ids.length > 5 && (
                              <div className="h-8 w-8 rounded-full bg-gray-300 border-2 border-white flex items-center justify-center text-gray-600 text-xs font-medium">
                                +{team.member_ids.length - 5}
                              </div>
                            )}
                          </div>
                        </div>

                        {team.leader_id !== user.id && (
                          <button
                            onClick={() => handleLeaveTeam(team.id)}
                            disabled={leaveTeamMutation.isLoading}
                            className="w-full inline-flex justify-center items-center px-4 py-2 border border-red-300 text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                          >
                            {leaveTeamMutation.isLoading ? 'Leaving...' : 'Leave Team'}
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Create Team Modal */}
      <Transition appear show={isCreateModalOpen} as={Fragment}>
        <Dialog as="div" className="relative z-10" onClose={() => setIsCreateModalOpen(false)}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black bg-opacity-25" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                  <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900 mb-6">
                    Create New Team
                  </Dialog.Title>

                  <form onSubmit={handleCreateTeam} className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Team Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={createTeamData.name}
                        onChange={(e) => setCreateTeamData(prev => ({ ...prev, name: e.target.value }))}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="e.g., Full-Stack Developers"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Description *
                      </label>
                      <textarea
                        required
                        rows={4}
                        value={createTeamData.description}
                        onChange={(e) => setCreateTeamData(prev => ({ ...prev, description: e.target.value }))}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Describe your team's focus and goals..."
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Maximum Members
                      </label>
                      <select
                        value={createTeamData.max_members}
                        onChange={(e) => setCreateTeamData(prev => ({ ...prev, max_members: parseInt(e.target.value) }))}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value={3}>3 members</option>
                        <option value={4}>4 members</option>
                        <option value={5}>5 members</option>
                        <option value={6}>6 members</option>
                        <option value={8}>8 members</option>
                        <option value={10}>10 members</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Team Skills *
                      </label>
                      
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
                                  createTeamData.skills.includes(skill)
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
                      {createTeamData.skills.length > 0 && (
                        <div className="border-t pt-4">
                          <p className="text-sm font-medium text-gray-700 mb-2">Selected Skills:</p>
                          <div className="flex flex-wrap gap-2">
                            {createTeamData.skills.map(skill => (
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

                    <div className="flex justify-end space-x-4">
                      <button
                        type="button"
                        onClick={() => setIsCreateModalOpen(false)}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={createTeamMutation.isLoading}
                        className={`px-6 py-2 text-sm font-medium text-white rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                          createTeamMutation.isLoading
                            ? 'bg-gray-400 cursor-not-allowed'
                            : 'bg-blue-600 hover:bg-blue-700'  
                        }`}
                      >
                        {createTeamMutation.isLoading ? 'Creating...' : 'Create Team'}
                      </button>
                    </div>
                  </form>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>

      {/* Join Team Confirmation Modal */}
      <Transition appear show={isJoinModalOpen} as={Fragment}>
        <Dialog as="div" className="relative z-10" onClose={() => setIsJoinModalOpen(false)}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black bg-opacity-25" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                  <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900 mb-4">
                    Join Team
                  </Dialog.Title>

                  {selectedTeam && (
                    <div className="mb-6">
                      <p className="text-sm text-gray-600 mb-4">
                        Are you sure you want to join <span className="font-medium text-gray-900">{selectedTeam.name}</span>?
                      </p>
                      
                      <div className="bg-gray-50 rounded-lg p-4">
                        <h4 className="font-medium text-gray-900 mb-2">{selectedTeam.name}</h4>
                        <p className="text-sm text-gray-600 mb-3">{selectedTeam.description}</p>
                        
                        <div className="flex flex-wrap gap-1">
                          {selectedTeam.skills.slice(0, 3).map((skill, index) => (
                            <span
                              key={index}
                              className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800"
                            >
                              {skill}
                            </span>
                          ))}
                          {selectedTeam.skills.length > 3 && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-600">
                              +{selectedTeam.skills.length - 3} more
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex justify-end space-x-4">
                    <button
                      type="button"
                      onClick={() => setIsJoinModalOpen(false)}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={confirmJoinTeam}
                      disabled={joinTeamMutation.isLoading}
                      className={`px-6 py-2 text-sm font-medium text-white rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                        joinTeamMutation.isLoading
                          ? 'bg-gray-400 cursor-not-allowed'
                          : 'bg-blue-600 hover:bg-blue-700'
                      }`}
                    >
                      {joinTeamMutation.isLoading ? 'Joining...' : 'Join Team'}
                    </button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </Layout>
  );
};

export default TeamsPage;