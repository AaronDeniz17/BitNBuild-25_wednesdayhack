// Bids routes for GigCampus
// Handles bid creation, management, and acceptance

const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { admin, db } = require('../config/firebase');
const { auth, requireUniversityVerification, userRateLimit } = require('../middleware/auth');

const router = express.Router();

// Bid status constants
const BID_STATUS = {
  PENDING: 'pending',
  ACCEPTED: 'accepted',
  REJECTED: 'rejected',
  WITHDRAWN: 'withdrawn'
};

/**
 * GET /api/bids
 * Get bids (filtered by user role)
 */
router.get('/', auth, async (req, res) => {
  try {
    const { status, project_id, page = 1, limit = 10 } = req.query;
    
    let query;
    
    // Students see their own bids, clients see bids on their projects
    if (req.user.role === 'student') {
      query = db.collection('bids').where('freelancer_id', '==', req.user.id);
    } else {
      // For clients, get bids on their projects
      const myProjectsSnapshot = await db.collection('projects')
        .where('client_id', '==', req.user.id)
        .get();
      
      const projectIds = myProjectsSnapshot.docs.map(doc => doc.id);
      
      if (projectIds.length === 0) {
        return res.json({
          success: true,
          data: [],
          pagination: { page: 1, limit: 10, total: 0, pages: 0 }
        });
      }

      query = db.collection('bids').where('project_id', 'in', projectIds);
    }

    // Apply filters
    if (status && status !== 'all') {
      query = query.where('status', '==', status);
    }

    if (project_id) {
      query = query.where('project_id', '==', project_id);
    }

    query = query.orderBy('created_at', 'desc');

    // Pagination
    const pageSize = Math.min(parseInt(limit), 50);
    const offset = (parseInt(page) - 1) * pageSize;
    
    query = query.limit(pageSize).offset(offset);

    const snapshot = await query.get();
    const bids = [];

    for (const doc of snapshot.docs) {
      const bidData = doc.data();
      
      // Get project info
      const projectDoc = await db.collection('projects').doc(bidData.project_id).get();
      const projectData = projectDoc.exists ? projectDoc.data() : null;

      // Get bidder info (for clients viewing bids)
      let bidderData = null;
      if (req.user.role !== 'student') {
        const bidderDoc = await db.collection('users').doc(bidData.freelancer_id).get();
        bidderData = bidderDoc.exists ? bidderDoc.data() : null;
      }

      bids.push({
        id: doc.id,
        ...bidData,
        project: projectData ? {
          id: bidData.project_id,
          title: projectData.title,
          budget: projectData.budget,
          status: projectData.status
        } : null,
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
    console.error('Get bids error:', error);
    res.status(500).json({ error: 'Failed to get bids' });
  }
});

/**
 * GET /api/bids/:id
 * Get specific bid by ID
 */
router.get('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    
    const bidDoc = await db.collection('bids').doc(id).get();
    
    if (!bidDoc.exists) {
      return res.status(404).json({ error: 'Bid not found' });
    }

    const bidData = bidDoc.data();
    
    // Check access permissions
    const canAccess = bidData.freelancer_id === req.user.id || 
                     (await checkProjectOwnership(bidData.project_id, req.user.id));
    
    if (!canAccess) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Get project info
    const projectDoc = await db.collection('projects').doc(bidData.project_id).get();
    const projectData = projectDoc.exists ? projectDoc.data() : null;

    // Get bidder info
    const bidderDoc = await db.collection('users').doc(bidData.freelancer_id).get();
    const bidderData = bidderDoc.exists ? bidderDoc.data() : null;

    const bid = {
      id,
      ...bidData,
      project: projectData ? {
        id: bidData.project_id,
        title: projectData.title,
        description: projectData.description,
        budget: projectData.budget,
        deadline: projectData.deadline,
        status: projectData.status,
        client_id: projectData.client_id
      } : null,
      bidder: bidderData ? {
        id: bidderData.id,
        name: bidderData.name,
        university: bidderData.university,
        university_verified: bidderData.university_verified,
        bio: bidderData.bio,
        skills: bidderData.skills || [],
        portfolio_links: bidderData.portfolio_links || [],
        average_rating: bidderData.average_rating || 0,
        completed_projects: bidderData.completed_projects || 0
      } : null
    };

    res.json({
      success: true,
      data: bid
    });

  } catch (error) {
    console.error('Get bid error:', error);
    res.status(500).json({ error: 'Failed to get bid' });
  }
});

/**
 * POST /api/bids
 * Create a new bid
 */
router.post('/', auth, requireUniversityVerification, userRateLimit(20, 60 * 60 * 1000), async (req, res) => {
  try {
    const { project_id, amount, timeline, proposal, milestones } = req.body;

    // Validate required fields
    if (!project_id || !amount || !timeline || !proposal) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        required: ['project_id', 'amount', 'timeline', 'proposal']
      });
    }

    // Validate amount
    if (amount < 25) {
      return res.status(400).json({ error: 'Bid amount must be at least $25' });
    }

    // Validate proposal length
    if (proposal.length < 50) {
      return res.status(400).json({ 
        error: 'Proposal must be at least 50 characters long' 
      });
    }

    // Check if project exists and is open
    const projectDoc = await db.collection('projects').doc(project_id).get();
    
    if (!projectDoc.exists) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const project = projectDoc.data();
    
    if (project.status !== 'open') {
      return res.status(400).json({ error: 'Project is not accepting bids' });
    }

    // Can't bid on own projects
    if (project.client_id === req.user.id) {
      return res.status(400).json({ error: 'Cannot bid on your own project' });
    }

    // Check if user already has a pending bid on this project
    const existingBidSnapshot = await db.collection('bids')
      .where('project_id', '==', project_id)
      .where('freelancer_id', '==', req.user.id)
      .where('status', 'in', ['pending', 'accepted'])
      .get();

    if (!existingBidSnapshot.empty) {
      return res.status(400).json({ 
        error: 'You already have an active bid on this project' 
      });
    }

    const bidId = uuidv4();
    
    const newBid = {
      id: bidId,
      project_id,
      freelancer_id: req.user.id,
      amount: parseFloat(amount),
      timeline: parseInt(timeline), // days
      proposal: proposal.trim(),
      milestones: milestones || [],
      status: BID_STATUS.PENDING,
      
      // Metadata
      created_at: admin.firestore.FieldValue.serverTimestamp(),
      updated_at: admin.firestore.FieldValue.serverTimestamp()
    };

    // Use transaction to ensure atomicity
    await db.runTransaction(async (transaction) => {
      // Create the bid
      transaction.set(db.collection('bids').doc(bidId), newBid);
      
      // Update project bid count
      transaction.update(db.collection('projects').doc(project_id), {
        bid_count: admin.firestore.FieldValue.increment(1),
        updated_at: admin.firestore.FieldValue.serverTimestamp()
      });
    });

    res.status(201).json({
      success: true,
      message: 'Bid submitted successfully',
      data: { id: bidId, ...newBid }
    });

  } catch (error) {
    console.error('Create bid error:', error);
    res.status(500).json({ error: 'Failed to create bid' });
  }
});

/**
 * PUT /api/bids/:id
 * Update bid (only by bidder, only if pending)
 */
router.put('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, timeline, proposal, milestones } = req.body;
    
    const bidDoc = await db.collection('bids').doc(id).get();
    
    if (!bidDoc.exists) {
      return res.status(404).json({ error: 'Bid not found' });
    }

    const bid = bidDoc.data();
    
    // Check ownership
    if (bid.freelancer_id !== req.user.id) {
      return res.status(403).json({ error: 'You can only update your own bids' });
    }

    // Can only update pending bids
    if (bid.status !== BID_STATUS.PENDING) {
      return res.status(400).json({ error: 'Can only update pending bids' });
    }

    const updates = {};
    
    if (amount !== undefined) {
      if (amount < 25) {
        return res.status(400).json({ error: 'Bid amount must be at least $25' });
      }
      updates.amount = parseFloat(amount);
    }
    
    if (timeline !== undefined) {
      updates.timeline = parseInt(timeline);
    }
    
    if (proposal !== undefined) {
      if (proposal.length < 50) {
        return res.status(400).json({ 
          error: 'Proposal must be at least 50 characters long' 
        });
      }
      updates.proposal = proposal.trim();
    }
    
    if (milestones !== undefined) {
      updates.milestones = milestones;
    }

    updates.updated_at = admin.firestore.FieldValue.serverTimestamp();

    await db.collection('bids').doc(id).update(updates);

    // Get updated bid
    const updatedBidDoc = await db.collection('bids').doc(id).get();

    res.json({
      success: true,
      message: 'Bid updated successfully',
      data: { id, ...updatedBidDoc.data() }
    });

  } catch (error) {
    console.error('Update bid error:', error);
    res.status(500).json({ error: 'Failed to update bid' });
  }
});

/**
 * POST /api/bids/:id/accept
 * Accept a bid (only by project owner)
 */
router.post('/:id/accept', auth, async (req, res) => {
  try {
    const { id } = req.params;
    
    const bidDoc = await db.collection('bids').doc(id).get();
    
    if (!bidDoc.exists) {
      return res.status(404).json({ error: 'Bid not found' });
    }

    const bid = bidDoc.data();
    
    // Check if user owns the project
    const projectDoc = await db.collection('projects').doc(bid.project_id).get();
    if (!projectDoc.exists) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const project = projectDoc.data();
    
    if (project.client_id !== req.user.id) {
      return res.status(403).json({ error: 'You can only accept bids on your own projects' });
    }

    // Check if bid is still pending
    if (bid.status !== BID_STATUS.PENDING) {
      return res.status(400).json({ error: 'Bid is no longer pending' });
    }

    // Check if project is still open
    if (project.status !== 'open') {
      return res.status(400).json({ error: 'Project is no longer accepting bids' });
    }

    const contractId = uuidv4();

    // Use transaction to ensure atomicity
    await db.runTransaction(async (transaction) => {
      // Accept the bid
      transaction.update(db.collection('bids').doc(id), {
        status: BID_STATUS.ACCEPTED,
        accepted_at: admin.firestore.FieldValue.serverTimestamp(),
        updated_at: admin.firestore.FieldValue.serverTimestamp()
      });

      // Reject all other bids for this project
      const otherBidsSnapshot = await db.collection('bids')
        .where('project_id', '==', bid.project_id)
        .where('status', '==', BID_STATUS.PENDING)
        .get();

      otherBidsSnapshot.docs.forEach(doc => {
        if (doc.id !== id) {
          transaction.update(doc.ref, {
            status: BID_STATUS.REJECTED,
            rejected_at: admin.firestore.FieldValue.serverTimestamp(),
            updated_at: admin.firestore.FieldValue.serverTimestamp()
          });
        }
      });

      // Update project status
      transaction.update(db.collection('projects').doc(bid.project_id), {
        status: 'in_progress',
        freelancer_id: bid.freelancer_id,
        accepted_bid_id: id,
        started_at: admin.firestore.FieldValue.serverTimestamp(),
        updated_at: admin.firestore.FieldValue.serverTimestamp()
      });

      // Create contract
      const contractData = {
        id: contractId,
        project_id: bid.project_id,
        client_id: project.client_id,
        freelancer_id: bid.freelancer_id,
        bid_id: id,
        amount: bid.amount,
        status: 'active',
        created_at: admin.firestore.FieldValue.serverTimestamp(),
        updated_at: admin.firestore.FieldValue.serverTimestamp()
      };

      transaction.set(db.collection('contracts').doc(contractId), contractData);

      // Create milestones if they exist in the bid
      if (bid.milestones && bid.milestones.length > 0) {
        bid.milestones.forEach((milestone, index) => {
          const milestoneId = uuidv4();
          const milestoneData = {
            id: milestoneId,
            project_id: bid.project_id,
            contract_id: contractId,
            title: milestone.title,
            description: milestone.description || '',
            amount: parseFloat(milestone.amount),
            deadline: admin.firestore.Timestamp.fromDate(new Date(milestone.deadline)),
            order: index + 1,
            status: 'pending',
            created_at: admin.firestore.FieldValue.serverTimestamp()
          };
          
          transaction.set(db.collection('milestones').doc(milestoneId), milestoneData);
        });
      }
    });

    res.json({
      success: true,
      message: 'Bid accepted successfully',
      contract_id: contractId
    });

  } catch (error) {
    console.error('Accept bid error:', error);
    res.status(500).json({ error: 'Failed to accept bid' });
  }
});

/**
 * POST /api/bids/:id/reject
 * Reject a bid (only by project owner)
 */
router.post('/:id/reject', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    
    const bidDoc = await db.collection('bids').doc(id).get();
    
    if (!bidDoc.exists) {
      return res.status(404).json({ error: 'Bid not found' });
    }

    const bid = bidDoc.data();
    
    // Check if user owns the project
    const canReject = await checkProjectOwnership(bid.project_id, req.user.id);
    
    if (!canReject) {
      return res.status(403).json({ error: 'You can only reject bids on your own projects' });
    }

    // Check if bid is still pending
    if (bid.status !== BID_STATUS.PENDING) {
      return res.status(400).json({ error: 'Bid is no longer pending' });
    }

    const updates = {
      status: BID_STATUS.REJECTED,
      rejected_at: admin.firestore.FieldValue.serverTimestamp(),
      updated_at: admin.firestore.FieldValue.serverTimestamp()
    };

    if (reason) {
      updates.rejection_reason = reason.trim();
    }

    await db.collection('bids').doc(id).update(updates);

    res.json({
      success: true,
      message: 'Bid rejected successfully'
    });

  } catch (error) {
    console.error('Reject bid error:', error);
    res.status(500).json({ error: 'Failed to reject bid' });
  }
});

/**
 * POST /api/bids/:id/withdraw
 * Withdraw a bid (only by bidder, only if pending)
 */
router.post('/:id/withdraw', auth, async (req, res) => {
  try {
    const { id } = req.params;
    
    const bidDoc = await db.collection('bids').doc(id).get();
    
    if (!bidDoc.exists) {
      return res.status(404).json({ error: 'Bid not found' });
    }

    const bid = bidDoc.data();
    
    // Check ownership
    if (bid.freelancer_id !== req.user.id) {
      return res.status(403).json({ error: 'You can only withdraw your own bids' });
    }

    // Can only withdraw pending bids
    if (bid.status !== BID_STATUS.PENDING) {
      return res.status(400).json({ error: 'Can only withdraw pending bids' });
    }

    // Use transaction to ensure atomicity
    await db.runTransaction(async (transaction) => {
      // Update bid status
      transaction.update(db.collection('bids').doc(id), {
        status: BID_STATUS.WITHDRAWN,
        withdrawn_at: admin.firestore.FieldValue.serverTimestamp(),
        updated_at: admin.firestore.FieldValue.serverTimestamp()
      });

      // Update project bid count
      transaction.update(db.collection('projects').doc(bid.project_id), {
        bid_count: admin.firestore.FieldValue.increment(-1)
      });
    });

    res.json({
      success: true,
      message: 'Bid withdrawn successfully'
    });

  } catch (error) {
    console.error('Withdraw bid error:', error);
    res.status(500).json({ error: 'Failed to withdraw bid' });
  }
});

// Helper function to check project ownership
async function checkProjectOwnership(projectId, userId) {
  try {
    const projectDoc = await db.collection('projects').doc(projectId).get();
    return projectDoc.exists && projectDoc.data().client_id === userId;
  } catch (error) {
    return false;
  }
}

module.exports = router;