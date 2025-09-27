// Authentication middleware for GigCampus API
// Handles JWT token verification and user authentication

const jwt = require('jsonwebtoken');
const { admin } = require('../config/firebase');

/**
 * Middleware to verify JWT token and authenticate user
 * TODO: Replace with Firebase Auth verification in production
 */
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ error: 'Access token required' });
    }

    // For MVP: Simple JWT verification
    // TODO: Replace with Firebase Admin SDK verification
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'gigcampus-secret-key');
    
    // Verify user exists in database
    const userDoc = await admin.firestore().collection('users').doc(decoded.userId).get();
    
    if (!userDoc.exists) {
      return res.status(401).json({ error: 'User not found' });
    }

    const userData = userDoc.data();
    
    if (!userData.is_active) {
      return res.status(401).json({ error: 'Account deactivated' });
    }

    req.user = {
      id: decoded.userId,
      email: userData.email,
      role: userData.role,
      university_verified: userData.university_verified
    };

    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
};

/**
 * Middleware to check if user has required role
 */
const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    next();
  };
};

/**
 * Middleware to check if user is university verified
 */
const requireUniversityVerification = (req, res, next) => {
  if (!req.user.university_verified) {
    return res.status(403).json({ 
      error: 'University verification required',
      message: 'Please verify your university email to access this feature'
    });
  }
  next();
};

/**
 * Middleware to check if user owns resource
 */
const requireOwnership = (resourceIdParam = 'id') => {
  return async (req, res, next) => {
    try {
      const resourceId = req.params[resourceIdParam];
      const userId = req.user.id;

      // Check if user owns the resource
      // This is a simplified check - implement based on your resource type
      const resourceDoc = await admin.firestore()
        .collection('projects') // Adjust collection name as needed
        .doc(resourceId)
        .get();

      if (!resourceDoc.exists) {
        return res.status(404).json({ error: 'Resource not found' });
      }

      const resourceData = resourceDoc.data();
      
      // Check ownership based on resource type
      if (resourceData.client_id !== userId && resourceData.freelancer_id !== userId) {
        return res.status(403).json({ error: 'Access denied' });
      }

      next();
    } catch (error) {
      console.error('Ownership check error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  };
};

module.exports = {
  authenticateToken,
  requireRole,
  requireUniversityVerification,
  requireOwnership
};
