// Contracts routes for GigCampus
// Handles contract management, milestones, and payments

const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { admin, db } = require('../config/firebase');
const { auth, userRateLimit } = require('../middleware/auth');

const router = express.Router();

// Contract status constants
const CONTRACT_STATUS = {
  ACTIVE: 'active',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  DISPUTED: 'disputed'
};

/**
 * GET /api/contracts
 * Get user's contracts
 */
router.get('/', auth, async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;

    let query = db.collection('contracts')
      .where('participants', 'array-contains', req.user.id);

    if (status && status !== 'all') {
      query = query.where('status', '==', status);
    }

    query = query.orderBy('created_at', 'desc');

    const pageSize = Math.min(parseInt(limit), 50);
    const offset = (parseInt(page) - 1) * pageSize;
    
    query = query.limit(pageSize).offset(offset);

    const snapshot = await query.get();
    const contracts = [];

    for (const doc of snapshot.docs) {
      const contractData = doc.data();
      
      // Get project info
      const projectDoc = await db.collection('projects').doc(contractData.project_id).get();
      const projectData = projectDoc.exists ? projectDoc.data() : null;

      // Get other party info
      const otherPartyId = contractData.client_id === req.user.id ? 
        contractData.freelancer_id : contractData.client_id;
      
      const otherPartyDoc = await db.collection('users').doc(otherPartyId).get();
      const otherPartyData = otherPartyDoc.exists ? otherPartyDoc.data() : null;

      // Get milestones count
      const milestonesSnapshot = await db.collection('milestones')
        .where('contract_id', '==', doc.id)
        .get();

      contracts.push({
        id: doc.id,
        ...contractData,
        project: projectData ? {
          id: contractData.project_id,
          title: projectData.title,
          deadline: projectData.deadline
        } : null,
        other_party: otherPartyData ? {
          id: otherPartyData.id,
          name: otherPartyData.name,
          university: otherPartyData.university,
          university_verified: otherPartyData.university_verified
        } : null,
        milestones_count: milestonesSnapshot.size,
        user_role: contractData.client_id === req.user.id ? 'client' : 'freelancer'
      });
    }

    res.json({
      success: true,
      data: contracts
    });

  } catch (error) {
    console.error('Get contracts error:', error);
    res.status(500).json({ error: 'Failed to get contracts' });
  }
});

/**
 * GET /api/contracts/:id
 * Get specific contract by ID
 */
router.get('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    
    const contractDoc = await db.collection('contracts').doc(id).get();
    
    if (!contractDoc.exists) {
      return res.status(404).json({ error: 'Contract not found' });
    }

    const contractData = contractDoc.data();
    
    // Check access permissions
    const hasAccess = contractData.client_id === req.user.id || 
                     contractData.freelancer_id === req.user.id;
    
    if (!hasAccess) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Get project info
    const projectDoc = await db.collection('projects').doc(contractData.project_id).get();
    const projectData = projectDoc.exists ? projectDoc.data() : null;

    // Get client and freelancer info
    const clientDoc = await db.collection('users').doc(contractData.client_id).get();
    const freelancerDoc = await db.collection('users').doc(contractData.freelancer_id).get();
    
    const clientData = clientDoc.exists ? clientDoc.data() : null;
    const freelancerData = freelancerDoc.exists ? freelancerDoc.data() : null;

    // Get milestones
    const milestonesSnapshot = await db.collection('milestones')
      .where('contract_id', '==', id)
      .orderBy('order', 'asc')
      .get();

    const milestones = milestonesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Get transactions/payments
    const transactionsSnapshot = await db.collection('transactions')
      .where('contract_id', '==', id)
      .orderBy('created_at', 'desc')
      .get();

    const transactions = transactionsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    const contract = {
      id,
      ...contractData,
      project: projectData,
      client: clientData ? {
        id: clientData.id,
        name: clientData.name,
        university: clientData.university,
        university_verified: clientData.university_verified,
        average_rating: clientData.average_rating || 0
      } : null,
      freelancer: freelancerData ? {
        id: freelancerData.id,
        name: freelancerData.name,
        university: freelancerData.university,
        university_verified: freelancerData.university_verified,
        skills: freelancerData.skills || [],
        average_rating: freelancerData.average_rating || 0
      } : null,
      milestones,
      transactions,
      user_role: contractData.client_id === req.user.id ? 'client' : 'freelancer'
    };

    res.json({
      success: true,
      data: contract
    });

  } catch (error) {
    console.error('Get contract error:', error);
    res.status(500).json({ error: 'Failed to get contract' });
  }
});

/**
 * POST /api/contracts/:id/complete
 * Mark contract as completed
 */
router.post('/:id/complete', auth, async (req, res) => {
  try {
    const { id } = req.params;
    
    const contractDoc = await db.collection('contracts').doc(id).get();
    
    if (!contractDoc.exists) {
      return res.status(404).json({ error: 'Contract not found' });
    }

    const contractData = contractDoc.data();
    
    // Only client can mark contract as completed
    if (contractData.client_id !== req.user.id) {
      return res.status(403).json({ error: 'Only the client can mark contract as completed' });
    }

    // Check if contract is active
    if (contractData.status !== CONTRACT_STATUS.ACTIVE) {
      return res.status(400).json({ error: 'Contract is not active' });
    }

    // Check if all milestones are completed
    const pendingMilestonesSnapshot = await db.collection('milestones')
      .where('contract_id', '==', id)
      .where('status', '!=', 'completed')
      .get();

    if (!pendingMilestonesSnapshot.empty) {
      return res.status(400).json({ 
        error: 'All milestones must be completed before marking contract as complete' 
      });
    }

    // Use transaction to ensure atomicity
    await db.runTransaction(async (transaction) => {
      // Update contract status
      transaction.update(db.collection('contracts').doc(id), {
        status: CONTRACT_STATUS.COMPLETED,
        completed_at: admin.firestore.FieldValue.serverTimestamp(),
        updated_at: admin.firestore.FieldValue.serverTimestamp()
      });

      // Update project status
      transaction.update(db.collection('projects').doc(contractData.project_id), {
        status: 'completed',
        completed_at: admin.firestore.FieldValue.serverTimestamp(),
        updated_at: admin.firestore.FieldValue.serverTimestamp()
      });

      // Update user stats
      transaction.update(db.collection('users').doc(contractData.freelancer_id), {
        completed_projects: admin.firestore.FieldValue.increment(1),
        total_earnings: admin.firestore.FieldValue.increment(contractData.amount),
        updated_at: admin.firestore.FieldValue.serverTimestamp()
      });

      transaction.update(db.collection('users').doc(contractData.client_id), {
        projects_posted: admin.firestore.FieldValue.increment(1),
        updated_at: admin.firestore.FieldValue.serverTimestamp()
      });
    });

    res.json({
      success: true,
      message: 'Contract marked as completed successfully'
    });

  } catch (error) {
    console.error('Complete contract error:', error);
    res.status(500).json({ error: 'Failed to complete contract' });
  }
});

/**
 * POST /api/contracts/:id/cancel
 * Cancel contract
 */
router.post('/:id/cancel', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    
    const contractDoc = await db.collection('contracts').doc(id).get();
    
    if (!contractDoc.exists) {
      return res.status(404).json({ error: 'Contract not found' });
    }

    const contractData = contractDoc.data();
    
    // Check access permissions
    const hasAccess = contractData.client_id === req.user.id || 
                     contractData.freelancer_id === req.user.id;
    
    if (!hasAccess) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Check if contract can be cancelled
    if (contractData.status !== CONTRACT_STATUS.ACTIVE) {
      return res.status(400).json({ error: 'Contract cannot be cancelled' });
    }

    // Use transaction to ensure atomicity
    await db.runTransaction(async (transaction) => {
      // Update contract status
      transaction.update(db.collection('contracts').doc(id), {
        status: CONTRACT_STATUS.CANCELLED,
        cancelled_at: admin.firestore.FieldValue.serverTimestamp(),
        cancelled_by: req.user.id,
        cancellation_reason: reason || '',
        updated_at: admin.firestore.FieldValue.serverTimestamp()
      });

      // Update project status
      transaction.update(db.collection('projects').doc(contractData.project_id), {
        status: 'cancelled',
        cancelled_at: admin.firestore.FieldValue.serverTimestamp(),
        updated_at: admin.firestore.FieldValue.serverTimestamp()
      });

      // Cancel all pending milestones
      const pendingMilestonesSnapshot = await db.collection('milestones')
        .where('contract_id', '==', id)
        .where('status', '!=', 'completed')
        .get();

      pendingMilestonesSnapshot.docs.forEach(doc => {
        transaction.update(doc.ref, {
          status: 'cancelled',
          cancelled_at: admin.firestore.FieldValue.serverTimestamp()
        });
      });
    });

    res.json({
      success: true,
      message: 'Contract cancelled successfully'
    });

  } catch (error) {
    console.error('Cancel contract error:', error);
    res.status(500).json({ error: 'Failed to cancel contract' });
  }
});

/**
 * POST /api/contracts/:id/dispute
 * Create a dispute for contract
 */
router.post('/:id/dispute', auth, userRateLimit(3, 24 * 60 * 60 * 1000), async (req, res) => {
  try {
    const { id } = req.params;
    const { reason, description } = req.body;

    if (!reason || !description) {
      return res.status(400).json({ 
        error: 'Reason and description are required' 
      });
    }
    
    const contractDoc = await db.collection('contracts').doc(id).get();
    
    if (!contractDoc.exists) {
      return res.status(404).json({ error: 'Contract not found' });
    }

    const contractData = contractDoc.data();
    
    // Check access permissions
    const hasAccess = contractData.client_id === req.user.id || 
                     contractData.freelancer_id === req.user.id;
    
    if (!hasAccess) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Check if contract is active
    if (contractData.status !== CONTRACT_STATUS.ACTIVE) {
      return res.status(400).json({ error: 'Can only dispute active contracts' });
    }

    // Check if dispute already exists
    const existingDisputeSnapshot = await db.collection('disputes')
      .where('contract_id', '==', id)
      .where('status', 'in', ['open', 'investigating'])
      .get();

    if (!existingDisputeSnapshot.empty) {
      return res.status(400).json({ error: 'A dispute already exists for this contract' });
    }

    const disputeId = uuidv4();
    
    const disputeData = {
      id: disputeId,
      contract_id: id,
      project_id: contractData.project_id,
      initiated_by: req.user.id,
      client_id: contractData.client_id,
      freelancer_id: contractData.freelancer_id,
      reason,
      description: description.trim(),
      status: 'open',
      created_at: admin.firestore.FieldValue.serverTimestamp(),
      updated_at: admin.firestore.FieldValue.serverTimestamp()
    };

    // Use transaction to ensure atomicity
    await db.runTransaction(async (transaction) => {
      // Create dispute
      transaction.set(db.collection('disputes').doc(disputeId), disputeData);
      
      // Update contract status
      transaction.update(db.collection('contracts').doc(id), {
        status: CONTRACT_STATUS.DISPUTED,
        disputed_at: admin.firestore.FieldValue.serverTimestamp(),
        updated_at: admin.firestore.FieldValue.serverTimestamp()
      });
    });

    res.status(201).json({
      success: true,
      message: 'Dispute created successfully',
      data: { id: disputeId, ...disputeData }
    });

  } catch (error) {
    console.error('Create dispute error:', error);
    res.status(500).json({ error: 'Failed to create dispute' });
  }
});

module.exports = router;