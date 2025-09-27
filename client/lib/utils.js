// Utility functions for GigCampus
// Common formatting and helper functions

/**
 * Format currency values with proper formatting
 * @param {number} amount - The amount to format
 * @param {string} currency - Currency code (default: USD)
 * @returns {string} Formatted currency string
 */
export const formatCurrency = (amount, currency = 'USD') => {
  if (!amount && amount !== 0) return '$0';
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(numAmount);
};

/**
 * Format date to a readable string
 * @param {Date|string} date - Date to format
 * @returns {string} Formatted date string
 */
export const formatDate = (date) => {
  if (!date) return '';
  const dateObj = date instanceof Date ? date : new Date(date);
  if (isNaN(dateObj.getTime())) return '';
  
  return dateObj.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

// Format date and time to readable string
export const formatDateTime = (date) => {
  if (!date) return '';
  const dateObj = date instanceof Date ? date : new Date(date);
  if (isNaN(dateObj.getTime())) return '';
  
  return dateObj.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

/**
 * Check if an email address is from a university domain
 * @param {string} email - Email address to check
 * @returns {boolean} True if it's a university email
 */
export const isUniversityEmail = (email) => {
  if (!email) return false;
  const domain = email.split('@')[1]?.toLowerCase();
  if (!domain) return false;
  
  // Common university email domains
  return domain.endsWith('.edu') || 
         domain.endsWith('.ac.uk') || 
         domain.endsWith('.edu.au') ||
         domain.endsWith('.ac.in');
};

// Get relative time (e.g., "2 days ago", "in 3 hours")
export const getRelativeTime = (date) => {
  if (!date) return '';
  const dateObj = date instanceof Date ? date : new Date(date);
  if (isNaN(dateObj.getTime())) return '';
  
  const now = new Date();
  const diffMs = now - dateObj;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) {
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    if (diffHours === 0) {
      const diffMins = Math.floor(diffMs / (1000 * 60));
      return diffMins <= 0 ? 'Just now' : `${diffMins} minute${diffMins === 1 ? '' : 's'} ago`;
    }
    return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
  } else if (diffDays === 1) {
    return 'Yesterday';
  } else if (diffDays < 7) {
    return `${diffDays} days ago`;
  }
  
  return formatDate(dateObj);
};

// Calculate skill match percentage
export const calculateSkillMatch = (requiredSkills = [], userSkills = []) => {
  if (!requiredSkills.length) return 100;
  if (!userSkills.length) return 0;
  
  const matches = requiredSkills.filter(skill => 
    userSkills.some(userSkill => 
      userSkill.toLowerCase().includes(skill.toLowerCase()) ||
      skill.toLowerCase().includes(userSkill.toLowerCase())
    )
  );
  
  return Math.round((matches.length / requiredSkills.length) * 100);
};

// Truncate text with ellipsis
export const truncateText = (text, maxLength = 100) => {
  if (!text || text.length <= maxLength) return text;
  return text.substring(0, maxLength).trim() + '...';
};

// Capitalize first letter of each word
export const capitalizeWords = (str) => {
  if (!str) return '';
  return str.split(' ').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
  ).join(' ');
};

// Get status badge color
export const getStatusColor = (status) => {
  const colors = {
    'active': 'bg-green-100 text-green-800',
    'completed': 'bg-blue-100 text-blue-800',
    'cancelled': 'bg-red-100 text-red-800',
    'paused': 'bg-yellow-100 text-yellow-800',
    'draft': 'bg-gray-100 text-gray-800',
    'pending': 'bg-orange-100 text-orange-800',
    'approved': 'bg-green-100 text-green-800',
    'rejected': 'bg-red-100 text-red-800',
    'in_progress': 'bg-blue-100 text-blue-800',
    'in_review': 'bg-purple-100 text-purple-800',
    'open': 'bg-green-100 text-green-800',
  };
  
  return colors[status] || 'bg-gray-100 text-gray-800';
};

// Get urgency badge color
export const getUrgencyColor = (urgency) => {
  const colors = {
    'low': 'bg-green-100 text-green-800',
    'medium': 'bg-yellow-100 text-yellow-800',
    'high': 'bg-red-100 text-red-800',
    'urgent': 'bg-red-200 text-red-900',
  };
  
  return colors[urgency] || 'bg-gray-100 text-gray-800';
};

// Format file size
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Generate unique ID
export const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

// Validate email
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Validate university email
export const isValidUniversityEmail = (email) => {
  const universityDomains = [
    '.edu', '.ac.uk', '.ac.in', '.edu.au', '.edu.ca', '.ac.nz',
    '.uni-', '.univ-', '.ac.at', '.ac.be', '.ac.dk', '.ac.jp'
  ];
  
  return universityDomains.some(domain => email.toLowerCase().includes(domain));
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

// Deep clone object
export const deepClone = (obj) => {
  if (obj === null || typeof obj !== 'object') return obj;
  if (obj instanceof Date) return new Date(obj.getTime());
  if (obj instanceof Array) return obj.map(item => deepClone(item));
  if (typeof obj === 'object') {
    const clonedObj = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        clonedObj[key] = deepClone(obj[key]);
      }
    }
    return clonedObj;
  }
};

// Skills categories for the platform
export const SKILL_CATEGORIES = {
  'Web Development': [
    'React', 'Angular', 'Vue.js', 'JavaScript', 'TypeScript', 'HTML', 'CSS',
    'Node.js', 'Express.js', 'PHP', 'Laravel', 'WordPress', 'Django', 'Flask'
  ],
  'Mobile Development': [
    'React Native', 'Flutter', 'iOS (Swift)', 'Android (Kotlin)', 'Ionic',
    'Xamarin', 'Unity', 'App Store Optimization'
  ],
  'Design & UI/UX': [
    'UI Design', 'UX Design', 'Graphic Design', 'Figma', 'Adobe XD',
    'Photoshop', 'Illustrator', 'Branding', 'Logo Design', 'Wireframing'
  ],
  'Data Science & AI': [
    'Python', 'R', 'Machine Learning', 'Data Analysis', 'SQL', 'Pandas',
    'TensorFlow', 'PyTorch', 'Data Visualization', 'Statistics'
  ],
  'Backend & Cloud': [
    'AWS', 'Google Cloud', 'Azure', 'Docker', 'Kubernetes', 'MongoDB',
    'PostgreSQL', 'Redis', 'GraphQL', 'Microservices'
  ],
  'Marketing & Content': [
    'Content Writing', 'SEO', 'Social Media Marketing', 'Email Marketing',
    'Google Ads', 'Facebook Ads', 'Copywriting', 'Video Editing'
  ],
  'Business & Finance': [
    'Business Analysis', 'Financial Modeling', 'Excel', 'PowerBI',
    'Project Management', 'Market Research', 'Strategy Consulting'
  ],
  'Other': [
    'Translation', 'Virtual Assistant', 'Customer Support', 'QA Testing',
    '3D Modeling', 'Animation', 'Music Production', 'Voice Over'
  ]
};

// University validation
export const validateUniversity = (universityName) => {
  const commonUniversities = [
    'Stanford University', 'MIT', 'Harvard University', 'UC Berkeley',
    'UCLA', 'USC', 'NYU', 'Columbia University', 'Princeton University',
    'Yale University', 'University of Pennsylvania', 'Cornell University',
    'Carnegie Mellon University', 'Georgia Tech', 'University of Washington',
    'University of Texas at Austin', 'University of Michigan', 'Caltech'
  ];
  
  return commonUniversities.includes(universityName) || universityName.toLowerCase().includes('university') || universityName.toLowerCase().includes('college');
};

// Extract university from email domain
export const extractUniversityFromEmail = (email) => {
  if (!email) return '';
  
  const domain = email.split('@')[1];
  if (!domain) return '';
  
  // Common mappings
  const universityMappings = {
    'stanford.edu': 'Stanford University',
    'mit.edu': 'MIT',
    'harvard.edu': 'Harvard University',
    'berkeley.edu': 'UC Berkeley',
    'ucla.edu': 'UCLA',
    'usc.edu': 'USC',
    'nyu.edu': 'NYU',
    'columbia.edu': 'Columbia University',
    'princeton.edu': 'Princeton University',
    'yale.edu': 'Yale University',
    'upenn.edu': 'University of Pennsylvania',
    'cornell.edu': 'Cornell University',
    'cmu.edu': 'Carnegie Mellon University',
    'gatech.edu': 'Georgia Tech',
    'washington.edu': 'University of Washington',
    'utexas.edu': 'University of Texas at Austin',
    'umich.edu': 'University of Michigan',
    'caltech.edu': 'Caltech'
  };
  
  return universityMappings[domain] || capitalizeWords(domain.replace('.edu', '').replace(/[.-]/g, ' '));
};

// Calculate project match score
export const calculateProjectMatch = (project, userProfile) => {
  let score = 0;
  let factors = 0;
  
  // Skills match (40% weight)
  const skillMatch = calculateSkillMatch(project.required_skills || [], userProfile.skills || []);
  score += skillMatch * 0.4;
  factors += 0.4;
  
  // Budget compatibility (20% weight)
  if (userProfile.hourly_rate && project.budget && project.estimated_hours) {
    const expectedPayment = userProfile.hourly_rate * project.estimated_hours;
    const budgetRatio = Math.min(project.budget / expectedPayment, 2); // Cap at 2x
    score += (budgetRatio * 50) * 0.2; // Convert to 0-100 scale
    factors += 0.2;
  }
  
  // University match (15% weight)
  if (project.client_university && userProfile.university) {
    const universityMatch = project.client_university === userProfile.university ? 100 : 0;
    score += universityMatch * 0.15;
    factors += 0.15;
  }
  
  // Experience level (15% weight)
  if (userProfile.completed_projects !== undefined) {
    const experienceScore = Math.min(userProfile.completed_projects * 10, 100); // 10 points per project, max 100
    score += experienceScore * 0.15;
    factors += 0.15;
  }
  
  // Availability (10% weight)
  if (userProfile.is_available) {
    score += 100 * 0.10;
    factors += 0.10;
  }
  
  return factors > 0 ? Math.round(score / factors) : 0;
};

// Generate avatar initials
export const getInitials = (name) => {
  if (!name) return '??';
  return name
    .split(' ')
    .map(word => word.charAt(0))
    .join('')
    .substring(0, 2)
    .toUpperCase();
};

// Format percentage
export const formatPercentage = (value, decimals = 0) => {
  return `${value.toFixed(decimals)}%`;
};

// Sleep utility for testing
export const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));