// Projects routes for GigCampus
// Handles project creation, listing, updates, and management

const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { admin, db } = require('../config/firebase');
const { auth, optionalAuth, requireUniversityVerification, userRateLimit } = require('../middleware/auth');
const handleError = require('../utils/error-handler');
const dbOperations = require('../utils/db-operations');
const firestoreHelpers = require('../utils/firestore-helpers');

const router = express.Router();

// Project status constants
const PROJECT_STATUS = {
  DRAFT: 'draft',
  OPEN: 'open',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled'
};

/**
 * GET /api/projects/skill-suggestions
 * Get skill suggestions based on trending skills in projects
 */
router.get('/skill-suggestions', optionalAuth, async (req, res) => {
  try {
    // Get all projects to analyze skill trends
    const snapshot = await db.collection('projects')
      .limit(100)
      .get();

    const skillCount = {};
    
    snapshot.docs.forEach(doc => {
      const project = doc.data();
      if (project.skills_required && Array.isArray(project.skills_required)) {
        project.skills_required.forEach(skill => {
          skillCount[skill] = (skillCount[skill] || 0) + 1;
        });
      }
    });

    // Sort skills by frequency and return top suggestions
    const suggestions = Object.entries(skillCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 20)
      .map(([skill, count]) => ({
        skill,
        count,
        trending: count > 3
      }));

    res.json({
      success: true,
      data: suggestions
    });

  } catch (error) {
    console.error('Get skill suggestions error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to get skill suggestions',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Get single project by ID
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const { id } = req.params;
    console.log('Fetching project:', id);
    
    const result = await firestoreHelpers.getDocumentById('projects', id);
    if (!result.success) {
      return res.status(result.error === 'Document not found' ? 404 : 500).json(result);
    }
    
    // Get client info
    const clientResult = await firestoreHelpers.getDocumentById('users', result.data.client_id);
    const clientData = clientResult.success ? clientResult.data : null;
    
    // Get bids if authenticated
    let bids = [];
    if (req.user) {
      const bidsResult = await firestoreHelpers.getDocuments('bids', {
        'project_id': id
      }, {
        orderBy: 'created_at',
        orderDirection: 'desc'
      });
      
      if (bidsResult.success) {
        bids = await Promise.all(bidsResult.data.map(async (bid) => {
          const freelancerResult = await firestoreHelpers.getDocumentById('users', bid.freelancer_id);
          const freelancerData = freelancerResult.success ? freelancerResult.data : null;
          
          return {
            ...bid,
            freelancer: freelancerData ? {
              id: freelancerData.id,
              name: freelancerData.name,
              avatar: freelancerData.avatar,
              rating: freelancerData.rating,
              completed_projects: freelancerData.completed_projects
            } : null
          };
        }));
      }
    }
    
    // Prepare response
    const response = {
      success: true,
      data: {
        project: result.data,
        client: clientData ? {
          id: clientData.id,
          name: clientData.name,
          avatar: clientData.avatar,
          rating: clientData.rating,
          total_projects: clientData.total_projects
        } : null,
        bids: req.user ? bids : undefined
      }
    };
    
    res.json(response);
  } catch (error) {
    console.error('Error getting project:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get project details',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

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

    // Build filters object
    const filters = {};
    
    if (status && status !== 'all') {
      filters['status'] = status;
    }
    
    if (category) {
      filters['category'] = category;
    }
    
    // Build options object
    const validSortFields = ['created_at', 'budget', 'deadline', 'bid_count'];
    const options = {
      orderBy: validSortFields.includes(sort_by) ? sort_by : 'created_at',
      orderDirection: sort_order === 'asc' ? 'asc' : 'desc',
      limit: Math.min(parseInt(limit), 50)
    };
    
    // Get projects
    const result = await firestoreHelpers.getDocuments('projects', filters, options);
    if (!result.success) {
      return res.status(500).json(result);
    }
    
    // Post-process results for search, budget range, and skills
    const projects = result.data.filter(project => {
      // Budget range filter
      if (min_budget && project.budget < parseFloat(min_budget)) return false;
      if (max_budget && project.budget > parseFloat(max_budget)) return false;
      
      // Skills filter
      if (skills) {
        const skillsArray = Array.isArray(skills) ? skills : [skills];
        if (!skillsArray.some(skill => project.skills_required?.includes(skill))) return false;
      }
      
      // Search filter
      if (search) {
        const searchTerm = search.toLowerCase();
        const titleMatch = project.title?.toLowerCase().includes(searchTerm);
        const descMatch = project.description?.toLowerCase().includes(searchTerm);
        if (!titleMatch && !descMatch) return false;
      }
      
      return true;
    });
    
    // Get client info for each project
    const projectsWithClients = await Promise.all(projects.map(async (project) => {
      const clientResult = await firestoreHelpers.getDocumentById('users', project.client_id);
      const clientData = clientResult.success ? clientResult.data : null;
      
      return {
        ...project,
        client: clientData ? {
          id: clientData.id,
          name: clientData.name,
          university: clientData.university,
          university_verified: clientData.university_verified,
          average_rating: clientData.average_rating || 0
        } : null
      };
    }));
    
    // Pagination
    const pageNum = parseInt(page);
    const pageSize = Math.min(parseInt(limit), 50);
    const startIdx = (pageNum - 1) * pageSize;
    const paginatedProjects = projectsWithClients.slice(startIdx, startIdx + pageSize);
    
    res.json({
      success: true,
      data: paginatedProjects,
      pagination: {
        page: pageNum,
        limit: pageSize,
        total: projectsWithClients.length,
        pages: Math.ceil(projectsWithClients.length / pageSize)
      }
    });

  } catch (error) {
    console.error('Get projects error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get projects',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
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
    console.log('Creating project with data:', JSON.stringify(projectData, null, 2));
    
    // Validate project data
    const validationErrors = validateProjectData(projectData, true);
    if (validationErrors.length > 0) {
      return res.status(400).json({ 
        success: false,
        error: 'Validation failed',
        details: validationErrors
      });
    }

    // Check if user can create projects (students and clients can create projects)
    if (!['student', 'client'].includes(req.user.role)) {
      return res.status(403).json({ 
        success: false,
        error: 'Only students and clients can create projects',
        details: [`Current role: ${req.user.role}`]
      });
    }

    // Format dates and numbers
    let deadline;
    try {
      deadline = projectData.deadline ? admin.firestore.Timestamp.fromDate(new Date(projectData.deadline)) : null;
      if (!deadline) {
        throw new Error('Invalid deadline');
      }
    } catch (error) {
      return res.status(400).json({
        success: false,
        error: 'Invalid deadline date format',
        details: ['Please provide a valid date for the project deadline']
      });
    }

    const budget = parseFloat(projectData.budget);
    if (isNaN(budget) || budget <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid budget',
        details: ['Budget must be a positive number']
      });
    }

    const projectId = uuidv4();
    console.log('Generated project ID:', projectId);
    
    const newProject = {
      id: projectId,
      client_id: req.user.id,
      title: projectData.title.trim(),
      description: projectData.description.trim(),
      category: projectData.category || 'other',
      skills_required: projectData.required_skills || [],
      budget: budget,
      budget_type: projectData.budget_type || 'fixed',
      deadline: deadline,
      status: PROJECT_STATUS.OPEN,
      
      // Optional fields
      attachments: projectData.attachments || [],
      requirements: projectData.requirements || [],
      milestones: [],
      
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

    // Create the project first
    try {
      await db.collection('projects').doc(projectId).set(newProject);
      console.log('Created project document');
    } catch (error) {
      console.error('Failed to create project document:', error);
      return res.status(500).json({
        success: false,
        error: 'Database error',
        details: ['Failed to create project. Please try again.']
      });
    }

    // Create milestones if provided
    if (projectData.milestones?.length > 0) {
      try {
        const batch = db.batch();
        const validMilestones = [];
        
        for (const [index, milestone] of projectData.milestones.entries()) {
          try {
            const milestoneId = uuidv4();
            const milestoneData = {
              id: milestoneId,
              project_id: projectId,
              title: milestone.title.trim(),
              description: milestone.description?.trim() || '',
              budget: parseFloat(milestone.budget) || 0,
              deadline: admin.firestore.Timestamp.fromDate(new Date(milestone.deadline)),
              order: index + 1,
              status: 'pending',
              created_at: admin.firestore.FieldValue.serverTimestamp()
            };
            
            batch.set(db.collection('milestones').doc(milestoneId), milestoneData);
            validMilestones.push(milestoneData);
          } catch (error) {
            console.warn('Skipping invalid milestone:', error);
          }
        }
        
        if (validMilestones.length > 0) {
          await batch.commit();
          newProject.milestones = validMilestones;
          console.log('Created', validMilestones.length, 'milestones');
        }
      } catch (error) {
        console.error('Failed to create milestones:', error);
        // Don't fail the whole request if milestones fail
      }
    }

    console.log('Project creation complete');
    res.status(201).json({
      success: true,
      message: 'Project created successfully',
      data: { id: projectId, ...newProject }
    });

  } catch (error) {
    console.error('Project creation error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error',
      message: 'Failed to create project',
      details: process.env.NODE_ENV === 'development' ? [error.message] : undefined
    });
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