// Authentication middleware for GigCampus
// Verifies Firebase JWT tokens and adds user info to request

const jwt = require('jsonwebtoken');
const { admin, db } = require('../config/firebase');

// Main authentication middleware
const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'Access denied. No token provided.' });
    }

    // Verify Firebase token
    const decodedToken = await admin.auth().verifyIdToken(token);
    
    // Get user data from Firestore
    const userDoc = await db.collection('users').doc(decodedToken.uid).get();
    
    if (!userDoc.exists) {
      return res.status(401).json({ error: 'User not found' });
    }

    // Add user info to request
    req.user = {
      id: decodedToken.uid,
      email: decodedToken.email,
      ...userDoc.data()
    };
    
    next();
  } catch (error) {
    console.error('Auth error:', error);
    res.status(401).json({ error: 'Invalid token' });
  }
};

// Optional authentication - doesn't fail if no token
const optionalAuth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      req.user = null;
      return next();
    }

    const decodedToken = await admin.auth().verifyIdToken(token);
    const userDoc = await db.collection('users').doc(decodedToken.uid).get();
    
    if (userDoc.exists) {
      req.user = {
        id: decodedToken.uid,
        email: decodedToken.email,
        ...userDoc.data()
      };
    } else {
      req.user = null;
    }
    
    next();
  } catch (error) {
    req.user = null;
    next();
  }
};

// Role-based authentication
const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const userRoles = Array.isArray(req.user.roles) ? req.user.roles : [req.user.role];
    const hasRole = roles.some(role => userRoles.includes(role));
    
    if (!hasRole) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    
    next();
  };
};

// University verification check - only for students
const requireUniversityVerification = (req, res, next) => {
  // Skip verification for non-student users
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  // Only require verification for student users
  if (req.user.role === 'student' && !req.user.university_verified) {
    return res.status(403).json({ 
      error: 'University verification required',
      message: 'Please verify your university email to access this feature'
    });
  }
  
  next();
};

// Admin authentication - requires admin role
const adminAuth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'Access denied. No token provided.' });
    }

    // Verify Firebase token
    const decodedToken = await admin.auth().verifyIdToken(token);
    
    // Get user data from Firestore
    const userDoc = await db.collection('users').doc(decodedToken.uid).get();
    
    if (!userDoc.exists) {
      return res.status(401).json({ error: 'User not found' });
    }

    const userData = userDoc.data();
    
    // Check if user has admin role
    if (userData.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    // Add user info to request
    req.user = {
      id: decodedToken.uid,
      email: decodedToken.email,
      ...userData
    };
    
    next();
  } catch (error) {
    console.error('Admin auth error:', error);
    res.status(401).json({ error: 'Invalid token' });
  }
};

// Rate limiting by user
const userRateLimit = (maxRequests = 100, windowMs = 15 * 60 * 1000) => {
  const requests = new Map();
  
  return (req, res, next) => {
    if (!req.user) return next();
    
    const userId = req.user.id;
    const now = Date.now();
    const windowStart = now - windowMs;
    
    if (!requests.has(userId)) {
      requests.set(userId, []);
    }
    
    const userRequests = requests.get(userId).filter(time => time > windowStart);
    
    if (userRequests.length >= maxRequests) {
      return res.status(429).json({ 
        error: 'Too many requests',
        retryAfter: Math.ceil((userRequests[0] + windowMs - now) / 1000)
      });
    }
    
    userRequests.push(now);
    requests.set(userId, userRequests);
    
    next();
  };
};

module.exports = { 
  auth, 
  optionalAuth, 
  requireRole, 
  requireUniversityVerification,
  adminAuth,
  userRateLimit 
};
