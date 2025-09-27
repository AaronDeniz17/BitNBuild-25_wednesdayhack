// Authentication routes for GigCampus
// Handles user registration, login, profile management, and university verification

const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { admin, db, auth: firebaseAuth } = require('../config/firebase');
const { auth, optionalAuth, requireUniversityVerification, userRateLimit } = require('../middleware/auth');

const router = express.Router();

// University domains for validation
const UNIVERSITY_DOMAINS = [
  'edu', 'ac.uk', 'ac.in', 'edu.au', 'edu.sg', 'edu.my', 'edu.ph',
  'university.edu', 'college.edu', 'school.edu'
];

// Helper function to validate university email
const isUniversityEmail = (email) => {
  const domain = email.split('@')[1]?.toLowerCase();
  return UNIVERSITY_DOMAINS.some(uniDomain => 
    domain === uniDomain || domain?.endsWith('.' + uniDomain)
  );
};

/**
 * POST /api/auth/register
 * Register a new user profile after Firebase Auth registration
 */
router.post('/register', userRateLimit(5, 15 * 60 * 1000), async (req, res) => {
  try {
    const { 
      idToken,
      name, 
      role = 'student', 
      university,
      university_major,
      graduation_year,
      phone 
    } = req.body;

    // Validate required fields
    if (!idToken || !name) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        required: ['idToken', 'name']
      });
    }

    // University is required only for students
    if (role === 'student' && !university) {
      return res.status(400).json({ 
        error: 'University is required for student registration',
        required: ['university']
      });
    }

    // Verify the Firebase ID token
    const decodedToken = await firebaseAuth.verifyIdToken(idToken);
    const { uid, email } = decodedToken;

    // Check if user already exists
    const existingUser = await db.collection('users').doc(uid).get();
    if (existingUser.exists) {
      return res.status(400).json({ error: 'User profile already exists' });
    }

    // Check if it's a university email
    const isUniEmail = isUniversityEmail(email);

    // Create user profile in Firestore
    const userData = {
      id: uid,
      email,
      name,
      role,
      university,
      university_major: university_major || null,
      graduation_year: graduation_year || null,
      phone: phone || null,
      university_verified: false,
      is_university_email: isUniEmail,
      profile_completed: false,
      created_at: admin.firestore.FieldValue.serverTimestamp(),
      updated_at: admin.firestore.FieldValue.serverTimestamp(),
      is_active: true,
      
      // Profile fields
      bio: null,
      skills: [],
      portfolio_links: [],
      hourly_rate: null,
      availability: 'part-time',
      languages: [],
      linkedin_url: null,
      github_url: null,
      
      // Stats
      completed_projects: 0,
      total_earnings: 0,
      average_rating: 0,
      total_reviews: 0,
      badges: []
    };

    await db.collection('users').doc(uid).set(userData);

    // Send verification email if university email
    if (isUniEmail) {
      await firebaseAuth.generateEmailVerificationLink(email);
    }

    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: uid,
        email,
        name,
        role,
        university,
        university_verified: false,
        is_university_email: isUniEmail
      },
      requiresVerification: isUniEmail
    });

  } catch (error) {
    console.error('Registration error:', error);
    
    if (error.code === 'auth/email-already-exists') {
      return res.status(400).json({ error: 'Email already registered' });
    }
    
    res.status(500).json({ 
      error: 'Registration failed',
      message: error.message 
    });
  }
});

/**
 * POST /api/auth/login
 * Login user (handled by Firebase Auth on frontend)
 * This endpoint validates the token and returns user data
 */
router.post('/login', async (req, res) => {
  try {
    const { idToken } = req.body;

    if (!idToken) {
      return res.status(400).json({ error: 'ID token required' });
    }

    // Verify the Firebase ID token
    const decodedToken = await firebaseAuth.verifyIdToken(idToken);
    
    // Get user data from Firestore
    const userDoc = await db.collection('users').doc(decodedToken.uid).get();
    
    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User profile not found' });
    }

    const userData = userDoc.data();

    // Update last login
    await db.collection('users').doc(decodedToken.uid).update({
      last_login: admin.firestore.FieldValue.serverTimestamp()
    });

    res.json({
      message: 'Login successful',
      user: {
        id: decodedToken.uid,
        email: decodedToken.email,
        ...userData
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(401).json({ 
      error: 'Login failed',
      message: 'Invalid credentials or token'
    });
  }
});

/**
 * GET /api/auth/profile
 * Get current user's profile
 */
router.get('/profile', auth, async (req, res) => {
  try {
    const userDoc = await db.collection('users').doc(req.user.id).get();
    
    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      success: true,
      data: userDoc.data()
    });

  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Failed to get profile' });
  }
});

/**
 * PUT /api/auth/profile
 * Update user profile
 */
router.put('/profile', auth, async (req, res) => {
  try {
    const allowedFields = [
      'name', 'bio', 'skills', 'portfolio_links', 'hourly_rate',
      'availability', 'university_major', 'graduation_year',
      'languages', 'linkedin_url', 'github_url', 'phone'
    ];

    const updates = {};
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    // Validate hourly rate
    if (updates.hourly_rate && (updates.hourly_rate < 5 || updates.hourly_rate > 500)) {
      return res.status(400).json({ 
        error: 'Hourly rate must be between $5 and $500' 
      });
    }

    // Validate skills array
    if (updates.skills && !Array.isArray(updates.skills)) {
      return res.status(400).json({ error: 'Skills must be an array' });
    }

    // Add update timestamp
    updates.updated_at = admin.firestore.FieldValue.serverTimestamp();

    // Check if profile is now complete
    const requiredFields = ['name', 'bio', 'skills', 'university_major'];
    const userDoc = await db.collection('users').doc(req.user.id).get();
    const currentData = userDoc.data();
    
    const isComplete = requiredFields.every(field => 
      (updates[field] !== undefined ? updates[field] : currentData[field])
    );
    
    if (isComplete && !currentData.profile_completed) {
      updates.profile_completed = true;
    }

    await db.collection('users').doc(req.user.id).update(updates);

    // Get updated user data
    const updatedUserDoc = await db.collection('users').doc(req.user.id).get();

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: updatedUserDoc.data()
    });

  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

/**
 * GET /api/auth/user/:userId
 * Get public user profile
 */
router.get('/user/:userId', optionalAuth, async (req, res) => {
  try {
    const { userId } = req.params;
    
    const userDoc = await db.collection('users').doc(userId).get();
    
    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userData = userDoc.data();
    
    // Return public profile data only
    const publicData = {
      id: userData.id,
      name: userData.name,
      bio: userData.bio,
      university: userData.university,
      university_major: userData.university_major,
      graduation_year: userData.graduation_year,
      university_verified: userData.university_verified,
      skills: userData.skills || [],
      portfolio_links: userData.portfolio_links || [],
      hourly_rate: userData.hourly_rate,
      availability: userData.availability,
      languages: userData.languages || [],
      linkedin_url: userData.linkedin_url,
      github_url: userData.github_url,
      completed_projects: userData.completed_projects || 0,
      total_earnings: userData.total_earnings || 0,
      average_rating: userData.average_rating || 0,
      total_reviews: userData.total_reviews || 0,
      badges: userData.badges || [],
      created_at: userData.created_at
    };

    res.json({
      success: true,
      data: publicData
    });

  } catch (error) {
    console.error('Get user profile error:', error);
    res.status(500).json({ error: 'Failed to get user profile' });
  }
});

/**
 * POST /api/auth/verify-university
 * Send university verification email
 */
router.post('/verify-university', auth, async (req, res) => {
  try {
    const user = req.user;
    
    if (!user.is_university_email) {
      return res.status(400).json({ 
        error: 'Not a university email',
        message: 'Please use your university email address for verification'
      });
    }

    if (user.university_verified) {
      return res.status(400).json({ 
        error: 'Already verified',
        message: 'Your university email is already verified'
      });
    }

    // Generate verification link
    const actionCodeSettings = {
      url: `${process.env.CLIENT_URL}/verify-email?mode=verifyEmail`,
      handleCodeInApp: true
    };

    const link = await firebaseAuth.generateEmailVerificationLink(
      user.email, 
      actionCodeSettings
    );

    // You could send this via email service here
    // For now, we'll return the link (in production, send via email)

    res.json({
      success: true,
      message: 'Verification email sent',
      // Remove this in production
      verificationLink: link
    });

  } catch (error) {
    console.error('University verification error:', error);
    res.status(500).json({ error: 'Failed to send verification email' });
  }
});

/**
 * POST /api/auth/confirm-university-verification
 * Confirm university email verification
 */
router.post('/confirm-university-verification', auth, async (req, res) => {
  try {
    // Check if Firebase email is verified
    const userRecord = await firebaseAuth.getUser(req.user.id);
    
    if (!userRecord.emailVerified) {
      return res.status(400).json({ 
        error: 'Email not verified',
        message: 'Please verify your email first'
      });
    }

    // Update university verification status
    await db.collection('users').doc(req.user.id).update({
      university_verified: true,
      email_verified_at: admin.firestore.FieldValue.serverTimestamp(),
      updated_at: admin.firestore.FieldValue.serverTimestamp()
    });

    res.json({
      success: true,
      message: 'University email verified successfully'
    });

  } catch (error) {
    console.error('Confirm verification error:', error);
    res.status(500).json({ error: 'Failed to confirm verification' });
  }
});

/**
 * POST /api/auth/change-password
 * Change user password
 */
router.post('/change-password', auth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ 
        error: 'Current password and new password required' 
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ 
        error: 'New password must be at least 6 characters long' 
      });
    }

    // Update password in Firebase Auth
    await firebaseAuth.updateUser(req.user.id, {
      password: newPassword
    });

    // Update timestamp in Firestore
    await db.collection('users').doc(req.user.id).update({
      password_changed_at: admin.firestore.FieldValue.serverTimestamp(),
      updated_at: admin.firestore.FieldValue.serverTimestamp()
    });

    res.json({
      success: true,
      message: 'Password changed successfully'
    });

  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ error: 'Failed to change password' });
  }
});

/**
 * GET /api/auth/settings
 * Get user notification settings
 */
router.get('/settings', auth, async (req, res) => {
  try {
    const settingsDoc = await db.collection('user_settings').doc(req.user.id).get();
    
    const defaultSettings = {
      email_notifications: true,
      project_updates: true,
      bid_notifications: true,
      message_notifications: true,
      marketing_emails: false
    };

    const settings = settingsDoc.exists ? settingsDoc.data() : defaultSettings;

    res.json({
      success: true,
      data: settings
    });

  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({ error: 'Failed to get settings' });
  }
});

/**
 * PUT /api/auth/notification-settings
 * Update user notification settings
 */
router.put('/notification-settings', auth, async (req, res) => {
  try {
    const allowedSettings = [
      'email_notifications',
      'project_updates', 
      'bid_notifications',
      'message_notifications',
      'marketing_emails'
    ];

    const updates = {};
    for (const setting of allowedSettings) {
      if (req.body[setting] !== undefined) {
        updates[setting] = Boolean(req.body[setting]);
      }
    }

    updates.updated_at = admin.firestore.FieldValue.serverTimestamp();

    await db.collection('user_settings').doc(req.user.id).set(updates, { merge: true });

    res.json({
      success: true,
      message: 'Notification settings updated successfully'
    });

  } catch (error) {
    console.error('Update settings error:', error);
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

/**
 * DELETE /api/auth/account
 * Delete user account
 */
router.delete('/account', auth, async (req, res) => {
  try {
    const userId = req.user.id;

    // Delete from Firebase Auth
    await firebaseAuth.deleteUser(userId);

    // Delete user data from Firestore (implement proper cleanup)
    const batch = db.batch();
    
    // Delete user profile
    batch.delete(db.collection('users').doc(userId));
    
    // Delete user settings
    batch.delete(db.collection('user_settings').doc(userId));
    
    // Note: In production, you'd want to handle related data cleanup
    // (projects, bids, messages, etc.) more carefully
    
    await batch.commit();

    res.json({
      success: true,
      message: 'Account deleted successfully'
    });

  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({ error: 'Failed to delete account' });
  }
});

/**
 * POST /api/auth/logout
 * Logout user (mainly for cleanup)
 */
router.post('/logout', auth, async (req, res) => {
  try {
    // Update last logout time
    await db.collection('users').doc(req.user.id).update({
      last_logout: admin.firestore.FieldValue.serverTimestamp()
    });

    res.json({
      success: true,
      message: 'Logged out successfully'
    });

  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Logout failed' });
  }
});

module.exports = router;