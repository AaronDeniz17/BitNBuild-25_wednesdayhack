// Project Detail Page with Bid Modal for GigCampus
// Shows project details and allows students to submit bids

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { toast } from 'react-hot-toast';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import {
  CalendarIcon,
  CurrencyDollarIcon,
  ClockIcon,
  UserGroupIcon,
  TagIcon,
  XMarkIcon,
  PaperAirplaneIcon,
  StarIcon,
  BriefcaseIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

import Layout from '../../components/Layout/Layout';
import { useAuth } from '../../contexts/AuthContext';
import { projectsAPI, bidsAPI } from '../../lib/api';
import { formatCurrency, formatDate, getRelativeTime } from '../../lib/utils';

const ProjectDetailPage = () => {
  const router = useRouter();
  const { id } = router.query;
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const [isBidModalOpen, setIsBidModalOpen] = useState(false);
  const [bidData, setBidData] = useState({
    price: '',
    eta_days: '',
    proposal: '',
    portfolio_links: [''],
    message: ''
  });

  useEffect(() => {
    if (id) {
      fetchProjectDetails();
    }
  }, [id]);

  const fetchProjectDetails = async () => {
    try {
      const response = await projectsAPI.getProject(id);
      setProject(response.data.project);
      setClient(response.data.client);
      setBids(response.data.bids || []);
    } catch (error) {
      console.error('Failed to fetch project:', error);
      toast.error('Failed to load project details');
    } finally {
      setLoading(false);
    }
  };

  const handleBidSubmit = async (e) => {
    e.preventDefault();
    
    if (!user || user.role !== 'student') {
      toast.error('Only students can submit bids');
      return;
    }

    if (!bidData.price || !bidData.proposal || !bidData.eta_days) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (parseFloat(bidData.price) <= 0) {
      toast.error('Bid amount must be greater than 0');
      return;
    }

    setSubmittingBid(true);

    try {
      const bidPayload = {
        project_id: id,
        price: parseFloat(bidData.price),
        proposal: bidData.proposal,
        eta_days: parseInt(bidData.eta_days),
        portfolio_links: bidData.portfolio_links.filter(link => link.trim()),
        message: bidData.message
      };

      await bidsAPI.createBid(bidPayload);
      
      toast.success('Bid submitted successfully!');
      setShowBidModal(false);
      setBidData({
        price: '',
        proposal: '',
        eta_days: '',
        portfolio_links: [],
        message: ''
      });
      
      // Refresh project details to show new bid
      fetchProjectDetails();
    } catch (error) {
      console.error('Bid submission error:', error);
      toast.error('Failed to submit bid. Please try again.');
    } finally {
      setSubmittingBid(false);
    }
  };

  const handlePortfolioLinkChange = (index, value) => {
    setBidData(prev => ({
      ...prev,
      portfolio_links: prev.portfolio_links.map((link, i) => 
        i === index ? value : link
      )
    }));
  };

  const addPortfolioLink = () => {
    setBidData(prev => ({
      ...prev,
      portfolio_links: [...prev.portfolio_links, '']
    }));
  };

  const removePortfolioLink = (index) => {
    setBidData(prev => ({
      ...prev,
      portfolio_links: prev.portfolio_links.filter((_, i) => i !== index)
    }));
  };

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="loading-spinner-lg"></div>
        </div>
      </Layout>
    );
  }

  if (!project) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Project Not Found</h2>
            <p className="text-gray-600 mb-4">The project you're looking for doesn't exist.</p>
            <Link href="/projects" className="btn-primary">Browse Projects</Link>
          </div>
        </div>
      </Layout>
    );
  }

  const canBid = user && user.role === 'student' && project.status === 'open' && 
                 !bids.some(bid => bid.freelancer_id === user.id);

  const userBid = bids.find(bid => bid.freelancer_id === user.id);

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-6">
            <button
              onClick={() => router.back()}
              className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
            >
              <ChevronLeftIcon className="h-5 w-5 mr-1" />
              Back to Projects
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Project Header */}
              <div className="card p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">
                      {project.title}
                    </h1>
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <span className="flex items-center">
                        <CalendarIcon className="h-4 w-4 mr-1" />
                        Posted {getRelativeTime(project.created_at)}
                      </span>
                      <span className="flex items-center">
                        <BriefcaseIcon className="h-4 w-4 mr-1" />
                        {project.category?.replace('-', ' ')}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        project.urgency === 'high' ? 'bg-red-100 text-red-800' :
                        project.urgency === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {project.urgency} priority
                      </span>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-2xl font-bold text-primary-600">
                      {formatCurrency(project.budget)}
                    </div>
                    <div className="text-sm text-gray-600">
                      Fixed Price
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <ClockIcon className="h-6 w-6 text-gray-600 mx-auto mb-1" />
                    <div className="text-sm text-gray-600">Deadline</div>
                    <div className="font-medium">{formatDate(project.deadline)}</div>
                  </div>
                  
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <UserGroupIcon className="h-6 w-6 text-gray-600 mx-auto mb-1" />
                    <div className="text-sm text-gray-600">Bids</div>
                    <div className="font-medium">{bids.length}</div>
                  </div>
                  
                  {project.estimated_hours > 0 && (
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <ClockIcon className="h-6 w-6 text-gray-600 mx-auto mb-1" />
                      <div className="text-sm text-gray-600">Est. Hours</div>
                      <div className="font-medium">{project.estimated_hours}h</div>
                    </div>
                  )}
                  
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <StarIcon className="h-6 w-6 text-gray-600 mx-auto mb-1" />
                    <div className="text-sm text-gray-600">Type</div>
                    <div className="font-medium">
                      {project.requires_team ? 'Team' : 'Individual'}
                    </div>
                  </div>
                </div>

                {/* Required Skills */}
                <div className="mb-6">
                  <h3 className="font-medium text-gray-900 mb-3">Required Skills</h3>
                  <div className="flex flex-wrap gap-2">
                    {project.required_skills?.map((skill, index) => (
                      <span key={index} className="badge-primary">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Team Requirements */}
                {project.requires_team && (
                  <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                    <h3 className="font-medium text-blue-900 mb-2">Team Requirements</h3>
                    <p className="text-blue-800">
                      This project requires a team of {project.team_size_min} to {project.team_size_max} members.
                    </p>
                  </div>
                )}
              </div>

              {/* Project Description */}
              <div className="card p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Project Description</h2>
                <div className="prose max-w-none">
                  <p className="text-gray-700 whitespace-pre-wrap">{project.description}</p>
                </div>
              </div>

              {/* Milestones */}
              {project.milestones && project.milestones.length > 0 && (
                <div className="card p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Project Milestones</h2>
                  <div className="space-y-4">
                    {project.milestones.map((milestone, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-medium text-gray-900">{milestone.title}</h3>
                          <div className="text-sm font-medium text-primary-600">
                            {milestone.weight_pct}% • {formatCurrency((project.budget * milestone.weight_pct) / 100)}
                          </div>
                        </div>
                        {milestone.description && (
                          <p className="text-gray-600 text-sm mb-2">{milestone.description}</p>
                        )}
                        {milestone.due_date && (
                          <div className="text-xs text-gray-500">
                            Due: {formatDate(milestone.due_date)}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* User's Bid Status */}
              {userBid && (
                <div className="card p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Your Bid</h2>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-blue-900">
                        Bid Amount: {formatCurrency(userBid.price)}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        userBid.status === 'accepted' ? 'bg-green-100 text-green-800' :
                        userBid.status === 'rejected' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {userBid.status}
                      </span>
                    </div>
                    <p className="text-blue-800 text-sm mb-2">
                      ETA: {userBid.eta_days} days
                    </p>
                    <p className="text-blue-700 text-sm">
                      {userBid.proposal}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Client Information */}
              <div className="card p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Client</h3>
                {client && (
                  <div className="space-y-3">
                    <div>
                      <div className="font-medium text-gray-900">{client.name}</div>
                      <div className="text-sm text-gray-600">{client.university}</div>
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <CalendarIcon className="h-4 w-4 mr-1" />
                      Member since {formatDate(client.created_at)}
                    </div>
                  </div>
                )}
              </div>

              {/* Action Button */}
              {canBid && (
                <button
                  onClick={() => setShowBidModal(true)}
                  className="btn-primary w-full"
                >
                  Submit Bid
                </button>
              )}

              {!user && (
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className="text-gray-600 mb-3">Want to bid on this project?</p>
                  <Link href="/login" className="btn-primary">
                    Sign In
                  </Link>
                </div>
              )}

              {user && user.role === 'client' && (
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className="text-gray-600">You're viewing as a client</p>
                </div>
              )}

              {project.status !== 'open' && (
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className="text-gray-600">This project is no longer accepting bids</p>
                </div>
              )}

              {/* Project Stats */}
              <div className="card p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Project Stats</h3>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Total Bids</span>
                    <span className="font-medium">{bids.length}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Average Bid</span>
                    <span className="font-medium">
                      {bids.length > 0 
                        ? formatCurrency(bids.reduce((sum, bid) => sum + bid.price, 0) / bids.length)
                        : 'N/A'
                      }
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Status</span>
                    <span className={`font-medium ${
                      project.status === 'open' ? 'text-green-600' :
                      project.status === 'in_progress' ? 'text-blue-600' :
                      'text-gray-600'
                    }`}>
                      {project.status.replace('_', ' ')}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bid Modal */}
      {showBidModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-screen overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Submit Your Bid</h2>
              
              <form onSubmit={handleBidSubmit} className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="label">
                      Your Bid ($) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      value={bidData.price}
                      onChange={(e) => setBidData({...bidData, price: e.target.value})}
                      className="input"
                      placeholder="1000"
                      min="1"
                      required
                    />
                  </div>

                  <div>
                    <label className="label">
                      Delivery Time (days) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      value={bidData.eta_days}
                      onChange={(e) => setBidData({...bidData, eta_days: e.target.value})}
                      className="input"
                      placeholder="14"
                      min="1"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="label">
                    Your Proposal <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    rows={6}
                    value={bidData.proposal}
                    onChange={(e) => setBidData({...bidData, proposal: e.target.value})}
                    className="input"
                    placeholder="Explain your approach, experience, and why you're the right fit for this project..."
                    required
                  />
                </div>

                <div>
                  <label className="label">Portfolio Links (Optional)</label>
                  <div className="space-y-2">
                    {bidData.portfolio_links.map((link, index) => (
                      <div key={index} className="flex space-x-2">
                        <input
                          type="url"
                          value={link}
                          onChange={(e) => handlePortfolioLinkChange(index, e.target.value)}
                          className="input flex-1"
                          placeholder="https://github.com/yourproject"
                        />
                        <button
                          type="button"
                          onClick={() => removePortfolioLink(index)}
                          className="btn-secondary px-3"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={addPortfolioLink}
                      className="btn-secondary text-sm"
                    >
                      + Add Portfolio Link
                    </button>
                  </div>
                </div>

                <div>
                  <label className="label">Additional Message (Optional)</label>
                  <textarea
                    rows={3}
                    value={bidData.message}
                    onChange={(e) => setBidData({...bidData, message: e.target.value})}
                    className="input"
                    placeholder="Any additional information for the client..."
                  />
                </div>

                <div className="flex justify-end space-x-4">
                  <button
                    type="button"
                    onClick={() => setShowBidModal(false)}
                    className="btn-secondary"
                    disabled={submittingBid}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn-primary"
                    disabled={submittingBid}
                  >
                    {submittingBid ? 'Submitting...' : 'Submit Bid'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default ProjectDetailPage;