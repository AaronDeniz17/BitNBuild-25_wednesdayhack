// Projects routes for GigCampus
// Handles project creation, listing, updates, and management

const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { admin, db } = require('../config/firebase');
const { auth, optionalAuth, requireUniversityVerification, userRateLimit } = require('../middleware/auth');

const router = express.Router();

// Project status constants
const PROJECT_STATUS = {
  DRAFT: 'draft',
  OPEN: 'open',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled'
};

// Helper function to validate project data
const validateProjectData = (data, isCreate = true) => {
  const errors = [];
  
  if (isCreate || data.title !== undefined) {
    if (!data.title || data.title.trim().length < 5) {
      errors.push('Title must be at least 5 characters long');
    }
  }
  
  if (isCreate || data.description !== undefined) {
    if (!data.description || data.description.trim().length < 20) {
      errors.push('Description must be at least 20 characters long');
    }
  }
  
  if (isCreate || data.budget !== undefined) {
    const budget = parseFloat(data.budget);
    if (isNaN(budget) || budget < 25) {
      errors.push('Budget must be at least $25');
    }
  }
  
  if (isCreate || data.deadline !== undefined) {
    if (!data.deadline) {
      errors.push('Deadline is required');
    } else {
      try {
        const deadlineDate = new Date(data.deadline);
        const now = new Date();
        if (isNaN(deadlineDate.getTime())) {
          errors.push('Invalid deadline date format');
        } else if (deadlineDate <= now) {
          errors.push('Deadline must be in the future');
        }
      } catch (error) {
        errors.push('Invalid deadline date format');
      }
    }
  }
  
  if (isCreate) {
    if (!data.required_skills || !Array.isArray(data.required_skills) || data.required_skills.length === 0) {
      errors.push('At least one required skill must be specified');
    }
  } else if (data.required_skills !== undefined && !Array.isArray(data.required_skills)) {
    errors.push('Required skills must be an array');
  }
  
  return errors;
};

/**
 * GET /api/projects
 * Get all projects with filtering and pagination
 */
router.get('/', optionalAuth, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      category,
      min_budget,
      max_budget,
      skills,
      status = 'open',
      sort_by = 'created_at',
      sort_order = 'desc',
      search
    } = req.query;

    let query = db.collection('projects');

    // Apply filters
    if (status && status !== 'all') {
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

    // Skills filtering (if skills provided)
    if (skills) {
      const skillsArray = Array.isArray(skills) ? skills : [skills];
      query = query.where('skills_required', 'array-contains-any', skillsArray);
    }

    // Sorting
    const validSortFields = ['created_at', 'budget', 'deadline', 'bid_count'];
    const sortField = validSortFields.includes(sort_by) ? sort_by : 'created_at';
    const sortDirection = sort_order === 'asc' ? 'asc' : 'desc';
    
    query = query.orderBy(sortField, sortDirection);

    // Pagination
    const pageSize = Math.min(parseInt(limit), 50);
    const offset = (parseInt(page) - 1) * pageSize;
    
    query = query.limit(pageSize).offset(offset);

    const snapshot = await query.get();
    const projects = [];

    for (const doc of snapshot.docs) {
      const projectData = doc.data();
      
      // Text search filtering (simple implementation)
      if (search) {
        const searchTerm = search.toLowerCase();
        const titleMatch = projectData.title?.toLowerCase().includes(searchTerm);
        const descMatch = projectData.description?.toLowerCase().includes(searchTerm);
        
        if (!titleMatch && !descMatch) {
          continue;
        }
      }

      // Get client info
      const clientDoc = await db.collection('users').doc(projectData.client_id).get();
      const clientData = clientDoc.exists ? clientDoc.data() : null;

      projects.push({
        id: doc.id,
        ...projectData,
        client: clientData ? {
          id: clientData.id,
          name: clientData.name,
          university: clientData.university,
          university_verified: clientData.university_verified,
          average_rating: clientData.average_rating || 0
        } : null
      });
    }

    // Get total count for pagination
    const totalQuery = db.collection('projects');
    // Apply same filters for count (simplified)
    const totalSnapshot = await totalQuery.get();
    const totalCount = totalSnapshot.size;

    res.json({
      success: true,
      data: projects,
      pagination: {
        page: parseInt(page),
        limit: pageSize,
        total: totalCount,
        pages: Math.ceil(totalCount / pageSize)
      }
    });

  } catch (error) {
    console.error('Get projects error:', error);
    res.status(500).json({ error: 'Failed to get projects' });
  }
});

/**
 * GET /api/projects/:id
 * Get specific project by ID
 */
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const { id } = req.params;
    
    const projectDoc = await db.collection('projects').doc(id).get();
    
    if (!projectDoc.exists) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const projectData = projectDoc.data();

    // Get client info
    const clientDoc = await db.collection('users').doc(projectData.client_id).get();
    const clientData = clientDoc.exists ? clientDoc.data() : null;

    // Get bids count
    const bidsSnapshot = await db.collection('bids')
      .where('project_id', '==', id)
      .get();

    // Get milestones if project is in progress or completed
    let milestones = null;
    if (['in_progress', 'completed'].includes(projectData.status)) {
      const milestonesSnapshot = await db.collection('milestones')
        .where('project_id', '==', id)
        .orderBy('order')
        .get();
      
      milestones = milestonesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    }

    const project = {
      id,
      ...projectData,
      client: clientData ? {
        id: clientData.id,
        name: clientData.name,
        university: clientData.university,
        university_verified: clientData.university_verified,
        average_rating: clientData.average_rating || 0,
        completed_projects: clientData.completed_projects || 0
      } : null,
      bid_count: bidsSnapshot.size,
      milestones
    };

    res.json({
      success: true,
      data: project
    });

  } catch (error) {
    console.error('Get project error:', error);
    res.status(500).json({ error: 'Failed to get project' });
  }
});

/**
 * POST /api/projects
 * Create a new project
 */
// Custom middleware for project creation
const verifyProjectCreator = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  // For students, require university verification
  if (req.user.role === 'student' && !req.user.university_verified) {
    return res.status(403).json({ 
      error: 'University verification required',
      message: 'Students must verify their university email to create projects'
    });
  }

  // For clients, just check if they are a client
  if (req.user.role !== 'client' && req.user.role !== 'student') {
    return res.status(403).json({ 
      error: 'Invalid user role',
      message: 'Only clients and verified students can create projects'
    });
  }

  next();
};

router.post('/', auth, verifyProjectCreator, userRateLimit(10, 60 * 60 * 1000), async (req, res) => {
  try {
    const projectData = req.body;
    
    // Validate project data
    const validationErrors = validateProjectData(projectData, true);
    if (validationErrors.length > 0) {
      return res.status(400).json({ 
        error: 'Validation failed',
        details: validationErrors
      });
    }

    // Check if user can create projects (students and clients can create projects)
    if (!['student', 'client'].includes(req.user.role)) {
      return res.status(403).json({ 
        error: 'Only students and clients can create projects' 
      });
    }

    const projectId = uuidv4();
    
    const newProject = {
      id: projectId,
      client_id: req.user.id,
      title: projectData.title.trim(),
      description: projectData.description.trim(),
      category: projectData.category || 'other',
      skills_required: projectData.required_skills || [], // Changed from skills_required to required_skills to match client
      budget: parseFloat(projectData.budget),
      budget_type: projectData.budget_type || 'fixed',
      deadline: projectData.deadline ? admin.firestore.Timestamp.fromDate(new Date(projectData.deadline)) : null,
      status: PROJECT_STATUS.OPEN,
      
      // Optional fields
      attachments: projectData.attachments || [],
      requirements: projectData.requirements || [],
      milestones: projectData.milestones || [],
      
      // Metadata
      created_at: admin.firestore.FieldValue.serverTimestamp(),
      updated_at: admin.firestore.FieldValue.serverTimestamp(),
      
      // Stats
      bid_count: 0,
      view_count: 0,
      
      // Flags
      is_featured: false,
      is_urgent: projectData.is_urgent || false
    };

    await db.collection('projects').doc(projectId).set(newProject);

    // Create initial milestones if provided
    if (projectData.milestones && projectData.milestones.length > 0) {
      const batch = db.batch();
      
      projectData.milestones.forEach((milestone, index) => {
        const milestoneId = uuidv4();
        const milestoneData = {
          id: milestoneId,
          project_id: projectId,
          title: milestone.title,
          description: milestone.description || '',
          budget: parseFloat(milestone.budget),
          deadline: admin.firestore.Timestamp.fromDate(new Date(milestone.deadline)),
          order: index + 1,
          status: 'pending',
          created_at: admin.firestore.FieldValue.serverTimestamp()
        };
        
        batch.set(db.collection('milestones').doc(milestoneId), milestoneData);
      });
      
      await batch.commit();
    }

    res.status(201).json({
      success: true,
      message: 'Project created successfully',
      data: { id: projectId, ...newProject }
    });

  } catch (error) {
    console.error('Create project error:', error);
    res.status(500).json({ error: 'Failed to create project' });
  }
});

/**
 * PUT /api/projects/:id
 * Update project (only by owner)
 */
router.put('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    // Get current project
    const projectDoc = await db.collection('projects').doc(id).get();
    
    if (!projectDoc.exists) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const currentProject = projectDoc.data();
    
    // Check ownership
    if (currentProject.client_id !== req.user.id) {
      return res.status(403).json({ error: 'You can only update your own projects' });
    }

    // Can't update completed or cancelled projects
    if (['completed', 'cancelled'].includes(currentProject.status)) {
      return res.status(400).json({ 
        error: 'Cannot update completed or cancelled projects' 
      });
    }

    // Validate updates
    const validationErrors = validateProjectData(updates, false);
    if (validationErrors.length > 0) {
      return res.status(400).json({ 
        error: 'Validation failed',
        details: validationErrors
      });
    }

    // Allowed fields to update
    const allowedFields = [
      'title', 'description', 'budget', 'deadline', 'skills_required',
      'category', 'requirements', 'is_urgent'
    ];

    const updateData = {};
    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        if (field === 'deadline') {
          updateData[field] = admin.firestore.Timestamp.fromDate(new Date(updates[field]));
        } else if (field === 'budget') {
          updateData[field] = parseFloat(updates[field]);
        } else {
          updateData[field] = updates[field];
        }
      }
    }

    updateData.updated_at = admin.firestore.FieldValue.serverTimestamp();

    await db.collection('projects').doc(id).update(updateData);

    // Get updated project
    const updatedProjectDoc = await db.collection('projects').doc(id).get();

    res.json({
      success: true,
      message: 'Project updated successfully',
      data: { id, ...updatedProjectDoc.data() }
    });

  } catch (error) {
    console.error('Update project error:', error);
    res.status(500).json({ error: 'Failed to update project' });
  }
});

/**
 * DELETE /api/projects/:id
 * Delete project (only by owner, only if no bids)
 */
router.delete('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    
    const projectDoc = await db.collection('projects').doc(id).get();
    
    if (!projectDoc.exists) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const project = projectDoc.data();
    
    // Check ownership
    if (project.client_id !== req.user.id) {
      return res.status(403).json({ error: 'You can only delete your own projects' });
    }

    // Check if project has bids
    const bidsSnapshot = await db.collection('bids')
      .where('project_id', '==', id)
      .get();

    if (!bidsSnapshot.empty) {
      return res.status(400).json({ 
        error: 'Cannot delete project with existing bids' 
      });
    }

    // Delete project and related data
    const batch = db.batch();
    
    // Delete project
    batch.delete(db.collection('projects').doc(id));
    
    // Delete milestones
    const milestonesSnapshot = await db.collection('milestones')
      .where('project_id', '==', id)
      .get();
    
    milestonesSnapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });

    await batch.commit();

    res.json({
      success: true,
      message: 'Project deleted successfully'
    });

  } catch (error) {
    console.error('Delete project error:', error);
    res.status(500).json({ error: 'Failed to delete project' });
  }
});

/**
 * POST /api/projects/:id/status
 * Update project status
 */
router.post('/:id/status', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    if (!Object.values(PROJECT_STATUS).includes(status)) {
      return res.status(400).json({ 
        error: 'Invalid status',
        validStatuses: Object.values(PROJECT_STATUS)
      });
    }

    const projectDoc = await db.collection('projects').doc(id).get();
    
    if (!projectDoc.exists) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const project = projectDoc.data();
    
    // Check ownership
    if (project.client_id !== req.user.id) {
      return res.status(403).json({ error: 'You can only update your own projects' });
    }

    // Validate status transition
    const currentStatus = project.status;
    const validTransitions = {
      [PROJECT_STATUS.DRAFT]: [PROJECT_STATUS.OPEN, PROJECT_STATUS.CANCELLED],
      [PROJECT_STATUS.OPEN]: [PROJECT_STATUS.IN_PROGRESS, PROJECT_STATUS.CANCELLED],
      [PROJECT_STATUS.IN_PROGRESS]: [PROJECT_STATUS.COMPLETED, PROJECT_STATUS.CANCELLED],
      [PROJECT_STATUS.COMPLETED]: [],
      [PROJECT_STATUS.CANCELLED]: []
    };

    if (!validTransitions[currentStatus].includes(status)) {
      return res.status(400).json({ 
        error: `Cannot change status from ${currentStatus} to ${status}` 
      });
    }

    await db.collection('projects').doc(id).update({
      status,
      updated_at: admin.firestore.FieldValue.serverTimestamp(),
      [`${status}_at`]: admin.firestore.FieldValue.serverTimestamp()
    });

    res.json({
      success: true,
      message: `Project status updated to ${status}`
    });

  } catch (error) {
    console.error('Update project status error:', error);
    res.status(500).json({ error: 'Failed to update project status' });
  }
});

/**
 * GET /api/projects/:id/bids
 * Get all bids for a project
 */
router.get('/:id/bids', auth, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Verify project exists and user has access
    const projectDoc = await db.collection('projects').doc(id).get();
    
    if (!projectDoc.exists) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const project = projectDoc.data();
    
    // Only project owner can see all bids
    if (project.client_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const bidsSnapshot = await db.collection('bids')
      .where('project_id', '==', id)
      .orderBy('created_at', 'desc')
      .get();

    const bids = [];
    
    for (const doc of bidsSnapshot.docs) {
      const bidData = doc.data();
      
      // Get bidder info
      const bidderDoc = await db.collection('users').doc(bidData.freelancer_id).get();
      const bidderData = bidderDoc.exists ? bidderDoc.data() : null;

      bids.push({
        id: doc.id,
        ...bidData,
        bidder: bidderData ? {
          id: bidderData.id,
          name: bidderData.name,
          university: bidderData.university,
          university_verified: bidderData.university_verified,
          skills: bidderData.skills || [],
          average_rating: bidderData.average_rating || 0,
          completed_projects: bidderData.completed_projects || 0
        } : null
      });
    }

    res.json({
      success: true,
      data: bids
    });

  } catch (error) {
    console.error('Get project bids error:', error);
    res.status(500).json({ error: 'Failed to get project bids' });
  }
});

/**
 * GET /api/projects/my/created
 * Get current user's created projects
 */
router.get('/my/created', auth, async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    
    let query = db.collection('projects')
      .where('client_id', '==', req.user.id);

    if (status && status !== 'all') {
      query = query.where('status', '==', status);
    }

    query = query.orderBy('created_at', 'desc');

    const pageSize = Math.min(parseInt(limit), 50);
    const offset = (parseInt(page) - 1) * pageSize;
    
    query = query.limit(pageSize).offset(offset);

    const snapshot = await query.get();
    const projects = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    res.json({
      success: true,
      data: projects
    });

  } catch (error) {
    console.error('Get my projects error:', error);
    res.status(500).json({ error: 'Failed to get your projects' });
  }
});

module.exports = router;