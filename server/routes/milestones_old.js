// Milestone routes for GigCampus
// Handles milestone creation, updates, and submissions

const express = require('express');
const { admin } = require('../config/firebase');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

/**
 * POST /api/milestones
 * Create a new milestone (clients only)
 */
router.post('/', authenticateToken, requireRole(['client']), async (req, res) => {
  try {
    const {
      contract_id,
      title,
      description,
      weight_pct,
      due_date
    } = req.body;

    // Validate required fields
    if (!contract_id || !title || !weight_pct || !due_date) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Validate weight percentage
    if (weight_pct <= 0 || weight_pct > 100) {
      return res.status(400).json({ error: 'Weight percentage must be between 0 and 100' });
    }

    // Check if contract exists and belongs to user
    const contractDoc = await admin.firestore()
      .collection('contracts')
      .doc(contract_id)
      .get();

    if (!contractDoc.exists) {
      return res.status(404).json({ error: 'Contract not found' });
    }

    const contractData = contractDoc.data();

    if (contractData.client_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Check if contract is active
    if (contractData.status !== 'active') {
      return res.status(400).json({ error: 'Contract is not active' });
    }

    // Create milestone
    const milestoneData = {
      id: admin.firestore().collection('milestones').doc().id,
      contract_id,
      title,
      description,
      weight_pct: parseFloat(weight_pct),
      due_date: admin.firestore.Timestamp.fromDate(new Date(due_date)),
      status: 'pending',
      submitted_files: [],
      amount: (contractData.total_amount * weight_pct) / 100
    };

    await admin.firestore()
      .collection('milestones')
      .doc(milestoneData.id)
      .set(milestoneData);

    res.status(201).json({
      message: 'Milestone created successfully',
      milestone: milestoneData
    });

  } catch (error) {
    console.error('Milestone creation error:', error);
    res.status(500).json({ error: 'Failed to create milestone' });
  }
});

/**
 * PUT /api/milestones/:id/submit
 * Submit milestone for approval (freelancers only)
 */
router.put('/:id/submit', authenticateToken, requireRole(['student']), async (req, res) => {
  try {
    const milestoneId = req.params.id;
    const { submitted_files, notes } = req.body;

    // Get milestone
    const milestoneDoc = await admin.firestore()
      .collection('milestones')
      .doc(milestoneId)
      .get();

    if (!milestoneDoc.exists) {
      return res.status(404).json({ error: 'Milestone not found' });
    }

    const milestoneData = milestoneDoc.data();

    // Check if user has access to this milestone
    const contractDoc = await admin.firestore()
      .collection('contracts')
      .doc(milestoneData.contract_id)
      .get();

    if (!contractDoc.exists) {
      return res.status(404).json({ error: 'Contract not found' });
    }

    const contractData = contractDoc.data();

    const hasAccess = contractData.freelancer_id === req.user.id ||
                     (contractData.team_id && await isTeamMember(contractData.team_id, req.user.id));

    if (!hasAccess) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Check if milestone can be submitted
    if (milestoneData.status !== 'pending' && milestoneData.status !== 'in_progress') {
      return res.status(400).json({ error: 'Milestone cannot be submitted' });
    }

    // Update milestone
    await admin.firestore()
      .collection('milestones')
      .doc(milestoneId)
      .update({
        status: 'submitted',
        submitted_files: submitted_files || [],
        submitted_at: admin.firestore.FieldValue.serverTimestamp(),
        notes: notes || ''
      });

    res.json({ message: 'Milestone submitted successfully' });

  } catch (error) {
    console.error('Milestone submission error:', error);
    res.status(500).json({ error: 'Failed to submit milestone' });
  }
});

/**
 * PUT /api/milestones/:id/approve
 * Approve milestone (clients only)
 */
router.put('/:id/approve', authenticateToken, requireRole(['client']), async (req, res) => {
  try {
    const milestoneId = req.params.id;
    const { feedback } = req.body;

    // Get milestone
    const milestoneDoc = await admin.firestore()
      .collection('milestones')
      .doc(milestoneId)
      .get();

    if (!milestoneDoc.exists) {
      return res.status(404).json({ error: 'Milestone not found' });
    }

    const milestoneData = milestoneDoc.data();

    // Check if user owns the contract
    const contractDoc = await admin.firestore()
      .collection('contracts')
      .doc(milestoneData.contract_id)
      .get();

    if (!contractDoc.exists) {
      return res.status(404).json({ error: 'Contract not found' });
    }

    const contractData = contractDoc.data();

    if (contractData.client_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Check if milestone can be approved
    if (milestoneData.status !== 'submitted') {
      return res.status(400).json({ error: 'Milestone is not submitted' });
    }

    // Update milestone
    await admin.firestore()
      .collection('milestones')
      .doc(milestoneId)
      .update({
        status: 'approved',
        approved_at: admin.firestore.FieldValue.serverTimestamp(),
        feedback: feedback || ''
      });

    res.json({ message: 'Milestone approved successfully' });

  } catch (error) {
    console.error('Milestone approval error:', error);
    res.status(500).json({ error: 'Failed to approve milestone' });
  }
});

/**
 * PUT /api/milestones/:id/reject
 * Reject milestone (clients only)
 */
router.put('/:id/reject', authenticateToken, requireRole(['client']), async (req, res) => {
  try {
    const milestoneId = req.params.id;
    const { feedback, reason } = req.body;

    if (!feedback) {
      return res.status(400).json({ error: 'Feedback is required for rejection' });
    }

    // Get milestone
    const milestoneDoc = await admin.firestore()
      .collection('milestones')
      .doc(milestoneId)
      .get();

    if (!milestoneDoc.exists) {
      return res.status(404).json({ error: 'Milestone not found' });
    }

    const milestoneData = milestoneDoc.data();

    // Check if user owns the contract
    const contractDoc = await admin.firestore()
      .collection('contracts')
      .doc(milestoneData.contract_id)
      .get();

    if (!contractDoc.exists) {
      return res.status(404).json({ error: 'Contract not found' });
    }

    const contractData = contractDoc.data();

    if (contractData.client_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Check if milestone can be rejected
    if (milestoneData.status !== 'submitted') {
      return res.status(400).json({ error: 'Milestone is not submitted' });
    }

    // Update milestone
    await admin.firestore()
      .collection('milestones')
      .doc(milestoneId)
      .update({
        status: 'rejected',
        rejected_at: admin.firestore.FieldValue.serverTimestamp(),
        feedback,
        rejection_reason: reason || 'No specific reason provided'
      });

    res.json({ message: 'Milestone rejected successfully' });

  } catch (error) {
    console.error('Milestone rejection error:', error);
    res.status(500).json({ error: 'Failed to reject milestone' });
  }
});

/**
 * PUT /api/milestones/:id/start
 * Start working on milestone (freelancers only)
 */
router.put('/:id/start', authenticateToken, requireRole(['student']), async (req, res) => {
  try {
    const milestoneId = req.params.id;

    // Get milestone
    const milestoneDoc = await admin.firestore()
      .collection('milestones')
      .doc(milestoneId)
      .get();

    if (!milestoneDoc.exists) {
      return res.status(404).json({ error: 'Milestone not found' });
    }

    const milestoneData = milestoneDoc.data();

    // Check if user has access to this milestone
    const contractDoc = await admin.firestore()
      .collection('contracts')
      .doc(milestoneData.contract_id)
      .get();

    if (!contractDoc.exists) {
      return res.status(404).json({ error: 'Contract not found' });
    }

    const contractData = contractDoc.data();

    const hasAccess = contractData.freelancer_id === req.user.id ||
                     (contractData.team_id && await isTeamMember(contractData.team_id, req.user.id));

    if (!hasAccess) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Check if milestone can be started
    if (milestoneData.status !== 'pending') {
      return res.status(400).json({ error: 'Milestone cannot be started' });
    }

    // Update milestone
    await admin.firestore()
      .collection('milestones')
      .doc(milestoneId)
      .update({
        status: 'in_progress',
        started_at: admin.firestore.FieldValue.serverTimestamp()
      });

    res.json({ message: 'Milestone started successfully' });

  } catch (error) {
    console.error('Milestone start error:', error);
    res.status(500).json({ error: 'Failed to start milestone' });
  }
});

/**
 * GET /api/milestones/:id
 * Get milestone details
 */
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const milestoneId = req.params.id;

    const milestoneDoc = await admin.firestore()
      .collection('milestones')
      .doc(milestoneId)
      .get();

    if (!milestoneDoc.exists) {
      return res.status(404).json({ error: 'Milestone not found' });
    }

    const milestoneData = milestoneDoc.data();

    // Check if user has access to this milestone
    const contractDoc = await admin.firestore()
      .collection('contracts')
      .doc(milestoneData.contract_id)
      .get();

    if (!contractDoc.exists) {
      return res.status(404).json({ error: 'Contract not found' });
    }

    const contractData = contractDoc.data();

    const hasAccess = contractData.client_id === req.user.id ||
                     contractData.freelancer_id === req.user.id ||
                     (contractData.team_id && await isTeamMember(contractData.team_id, req.user.id));

    if (!hasAccess) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json({
      milestone: {
        id: milestoneDoc.id,
        ...milestoneData,
        due_date: milestoneData.due_date?.toDate(),
        submitted_at: milestoneData.submitted_at?.toDate(),
        approved_at: milestoneData.approved_at?.toDate(),
        started_at: milestoneData.started_at?.toDate(),
        rejected_at: milestoneData.rejected_at?.toDate()
      }
    });

  } catch (error) {
    console.error('Milestone fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch milestone' });
  }
});

// Helper function to check if user is team member
async function isTeamMember(teamId, userId) {
  const teamDoc = await admin.firestore()
    .collection('teams')
    .doc(teamId)
    .get();

  if (!teamDoc.exists) return false;

  const teamData = teamDoc.data();
  return teamData.member_ids && teamData.member_ids.includes(userId);
}

module.exports = router;
