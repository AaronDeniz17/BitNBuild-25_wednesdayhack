// TeamManagement component for creating and managing teams
// Supports team creation, joining, role management, and wallet viewing

import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

const TeamManagement = () => {
  const { user } = useAuth();
  const [teams, setTeams] = useState([]);
  const [myTeams, setMyTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [activeTab, setActiveTab] = useState('browse');

  useEffect(() => {
    fetchTeams();
    fetchMyTeams();
  }, []);

  const fetchTeams = async () => {
    try {
      const response = await fetch('/api/teams');
      const data = await response.json();
      if (data.success) {
        setTeams(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch teams:', error);
      toast.error('Failed to load teams');
    } finally {
      setLoading(false);
    }
  };

  const fetchMyTeams = async () => {
    try {
      const response = await fetch('/api/teams?my_teams=true');
      const data = await response.json();
      if (data.success) {
        setMyTeams(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch my teams:', error);
    }
  };

  const handleCreateTeam = async (teamData) => {
    try {
      const response = await fetch('/api/teams', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(teamData),
      });

      const data = await response.json();
      if (data.success) {
        toast.success('Team created successfully!');
        setShowCreateForm(false);
        fetchTeams();
        fetchMyTeams();
      } else {
        throw new Error(data.error || 'Failed to create team');
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleJoinTeam = async (teamId) => {
    try {
      const response = await fetch(`/api/teams/${teamId}/join`, {
        method: 'POST',
      });

      const data = await response.json();
      if (data.success) {
        toast.success('Successfully joined team!');
        fetchTeams();
        fetchMyTeams();
      } else {
        throw new Error(data.error || 'Failed to join team');
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleLeaveTeam = async (teamId) => {
    if (!confirm('Are you sure you want to leave this team?')) return;

    try {
      const response = await fetch(`/api/teams/${teamId}/leave`, {
        method: 'POST',
      });

      const data = await response.json();
      if (data.success) {
        toast.success('Successfully left team!');
        fetchTeams();
        fetchMyTeams();
      } else {
        throw new Error(data.error || 'Failed to leave team');
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleUpdateMemberRole = async (teamId, memberId, role) => {
    try {
      const response = await fetch(`/api/teams/${teamId}/members/${memberId}/role`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ role }),
      });

      const data = await response.json();
      if (data.success) {
        toast.success('Member role updated!');
        fetchMyTeams();
      } else {
        throw new Error(data.error || 'Failed to update role');
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleRemoveMember = async (teamId, memberId) => {
    if (!confirm('Are you sure you want to remove this member?')) return;

    try {
      const response = await fetch(`/api/teams/${teamId}/members/${memberId}`, {
        method: 'DELETE',
      });

      const data = await response.json();
      if (data.success) {
        toast.success('Member removed successfully!');
        fetchMyTeams();
      } else {
        throw new Error(data.error || 'Failed to remove member');
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="loading-spinner-lg"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Team Management
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Create teams, join existing teams, and manage collaborative projects
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="mb-6">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('browse')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'browse'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Browse Teams
            </button>
            <button
              onClick={() => setActiveTab('my-teams')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'my-teams'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              My Teams ({myTeams.length})
            </button>
          </nav>
        </div>
      </div>

      {/* Browse Teams Tab */}
      {activeTab === 'browse' && (
        <div>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Available Teams
            </h2>
            <button
              onClick={() => setShowCreateForm(true)}
              className="btn btn-primary"
            >
              Create New Team
            </button>
          </div>

          {teams.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No teams found
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                Be the first to create a team and start collaborating!
              </p>
              <button
                onClick={() => setShowCreateForm(true)}
                className="btn btn-primary"
              >
                Create Team
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {teams.map((team) => (
                <TeamCard
                  key={team.id}
                  team={team}
                  onJoin={() => handleJoinTeam(team.id)}
                  onView={() => setSelectedTeam(team)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* My Teams Tab */}
      {activeTab === 'my-teams' && (
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
            My Teams
          </h2>

          {myTeams.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                You're not part of any teams
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                Join existing teams or create your own to start collaborating!
              </p>
              <button
                onClick={() => setActiveTab('browse')}
                className="btn btn-primary"
              >
                Browse Teams
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {myTeams.map((team) => (
                <MyTeamCard
                  key={team.id}
                  team={team}
                  onLeave={() => handleLeaveTeam(team.id)}
                  onUpdateRole={handleUpdateMemberRole}
                  onRemoveMember={handleRemoveMember}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Create Team Modal */}
      {showCreateForm && (
        <CreateTeamModal
          onSubmit={handleCreateTeam}
          onClose={() => setShowCreateForm(false)}
        />
      )}

      {/* Team Details Modal */}
      {selectedTeam && (
        <TeamDetailsModal
          team={selectedTeam}
          onClose={() => setSelectedTeam(null)}
          onJoin={() => {
            handleJoinTeam(selectedTeam.id);
            setSelectedTeam(null);
          }}
        />
      )}
    </div>
  );
};

// Team Card Component
const TeamCard = ({ team, onJoin, onView }) => {
  const { user } = useAuth();
  const isMember = team.is_member;
  const isOwner = team.owner_id === user?.id;

  return (
    <div className="card hover:shadow-lg transition-shadow">
      <div className="card-body">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {team.name}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {team.member_count} member{team.member_count !== 1 ? 's' : ''}
            </p>
          </div>
          <div className="flex space-x-2">
            {isOwner && (
              <span className="badge badge-primary">Owner</span>
            )}
            {isMember && !isOwner && (
              <span className="badge badge-success">Member</span>
            )}
          </div>
        </div>

        {team.description && (
          <p className="text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
            {team.description}
          </p>
        )}

        {team.skills && team.skills.length > 0 && (
          <div className="mb-4">
            <div className="flex flex-wrap gap-1">
              {team.skills.slice(0, 3).map((skill, index) => (
                <span key={index} className="badge badge-gray text-xs">
                  {skill}
                </span>
              ))}
              {team.skills.length > 3 && (
                <span className="text-xs text-gray-500">
                  +{team.skills.length - 3} more
                </span>
              )}
            </div>
          </div>
        )}

        <div className="flex justify-between items-center">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Created {new Date(team.created_at?.toDate?.() || team.created_at).toLocaleDateString()}
          </div>
          <div className="flex space-x-2">
            <button
              onClick={onView}
              className="btn btn-secondary btn-sm"
            >
              View
            </button>
            {!isMember && (
              <button
                onClick={onJoin}
                className="btn btn-primary btn-sm"
              >
                Join
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// My Team Card Component
const MyTeamCard = ({ team, onLeave, onUpdateRole, onRemoveMember }) => {
  const { user } = useAuth();
  const isOwner = team.owner_id === user?.id;
  const userRole = team.user_role;

  return (
    <div className="card">
      <div className="card-body">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {team.name}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {team.member_count} member{team.member_count !== 1 ? 's' : ''} • 
              Wallet: ${team.wallet_balance || 0}
            </p>
          </div>
          <div className="flex space-x-2">
            {isOwner && (
              <span className="badge badge-primary">Owner</span>
            )}
            {userRole && (
              <span className="badge badge-success capitalize">{userRole}</span>
            )}
          </div>
        </div>

        {team.description && (
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {team.description}
          </p>
        )}

        {/* Team Members */}
        <div className="mb-4">
          <h4 className="font-medium text-gray-900 dark:text-white mb-2">
            Team Members
          </h4>
          <div className="space-y-2">
            {team.members?.map((member) => (
              <div key={member.id} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-primary-600 dark:text-primary-400">
                      {member.user?.name?.charAt(0) || '?'}
                    </span>
                  </div>
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">
                      {member.user?.name || 'Unknown'}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {member.role}
                    </div>
                  </div>
                </div>
                {isOwner && member.user_id !== user?.id && (
                  <div className="flex space-x-2">
                    <select
                      value={member.role}
                      onChange={(e) => onUpdateRole(team.id, member.id, e.target.value)}
                      className="text-xs border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-800"
                    >
                      <option value="member">Member</option>
                      <option value="lead">Lead</option>
                    </select>
                    <button
                      onClick={() => onRemoveMember(team.id, member.id)}
                      className="text-red-600 hover:text-red-800 text-xs"
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-between items-center">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Created {new Date(team.created_at?.toDate?.() || team.created_at).toLocaleDateString()}
          </div>
          {!isOwner && (
            <button
              onClick={() => onLeave(team.id)}
              className="btn btn-error btn-sm"
            >
              Leave Team
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// Create Team Modal Component
const CreateTeamModal = ({ onSubmit, onClose }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    skills: []
  });
  const [skillInput, setSkillInput] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error('Team name is required');
      return;
    }
    onSubmit(formData);
  };

  const addSkill = (skill) => {
    if (skill && !formData.skills.includes(skill)) {
      setFormData({
        ...formData,
        skills: [...formData.skills, skill]
      });
    }
  };

  const removeSkill = (skill) => {
    setFormData({
      ...formData,
      skills: formData.skills.filter(s => s !== skill)
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Create New Team
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Team Name *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="input"
              placeholder="Enter team name"
              required
            />
          </div>

          <div>
            <label className="label">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="input"
              rows={3}
              placeholder="Describe your team's focus and expertise..."
            />
          </div>

          <div>
            <label className="label">Skills</label>
            <div className="flex space-x-2 mb-2">
              <input
                type="text"
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                className="input flex-1"
                placeholder="Add a skill..."
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addSkill(skillInput.trim());
                    setSkillInput('');
                  }
                }}
              />
              <button
                type="button"
                onClick={() => {
                  if (skillInput.trim()) {
                    addSkill(skillInput.trim());
                    setSkillInput('');
                  }
                }}
                className="btn btn-secondary"
              >
                Add
              </button>
            </div>
            {formData.skills.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {formData.skills.map((skill, index) => (
                  <span key={index} className="badge badge-primary flex items-center space-x-1">
                    <span>{skill}</span>
                    <button
                      type="button"
                      onClick={() => removeSkill(skill)}
                      className="ml-1 text-primary-600 hover:text-primary-800"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
            >
              Create Team
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Team Details Modal Component
const TeamDetailsModal = ({ team, onClose, onJoin }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full p-6">
        <div className="flex items-start justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            {team.name}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {team.description && (
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {team.description}
          </p>
        )}

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Members</div>
            <div className="text-lg font-semibold text-gray-900 dark:text-white">
              {team.member_count}
            </div>
          </div>
          <div>
            <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Wallet Balance</div>
            <div className="text-lg font-semibold text-gray-900 dark:text-white">
              ${team.wallet_balance || 0}
            </div>
          </div>
        </div>

        {team.skills && team.skills.length > 0 && (
          <div className="mb-4">
            <div className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Skills</div>
            <div className="flex flex-wrap gap-2">
              {team.skills.map((skill, index) => (
                <span key={index} className="badge badge-gray">
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="btn btn-secondary"
          >
            Close
          </button>
          <button
            onClick={onJoin}
            className="btn btn-primary"
          >
            Join Team
          </button>
        </div>
      </div>
    </div>
  );
};

export default TeamManagement;
