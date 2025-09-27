// Project routes for GigCampus
// Handles project creation, listing, and management

const express = require('express');
const { admin } = require('../config/firebase');
const { authenticateToken, requireRole, requireUniversityVerification } = require('../middleware/auth');

const router = express.Router();

/**
 * POST /api/projects
 * Create a new project (clients only)
 */
router.post('/', authenticateToken, requireRole(['client']), async (req, res) => {
  try {
    const {
      title,
      description,
      required_skills,
      budget,
      deadline,
      milestones,
      requires_team,
      team_size_min,
      team_size_max,
      category,
      urgency,
      tags,
      estimated_hours
    } = req.body;

    // Validate required fields
    if (!title || !description || !budget || !deadline) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Validate budget
    if (budget <= 0) {
      return res.status(400).json({ error: 'Budget must be greater than 0' });
    }

    // Validate deadline
    const deadlineDate = new Date(deadline);
    if (deadlineDate <= new Date()) {
      return res.status(400).json({ error: 'Deadline must be in the future' });
    }

    // Create project document
    const projectData = {
      id: admin.firestore().collection('projects').doc().id,
      client_id: req.user.id,
      title,
      description,
      required_skills: required_skills || [],
      budget: parseFloat(budget),
      deadline: admin.firestore.Timestamp.fromDate(deadlineDate),
      milestones: milestones || [],
      requires_team: requires_team || false,
      team_size_min: team_size_min || 1,
      team_size_max: team_size_max || 5,
      status: 'open',
      created_at: admin.firestore.FieldValue.serverTimestamp(),
      updated_at: admin.firestore.FieldValue.serverTimestamp(),
      category: category || 'general',
      urgency: urgency || 'medium',
      is_featured: false,
      tags: tags || [],
      attachments: [],
      estimated_hours: estimated_hours || 0
    };

    // Save project to Firestore
    await admin.firestore()
      .collection('projects')
      .doc(projectData.id)
      .set(projectData);

    res.status(201).json({
      message: 'Project created successfully',
      project: projectData
    });

  } catch (error) {
    console.error('Project creation error:', error);
    res.status(500).json({ error: 'Failed to create project' });
  }
});

/**
 * GET /api/projects
 * Get all projects with filtering and pagination
 */
router.get('/', authenticateToken, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status = 'open',
      category,
      min_budget,
      max_budget,
      skills,
      search,
      sort_by = 'created_at',
      sort_order = 'desc'
    } = req.query;

    let query = admin.firestore().collection('projects');

    // Apply filters
    if (status) {
      query = query.where('status', '==', status);
    }

    if (category) {
      query = query.where('category', '==', category);
    }

    if (min_budget) {
      query = query.where('budget', '>=', parseFloat(min_budget));
    }

    if (max_budget) {
      query = query.where('budget', '<=', parseFloat(max_budget));
    }

    if (skills && skills.length > 0) {
      query = query.where('required_skills', 'array-contains-any', skills);
    }

    // Apply sorting
    query = query.orderBy(sort_by, sort_order);

    // Apply pagination
    const offset = (parseInt(page) - 1) * parseInt(limit);
    query = query.limit(parseInt(limit)).offset(offset);

    const snapshot = await query.get();
    const projects = [];

    snapshot.forEach(doc => {
      const projectData = doc.data();
      
      // Apply search filter if provided
      if (search) {
        const searchLower = search.toLowerCase();
        const matchesSearch = 
          projectData.title.toLowerCase().includes(searchLower) ||
          projectData.description.toLowerCase().includes(searchLower) ||
          projectData.required_skills.some(skill => 
            skill.toLowerCase().includes(searchLower)
          );
        
        if (!matchesSearch) return;
      }

      projects.push({
        id: doc.id,
        ...projectData,
        created_at: projectData.created_at?.toDate(),
        deadline: projectData.deadline?.toDate()
      });
    });

    // Get total count for pagination
    const totalQuery = admin.firestore().collection('projects');
    const totalSnapshot = await totalQuery.get();
    const total = totalSnapshot.size;

    res.json({
      projects,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });

  } catch (error) {
    console.error('Projects fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
});

/**
 * GET /api/projects/:id
 * Get project details by ID
 */
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const projectId = req.params.id;

    const projectDoc = await admin.firestore()
      .collection('projects')
      .doc(projectId)
      .get();

    if (!projectDoc.exists) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const projectData = projectDoc.data();

    // Get client information
    const clientDoc = await admin.firestore()
      .collection('users')
      .doc(projectData.client_id)
      .get();

    const clientData = clientDoc.exists ? clientDoc.data() : null;

    // Get bids for this project
    const bidsSnapshot = await admin.firestore()
      .collection('bids')
      .where('project_id', '==', projectId)
      .get();

    const bids = [];
    bidsSnapshot.forEach(doc => {
      bids.push({
        id: doc.id,
        ...doc.data(),
        created_at: doc.data().created_at?.toDate()
      });
    });

    res.json({
      project: {
        id: projectDoc.id,
        ...projectData,
        created_at: projectData.created_at?.toDate(),
        deadline: projectData.deadline?.toDate()
      },
      client: clientData ? {
        id: clientData.id,
        name: clientData.name,
        university: clientData.university
      } : null,
      bids
    });

  } catch (error) {
    console.error('Project fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch project' });
  }
});

/**
 * PUT /api/projects/:id
 * Update project (client only)
 */
router.put('/:id', authenticateToken, requireRole(['client']), async (req, res) => {
  try {
    const projectId = req.params.id;
    const updates = req.body;

    // Check if project exists and belongs to user
    const projectDoc = await admin.firestore()
      .collection('projects')
      .doc(projectId)
      .get();

    if (!projectDoc.exists) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const projectData = projectDoc.data();

    if (projectData.client_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Don't allow updates to active projects
    if (projectData.status !== 'open') {
      return res.status(400).json({ error: 'Cannot update active project' });
    }

    // Remove fields that shouldn't be updated
    delete updates.id;
    delete updates.client_id;
    delete updates.created_at;
    delete updates.status;

    // Update project
    await admin.firestore()
      .collection('projects')
      .doc(projectId)
      .update({
        ...updates,
        updated_at: admin.firestore.FieldValue.serverTimestamp()
      });

    res.json({ message: 'Project updated successfully' });

  } catch (error) {
    console.error('Project update error:', error);
    res.status(500).json({ error: 'Failed to update project' });
  }
});

/**
 * DELETE /api/projects/:id
 * Delete project (client only)
 */
router.delete('/:id', authenticateToken, requireRole(['client']), async (req, res) => {
  try {
    const projectId = req.params.id;

    // Check if project exists and belongs to user
    const projectDoc = await admin.firestore()
      .collection('projects')
      .doc(projectId)
      .get();

    if (!projectDoc.exists) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const projectData = projectDoc.data();

    if (projectData.client_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Don't allow deletion of active projects
    if (projectData.status !== 'open') {
      return res.status(400).json({ error: 'Cannot delete active project' });
    }

    // Delete project
    await admin.firestore()
      .collection('projects')
      .doc(projectId)
      .delete();

    res.json({ message: 'Project deleted successfully' });

  } catch (error) {
    console.error('Project deletion error:', error);
    res.status(500).json({ error: 'Failed to delete project' });
  }
});

/**
 * GET /api/projects/recommended
 * Get recommended projects for students
 */
router.get('/recommended', authenticateToken, requireRole(['student']), async (req, res) => {
  try {
    const userId = req.user.id;

    // Get student profile
    const studentDoc = await admin.firestore()
      .collection('student_profiles')
      .doc(userId)
      .get();

    if (!studentDoc.exists) {
      return res.status(404).json({ error: 'Student profile not found' });
    }

    const studentData = studentDoc.data();
    const studentSkills = studentData.skills || [];

    // Get open projects
    let query = admin.firestore()
      .collection('projects')
      .where('status', '==', 'open')
      .orderBy('created_at', 'desc')
      .limit(20);

    const snapshot = await query.get();
    const projects = [];

    snapshot.forEach(doc => {
      const projectData = doc.data();
      
      // Calculate skill match score
      const projectSkills = projectData.required_skills || [];
      const skillMatches = projectSkills.filter(skill => 
        studentSkills.includes(skill)
      ).length;
      const skillMatchScore = projectSkills.length > 0 ? 
        (skillMatches / projectSkills.length) * 100 : 0;

      // Only include projects with at least 50% skill match
      if (skillMatchScore >= 50) {
        projects.push({
          id: doc.id,
          ...projectData,
          skill_match_score: skillMatchScore,
          created_at: projectData.created_at?.toDate(),
          deadline: projectData.deadline?.toDate()
        });
      }
    });

    // Sort by skill match score
    projects.sort((a, b) => b.skill_match_score - a.skill_match_score);

    res.json({ projects });

  } catch (error) {
    console.error('Recommended projects error:', error);
    res.status(500).json({ error: 'Failed to fetch recommended projects' });
  }
});

/**
 * GET /api/projects/trending-skills
 * Get trending skills across all projects
 */
router.get('/trending-skills', authenticateToken, async (req, res) => {
  try {
    // Get all open projects
    const snapshot = await admin.firestore()
      .collection('projects')
      .where('status', '==', 'open')
      .get();

    const skillCounts = {};

    snapshot.forEach(doc => {
      const projectData = doc.data();
      const skills = projectData.required_skills || [];

      skills.forEach(skill => {
        skillCounts[skill] = (skillCounts[skill] || 0) + 1;
      });
    });

    // Sort skills by count
    const trendingSkills = Object.entries(skillCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([skill, count]) => ({ skill, count }));

    res.json({ trendingSkills });

  } catch (error) {
    console.error('Trending skills error:', error);
    res.status(500).json({ error: 'Failed to fetch trending skills' });
  }
});

module.exports = router;
