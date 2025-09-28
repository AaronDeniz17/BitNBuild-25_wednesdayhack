// AdminDashboard component for platform administration
// Handles dispute resolution, transaction management, and user administration

import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

const AdminDashboard = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [dashboardData, setDashboardData] = useState(null);
  const [disputes, setDisputes] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.role !== 'admin') {
      toast.error('Admin access required');
      return;
    }
    fetchDashboardData();
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      const response = await fetch('/api/admin/dashboard');
      const data = await response.json();
      if (data.success) {
        setDashboardData(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const fetchDisputes = async () => {
    try {
      const response = await fetch('/api/admin/disputes');
      const data = await response.json();
      if (data.success) {
        setDisputes(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch disputes:', error);
      toast.error('Failed to load disputes');
    }
  };

  const fetchTransactions = async () => {
    try {
      const response = await fetch('/api/admin/transactions');
      const data = await response.json();
      if (data.success) {
        setTransactions(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch transactions:', error);
      toast.error('Failed to load transactions');
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/admin/users');
      const data = await response.json();
      if (data.success) {
        setUsers(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
      toast.error('Failed to load users');
    }
  };

  const handleResolveDispute = async (disputeId, status, resolution, action) => {
    try {
      const response = await fetch(`/api/admin/disputes/${disputeId}/resolve`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status, resolution, action }),
      });

      const data = await response.json();
      if (data.success) {
        toast.success(`Dispute ${status} successfully`);
        fetchDisputes();
      } else {
        throw new Error(data.error || 'Failed to resolve dispute');
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleAdjustBalance = async (toType, toId, amount, reason) => {
    try {
      const response = await fetch('/api/admin/transactions/adjust', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ toType, toId, amount, reason }),
      });

      const data = await response.json();
      if (data.success) {
        toast.success('Balance adjusted successfully');
        fetchTransactions();
      } else {
        throw new Error(data.error || 'Failed to adjust balance');
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleUpdateUserStatus = async (userId, isActive, reason) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ is_active: isActive, reason }),
      });

      const data = await response.json();
      if (data.success) {
        toast.success(`User ${isActive ? 'activated' : 'deactivated'} successfully`);
        fetchUsers();
      } else {
        throw new Error(data.error || 'Failed to update user status');
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  if (user?.role !== 'admin') {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center py-12">
          <div className="text-red-500 mb-4">
            <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Access Denied
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            You need admin privileges to access this page.
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="loading-spinner-lg"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Admin Dashboard
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Manage disputes, transactions, and platform administration
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="mb-6">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'overview', label: 'Overview' },
              { id: 'disputes', label: 'Disputes' },
              { id: 'transactions', label: 'Transactions' },
              { id: 'users', label: 'Users' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  if (tab.id === 'disputes') fetchDisputes();
                  if (tab.id === 'transactions') fetchTransactions();
                  if (tab.id === 'users') fetchUsers();
                }}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && dashboardData && (
        <div className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            <StatCard
              title="Total Users"
              value={dashboardData.stats.total_users}
              icon="👥"
              color="blue"
            />
            <StatCard
              title="Total Projects"
              value={dashboardData.stats.total_projects}
              icon="📋"
              color="green"
            />
            <StatCard
              title="Active Contracts"
              value={dashboardData.stats.active_contracts}
              icon="📝"
              color="purple"
            />
            <StatCard
              title="Open Disputes"
              value={dashboardData.stats.open_disputes}
              icon="⚠️"
              color="red"
            />
            <StatCard
              title="Total Transactions"
              value={dashboardData.stats.total_transactions}
              icon="💰"
              color="yellow"
            />
          </div>

          {/* Recent Disputes */}
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Recent Disputes
              </h3>
            </div>
            <div className="card-body">
              {dashboardData.recent_disputes.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400 text-center py-4">
                  No recent disputes
                </p>
              ) : (
                <div className="space-y-3">
                  {dashboardData.recent_disputes.map((dispute) => (
                    <div key={dispute.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded">
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">
                          {dispute.summary}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          Project: {dispute.project_id}
                        </div>
                      </div>
                      <span className={`badge ${
                        dispute.status === 'open' ? 'badge-error' : 'badge-success'
                      }`}>
                        {dispute.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Recent Transactions */}
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Recent Transactions
              </h3>
            </div>
            <div className="card-body">
              {dashboardData.recent_transactions.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400 text-center py-4">
                  No recent transactions
                </p>
              ) : (
                <div className="space-y-3">
                  {dashboardData.recent_transactions.map((transaction) => (
                    <div key={transaction.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded">
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">
                          {transaction.type.replace('_', ' ').toUpperCase()}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          ${transaction.amount} • {transaction.status}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium text-gray-900 dark:text-white">
                          ${transaction.amount}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {new Date(transaction.created_at?.toDate?.() || transaction.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Disputes Tab */}
      {activeTab === 'disputes' && (
        <DisputesTab
          disputes={disputes}
          onResolve={handleResolveDispute}
        />
      )}

      {/* Transactions Tab */}
      {activeTab === 'transactions' && (
        <TransactionsTab
          transactions={transactions}
          onAdjustBalance={handleAdjustBalance}
        />
      )}

      {/* Users Tab */}
      {activeTab === 'users' && (
        <UsersTab
          users={users}
          onUpdateStatus={handleUpdateUserStatus}
        />
      )}
    </div>
  );
};

// Stat Card Component
const StatCard = ({ title, value, icon, color }) => {
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400',
    green: 'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-400',
    purple: 'bg-purple-100 text-purple-600 dark:bg-purple-900 dark:text-purple-400',
    red: 'bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-400',
    yellow: 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900 dark:text-yellow-400'
  };

  return (
    <div className="card">
      <div className="card-body text-center">
        <div className={`inline-flex items-center justify-center w-12 h-12 rounded-full ${colorClasses[color]} mb-3`}>
          <span className="text-2xl">{icon}</span>
        </div>
        <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
          {value}
        </div>
        <div className="text-sm text-gray-500 dark:text-gray-400">
          {title}
        </div>
      </div>
    </div>
  );
};

// Disputes Tab Component
const DisputesTab = ({ disputes, onResolve }) => {
  const [selectedDispute, setSelectedDispute] = useState(null);
  const [resolution, setResolution] = useState('');
  const [action, setAction] = useState('');

  const handleResolve = (dispute) => {
    if (!resolution.trim()) {
      toast.error('Resolution details are required');
      return;
    }
    onResolve(dispute.id, 'resolved', resolution, action);
    setSelectedDispute(null);
    setResolution('');
    setAction('');
  };

  const handleReject = (dispute) => {
    onResolve(dispute.id, 'rejected', resolution, '');
    setSelectedDispute(null);
    setResolution('');
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          Dispute Management
        </h2>
      </div>

      {disputes.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No disputes found
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            All disputes have been resolved
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {disputes.map((dispute) => (
            <div key={dispute.id} className="card">
              <div className="card-body">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {dispute.summary}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Project: {dispute.project?.title || dispute.project_id}
                    </p>
                  </div>
                  <span className={`badge ${
                    dispute.status === 'open' ? 'badge-error' : 
                    dispute.status === 'resolved' ? 'badge-success' : 'badge-warning'
                  }`}>
                    {dispute.status}
                  </span>
                </div>

                <div className="mb-4">
                  <p className="text-gray-600 dark:text-gray-400">
                    {dispute.details}
                  </p>
                </div>

                <div className="flex justify-between items-center">
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    Raised by: {dispute.raised_by?.name || 'Unknown'} • 
                    {new Date(dispute.created_at?.toDate?.() || dispute.created_at).toLocaleDateString()}
                  </div>
                  {dispute.status === 'open' && (
                    <button
                      onClick={() => setSelectedDispute(dispute)}
                      className="btn btn-primary btn-sm"
                    >
                      Resolve
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Resolution Modal */}
      {selectedDispute && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Resolve Dispute
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="label">Resolution Details *</label>
                <textarea
                  value={resolution}
                  onChange={(e) => setResolution(e.target.value)}
                  className="input"
                  rows={4}
                  placeholder="Describe the resolution..."
                />
              </div>

              <div>
                <label className="label">Action</label>
                <select
                  value={action}
                  onChange={(e) => setAction(e.target.value)}
                  className="input"
                >
                  <option value="">No specific action</option>
                  <option value="refund_client">Refund Client</option>
                  <option value="release_to_freelancer">Release to Freelancer</option>
                  <option value="split_funds">Split Funds</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setSelectedDispute(null)}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={() => handleReject(selectedDispute)}
                className="btn btn-warning"
              >
                Reject
              </button>
              <button
                onClick={() => handleResolve(selectedDispute)}
                className="btn btn-primary"
              >
                Resolve
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Transactions Tab Component
const TransactionsTab = ({ transactions, onAdjustBalance }) => {
  const [showAdjustForm, setShowAdjustForm] = useState(false);
  const [adjustData, setAdjustData] = useState({
    toType: 'user',
    toId: '',
    amount: '',
    reason: ''
  });

  const handleAdjust = () => {
    if (!adjustData.toId || !adjustData.amount || !adjustData.reason) {
      toast.error('All fields are required');
      return;
    }
    onAdjustBalance(adjustData.toType, adjustData.toId, parseFloat(adjustData.amount), adjustData.reason);
    setShowAdjustForm(false);
    setAdjustData({ toType: 'user', toId: '', amount: '', reason: '' });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          Transaction Management
        </h2>
        <button
          onClick={() => setShowAdjustForm(true)}
          className="btn btn-primary"
        >
          Adjust Balance
        </button>
      </div>

      {transactions.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No transactions found
          </h3>
        </div>
      ) : (
        <div className="space-y-4">
          {transactions.map((transaction) => (
            <div key={transaction.id} className="card">
              <div className="card-body">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">
                      {transaction.type.replace('_', ' ').toUpperCase()}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {transaction.metadata?.description || 'No description'}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium text-gray-900 dark:text-white">
                      ${transaction.amount}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {new Date(transaction.created_at?.toDate?.() || transaction.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Adjust Balance Modal */}
      {showAdjustForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Adjust Balance
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="label">Adjustment Type</label>
                <select
                  value={adjustData.toType}
                  onChange={(e) => setAdjustData({ ...adjustData, toType: e.target.value })}
                  className="input"
                >
                  <option value="user">User</option>
                  <option value="team">Team</option>
                </select>
              </div>

              <div>
                <label className="label">ID</label>
                <input
                  type="text"
                  value={adjustData.toId}
                  onChange={(e) => setAdjustData({ ...adjustData, toId: e.target.value })}
                  className="input"
                  placeholder="User or Team ID"
                />
              </div>

              <div>
                <label className="label">Amount</label>
                <input
                  type="number"
                  value={adjustData.amount}
                  onChange={(e) => setAdjustData({ ...adjustData, amount: e.target.value })}
                  className="input"
                  placeholder="Positive or negative amount"
                />
              </div>

              <div>
                <label className="label">Reason</label>
                <textarea
                  value={adjustData.reason}
                  onChange={(e) => setAdjustData({ ...adjustData, reason: e.target.value })}
                  className="input"
                  rows={3}
                  placeholder="Reason for adjustment..."
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowAdjustForm(false)}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleAdjust}
                className="btn btn-primary"
              >
                Adjust Balance
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Users Tab Component
const UsersTab = ({ users, onUpdateStatus }) => {
  const [selectedUser, setSelectedUser] = useState(null);
  const [reason, setReason] = useState('');

  const handleUpdateStatus = (user) => {
    if (!reason.trim()) {
      toast.error('Reason is required');
      return;
    }
    onUpdateStatus(user.id, !user.is_active, reason);
    setSelectedUser(null);
    setReason('');
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          User Management
        </h2>
      </div>

      {users.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No users found
          </h3>
        </div>
      ) : (
        <div className="space-y-4">
          {users.map((user) => (
            <div key={user.id} className="card">
              <div className="card-body">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-primary-600 dark:text-primary-400">
                        {user.name?.charAt(0) || '?'}
                      </span>
                    </div>
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">
                        {user.name}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {user.email} • {user.role}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className={`badge ${
                      user.is_active ? 'badge-success' : 'badge-error'
                    }`}>
                      {user.is_active ? 'Active' : 'Inactive'}
                    </span>
                    <button
                      onClick={() => setSelectedUser(user)}
                      className="btn btn-secondary btn-sm"
                    >
                      {user.is_active ? 'Deactivate' : 'Activate'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Status Update Modal */}
      {selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              {selectedUser.is_active ? 'Deactivate' : 'Activate'} User
            </h3>
            
            <div className="mb-4">
              <p className="text-gray-600 dark:text-gray-400">
                {selectedUser.is_active 
                  ? 'Are you sure you want to deactivate this user?' 
                  : 'Are you sure you want to activate this user?'
                }
              </p>
            </div>

            <div className="mb-4">
              <label className="label">Reason *</label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="input"
                rows={3}
                placeholder="Reason for status change..."
              />
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setSelectedUser(null)}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={() => handleUpdateStatus(selectedUser)}
                className={`btn ${selectedUser.is_active ? 'btn-error' : 'btn-success'}`}
              >
                {selectedUser.is_active ? 'Deactivate' : 'Activate'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
