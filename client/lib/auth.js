// Authentication utilities for GigCampus frontend
// Handles user authentication state and token management

export const AUTH_STORAGE_KEY = 'gigcampus_auth';

// Get stored auth data
export const getStoredAuth = () => {
  if (typeof window === 'undefined') return null;
  
  try {
    const stored = localStorage.getItem(AUTH_STORAGE_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch (error) {
    console.error('Error parsing stored auth:', error);
    return null;
  }
};

// Store auth data
export const storeAuth = (authData) => {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authData));
  } catch (error) {
    console.error('Error storing auth:', error);
  }
};

// Clear stored auth data
export const clearAuth = () => {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  } catch (error) {
    console.error('Error clearing auth:', error);
  }
};

// Check if user is authenticated
export const isAuthenticated = () => {
  const auth = getStoredAuth();
  return auth && auth.token && auth.user;
};

// Get current user
export const getCurrentUser = () => {
  const auth = getStoredAuth();
  return auth?.user || null;
};

// Get auth token
export const getAuthToken = () => {
  const auth = getStoredAuth();
  return auth?.token || null;
};

// Check if user has specific role
export const hasRole = (role) => {
  const user = getCurrentUser();
  return user?.role === role;
};

// Check if user is student
export const isStudent = () => {
  return hasRole('student');
};

// Check if user is client
export const isClient = () => {
  return hasRole('client');
};

// Check if user is admin
export const isAdmin = () => {
  return hasRole('admin');
};

// Check if user is university verified
export const isUniversityVerified = () => {
  const user = getCurrentUser();
  return user?.university_verified || false;
};

// Format user display name
export const getUserDisplayName = (user) => {
  if (!user) return 'Unknown User';
  return user.name || user.email || 'Unknown User';
};

// Format user role for display
export const getUserRoleDisplay = (role) => {
  const roleMap = {
    student: 'Student',
    client: 'Client',
    admin: 'Administrator'
  };
  return roleMap[role] || role;
};

// Check if user can access feature
export const canAccessFeature = (feature) => {
  const user = getCurrentUser();
  if (!user) return false;

  switch (feature) {
    case 'create_project':
      return isClient();
    case 'bid_project':
      return isStudent() && isUniversityVerified();
    case 'create_team':
      return isStudent() && isUniversityVerified();
    case 'admin_panel':
      return isAdmin();
    case 'university_verification':
      return isStudent() && !isUniversityVerified();
    default:
      return true;
  }
};

// Get user permissions
export const getUserPermissions = () => {
  const user = getCurrentUser();
  if (!user) return {};

  return {
    canCreateProject: canAccessFeature('create_project'),
    canBidProject: canAccessFeature('bid_project'),
    canCreateTeam: canAccessFeature('create_team'),
    canAccessAdmin: canAccessFeature('admin_panel'),
    needsUniversityVerification: canAccessFeature('university_verification'),
    isUniversityVerified: isUniversityVerified(),
    isStudent: isStudent(),
    isClient: isClient(),
    isAdmin: isAdmin()
  };
};

// Redirect based on user role
export const getDefaultRedirect = () => {
  const user = getCurrentUser();
  if (!user) return '/login';

  if (user.role === 'admin') {
    return '/admin/dashboard';
  } else if (user.role === 'client') {
    return '/client/dashboard';
  } else if (user.role === 'student') {
    if (!user.university_verified) {
      return '/student/verify-university';
    }
    return '/student/dashboard';
  }

  return '/dashboard';
};

// Validate email format
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Validate university email
export const isUniversityEmail = (email) => {
  return email.includes('.edu') || email.includes('university') || email.includes('college');
};

// Format currency
export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount);
};

// Format date
export const formatDate = (date) => {
  if (!date) return '';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }).format(dateObj);
};

// Format date and time
export const formatDateTime = (date) => {
  if (!date) return '';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(dateObj);
};

// Get relative time
export const getRelativeTime = (date) => {
  if (!date) return '';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffInSeconds = Math.floor((now - dateObj) / 1000);
  
  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
  if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)} days ago`;
  
  return formatDate(dateObj);
};

// Debounce function
export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

// Throttle function
export const throttle = (func, limit) => {
  let inThrottle;
  return function executedFunction(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};
