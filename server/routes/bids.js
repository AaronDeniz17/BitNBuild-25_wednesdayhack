// Bid routes for GigCampus
// Handles bid creation, acceptance, and management

const express = require('express');
const { admin } = require('../config/firebase');
const { authenticateToken, requireRole, requireUniversityVerification } = require('../middleware/auth');

const router = express.Router();

/**
 * POST /api/bids
 * Create a new bid (students only)
 */
router.post('/', authenticateToken, requireRole(['student']), requireUniversityVerification, async (req, res) => {
  try {
    const {
      project_id,
      price,
      proposal,
      eta_days,
      portfolio_links,
      previous_work,
      message,
      team_id
    } = req.body;

    // Validate required fields
    if (!project_id || !price || !proposal || !eta_days) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Validate price
    if (price <= 0) {
      return res.status(400).json({ error: 'Price must be greater than 0' });
    }

    // Check if project exists and is open
    const projectDoc = await admin.firestore()
      .collection('projects')
      .doc(project_id)
      .get();

    if (!projectDoc.exists) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const projectData = projectDoc.data();

    if (projectData.status !== 'open') {
      return res.status(400).json({ error: 'Project is not accepting bids' });
    }

    // Check if user already bid on this project
    const existingBidQuery = await admin.firestore()
      .collection('bids')
      .where('project_id', '==', project_id)
      .where('freelancer_id', '==', req.user.id)
      .get();

    if (!existingBidQuery.empty) {
      return res.status(400).json({ error: 'You have already bid on this project' });
    }

    // Create bid document
    const bidData = {
      id: admin.firestore().collection('bids').doc().id,
      project_id,
      freelancer_id: req.user.id,
      team_id: team_id || null,
      price: parseFloat(price),
      proposal,
      eta_days: parseInt(eta_days),
      status: 'pending',
      created_at: admin.firestore.FieldValue.serverTimestamp(),
      updated_at: admin.firestore.FieldValue.serverTimestamp(),
      portfolio_links: portfolio_links || [],
      previous_work: previous_work || [],
      is_individual: !team_id,
      message: message || ''
    };

    // Save bid to Firestore
    await admin.firestore()
      .collection('bids')
      .doc(bidData.id)
      .set(bidData);

    res.status(201).json({
      message: 'Bid submitted successfully',
      bid: bidData
    });

  } catch (error) {
    console.error('Bid creation error:', error);
    res.status(500).json({ error: 'Failed to create bid' });
  }
});

/**
 * GET /api/bids
 * Get bids for current user
 */
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { status, type = 'sent' } = req.query;
    const userId = req.user.id;

    let query;

    if (type === 'sent') {
      // Bids sent by user
      query = admin.firestore()
        .collection('bids')
        .where('freelancer_id', '==', userId);
    } else if (type === 'received') {
      // Bids received by user (for clients)
      if (req.user.role !== 'client') {
        return res.status(403).json({ error: 'Only clients can view received bids' });
      }

      // Get user's projects
      const projectsSnapshot = await admin.firestore()
        .collection('projects')
        .where('client_id', '==', userId)
        .get();

      const projectIds = projectsSnapshot.docs.map(doc => doc.id);

      if (projectIds.length === 0) {
        return res.json({ bids: [] });
      }

      query = admin.firestore()
        .collection('bids')
        .where('project_id', 'in', projectIds);
    } else {
      return res.status(400).json({ error: 'Invalid type parameter' });
    }

    // Apply status filter
    if (status) {
      query = query.where('status', '==', status);
    }

    // Apply ordering
    query = query.orderBy('created_at', 'desc');

    const snapshot = await query.get();
    const bids = [];

    for (const doc of snapshot.docs) {
      const bidData = doc.data();

      // Get project information
      const projectDoc = await admin.firestore()
        .collection('projects')
        .doc(bidData.project_id)
        .get();

      const projectData = projectDoc.exists ? projectDoc.data() : null;

      // Get freelancer information
      const freelancerDoc = await admin.firestore()
        .collection('users')
        .doc(bidData.freelancer_id)
        .get();

      const freelancerData = freelancerDoc.exists ? freelancerDoc.data() : null;

      // Get student profile if applicable
      let studentProfile = null;
      if (freelancerData && freelancerData.role === 'student') {
        const studentDoc = await admin.firestore()
          .collection('student_profiles')
          .doc(bidData.freelancer_id)
          .get();

        if (studentDoc.exists) {
          studentProfile = studentDoc.data();
        }
      }

      bids.push({
        id: doc.id,
        ...bidData,
        created_at: bidData.created_at?.toDate(),
        project: projectData ? {
          id: projectData.id,
          title: projectData.title,
          budget: projectData.budget,
          deadline: projectData.deadline?.toDate()
        } : null,
        freelancer: freelancerData ? {
          id: freelancerData.id,
          name: freelancerData.name,
          university: freelancerData.university
        } : null,
        studentProfile: studentProfile ? {
          skills: studentProfile.skills,
          hourly_rate: studentProfile.hourly_rate,
          reputation_score: studentProfile.reputation_score,
          completed_projects: studentProfile.completed_projects
        } : null
      });
    }

    res.json({ bids });

  } catch (error) {
    console.error('Bids fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch bids' });
  }
});

/**
 * GET /api/bids/:id
 * Get bid details by ID
 */
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const bidId = req.params.id;

    const bidDoc = await admin.firestore()
      .collection('bids')
      .doc(bidId)
      .get();

    if (!bidDoc.exists) {
      return res.status(404).json({ error: 'Bid not found' });
    }

    const bidData = bidDoc.data();

    // Check if user has access to this bid
    const hasAccess = bidData.freelancer_id === req.user.id || 
                     (req.user.role === 'client' && await isProjectOwner(bidData.project_id, req.user.id));

    if (!hasAccess) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Get project information
    const projectDoc = await admin.firestore()
      .collection('projects')
      .doc(bidData.project_id)
      .get();

    const projectData = projectDoc.exists ? projectDoc.data() : null;

    // Get freelancer information
    const freelancerDoc = await admin.firestore()
      .collection('users')
      .doc(bidData.freelancer_id)
      .get();

    const freelancerData = freelancerDoc.exists ? freelancerDoc.data() : null;

    res.json({
      bid: {
        id: bidDoc.id,
        ...bidData,
        created_at: bidData.created_at?.toDate()
      },
      project: projectData,
      freelancer: freelancerData
    });

  } catch (error) {
    console.error('Bid fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch bid' });
  }
});

/**
 * PUT /api/bids/:id/accept
 * Accept a bid (clients only)
 */
router.put('/:id/accept', authenticateToken, requireRole(['client']), async (req, res) => {
  try {
    const bidId = req.params.id;

    // Get bid
    const bidDoc = await admin.firestore()
      .collection('bids')
      .doc(bidId)
      .get();

    if (!bidDoc.exists) {
      return res.status(404).json({ error: 'Bid not found' });
    }

    const bidData = bidDoc.data();

    // Check if user owns the project
    const projectDoc = await admin.firestore()
      .collection('projects')
      .doc(bidData.project_id)
      .get();

    if (!projectDoc.exists) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const projectData = projectDoc.data();

    if (projectData.client_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Check if bid is still pending
    if (bidData.status !== 'pending') {
      return res.status(400).json({ error: 'Bid is no longer pending' });
    }

    // Check if project is still open
    if (projectData.status !== 'open') {
      return res.status(400).json({ error: 'Project is no longer accepting bids' });
    }

    // Start transaction to accept bid and create contract
    const batch = admin.firestore().batch();

    // Update bid status
    batch.update(bidDoc.ref, {
      status: 'accepted',
      updated_at: admin.firestore.FieldValue.serverTimestamp()
    });

    // Update project status
    batch.update(projectDoc.ref, {
      status: 'in_progress',
      updated_at: admin.firestore.FieldValue.serverTimestamp()
    });

    // Create contract
    const contractData = {
      id: admin.firestore().collection('contracts').doc().id,
      project_id: bidData.project_id,
      accepted_bid_id: bidId,
      freelancer_id: bidData.freelancer_id,
      team_id: bidData.team_id,
      client_id: req.user.id,
      status: 'active',
      escrow_balance: 0, // Will be updated when client deposits
      total_amount: bidData.price,
      milestones: projectData.milestones || [],
      created_at: admin.firestore.FieldValue.serverTimestamp(),
      started_at: admin.firestore.FieldValue.serverTimestamp()
    };

    const contractRef = admin.firestore().collection('contracts').doc(contractData.id);
    batch.set(contractRef, contractData);

    // Reject all other bids for this project
    const otherBidsSnapshot = await admin.firestore()
      .collection('bids')
      .where('project_id', '==', bidData.project_id)
      .where('freelancer_id', '!=', bidData.freelancer_id)
      .get();

    otherBidsSnapshot.forEach(doc => {
      batch.update(doc.ref, {
        status: 'rejected',
        updated_at: admin.firestore.FieldValue.serverTimestamp()
      });
    });

    // Commit transaction
    await batch.commit();

    res.json({
      message: 'Bid accepted successfully',
      contract: contractData
    });

  } catch (error) {
    console.error('Bid acceptance error:', error);
    res.status(500).json({ error: 'Failed to accept bid' });
  }
});

/**
 * PUT /api/bids/:id/reject
 * Reject a bid (clients only)
 */
router.put('/:id/reject', authenticateToken, requireRole(['client']), async (req, res) => {
  try {
    const bidId = req.params.id;

    // Get bid
    const bidDoc = await admin.firestore()
      .collection('bids')
      .doc(bidId)
      .get();

    if (!bidDoc.exists) {
      return res.status(404).json({ error: 'Bid not found' });
    }

    const bidData = bidDoc.data();

    // Check if user owns the project
    const projectDoc = await admin.firestore()
      .collection('projects')
      .doc(bidData.project_id)
      .get();

    if (!projectDoc.exists) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const projectData = projectDoc.data();

    if (projectData.client_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Check if bid is still pending
    if (bidData.status !== 'pending') {
      return res.status(400).json({ error: 'Bid is no longer pending' });
    }

    // Update bid status
    await admin.firestore()
      .collection('bids')
      .doc(bidId)
      .update({
        status: 'rejected',
        updated_at: admin.firestore.FieldValue.serverTimestamp()
      });

    res.json({ message: 'Bid rejected successfully' });

  } catch (error) {
    console.error('Bid rejection error:', error);
    res.status(500).json({ error: 'Failed to reject bid' });
  }
});

/**
 * DELETE /api/bids/:id
 * Delete a bid (freelancer only)
 */
router.delete('/:id', authenticateToken, requireRole(['student']), async (req, res) => {
  try {
    const bidId = req.params.id;

    // Get bid
    const bidDoc = await admin.firestore()
      .collection('bids')
      .doc(bidId)
      .get();

    if (!bidDoc.exists) {
      return res.status(404).json({ error: 'Bid not found' });
    }

    const bidData = bidDoc.data();

    // Check if user owns the bid
    if (bidData.freelancer_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Check if bid is still pending
    if (bidData.status !== 'pending') {
      return res.status(400).json({ error: 'Cannot delete accepted or rejected bid' });
    }

    // Delete bid
    await admin.firestore()
      .collection('bids')
      .doc(bidId)
      .delete();

    res.json({ message: 'Bid deleted successfully' });

  } catch (error) {
    console.error('Bid deletion error:', error);
    res.status(500).json({ error: 'Failed to delete bid' });
  }
});

// Helper function to check if user owns a project
async function isProjectOwner(projectId, userId) {
  const projectDoc = await admin.firestore()
    .collection('projects')
    .doc(projectId)
    .get();

  if (!projectDoc.exists) return false;

  const projectData = projectDoc.data();
  return projectData.client_id === userId;
}

module.exports = router;
