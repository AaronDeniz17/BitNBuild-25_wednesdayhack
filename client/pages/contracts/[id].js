// Contract Detail Page for GigCampus
// Shows contract details with milestones and escrow status

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { toast } from 'react-hot-toast';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import {
  CurrencyDollarIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  DocumentTextIcon,
  ChatBubbleLeftRightIcon,
  ArrowUpTrayIcon,
  StarIcon,
  UserIcon,
  CalendarIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline';

import Layout from '../../components/Layout/Layout';
import { useAuth } from '../../contexts/AuthContext';
import { contractsAPI, milestonesAPI, chatAPI } from '../../lib/api';
import { formatCurrency, formatDate, getRelativeTime } from '../../lib/utils';

const ContractDetailPage = () => {
  const router = useRouter();
  const { id } = router.query;
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const [activeTab, setActiveTab] = useState('overview');
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [selectedMilestone, setSelectedMilestone] = useState(null);
  const [submitData, setSubmitData] = useState({
    files: [],
    description: '',
    notes: ''
  });

  // Fetch contract details
  const { data: contract, isLoading, error } = useQuery(
    ['contract', id],
    () => contractsAPI.getContract(id),
    {
      enabled: !!id,
      retry: 1
    }
  );

  // Fetch chat messages
  const { data: messages } = useQuery(
    ['contract-chat', id],
    () => chatAPI.getContractMessages(id),
    {
      enabled: !!id && activeTab === 'chat',
      retry: 1
    }
  );

  // Submit milestone mutation
  const submitMilestoneMutation = useMutation(
    ({ milestoneId, data }) => milestonesAPI.submitMilestone(milestoneId, data),
    {
      onSuccess: () => {
        toast.success('Milestone submitted successfully!');
        setShowSubmitModal(false);
        setSubmitData({ files: [], description: '', notes: '' });
        queryClient.invalidateQueries(['contract', id]);
      },
      onError: (error) => {
        toast.error(error.response?.data?.error || 'Failed to submit milestone');
      }
    }
  );

  // Approve milestone mutation
  const approveMilestoneMutation = useMutation(
    (milestoneId) => milestonesAPI.approveMilestone(milestoneId),
    {
      onSuccess: () => {
        toast.success('Milestone approved!');
        queryClient.invalidateQueries(['contract', id]);
      },
      onError: (error) => {
        toast.error(error.response?.data?.error || 'Failed to approve milestone');
      }
    }
  );

  const handleSubmitMilestone = (milestone) => {
    setSelectedMilestone(milestone);
    setShowSubmitModal(true);
  };

  const confirmSubmitMilestone = () => {
    if (!selectedMilestone) return;
    
    if (!submitData.description.trim()) {
      toast.error('Please provide a description of your work');
      return;
    }

    submitMilestoneMutation.mutate({
      milestoneId: selectedMilestone.id,
      data: {
        description: submitData.description,
        notes: submitData.notes,
        submitted_files: submitData.files
      }
    });
  };

  const handleApproveMilestone = (milestoneId) => {
    if (window.confirm('Are you sure you want to approve this milestone? This will release the payment.')) {
      approveMilestoneMutation.mutate(milestoneId);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      case 'disputed':
        return 'bg-red-100 text-red-800';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getMilestoneStatusColor = (status) => {
    switch (status) {
      case 'completed':
      case 'approved':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'submitted':
      case 'in_review':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'in_progress':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'rejected':
        return 'text-red-600 bg-red-50 border-red-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const isFreelancer = user && contract?.data?.freelancer_id === user.id;
  const isClient = user && contract?.data?.client_id === user.id;

  if (isLoading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
        </div>
      </Layout>
    );
  }

  if (error || !contract?.data) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Contract not found</h3>
            <p className="mt-1 text-sm text-gray-500">The contract you're looking for doesn't exist.</p>
            <div className="mt-6">
              <button
                onClick={() => router.push('/contracts')}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                View All Contracts
              </button>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  const contractData = contract.data;
  
  // Calculate completion percentage
  const completedMilestones = contractData.milestones?.filter(m => m.status === 'approved') || [];
  const completionPercentage = contractData.milestones?.length > 0 
    ? (completedMilestones.length / contractData.milestones.length) * 100 
    : 0;

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="bg-white shadow rounded-lg mb-6">
            <div className="px-6 py-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center mb-4">
                    <h1 className="text-2xl font-bold text-gray-900 mr-4">{contractData.project_title}</h1>
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(contractData.status)}`}>
                      {contractData.status.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Total Value</p>
                      <p className="text-lg font-semibold text-gray-900">{formatCurrency(contractData.total_amount)}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Escrow Balance</p>
                      <div className="flex items-center">
                        <ShieldCheckIcon className="h-4 w-4 text-green-500 mr-1" />
                        <p className="text-lg font-semibold text-green-600">{formatCurrency(contractData.escrow_balance)}</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Progress</p>
                      <div className="flex items-center">
                        <div className="flex-1 bg-gray-200 rounded-full h-2 mr-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full" 
                            style={{ width: `${completionPercentage}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium text-gray-900">{Math.round(completionPercentage)}%</span>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Started</p>
                      <p className="text-lg font-semibold text-gray-900">{formatDate(contractData.started_at)}</p>
                    </div>
                  </div>
                </div>
                
                {/* Actions */}
                <div className="ml-6 flex space-x-3">
                  <button
                    onClick={() => setActiveTab('chat')}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                  >
                    <ChatBubbleLeftRightIcon className="h-4 w-4 mr-2" />
                    Chat
                  </button>
                  
                  {contractData.status === 'active' && (
                    <button className="inline-flex items-center px-4 py-2 border border-red-300 shadow-sm text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50">
                      <ExclamationTriangleIcon className="h-4 w-4 mr-2" />
                      Report Issue
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="mb-6">
            <nav className="flex space-x-8">
              <button
                onClick={() => setActiveTab('overview')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'overview'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Overview
              </button>
              <button
                onClick={() => setActiveTab('milestones')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'milestones'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Milestones ({contractData.milestones?.length || 0})
              </button>
              <button
                onClick={() => setActiveTab('payments')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'payments'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Payments
              </button>
              <button
                onClick={() => setActiveTab('chat')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'chat'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Communication
              </button>
            </nav>
          </div>

          {/* Tab Content */}
          <div className="space-y-6">
            {activeTab === 'overview' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Project Details */}
                <div className="lg:col-span-2">
                  <div className="bg-white shadow rounded-lg">
                    <div className="px-6 py-6">
                      <h3 className="text-lg font-medium text-gray-900 mb-4">Project Details</h3>
                      <div className="prose max-w-none">
                        <p className="text-gray-700">{contractData.project_description}</p>
                      </div>
                      
                      {contractData.project_skills && (
                        <div className="mt-6">
                          <h4 className="text-sm font-medium text-gray-700 mb-2">Required Skills</h4>
                          <div className="flex flex-wrap gap-2">
                            {contractData.project_skills.map((skill, index) => (
                              <span
                                key={index}
                                className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800"
                              >
                                {skill}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                  {/* Participants */}
                  <div className="bg-white shadow rounded-lg">
                    <div className="px-6 py-6">
                      <h3 className="text-lg font-medium text-gray-900 mb-4">Participants</h3>
                      
                      <div className="space-y-4">
                        <div className="flex items-center">
                          <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-medium">
                            {contractData.client_name?.charAt(0) || 'C'}
                          </div>
                          <div className="ml-3">
                            <p className="text-sm font-medium text-gray-900">{contractData.client_name}</p>
                            <p className="text-xs text-gray-500">Client</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center">
                          <div className="h-10 w-10 rounded-full bg-green-500 flex items-center justify-center text-white font-medium">
                            {contractData.freelancer_name?.charAt(0) || 'F'}
                          </div>
                          <div className="ml-3">
                            <p className="text-sm font-medium text-gray-900">{contractData.freelancer_name}</p>
                            <p className="text-xs text-gray-500">Freelancer</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Quick Stats */}
                  <div className="bg-white shadow rounded-lg">
                    <div className="px-6 py-6">
                      <h3 className="text-lg font-medium text-gray-900 mb-4">Contract Stats</h3>
                      
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-500">Payment Terms</span>
                          <span className="text-sm font-medium text-gray-900">
                            {contractData.payment_terms?.replace('_', ' ') || 'Milestone'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-500">Milestones</span>
                          <span className="text-sm font-medium text-gray-900">
                            {completedMilestones.length}/{contractData.milestones?.length || 0}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-500">Days Active</span>
                          <span className="text-sm font-medium text-gray-900">
                            {Math.ceil((new Date() - new Date(contractData.started_at)) / (1000 * 60 * 60 * 24))}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'milestones' && (
              <div className="bg-white shadow rounded-lg">
                <div className="px-6 py-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-6">Project Milestones</h3>
                  
                  <div className="space-y-6">
                    {contractData.milestones?.map((milestone, index) => (
                      <div key={milestone.id} className="border border-gray-200 rounded-lg p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center mb-3">
                              <h4 className="text-lg font-medium text-gray-900 mr-3">{milestone.title}</h4>
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getMilestoneStatusColor(milestone.status)}`}>
                                {milestone.status.replace('_', ' ')}
                              </span>
                            </div>
                            
                            <p className="text-gray-600 mb-4">{milestone.description}</p>
                            
                            <div className="flex items-center space-x-6 text-sm text-gray-500">
                              <div className="flex items-center">
                                <CurrencyDollarIcon className="h-4 w-4 mr-1" />
                                <span>{formatCurrency(milestone.amount)} ({milestone.weight_pct}%)</span>
                              </div>
                              <div className="flex items-center">
                                <CalendarIcon className="h-4 w-4 mr-1" />
                                <span>Due {formatDate(milestone.due_date)}</span>
                              </div>
                            </div>

                            {milestone.submitted_at && (
                              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                                <h5 className="font-medium text-gray-900 mb-2">Submitted Work</h5>
                                <p className="text-sm text-gray-600 mb-2">{milestone.submission_description}</p>
                                <p className="text-xs text-gray-500">Submitted {getRelativeTime(milestone.submitted_at)}</p>
                              </div>
                            )}

                            {milestone.feedback && (
                              <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                                <h5 className="font-medium text-gray-900 mb-2">Client Feedback</h5>
                                <p className="text-sm text-gray-600">{milestone.feedback}</p>
                              </div>
                            )}
                          </div>
                          
                          <div className="ml-6 flex flex-col space-y-2">
                            {isFreelancer && milestone.status === 'pending' && (
                              <button
                                onClick={() => handleSubmitMilestone(milestone)}
                                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                              >
                                <ArrowUpTrayIcon className="h-4 w-4 mr-1" />
                                Submit
                              </button>
                            )}
                            
                            {isClient && milestone.status === 'submitted' && (
                              <button
                                onClick={() => handleApproveMilestone(milestone.id)}
                                disabled={approveMilestoneMutation.isLoading}
                                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-green-600 hover:bg-green-700 disabled:opacity-50"
                              >
                                <CheckCircleIcon className="h-4 w-4 mr-1" />
                                {approveMilestoneMutation.isLoading ? 'Approving...' : 'Approve'}
                              </button>
                            )}
                            
                            {milestone.status === 'approved' && (
                              <div className="flex items-center text-green-600">
                                <CheckCircleIcon className="h-5 w-5 mr-1" />
                                <span className="text-sm font-medium">Complete</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'payments' && (
              <div className="bg-white shadow rounded-lg">
                <div className="px-6 py-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-6">Payment History</h3>
                  
                  <div className="space-y-4">
                    {contractData.transactions?.map((transaction, index) => (
                      <div key={index} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                        <div className="flex items-center">
                          <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
                            transaction.type === 'milestone_payment' ? 'bg-green-100' : 'bg-blue-100'
                          }`}>
                            <CurrencyDollarIcon className={`h-4 w-4 ${
                              transaction.type === 'milestone_payment' ? 'text-green-600' : 'text-blue-600'
                            }`} />
                          </div>
                          <div className="ml-4">
                            <p className="text-sm font-medium text-gray-900">{transaction.description}</p>
                            <p className="text-xs text-gray-500">{formatDate(transaction.created_at)}</p>
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <p className="text-sm font-medium text-gray-900">{formatCurrency(transaction.amount)}</p>
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            transaction.status === 'completed' ? 'bg-green-100 text-green-800' : 
                            transaction.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {transaction.status}
                          </span>
                        </div>
                      </div>
                    ))}
                    
                    {(!contractData.transactions || contractData.transactions.length === 0) && (
                      <div className="text-center py-8">
                        <CurrencyDollarIcon className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className="mt-2 text-sm font-medium text-gray-900">No payments yet</h3>
                        <p className="mt-1 text-sm text-gray-500">Payments will appear here as milestones are completed.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'chat' && (
              <div className="bg-white shadow rounded-lg">
                <div className="px-6 py-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-6">Project Communication</h3>
                  
                  <div className="space-y-4 h-96 overflow-y-auto">
                    {messages?.data?.map((message, index) => (
                      <div key={index} className={`flex ${message.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                          message.sender_id === user?.id
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-900'
                        }`}>
                          <p className="text-sm">{message.message}</p>
                          <p className={`text-xs mt-1 ${
                            message.sender_id === user?.id ? 'text-blue-100' : 'text-gray-500'
                          }`}>
                            {getRelativeTime(message.created_at)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="mt-4 border-t pt-4">
                    <div className="flex space-x-3">
                      <input
                        type="text"
                        placeholder="Type a message..."
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700">
                        Send
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Submit Milestone Modal */}
      <Transition appear show={showSubmitModal} as={Fragment}>
        <Dialog as="div" className="relative z-10" onClose={() => setShowSubmitModal(false)}>
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
                    Submit Milestone: {selectedMilestone?.title}
                  </Dialog.Title>

                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Work Description *
                      </label>
                      <textarea
                        rows={4}
                        value={submitData.description}
                        onChange={(e) => setSubmitData(prev => ({ ...prev, description: e.target.value }))}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Describe what you've completed for this milestone..."
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Additional Notes
                      </label>
                      <textarea
                        rows={3}
                        value={submitData.notes}
                        onChange={(e) => setSubmitData(prev => ({ ...prev, notes: e.target.value }))}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Any additional notes or comments..."
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Attachments
                      </label>
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                        <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
                        <p className="mt-2 text-sm text-gray-600">
                          Drop files here, or <span className="text-blue-600 cursor-pointer">browse</span>
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          PNG, JPG, PDF up to 10MB
                        </p>
                      </div>
                    </div>

                    <div className="flex justify-end space-x-4">
                      <button
                        type="button"
                        onClick={() => setShowSubmitModal(false)}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={confirmSubmitMilestone}
                        disabled={submitMilestoneMutation.isLoading}
                        className={`px-6 py-2 text-sm font-medium text-white rounded-md ${
                          submitMilestoneMutation.isLoading
                            ? 'bg-gray-400 cursor-not-allowed'
                            : 'bg-blue-600 hover:bg-blue-700'
                        }`}
                      >
                        {submitMilestoneMutation.isLoading ? 'Submitting...' : 'Submit Milestone'}
                      </button>
                    </div>
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

export default ContractDetailPage;