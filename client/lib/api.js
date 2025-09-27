// API client for GigCampus frontend
// Handles all API calls to the backend

import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    // Try to get token from auth storage first, then fallback to direct localStorage
    let token = null;
    try {
      const authData = localStorage.getItem('gigcampus_auth');
      if (authData) {
        const parsed = JSON.parse(authData);
        token = parsed.token;
      }
    } catch {
      // Fallback to direct token storage
      token = localStorage.getItem('token');
    }
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid - clear storage but don't auto-redirect
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // Let the AuthContext handle the redirect instead of forcing it here
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (idToken) => api.post('/auth/login', { idToken }),
  register: (userData) => api.post('/auth/register', userData),
  getProfile: () => api.get('/auth/profile'),
  updateProfile: (updates) => api.put('/auth/profile', updates),
  logout: () => api.post('/auth/logout'),
};

// Projects API
export const projectsAPI = {
  getProjects: (params = {}) => api.get('/projects', { params }),
  getProject: (id) => api.get(`/projects/${id}`),
  createProject: (projectData) => api.post('/projects', projectData),
  updateProject: (id, updates) => api.put(`/projects/${id}`, updates),
  deleteProject: (id) => api.delete(`/projects/${id}`),
  getRecommended: () => api.get('/projects/recommended'),
  getTrendingSkills: () => api.get('/projects/trending-skills'),
  getSkillSuggestions: () => api.get('/projects/skill-suggestions'),
};

// Bids API
export const bidsAPI = {
  getBids: (params = {}) => api.get('/bids', { params }),
  getBid: (id) => api.get(`/bids/${id}`),
  createBid: (bidData) => api.post('/bids', bidData),
  getProjectBids: (projectId) => api.get(`/bids/project/${projectId}`),
  acceptBid: (id) => api.put(`/bids/${id}/accept`),
  rejectBid: (id) => api.put(`/bids/${id}/reject`),
  deleteBid: (id) => api.delete(`/bids/${id}`),
};

// Contracts API
export const contractsAPI = {
  getContracts: (params = {}) => api.get('/contracts', { params }),
  getContract: (id) => api.get(`/contracts/${id}`),
  updateContractStatus: (id, status, reason) => api.put(`/contracts/${id}/status`, { status, reason }),
  getContractMilestones: (id) => api.get(`/contracts/${id}/milestones`),
  getContractTasks: (id) => api.get(`/contracts/${id}/tasks`),
};

// Milestones API
export const milestonesAPI = {
  createMilestone: (milestoneData) => api.post('/milestones', milestoneData),
  getMilestone: (id) => api.get(`/milestones/${id}`),
  submitMilestone: (id, data) => api.put(`/milestones/${id}/submit`, data),
  approveMilestone: (id, feedback) => api.put(`/milestones/${id}/approve`, { feedback }),
  rejectMilestone: (id, feedback, reason) => api.put(`/milestones/${id}/reject`, { feedback, reason }),
  startMilestone: (id) => api.put(`/milestones/${id}/start`),
};

// Teams API
export const teamsAPI = {
  getAllTeams: (params = {}) => api.get('/teams', { params }),
  getMyTeams: () => api.get('/teams/my-teams'),
  getTeam: (id) => api.get(`/teams/${id}`),
  createTeam: (teamData) => api.post('/teams', teamData),
  joinTeam: (id) => api.post(`/teams/${id}/join`),
  leaveTeam: (id) => api.post(`/teams/${id}/leave`),
  transferLeadership: (id, newLeaderId) => api.put(`/teams/${id}/transfer-leadership`, { new_leader_id: newLeaderId }),
  updateTeam: (id, updates) => api.put(`/teams/${id}/update`, updates),
  getTeamWallet: (id) => api.get(`/teams/${id}/wallet`),
};

// Transactions API
export const transactionsAPI = {
  depositEscrow: (contractId, amount) => api.post('/transactions/escrow/deposit', { contract_id: contractId, amount }),
  releaseEscrow: (contractId, milestoneId, amount, reason) => api.post('/transactions/escrow/release', { contract_id: contractId, milestone_id: milestoneId, amount, reason }),
  partialRelease: (contractId, completionPercentage) => api.post('/transactions/escrow/partial-release', { contract_id: contractId, completion_percentage: completionPercentage }),
  getContractTransactions: (contractId) => api.get(`/transactions/contract/${contractId}`),
  getWallet: () => api.get('/transactions/wallet'),
};

// Reviews API
export const reviewsAPI = {
  createReview: (reviewData) => api.post('/reviews', reviewData),
  getUserReviews: (userId, params = {}) => api.get(`/reviews/user/${userId}`, { params }),
  getPortfolioReviews: (userId, limit = 5) => api.get(`/reviews/portfolio/${userId}`, { params: { limit } }),
  getReviewStats: (userId) => api.get(`/reviews/stats/${userId}`),
  updateReview: (id, updates) => api.put(`/reviews/${id}`, updates),
  deleteReview: (id) => api.delete(`/reviews/${id}`),
};

// Chat API
export const chatAPI = {
  getContractMessages: (contractId, params = {}) => api.get(`/chat/${contractId}/messages`, { params }),
  sendMessage: (contractId, message, type = 'text', fileUrl = null) => api.post(`/chat/${contractId}/messages`, { message, type, file_url: fileUrl }),
  markMessageRead: (contractId, messageId) => api.put(`/chat/${contractId}/messages/${messageId}/read`),
  getUnreadCount: (contractId) => api.get(`/chat/${contractId}/unread-count`),
  getChatContracts: () => api.get('/chat/contracts'),
};

// Leaderboard API
export const leaderboardAPI = {
  getLeaderboard: (category = 'overall', timeFilter = 'all-time') => api.get('/leaderboard', { params: { category, time_filter: timeFilter } }),
  getUserRanking: (userId) => api.get(`/leaderboard/user/${userId}`),
  getTopPerformers: (limit = 10) => api.get('/leaderboard/top', { params: { limit } }),
};

// Notifications API
export const notificationsAPI = {
  getNotifications: (params = {}) => api.get('/notifications', { params }),
  getUnreadCount: () => api.get('/notifications/unread-count'),
  markAsRead: (id) => api.put(`/notifications/${id}/read`),
  markAllAsRead: () => api.put('/notifications/mark-all-read'),
  deleteNotification: (id) => api.delete(`/notifications/${id}`),
  getNotificationTypes: () => api.get('/notifications/types'),
};

// Admin API
export const adminAPI = {
  getDashboard: () => api.get('/admin/dashboard'),
  getDisputes: (params = {}) => api.get('/admin/disputes', { params }),
  getDispute: (id) => api.get(`/admin/disputes/${id}`),
  resolveDispute: (id, resolution, refundAmount, winnerId) => api.put(`/admin/disputes/${id}/resolve`, { resolution, refund_amount: refundAmount, winner_id: winnerId }),
  getUsers: (params = {}) => api.get('/admin/users', { params }),
  updateUserStatus: (id, isActive, reason) => api.put(`/admin/users/${id}/status`, { is_active: isActive, reason }),
  getAnalytics: (period = '30d') => api.get('/admin/analytics', { params: { period } }),
};

// Utility functions
export const handleAPIError = (error) => {
  if (error.response) {
    // Server responded with error status
    const message = error.response.data?.error || error.response.data?.message || 'An error occurred';
    return { message, status: error.response.status };
  } else if (error.request) {
    // Request was made but no response received
    return { message: 'Network error. Please check your connection.', status: 0 };
  } else {
    // Something else happened
    return { message: error.message || 'An unexpected error occurred', status: 0 };
  }
};

export default api;
