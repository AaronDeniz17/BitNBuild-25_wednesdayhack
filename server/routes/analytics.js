// Routes for student recommendations and analytics
const express = require('express');
const router = express.Router();
const { auth, optionalAuth } = require('../middleware/auth');
const { db } = require('../config/firebase');
const { 
  getRecommendedStudents, 
  getTrendingSkills,
  calculateStudentScore 
} = require('../utils/recommendations');
const { 
  SKILL_CATEGORIES,
  getAllMicroSkills,
  findSkillCategories 
} = require('../utils/skills-taxonomy');

/**
 * GET /api/analytics/skills/categories
 * Get all skill categories and their micro-skills
 */
router.get('/skills/categories', async (req, res) => {
  try {
    res.json({
      success: true,
      data: SKILL_CATEGORIES
    });
  } catch (error) {
    console.error('Error getting skill categories:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to get skill categories'
    });
  }
});

/**
 * GET /api/analytics/skills/trending
 * Get trending skills in the marketplace
 */
router.get('/skills/trending', async (req, res) => {
  try {
    const { timeframe = 30 } = req.query;
    const trendingSkills = await getTrendingSkills(db, parseInt(timeframe));
    
    res.json({
      success: true,
      data: trendingSkills
    });
  } catch (error) {
    console.error('Error getting trending skills:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to get trending skills'
    });
  }
});

/**
 * GET /api/analytics/students/recommended
 * Get recommended students for a project
 */
router.get('/students/recommended', auth, async (req, res) => {
  try {
    const { project_id, limit = 10 } = req.query;
    
    // Get project details
    const projectDoc = await db.collection('projects').doc(project_id).get();
    if (!projectDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Project not found'
      });
    }
    
    const project = projectDoc.data();
    const recommendations = await getRecommendedStudents(db, project, parseInt(limit));
    
    res.json({
      success: true,
      data: recommendations
    });
  } catch (error) {
    console.error('Error getting recommended students:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to get recommendations'
    });
  }
});

/**
 * GET /api/analytics/students/browse
 * Browse all students with filtering options
 */
router.get('/students/browse', optionalAuth, async (req, res) => {
  try {
    const { 
      search, 
      skills, 
      university, 
      availability, 
      min_rating = 0, 
      max_rate = 1000,
      limit = 50 
    } = req.query;
    
    // Base query for students
    let query = db.collection('users')
      .where('role', '==', 'student')
      .where('is_active', '==', true);
    
    const studentsSnapshot = await query.limit(parseInt(limit)).get();
    let students = studentsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    // Apply filters
    if (search) {
      const searchLower = search.toLowerCase();
      students = students.filter(student => 
        student.name?.toLowerCase().includes(searchLower) ||
        student.university?.toLowerCase().includes(searchLower) ||
        (student.skills && student.skills.some(skill => 
          skill.toLowerCase().includes(searchLower)
        ))
      );
    }
    
    if (university) {
      students = students.filter(student => 
        student.university?.toLowerCase().includes(university.toLowerCase())
      );
    }
    
    if (availability) {
      students = students.filter(student => 
        student.availability === availability
      );
    }
    
    if (min_rating > 0) {
      students = students.filter(student => 
        (student.average_rating || 0) >= parseFloat(min_rating)
      );
    }
    
    if (max_rate < 1000) {
      students = students.filter(student => 
        (student.hourly_rate || 0) <= parseFloat(max_rate)
      );
    }
    
    // Remove sensitive information
    const publicStudents = students.map(student => ({
      id: student.id,
      name: student.name,
      email: student.email,
      university: student.university,
      university_major: student.university_major,
      graduation_year: student.graduation_year,
      bio: student.bio,
      skills: student.skills || [],
      hourly_rate: student.hourly_rate,
      availability: student.availability,
      average_rating: student.average_rating || 0,
      total_reviews: student.total_reviews || 0,
      completed_projects: student.completed_projects || 0,
      university_verified: student.university_verified || false,
      portfolio_links: student.portfolio_links || [],
      created_at: student.created_at
    }));
    
    res.json({
      success: true,
      data: {
        students: publicStudents,
        total: publicStudents.length
      }
    });
  } catch (error) {
    console.error('Error browsing students:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to browse students'
    });
  }
});

/**
 * GET /api/analytics/students/rankings
 * Get student rankings based on multiple factors
 */
router.get('/students/rankings', auth, async (req, res) => {
  try {
    const { category, skill, limit = 50 } = req.query;
    
    // Get qualified students
    let query = db.collection('users')
      .where('role', '==', 'student')
      .where('university_verified', '==', true);
      
    if (skill) {
      query = query.where('skills', 'array-contains', skill);
    }
    
    const studentsSnapshot = await query.get();
    const students = studentsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    // Calculate rankings
    const rankedStudents = students
      .map(student => ({
        id: student.id,
        name: student.name,
        avatar: student.avatar,
        university: student.university,
        skills: student.skills,
        rating: student.rating,
        completed_projects: student.completed_projects?.length || 0,
        ...calculateStudentScore(student)
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, parseInt(limit));
    
    res.json({
      success: true,
      data: rankedStudents
    });
  } catch (error) {
    console.error('Error getting student rankings:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to get student rankings'
    });
  }
});

module.exports = router;