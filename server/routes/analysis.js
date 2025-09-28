// Routes for skill analysis and student recommendations
const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const { admin } = require('../config/firebase');

const router = express.Router();

/**
 * GET /api/analysis/student/:id/skills
 * Get categorized skills for a student
 */
router.get('/student/:id/skills', authenticateToken, async (req, res) => {
  try {
    const studentId = req.params.id;
    const studentDoc = await admin.firestore()
      .collection('student_profiles')
      .doc(studentId)
      .get();

    if (!studentDoc.exists) {
      return res.status(404).json({ error: 'Student profile not found' });
    }

    const student = studentDoc.data();
    res.json({ 
      success: true, 
      skills: student.skills || [] 
    });
  } catch (error) {
    console.error('Error getting student skills:', error);
    res.status(500).json({ error: 'Failed to get student skills' });
  }
});

/**
 * GET /api/analysis/student/:id/ranking
 * Get student's ranking and detailed scores
 */
router.get('/student/:id/ranking', authenticateToken, async (req, res) => {
  try {
    const studentId = req.params.id;
    const studentDoc = await admin.firestore()
      .collection('student_profiles')
      .doc(studentId)
      .get();

    if (!studentDoc.exists) {
      return res.status(404).json({ error: 'Student profile not found' });
    }

    res.json({ 
      success: true, 
      ranking: {
        score: 0,
        position: 0,
        total: 0
      }
    });
  } catch (error) {
    console.error('Error calculating student ranking:', error);
    res.status(500).json({ error: 'Failed to calculate ranking' });
  }
});

/**
 * GET /api/analysis/trending-skills
 * Get trending skills in the marketplace
 */
router.get('/trending-skills', authenticateToken, async (req, res) => {
  try {
    res.json({ 
      success: true, 
      trends: []
    });
  } catch (error) {
    console.error('Error getting trending skills:', error);
    res.status(500).json({ error: 'Failed to get trending skills' });
  }
});

/**
 * GET /api/analysis/project/:id/recommendations
 * Get recommended students for a project
 */
router.get('/project/:id/recommendations', authenticateToken, async (req, res) => {
  try {
    const recommendations = await getRecommendedProjects(req.params.id);
    res.json({ success: true, recommendations });
  } catch (error) {
    console.error('Error getting project recommendations:', error);
    res.status(500).json({ error: 'Failed to get recommendations' });
  }
});

module.exports = router;