// Enhanced Project Details page with escrow, chat, milestones, and team management
// Supports project viewing, bidding, escrow management, and real-time chat

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../contexts/AuthContext';
import Layout from '../../components/Layout/Layout';
import Chat from '../../components/Chat';
import toast from 'react-hot-toast';

const ProjectDetails = () => {
  const router = useRouter();
  const { id } = router.query;
  const { user } = useAuth();
  const [project, setProject] = useState(null);
  const [bids, setBids] = useState([]);
  const [milestones, setMilestones] = useState([]);
  const [escrowBalance, setEscrowBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [showBidForm, setShowBidForm] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [bidData, setBidData] = useState({
    price: '',
    eta_days: '',
    pitch: '',
    portfolio_url: '',
    message: ''
  });

  useEffect(() => {
    if (id) {
      fetchProject();
      fetchBids();
      fetchEscrowBalance();
    }
  }, [id]);

  const fetchProject = async () => {
    try {
      console.log('Fetching project with ID:', id);
      const response = await fetch(`/api/projects/${id}`);
      console.log('Response status:', response.status);
      
      const data = await response.json();
      console.log('Response data:', data);
      
      if (data.success) {
        setProject(data.data);
        // Set milestones from project data
        if (data.data.milestones) {
          setMilestones(data.data.milestones);
        }
      } else {
        throw new Error(data.error || 'Failed to load project');
      }
    } catch (error) {
      console.error('Failed to fetch project:', error);
      toast.error('Failed to load project');
    } finally {
      setLoading(false);
    }
  };

  const fetchBids = async () => {
    try {
      const response = await fetch(`/api/projects/${id}/bids`);
      const data = await response.json();
      if (data.success) {
        setBids(data.data);
      } else {
        console.warn('Failed to fetch bids:', data.error);
      }
    } catch (error) {
      console.error('Failed to fetch bids:', error);
    }
  };


  const fetchEscrowBalance = async () => {
    try {
      const response = await fetch(`/api/projects/${id}/escrow/balance`);
      const data = await response.json();
      if (data.success) {
        setEscrowBalance(data.escrowBalance || 0);
      } else {
        console.warn('Failed to fetch escrow balance:', data.error);
      }
    } catch (error) {
      console.error('Failed to fetch escrow balance:', error);
    }
  };

  const handleSubmitBid = async (e) => {
    e.preventDefault();
    if (!bidData.price || !bidData.eta_days || !bidData.pitch) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      const response = await fetch('/api/bids', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          project_id: id,
          proposer_type: 'user',
          proposer_id: user.id,
          ...bidData
        }),
      });

      const data = await response.json();
      if (data.success) {
        toast.success('Proposal submitted successfully!');
        setShowBidForm(false);
        setBidData({ price: '', eta_days: '', pitch: '', portfolio_url: '', message: '' });
        fetchBids();
      } else {
        throw new Error(data.error || 'Failed to submit proposal');
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleAcceptBid = async (bidId) => {
    if (!confirm('Are you sure you want to accept this proposal?')) return;

    try {
      const response = await fetch(`/api/bids/${bidId}/accept`, {
        method: 'PUT',
      });

      const data = await response.json();
      if (data.success) {
        toast.success('Proposal accepted successfully!');
        fetchBids();
        fetchProject();
      } else {
        throw new Error(data.error || 'Failed to accept proposal');
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleRejectBid = async (bidId) => {
    if (!confirm('Are you sure you want to reject this proposal?')) return;

    try {
      const response = await fetch(`/api/bids/${bidId}/reject`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reason: 'Not selected' }),
      });

      const data = await response.json();
      if (data.success) {
        toast.success('Proposal rejected');
        fetchBids();
      } else {
        throw new Error(data.error || 'Failed to reject proposal');
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleDepositEscrow = async (amount) => {
    try {
      const response = await fetch(`/api/projects/${id}/escrow/deposit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ amount: parseFloat(amount) }),
      });

      const data = await response.json();
      if (data.success) {
        toast.success('Funds deposited to escrow!');
        fetchEscrowBalance();
      } else {
        throw new Error(data.error || 'Failed to deposit funds');
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleApproveMilestone = async (milestoneId) => {
    try {
      const response = await fetch(`/api/projects/${id}/milestones/${milestoneId}/approve`, {
        method: 'POST',
      });

      const data = await response.json();
      if (data.success) {
        toast.success('Milestone approved!');
        fetchMilestones();
      } else {
        throw new Error(data.error || 'Failed to approve milestone');
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleReleaseMilestone = async (milestoneId) => {
    try {
      const response = await fetch(`/api/projects/${id}/milestones/${milestoneId}/release`, {
        method: 'POST',
      });

      const data = await response.json();
      if (data.success) {
        toast.success('Milestone funds released!');
        fetchMilestones();
        fetchEscrowBalance();
      } else {
        throw new Error(data.error || 'Failed to release funds');
      }
    } catch (error) {
      toast.error(error.message);
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

  if (!project) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto p-6">
          <div className="text-center py-12">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Project Not Found
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              The project you're looking for doesn't exist or has been removed.
            </p>
            <button
              onClick={() => router.push('/projects')}
              className="btn btn-primary"
            >
              Browse Projects
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  const isOwner = project.client_id === user?.id;
  const canBid = user?.role === 'student' && project.status === 'open' && !isOwner;

  return (
    <Layout>
      <div className="max-w-6xl mx-auto p-6">
              {/* Project Header */}
        <div className="mb-8">
                <div className="flex items-start justify-between mb-4">
                  <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                      {project.title}
                    </h1>
              <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                <span>By {project.client?.name || 'Unknown'}</span>
                <span>•</span>
                <span>{new Date(project.created_at?.toDate?.() || project.created_at).toLocaleDateString()}</span>
                <span>•</span>
                <span className={`badge ${
                  project.status === 'open' ? 'badge-success' :
                  project.status === 'in_progress' ? 'badge-warning' :
                  project.status === 'completed' ? 'badge-primary' : 'badge-error'
                }`}>
                  {project.status.replace('_', ' ')}
                      </span>
              </div>
            </div>
            <div className="flex space-x-3">
              {isOwner && (
                <button
                  onClick={() => setShowChat(true)}
                  className="btn btn-secondary"
                >
                  💬 Chat
                </button>
              )}
              {canBid && (
                <button
                  onClick={() => setShowBidForm(true)}
                  className="btn btn-primary"
                >
                  Submit Proposal
                </button>
              )}
                    </div>
                  </div>
                  
          {/* Project Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="card">
              <div className="card-body text-center">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  ${project.budget_min || project.budget_max || 0}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Budget</div>
              </div>
            </div>
            <div className="card">
              <div className="card-body text-center">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {project.bid_count || 0}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Proposals</div>
              </div>
            </div>
            <div className="card">
              <div className="card-body text-center">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  ${escrowBalance}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Escrow</div>
              </div>
            </div>
            <div className="card">
              <div className="card-body text-center">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {milestones.length}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Milestones</div>
                    </div>
                    </div>
                  </div>
                </div>

        {/* Tab Navigation */}
        <div className="mb-6">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="-mb-px flex space-x-8">
              {[
                { id: 'overview', label: 'Overview' },
                { id: 'proposals', label: 'Proposals' },
                { id: 'milestones', label: 'Milestones' },
                { id: 'chat', label: 'Chat' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
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
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Project Description */}
            <div className="card">
              <div className="card-header">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Project Description
                </h3>
                    </div>
              <div className="card-body">
                <p className="text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
                  {project.description}
                </p>
                  </div>
                </div>

                {/* Required Skills */}
            {project.required_skills && project.required_skills.length > 0 && (
              <div className="card">
                <div className="card-header">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Required Skills
                  </h3>
                </div>
                <div className="card-body">
                  <div className="flex flex-wrap gap-2">
                    {project.required_skills.map((skill, index) => (
                      <span key={index} className="badge badge-primary">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
                  </div>
                )}

            {/* Project Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="card">
                <div className="card-header">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Project Details
                  </h3>
                </div>
                <div className="card-body space-y-3">
                  <div>
                    <span className="font-medium text-gray-900 dark:text-white">Type:</span>
                    <span className="ml-2 text-gray-600 dark:text-gray-400 capitalize">
                      {project.project_type}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-900 dark:text-white">Budget:</span>
                    <span className="ml-2 text-gray-600 dark:text-gray-400">
                      {project.is_fixed_budget 
                        ? `$${project.budget_min}` 
                        : `$${project.budget_min} - $${project.budget_max}`
                      }
                    </span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-900 dark:text-white">Deadline:</span>
                    <span className="ml-2 text-gray-600 dark:text-gray-400">
                      {new Date(project.deadline?.toDate?.() || project.deadline).toLocaleDateString()}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-900 dark:text-white">Category:</span>
                    <span className="ml-2 text-gray-600 dark:text-gray-400 capitalize">
                      {project.category?.replace('-', ' ')}
                    </span>
              </div>
                </div>
              </div>

              {/* Escrow Management */}
              {isOwner && (
                <div className="card">
                  <div className="card-header">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Escrow Management
                    </h3>
                  </div>
                  <div className="card-body">
                    <div className="mb-4">
                      <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                        Current Escrow Balance
                      </div>
                      <div className="text-2xl font-bold text-gray-900 dark:text-white">
                        ${escrowBalance}
                          </div>
                        </div>
                    <EscrowDepositForm onDeposit={handleDepositEscrow} />
                  </div>
                          </div>
                        )}
                      </div>
                  </div>
        )}

        {/* Proposals Tab */}
        {activeTab === 'proposals' && (
          <ProposalsTab
            bids={bids}
            isOwner={isOwner}
            onAccept={handleAcceptBid}
            onReject={handleRejectBid}
          />
        )}

        {/* Milestones Tab */}
        {activeTab === 'milestones' && (
          <MilestonesTab
            milestones={milestones}
            isOwner={isOwner}
            onApprove={handleApproveMilestone}
            onRelease={handleReleaseMilestone}
          />
        )}

        {/* Chat Tab */}
        {activeTab === 'chat' && (
          <div className="h-96">
            <Chat projectId={id} />
                </div>
              )}

        {/* Bid Form Modal */}
        {showBidForm && (
          <BidFormModal
            project={project}
            bidData={bidData}
            setBidData={setBidData}
            onSubmit={handleSubmitBid}
            onClose={() => setShowBidForm(false)}
          />
        )}

        {/* Chat Modal */}
        {showChat && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg max-w-4xl w-full h-96">
              <Chat projectId={id} onClose={() => setShowChat(false)} />
                  </div>
                </div>
              )}
            </div>
    </Layout>
  );
};

// Escrow Deposit Form Component
const EscrowDepositForm = ({ onDeposit }) => {
  const [amount, setAmount] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!amount || parseFloat(amount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }
    onDeposit(amount);
    setAmount('');
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label className="label">Deposit Amount</label>
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="input"
          placeholder="Enter amount"
          min="1"
          step="0.01"
        />
      </div>
      <button type="submit" className="btn btn-primary w-full">
        Deposit to Escrow
      </button>
    </form>
  );
};

// Proposals Tab Component
const ProposalsTab = ({ bids, isOwner, onAccept, onReject }) => {
  if (!isOwner) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 mb-4">
          <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          Access Restricted
        </h3>
        <p className="text-gray-500 dark:text-gray-400">
          Only project owners can view proposals
        </p>
      </div>
    );
  }

  return (
            <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          Project Proposals ({bids.length})
        </h2>
      </div>

      {bids.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No proposals yet
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            Proposals will appear here when students submit them
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {bids.map((bid) => (
            <div key={bid.id} className="card">
              <div className="card-body">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-primary-600 dark:text-primary-400">
                        {bid.bidder?.name?.charAt(0) || '?'}
                      </span>
                    </div>
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">
                        {bid.bidder?.name || 'Unknown'}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {bid.bidder?.university} • {bid.skills_match}% skill match
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-gray-900 dark:text-white">
                      ${bid.price}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {bid.eta_days} days
                    </div>
                    </div>
                  </div>

                <div className="mb-4">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">Proposal</h4>
                  <p className="text-gray-600 dark:text-gray-400">
                    {bid.pitch}
                  </p>
              </div>

                {bid.portfolio_url && (
                  <div className="mb-4">
                    <a
                      href={bid.portfolio_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary-600 hover:text-primary-800 text-sm"
                    >
                      View Portfolio →
                    </a>
                  </div>
                )}

                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => onReject(bid.id)}
                    className="btn btn-error btn-sm"
                  >
                    Reject
                  </button>
                  <button
                    onClick={() => onAccept(bid.id)}
                    className="btn btn-primary btn-sm"
                  >
                    Accept
                  </button>
                </div>
              </div>
            </div>
          ))}
                </div>
              )}
    </div>
  );
};

// Milestones Tab Component
const MilestonesTab = ({ milestones, isOwner, onApprove, onRelease }) => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          Project Milestones ({milestones.length})
        </h2>
                </div>

      {milestones.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No milestones defined
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            Milestones will appear here when they are created
          </p>
                </div>
      ) : (
        <div className="space-y-4">
          {milestones.map((milestone, index) => (
            <div key={milestone.id} className="card">
              <div className="card-body">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {milestone.title}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      {milestone.description}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-gray-900 dark:text-white">
                      {milestone.percentage}%
                  </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      Due: {new Date(milestone.due_date?.toDate?.() || milestone.due_date).toLocaleDateString()}
                  </div>
                </div>
              </div>

                <div className="flex items-center justify-between">
                  <span className={`badge ${
                    milestone.status === 'pending' ? 'badge-warning' :
                    milestone.status === 'approved' ? 'badge-success' :
                    milestone.status === 'released' ? 'badge-primary' : 'badge-error'
                  }`}>
                    {milestone.status.replace('_', ' ')}
                  </span>
                  
                  {isOwner && milestone.status === 'pending' && (
                    <button
                      onClick={() => onApprove(milestone.id)}
                      className="btn btn-success btn-sm"
                    >
                      Approve
                    </button>
                  )}
                  
                  {isOwner && milestone.status === 'approved' && (
                    <button
                      onClick={() => onRelease(milestone.id)}
                      className="btn btn-primary btn-sm"
                    >
                      Release Funds
                    </button>
                  )}
            </div>
          </div>
        </div>
          ))}
        </div>
      )}
      </div>
  );
};

// Bid Form Modal Component
const BidFormModal = ({ project, bidData, setBidData, onSubmit, onClose }) => {
  return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Submit Proposal
        </h2>

        <form onSubmit={onSubmit} className="space-y-4">
                  <div>
            <label className="label">Proposed Price *</label>
                    <input
                      type="number"
                      value={bidData.price}
              onChange={(e) => setBidData({ ...bidData, price: e.target.value })}
                      className="input"
              placeholder="Enter your proposed price"
                      min="1"
              step="0.01"
                      required
                    />
                  </div>

                  <div>
            <label className="label">Estimated Days *</label>
                    <input
                      type="number"
                      value={bidData.eta_days}
              onChange={(e) => setBidData({ ...bidData, eta_days: e.target.value })}
                      className="input"
              placeholder="How many days will this take?"
                      min="1"
                      required
                    />
                </div>

                <div>
            <label className="label">Proposal Pitch *</label>
                  <textarea
              value={bidData.pitch}
              onChange={(e) => setBidData({ ...bidData, pitch: e.target.value })}
                    className="input"
              rows={4}
              placeholder="Why should the client choose you? What's your approach?"
                    required
                  />
                </div>

                <div>
            <label className="label">Portfolio URL</label>
                        <input
                          type="url"
              value={bidData.portfolio_url}
              onChange={(e) => setBidData({ ...bidData, portfolio_url: e.target.value })}
              className="input"
              placeholder="Link to your portfolio or previous work"
            />
                </div>

                <div>
            <label className="label">Additional Message</label>
                  <textarea
                    value={bidData.message}
              onChange={(e) => setBidData({ ...bidData, message: e.target.value })}
                    className="input"
              rows={3}
                    placeholder="Any additional information for the client..."
                  />
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
              Submit Proposal
                  </button>
                </div>
              </form>
            </div>
          </div>
  );
};

export default ProjectDetails;