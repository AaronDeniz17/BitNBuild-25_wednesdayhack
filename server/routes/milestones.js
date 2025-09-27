// Milestones routes for GigCampus
// Handles milestone management, submissions, and approvals

const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { admin, db } = require('../config/firebase');
const { auth, userRateLimit } = require('../middleware/auth');

const router = express.Router();

// Milestone status constants
const MILESTONE_STATUS = {
  PENDING: 'pending',
  IN_PROGRESS: 'in_progress',
  SUBMITTED: 'submitted',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled'
};

/**
 * GET /api/milestones
 * Get milestones for user's contracts
 */
router.get('/', auth, async (req, res) => {
  try {
    const { contract_id, status, page = 1, limit = 20 } = req.query;

    let query = db.collection('milestones');

    if (contract_id) {
      query = query.where('contract_id', '==', contract_id);
    } else {
      // Get milestones for user's contracts
      const userContractsSnapshot = await db.collection('contracts')
        .where('participants', 'array-contains', req.user.id)
        .get();

      const contractIds = userContractsSnapshot.docs.map(doc => doc.id);
      
      if (contractIds.length === 0) {
        return res.json({
          success: true,
          data: []
        });
      }

      query = query.where('contract_id', 'in', contractIds);
    }

    if (status && status !== 'all') {
      query = query.where('status', '==', status);
    }

    query = query.orderBy('deadline', 'asc');

    const pageSize = Math.min(parseInt(limit), 50);
    const offset = (parseInt(page) - 1) * pageSize;
    
    query = query.limit(pageSize).offset(offset);

    const snapshot = await query.get();
    const milestones = [];

    for (const doc of snapshot.docs) {
      const milestoneData = doc.data();
      
      // Get contract info to determine user role
      const contractDoc = await db.collection('contracts').doc(milestoneData.contract_id).get();
      const contractData = contractDoc.exists ? contractDoc.data() : null;

      // Get project info
      const projectDoc = await db.collection('projects').doc(milestoneData.project_id).get();
      const projectData = projectDoc.exists ? projectDoc.data() : null;

      milestones.push({
        id: doc.id,
        ...milestoneData,
        contract: contractData ? {
          id: milestoneData.contract_id,
          status: contractData.status
        } : null,
        project: projectData ? {
          id: milestoneData.project_id,
          title: projectData.title
        } : null,
        user_role: contractData ? 
          (contractData.client_id === req.user.id ? 'client' : 'freelancer') : 
          null
      });
    }

    res.json({
      success: true,
      data: milestones
    });

  } catch (error) {
    console.error('Get milestones error:', error);
    res.status(500).json({ error: 'Failed to get milestones' });
  }
});

/**
 * GET /api/milestones/:id
 * Get specific milestone by ID
 */
router.get('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    
    const milestoneDoc = await db.collection('milestones').doc(id).get();
    
    if (!milestoneDoc.exists) {
      return res.status(404).json({ error: 'Milestone not found' });
    }

    const milestoneData = milestoneDoc.data();
    
    // Check access permissions via contract
    const contractDoc = await db.collection('contracts').doc(milestoneData.contract_id).get();
    
    if (!contractDoc.exists) {
      return res.status(404).json({ error: 'Associated contract not found' });
    }

    const contractData = contractDoc.data();
    
    const hasAccess = contractData.client_id === req.user.id || 
                     contractData.freelancer_id === req.user.id;
    
    if (!hasAccess) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Get project info
    const projectDoc = await db.collection('projects').doc(milestoneData.project_id).get();
    const projectData = projectDoc.exists ? projectDoc.data() : null;

    // Get submissions if any
    const submissionsSnapshot = await db.collection('milestone_submissions')
      .where('milestone_id', '==', id)
      .orderBy('created_at', 'desc')
      .get();

    const submissions = submissionsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    const milestone = {
      id,
      ...milestoneData,
      contract: {
        id: milestoneData.contract_id,
        status: contractData.status,
        client_id: contractData.client_id,
        freelancer_id: contractData.freelancer_id
      },
      project: projectData,
      submissions,
      user_role: contractData.client_id === req.user.id ? 'client' : 'freelancer'
    };

    res.json({
      success: true,
      data: milestone
    });

  } catch (error) {
    console.error('Get milestone error:', error);
    res.status(500).json({ error: 'Failed to get milestone' });
  }
});

/**
 * POST /api/milestones/:id/start
 * Start working on a milestone (freelancer only)
 */
router.post('/:id/start', auth, async (req, res) => {
  try {
    const { id } = req.params;
    
    const milestoneDoc = await db.collection('milestones').doc(id).get();
    
    if (!milestoneDoc.exists) {
      return res.status(404).json({ error: 'Milestone not found' });
    }

    const milestoneData = milestoneDoc.data();
    
    // Check if user is the freelancer
    const contractDoc = await db.collection('contracts').doc(milestoneData.contract_id).get();
    const contractData = contractDoc.data();
    
    if (contractData.freelancer_id !== req.user.id) {
      return res.status(403).json({ error: 'Only the freelancer can start milestones' });
    }

    // Check if milestone is pending
    if (milestoneData.status !== MILESTONE_STATUS.PENDING) {
      return res.status(400).json({ error: 'Milestone is not pending' });
    }

    await db.collection('milestones').doc(id).update({
      status: MILESTONE_STATUS.IN_PROGRESS,
      started_at: admin.firestore.FieldValue.serverTimestamp(),
      updated_at: admin.firestore.FieldValue.serverTimestamp()
    });

    res.json({
      success: true,
      message: 'Milestone started successfully'
    });

  } catch (error) {
    console.error('Start milestone error:', error);
    res.status(500).json({ error: 'Failed to start milestone' });
  }
});

/**
 * POST /api/milestones/:id/submit
 * Submit milestone work (freelancer only)
 */
router.post('/:id/submit', auth, userRateLimit(10, 60 * 60 * 1000), async (req, res) => {
  try {
    const { id } = req.params;
    const { description, deliverables, notes } = req.body;

    if (!description) {
      return res.status(400).json({ error: 'Description is required' });
    }
    
    const milestoneDoc = await db.collection('milestones').doc(id).get();
    
    if (!milestoneDoc.exists) {
      return res.status(404).json({ error: 'Milestone not found' });
    }

    const milestoneData = milestoneDoc.data();
    
    // Check if user is the freelancer
    const contractDoc = await db.collection('contracts').doc(milestoneData.contract_id).get();
    const contractData = contractDoc.data();
    
    if (contractData.freelancer_id !== req.user.id) {
      return res.status(403).json({ error: 'Only the freelancer can submit milestones' });
    }

    // Check if milestone is in progress
    if (milestoneData.status !== MILESTONE_STATUS.IN_PROGRESS) {
      return res.status(400).json({ error: 'Milestone must be in progress to submit' });
    }

    const submissionId = uuidv4();
    
    const submissionData = {
      id: submissionId,
      milestone_id: id,
      contract_id: milestoneData.contract_id,
      project_id: milestoneData.project_id,
      freelancer_id: req.user.id,
      description: description.trim(),
      deliverables: deliverables || [],
      notes: notes || '',
      status: 'pending_review',
      created_at: admin.firestore.FieldValue.serverTimestamp()
    };

    // Use transaction to ensure atomicity
    await db.runTransaction(async (transaction) => {
      // Create submission
      transaction.set(db.collection('milestone_submissions').doc(submissionId), submissionData);
      
      // Update milestone status
      transaction.update(db.collection('milestones').doc(id), {
        status: MILESTONE_STATUS.SUBMITTED,
        submitted_at: admin.firestore.FieldValue.serverTimestamp(),
        updated_at: admin.firestore.FieldValue.serverTimestamp()
      });
    });

    res.status(201).json({
      success: true,
      message: 'Milestone submitted successfully',
      data: { id: submissionId, ...submissionData }
    });

  } catch (error) {
    console.error('Submit milestone error:', error);
    res.status(500).json({ error: 'Failed to submit milestone' });
  }
});

/**
 * POST /api/milestones/:id/approve
 * Approve milestone submission (client only)
 */
router.post('/:id/approve', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { feedback, bonus } = req.body;
    
    const milestoneDoc = await db.collection('milestones').doc(id).get();
    
    if (!milestoneDoc.exists) {
      return res.status(404).json({ error: 'Milestone not found' });
    }

    const milestoneData = milestoneDoc.data();
    
    // Check if user is the client
    const contractDoc = await db.collection('contracts').doc(milestoneData.contract_id).get();
    const contractData = contractDoc.data();
    
    if (contractData.client_id !== req.user.id) {
      return res.status(403).json({ error: 'Only the client can approve milestones' });
    }

    // Check if milestone is submitted
    if (milestoneData.status !== MILESTONE_STATUS.SUBMITTED) {
      return res.status(400).json({ error: 'Milestone must be submitted to approve' });
    }

    const paymentAmount = milestoneData.amount + (bonus ? parseFloat(bonus) : 0);

    // Use transaction to ensure atomicity
    await db.runTransaction(async (transaction) => {
      // Update milestone status
      transaction.update(db.collection('milestones').doc(id), {
        status: MILESTONE_STATUS.APPROVED,
        approved_at: admin.firestore.FieldValue.serverTimestamp(),
        approval_feedback: feedback || '',
        bonus_amount: bonus ? parseFloat(bonus) : 0,
        updated_at: admin.firestore.FieldValue.serverTimestamp()
      });

      // Create payment transaction
      const transactionId = uuidv4();
      const transactionData = {
        id: transactionId,
        contract_id: milestoneData.contract_id,
        milestone_id: id,
        from_user_id: contractData.client_id,
        to_user_id: contractData.freelancer_id,
        amount: paymentAmount,
        type: 'milestone_payment',
        status: 'completed', // In real app, this would be 'pending' until payment processing
        description: `Payment for milestone: ${milestoneData.title}`,
        created_at: admin.firestore.FieldValue.serverTimestamp()
      };

      transaction.set(db.collection('transactions').doc(transactionId), transactionData);

      // Update latest submission status
      const submissionsSnapshot = await db.collection('milestone_submissions')
        .where('milestone_id', '==', id)
        .orderBy('created_at', 'desc')
        .limit(1)
        .get();

      if (!submissionsSnapshot.empty) {
        const latestSubmission = submissionsSnapshot.docs[0];
        transaction.update(latestSubmission.ref, {
          status: 'approved',
          approved_at: admin.firestore.FieldValue.serverTimestamp(),
          approval_feedback: feedback || ''
        });
      }
    });

    res.json({
      success: true,
      message: 'Milestone approved successfully',
      payment_amount: paymentAmount
    });

  } catch (error) {
    console.error('Approve milestone error:', error);
    res.status(500).json({ error: 'Failed to approve milestone' });
  }
});

/**
 * POST /api/milestones/:id/reject
 * Reject milestone submission (client only)
 */
router.post('/:id/reject', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { feedback, requested_changes } = req.body;

    if (!feedback) {
      return res.status(400).json({ error: 'Feedback is required when rejecting' });
    }
    
    const milestoneDoc = await db.collection('milestones').doc(id).get();
    
    if (!milestoneDoc.exists) {
      return res.status(404).json({ error: 'Milestone not found' });
    }

    const milestoneData = milestoneDoc.data();
    
    // Check if user is the client
    const contractDoc = await db.collection('contracts').doc(milestoneData.contract_id).get();
    const contractData = contractDoc.data();
    
    if (contractData.client_id !== req.user.id) {
      return res.status(403).json({ error: 'Only the client can reject milestones' });
    }

    // Check if milestone is submitted
    if (milestoneData.status !== MILESTONE_STATUS.SUBMITTED) {
      return res.status(400).json({ error: 'Milestone must be submitted to reject' });
    }

    // Use transaction to ensure atomicity
    await db.runTransaction(async (transaction) => {
      // Update milestone status back to in_progress
      transaction.update(db.collection('milestones').doc(id), {
        status: MILESTONE_STATUS.IN_PROGRESS,
        rejection_feedback: feedback.trim(),
        requested_changes: requested_changes || [],
        rejected_at: admin.firestore.FieldValue.serverTimestamp(),
        updated_at: admin.firestore.FieldValue.serverTimestamp()
      });

      // Update latest submission status
      const submissionsSnapshot = await db.collection('milestone_submissions')
        .where('milestone_id', '==', id)
        .orderBy('created_at', 'desc')
        .limit(1)
        .get();

      if (!submissionsSnapshot.empty) {
        const latestSubmission = submissionsSnapshot.docs[0];
        transaction.update(latestSubmission.ref, {
          status: 'rejected',
          rejected_at: admin.firestore.FieldValue.serverTimestamp(),
          rejection_feedback: feedback.trim(),
          requested_changes: requested_changes || []
        });
      }
    });

    res.json({
      success: true,
      message: 'Milestone rejected with feedback'
    });

  } catch (error) {
    console.error('Reject milestone error:', error);
    res.status(500).json({ error: 'Failed to reject milestone' });
  }
});

/**
 * PUT /api/milestones/:id
 * Update milestone details (client only, before work starts)
 */
router.put('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, amount, deadline } = req.body;
    
    const milestoneDoc = await db.collection('milestones').doc(id).get();
    
    if (!milestoneDoc.exists) {
      return res.status(404).json({ error: 'Milestone not found' });
    }

    const milestoneData = milestoneDoc.data();
    
    // Check if user is the client
    const contractDoc = await db.collection('contracts').doc(milestoneData.contract_id).get();
    const contractData = contractDoc.data();
    
    if (contractData.client_id !== req.user.id) {
      return res.status(403).json({ error: 'Only the client can update milestones' });
    }

    // Can only update pending milestones
    if (milestoneData.status !== MILESTONE_STATUS.PENDING) {
      return res.status(400).json({ error: 'Can only update pending milestones' });
    }

    const updates = {};
    
    if (title) updates.title = title.trim();
    if (description) updates.description = description.trim();
    if (amount) updates.amount = parseFloat(amount);
    if (deadline) updates.deadline = admin.firestore.Timestamp.fromDate(new Date(deadline));
    
    updates.updated_at = admin.firestore.FieldValue.serverTimestamp();

    await db.collection('milestones').doc(id).update(updates);

    // Get updated milestone
    const updatedMilestoneDoc = await db.collection('milestones').doc(id).get();

    res.json({
      success: true,
      message: 'Milestone updated successfully',
      data: { id, ...updatedMilestoneDoc.data() }
    });

  } catch (error) {
    console.error('Update milestone error:', error);
    res.status(500).json({ error: 'Failed to update milestone' });
  }
});

/**
 * DELETE /api/milestones/:id
 * Delete milestone (client only, before work starts)
 */
router.delete('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    
    const milestoneDoc = await db.collection('milestones').doc(id).get();
    
    if (!milestoneDoc.exists) {
      return res.status(404).json({ error: 'Milestone not found' });
    }

    const milestoneData = milestoneDoc.data();
    
    // Check if user is the client
    const contractDoc = await db.collection('contracts').doc(milestoneData.contract_id).get();
    const contractData = contractDoc.data();
    
    if (contractData.client_id !== req.user.id) {
      return res.status(403).json({ error: 'Only the client can delete milestones' });
    }

    // Can only delete pending milestones
    if (milestoneData.status !== MILESTONE_STATUS.PENDING) {
      return res.status(400).json({ error: 'Can only delete pending milestones' });
    }

    await db.collection('milestones').doc(id).delete();

    res.json({
      success: true,
      message: 'Milestone deleted successfully'
    });

  } catch (error) {
    console.error('Delete milestone error:', error);
    res.status(500).json({ error: 'Failed to delete milestone' });
  }
});

module.exports = router;