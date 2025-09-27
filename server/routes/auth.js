// Authentication routes for GigCampus
// Handles user registration, login, and university verification

const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { admin, auth } = require('../config/firebase');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

/**
 * POST /api/auth/register
 * Register a new user (student or client)
 */
router.post('/register', async (req, res) => {
  try {
    const { email, password, name, role, university, phone } = req.body;

    // Validate required fields
    if (!email || !password || !name || !role) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Validate role
    if (!['student', 'client'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    // Check if user already exists
    const existingUser = await admin.firestore()
      .collection('users')
      .where('email', '==', email)
      .get();

    if (!existingUser.empty) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user in Firebase Auth
    const userRecord = await auth.createUser({
      email,
      password,
      displayName: name
    });

    // Create user document in Firestore
    const userData = {
      id: userRecord.uid,
      email,
      name,
      role,
      university_verified: false,
      university: university || '',
      created_at: admin.firestore.FieldValue.serverTimestamp(),
      last_login: admin.firestore.FieldValue.serverTimestamp(),
      phone: phone || '',
      is_active: true
    };

    await admin.firestore().collection('users').doc(userRecord.uid).set(userData);

    // Create student profile if role is student
    if (role === 'student') {
      const studentProfile = {
        user_id: userRecord.uid,
        skills: [],
        micro_skills: [],
        portfolio_links: [],
        availability: 'part-time',
        hourly_rate: 0,
        bio: '',
        badges: [],
        reputation_score: 0,
        completed_projects: 0,
        on_time_rate: 0,
        total_earnings: 0,
        university_major: '',
        graduation_year: null,
        linkedin_url: '',
        github_url: '',
        timezone: 'UTC',
        languages: ['English'],
        is_available: true
      };

      await admin.firestore()
        .collection('student_profiles')
        .doc(userRecord.uid)
        .set(studentProfile);
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: userRecord.uid, email, role },
      process.env.JWT_SECRET || 'gigcampus-secret-key',
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: userRecord.uid,
        email,
        name,
        role,
        university_verified: false
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

/**
 * POST /api/auth/login
 * Login user with email and password
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    // Get user from Firestore
    const userQuery = await admin.firestore()
      .collection('users')
      .where('email', '==', email)
      .get();

    if (userQuery.empty) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const userDoc = userQuery.docs[0];
    const userData = userDoc.data();

    if (!userData.is_active) {
      return res.status(401).json({ error: 'Account deactivated' });
    }

    // For MVP: Simple password check
    // TODO: Implement proper Firebase Auth verification
    const isValidPassword = await bcrypt.compare(password, userData.password || '');
    
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Update last login
    await admin.firestore()
      .collection('users')
      .doc(userData.id)
      .update({
        last_login: admin.firestore.FieldValue.serverTimestamp()
      });

    // Generate JWT token
    const token = jwt.sign(
      { userId: userData.id, email, role: userData.role },
      process.env.JWT_SECRET || 'gigcampus-secret-key',
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: userData.id,
        email: userData.email,
        name: userData.name,
        role: userData.role,
        university_verified: userData.university_verified
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

/**
 * POST /api/auth/verify-university
 * Verify university email for students
 */
router.post('/verify-university', authenticateToken, async (req, res) => {
  try {
    const { university, student_id } = req.body;
    const userId = req.user.id;

    // Only students can verify university
    if (req.user.role !== 'student') {
      return res.status(403).json({ error: 'Only students can verify university' });
    }

    // For MVP: Simple verification
    // TODO: Implement proper university email verification
    const isUniversityEmail = email.includes('.edu') || 
                            email.includes(university.toLowerCase().replace(/\s+/g, ''));

    if (!isUniversityEmail) {
      return res.status(400).json({ 
        error: 'Please use your university email address' 
      });
    }

    // Update user verification status
    await admin.firestore()
      .collection('users')
      .doc(userId)
      .update({
        university_verified: true,
        university: university
      });

    // Add verification badge to student profile
    await admin.firestore()
      .collection('student_profiles')
      .doc(userId)
      .update({
        badges: admin.firestore.FieldValue.arrayUnion('university-verified')
      });

    res.json({
      message: 'University verification successful',
      university_verified: true
    });

  } catch (error) {
    console.error('University verification error:', error);
    res.status(500).json({ error: 'Verification failed' });
  }
});

/**
 * GET /api/auth/profile
 * Get current user profile
 */
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    // Get user data
    const userDoc = await admin.firestore().collection('users').doc(userId).get();
    
    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userData = userDoc.data();

    // Get student profile if user is a student
    let studentProfile = null;
    if (userData.role === 'student') {
      const studentDoc = await admin.firestore()
        .collection('student_profiles')
        .doc(userId)
        .get();
      
      if (studentDoc.exists) {
        studentProfile = studentDoc.data();
      }
    }

    res.json({
      user: {
        id: userData.id,
        email: userData.email,
        name: userData.name,
        role: userData.role,
        university_verified: userData.university_verified,
        university: userData.university,
        created_at: userData.created_at,
        profile_picture: userData.profile_picture
      },
      studentProfile
    });

  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

/**
 * PUT /api/auth/profile
 * Update user profile
 */
router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const updates = req.body;

    // Remove sensitive fields
    delete updates.id;
    delete updates.email;
    delete updates.role;

    // Update user document
    await admin.firestore()
      .collection('users')
      .doc(userId)
      .update({
        ...updates,
        updated_at: admin.firestore.FieldValue.serverTimestamp()
      });

    // Update student profile if applicable
    if (req.user.role === 'student' && updates.studentProfile) {
      await admin.firestore()
        .collection('student_profiles')
        .doc(userId)
        .update(updates.studentProfile);
    }

    res.json({ message: 'Profile updated successfully' });

  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ error: 'Profile update failed' });
  }
});

/**
 * POST /api/auth/logout
 * Logout user (client-side token removal)
 */
router.post('/logout', authenticateToken, (req, res) => {
  // For JWT tokens, logout is handled client-side by removing the token
  // TODO: Implement token blacklist for enhanced security
  res.json({ message: 'Logout successful' });
});

module.exports = router;
