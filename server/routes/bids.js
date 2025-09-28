// Enhanced Bids routes for GigCampus
// Handles individual and team proposals with skill matching

const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { admin, db } = require('../config/firebase');
const { auth } = require('../middleware/auth');
const RecommendationService = require('../services/RecommendationService');

const router = express.Router();

/**
 * POST /api/bids
 * Submit a proposal (individual or team)
 */
router.post('/', auth, async (req, res) => {
  try {
    const { 
      project_id, 
      proposer_type, 
      proposer_id, 
      price, 
      eta_days, 
      pitch, 
      portfolio_url,
      proposed_team = [],
      message = ''
    } = req.body;

    // Validate inputs
    if (!project_id || !proposer_type || !proposer_id || !price || !eta_days || !pitch) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        details: ['project_id, proposer_type, proposer_id, price, eta_days, and pitch are required']
      });
    }

    if (!['user', 'team'].includes(proposer_type)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid proposer type',
        details: ['proposer_type must be "user" or "team"']
      });
    }

    // Check if user is a student
    if (req.user.role !== 'student') {
      return res.status(403).json({
        success: false,
        error: 'Only students can submit proposals'
      });
    }

    // Verify project exists and is open
    const projectDoc = await db.collection('projects').doc(project_id).get();
    
    if (!projectDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Project not found'
      });
    }

    const project = projectDoc.data();
    
    if (project.status !== 'open') {
      return res.status(400).json({
        success: false,
        error: 'Project is not accepting proposals',
        details: [`Project status: ${project.status}`]
      });
    }

    // Verify proposer
    if (proposer_type === 'user') {
      if (proposer_id !== req.user.id) {
        return res.status(403).json({
          success: false,
          error: 'You can only submit proposals for yourself'
        });
      }
    } else if (proposer_type === 'team') {
      // Verify user is a member of the team
      const teamMemberSnapshot = await db.collection('team_members')
        .where('team_id', '==', proposer_id)
        .where('user_id', '==', req.user.id)
        .where('is_active', '==', true)
        .get();

      if (teamMemberSnapshot.empty) {
        return res.status(403).json({
          success: false,
          error: 'You are not a member of this team'
        });
      }
    }

    // Check if user/team has already submitted a proposal for this project
    const existingBidSnapshot = await db.collection('bids')
      .where('project_id', '==', project_id)
      .where('proposer_type', '==', proposer_type)
      .where('proposer_id', '==', proposer_id)
      .where('status', 'in', ['pending', 'accepted'])
      .get();

    if (!existingBidSnapshot.empty) {
      return res.status(400).json({
        success: false,
        error: 'You have already submitted a proposal for this project'
      });
    }

    // Calculate skill match if proposer is a user
    let skillsMatch = 0;
    if (proposer_type === 'user') {
      const userDoc = await db.collection('users').doc(proposer_id).get();
      if (userDoc.exists) {
        const userData = userDoc.data();
        const userSkills = userData.skills || [];
        const requiredSkills = project.required_skills || [];
        
        if (requiredSkills.length > 0) {
          const matches = requiredSkills.filter(skill => 
            userSkills.some(userSkill => 
              userSkill.toLowerCase().includes(skill.toLowerCase()) ||
              skill.toLowerCase().includes(userSkill.toLowerCase())
            )
          ).length;
          
          skillsMatch = (matches / requiredSkills.length) * 100;
        }
      }
    }

    // Create proposal
    const bidId = uuidv4();
    const bidData = {
      id: bidId,
      project_id,
      proposer_type,
      proposer_id,
      price: parseFloat(price),
      eta_days: parseInt(eta_days),
      pitch: pitch.trim(),
      portfolio_url: portfolio_url?.trim() || '',
      status: 'pending',
      created_at: admin.firestore.FieldValue.serverTimestamp(),
      updated_at: admin.firestore.FieldValue.serverTimestamp(),
      proposed_team: proposed_team || [],
      skills_match: skillsMatch,
      previous_work: [],
      message: message.trim()
    };

    await db.collection('bids').doc(bidId).set(bidData);

    // Update project bid count
    await db.collection('projects').doc(project_id).update({
      bid_count: admin.firestore.FieldValue.increment(1)
    });

    res.status(201).json({
      success: true,
      message: 'Proposal submitted successfully',
      data: {
        id: bidId,
        ...bidData,
        skills_match_percentage: skillsMatch
      }
    });

  } catch (error) {
    console.error('Submit proposal error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to submit proposal',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * GET /api/bids
 * Get user's proposals
 */
router.get('/', auth, async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;

    let query = db.collection('bids')
      .where('proposer_id', '==', req.user.id)
      .orderBy('created_at', 'desc');

    if (status && status !== 'all') {
      query = query.where('status', '==', status);
    }

    const pageSize = Math.min(parseInt(limit), 50);
    const offset = (parseInt(page) - 1) * pageSize;
    
    query = query.limit(pageSize).offset(offset);

    const snapshot = await query.get();
    const proposals = await Promise.all(snapshot.docs.map(async (doc) => {
      const bidData = doc.data();
      
      // Get project details
      const projectDoc = await db.collection('projects').doc(bidData.project_id).get();
      const projectData = projectDoc.exists ? projectDoc.data() : null;

      return {
        id: doc.id,
        ...bidData,
        project: projectData ? {
          id: projectData.id,
          title: projectData.title,
          client_id: projectData.client_id,
          status: projectData.status,
          budget_min: projectData.budget_min,
          budget_max: projectData.budget_max
        } : null
      };
    }));

    res.json({
      success: true,
      data: proposals,
      pagination: {
        page: parseInt(page),
        limit: pageSize,
        total: proposals.length,
        pages: Math.ceil(proposals.length / pageSize)
      }
    });

  } catch (error) {
    console.error('Get proposals error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get proposals',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * GET /api/bids/:id
 * Get proposal details
 */
router.get('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;

    const bidDoc = await db.collection('bids').doc(id).get();
    
    if (!bidDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Proposal not found'
      });
    }

    const bidData = bidDoc.data();

    // Check if user has access to this proposal
    const isOwner = bidData.proposer_id === req.user.id;
    const isProjectOwner = await checkProjectOwnership(bidData.project_id, req.user.id);
    
    if (!isOwner && !isProjectOwner) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    // Get project details
    const projectDoc = await db.collection('projects').doc(bidData.project_id).get();
    const projectData = projectDoc.exists ? projectDoc.data() : null;

    // Get proposer details
    let proposerData = null;
    if (bidData.proposer_type === 'user') {
      const userDoc = await db.collection('users').doc(bidData.proposer_id).get();
      proposerData = userDoc.exists ? userDoc.data() : null;
    } else if (bidData.proposer_type === 'team') {
      const teamDoc = await db.collection('teams').doc(bidData.proposer_id).get();
      proposerData = teamDoc.exists ? teamDoc.data() : null;
    }

    res.json({
      success: true,
      data: {
        ...bidData,
        project: projectData,
        proposer: proposerData
      }
    });

  } catch (error) {
    console.error('Get proposal error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get proposal details',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * PUT /api/bids/:id/accept
 * Accept a proposal (project owner only)
 */
router.put('/:id/accept', auth, async (req, res) => {
  try {
    const { id } = req.params;

    const bidDoc = await db.collection('bids').doc(id).get();
    
    if (!bidDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Proposal not found'
      });
    }

    const bidData = bidDoc.data();

    // Check if user is project owner
    const isProjectOwner = await checkProjectOwnership(bidData.project_id, req.user.id);
    
    if (!isProjectOwner) {
      return res.status(403).json({
        success: false,
        error: 'Only project owner can accept proposals'
      });
    }

    // Check if proposal is still pending
    if (bidData.status !== 'pending') {
      return res.status(400).json({
        success: false,
        error: 'Proposal is not pending',
        details: [`Current status: ${bidData.status}`]
      });
    }

    // Use transaction to ensure atomicity
    const result = await db.runTransaction(async (transaction) => {
      // Accept the proposal
      const bidRef = db.collection('bids').doc(id);
      transaction.update(bidRef, {
        status: 'accepted',
        accepted_at: admin.firestore.FieldValue.serverTimestamp(),
        accepted_by: req.user.id
      });

      // Reject all other proposals for this project
      const otherBidsSnapshot = await db.collection('bids')
        .where('project_id', '==', bidData.project_id)
        .where('status', '==', 'pending')
        .get();

      otherBidsSnapshot.docs.forEach(doc => {
        if (doc.id !== id) {
          transaction.update(doc.ref, {
            status: 'rejected',
            rejected_at: admin.firestore.FieldValue.serverTimestamp(),
            rejected_by: req.user.id
          });
        }
      });

      // Update project status
      const projectRef = db.collection('projects').doc(bidData.project_id);
      transaction.update(projectRef, {
        status: 'in_progress',
        updated_at: admin.firestore.FieldValue.serverTimestamp()
      });

      // Create contract
      const contractId = uuidv4();
      const contractData = {
        id: contractId,
        project_id: bidData.project_id,
        accepted_bid_id: id,
        proposer_type: bidData.proposer_type,
        proposer_id: bidData.proposer_id,
        client_id: req.user.id,
        status: 'active',
        total_amount: bidData.price,
        escrow_balance: 0,
        created_at: admin.firestore.FieldValue.serverTimestamp(),
        started_at: admin.firestore.FieldValue.serverTimestamp()
      };

      transaction.set(db.collection('contracts').doc(contractId), contractData);

      return { contractId, contractData };
    });

    res.json({
      success: true,
      message: 'Proposal accepted successfully',
      data: {
        bid_id: id,
        contract_id: result.contractId,
        status: 'accepted'
      }
    });

  } catch (error) {
    console.error('Accept proposal error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to accept proposal',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * PUT /api/bids/:id/reject
 * Reject a proposal (project owner only)
 */
router.put('/:id/reject', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const bidDoc = await db.collection('bids').doc(id).get();
    
    if (!bidDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Proposal not found'
      });
    }

    const bidData = bidDoc.data();

    // Check if user is project owner
    const isProjectOwner = await checkProjectOwnership(bidData.project_id, req.user.id);
    
    if (!isProjectOwner) {
      return res.status(403).json({
        success: false,
        error: 'Only project owner can reject proposals'
      });
    }

    // Check if proposal is still pending
    if (bidData.status !== 'pending') {
      return res.status(400).json({
        success: false,
        error: 'Proposal is not pending',
        details: [`Current status: ${bidData.status}`]
      });
    }

    // Reject the proposal
    await db.collection('bids').doc(id).update({
      status: 'rejected',
      rejected_at: admin.firestore.FieldValue.serverTimestamp(),
      rejected_by: req.user.id,
      rejection_reason: reason || ''
    });

    res.json({
      success: true,
      message: 'Proposal rejected successfully'
    });

  } catch (error) {
    console.error('Reject proposal error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to reject proposal',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * PUT /api/bids/:id/withdraw
 * Withdraw a proposal (proposer only)
 */
router.put('/:id/withdraw', auth, async (req, res) => {
  try {
    const { id } = req.params;

    const bidDoc = await db.collection('bids').doc(id).get();
    
    if (!bidDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Proposal not found'
      });
    }

    const bidData = bidDoc.data();

    // Check if user is the proposer
    if (bidData.proposer_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Only the proposer can withdraw the proposal'
      });
    }

    // Check if proposal can be withdrawn
    if (!['pending'].includes(bidData.status)) {
      return res.status(400).json({
        success: false,
        error: 'Proposal cannot be withdrawn',
        details: [`Current status: ${bidData.status}`]
      });
    }

    // Withdraw the proposal
    await db.collection('bids').doc(id).update({
      status: 'withdrawn',
      withdrawn_at: admin.firestore.FieldValue.serverTimestamp()
    });

    res.json({
      success: true,
      message: 'Proposal withdrawn successfully'
    });

  } catch (error) {
    console.error('Withdraw proposal error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to withdraw proposal',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * Helper function to check if user owns a project
 */
async function checkProjectOwnership(projectId, userId) {
  try {
    const projectDoc = await db.collection('projects').doc(projectId).get();
    
    if (!projectDoc.exists) {
      return false;
    }

    const projectData = projectDoc.data();
    return projectData.client_id === userId;

  } catch (error) {
    console.error('Check project ownership error:', error);
    return false;
  }
}

module.exports = router;