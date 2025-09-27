// Contract routes for GigCampus
// Handles contract management and status updates

const express = require('express');
const { admin } = require('../config/firebase');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

/**
 * GET /api/contracts
 * Get contracts for current user
 */
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { status, type = 'all' } = req.query;
    const userId = req.user.id;

    let contracts = [];

    if (type === 'all' || type === 'client') {
      // Get contracts where user is client
      let clientQuery = admin.firestore()
        .collection('contracts')
        .where('client_id', '==', userId);

      if (status) {
        clientQuery = clientQuery.where('status', '==', status);
      }

      const clientSnapshot = await clientQuery.get();
      const clientContracts = [];

      for (const doc of clientSnapshot.docs) {
        const contractData = doc.data();
        const contractWithDetails = await enrichContractData(contractData, userId);
        clientContracts.push(contractWithDetails);
      }

      contracts = contracts.concat(clientContracts);
    }

    if (type === 'all' || type === 'freelancer') {
      // Get contracts where user is freelancer
      let freelancerQuery = admin.firestore()
        .collection('contracts')
        .where('freelancer_id', '==', userId);

      if (status) {
        freelancerQuery = freelancerQuery.where('status', '==', status);
      }

      const freelancerSnapshot = await freelancerQuery.get();
      const freelancerContracts = [];

      for (const doc of freelancerSnapshot.docs) {
        const contractData = doc.data();
        const contractWithDetails = await enrichContractData(contractData, userId);
        freelancerContracts.push(contractWithDetails);
      }

      contracts = contracts.concat(freelancerContracts);
    }

    // Remove duplicates if user is both client and freelancer
    const uniqueContracts = contracts.filter((contract, index, self) => 
      index === self.findIndex(c => c.id === contract.id)
    );

    res.json({ contracts: uniqueContracts });

  } catch (error) {
    console.error('Contracts fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch contracts' });
  }
});

/**
 * GET /api/contracts/:id
 * Get contract details by ID
 */
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const contractId = req.params.id;

    const contractDoc = await admin.firestore()
      .collection('contracts')
      .doc(contractId)
      .get();

    if (!contractDoc.exists) {
      return res.status(404).json({ error: 'Contract not found' });
    }

    const contractData = contractDoc.data();

    // Check if user has access to this contract
    const hasAccess = contractData.client_id === req.user.id || 
                     contractData.freelancer_id === req.user.id ||
                     (contractData.team_id && await isTeamMember(contractData.team_id, req.user.id));

    if (!hasAccess) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const contractWithDetails = await enrichContractData(contractData, req.user.id);

    res.json({ contract: contractWithDetails });

  } catch (error) {
    console.error('Contract fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch contract' });
  }
});

/**
 * PUT /api/contracts/:id/status
 * Update contract status
 */
router.put('/:id/status', authenticateToken, async (req, res) => {
  try {
    const contractId = req.params.id;
    const { status, reason } = req.body;

    if (!status) {
      return res.status(400).json({ error: 'Status is required' });
    }

    // Get contract
    const contractDoc = await admin.firestore()
      .collection('contracts')
      .doc(contractId)
      .get();

    if (!contractDoc.exists) {
      return res.status(404).json({ error: 'Contract not found' });
    }

    const contractData = contractDoc.data();

    // Check if user has permission to update status
    const canUpdate = contractData.client_id === req.user.id || 
                     contractData.freelancer_id === req.user.id ||
                     req.user.role === 'admin';

    if (!canUpdate) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Validate status transition
    const validTransitions = {
      'active': ['completed', 'disputed', 'cancelled'],
      'completed': [],
      'disputed': ['active', 'cancelled'],
      'cancelled': []
    };

    if (!validTransitions[contractData.status]?.includes(status)) {
      return res.status(400).json({ 
        error: `Invalid status transition from ${contractData.status} to ${status}` 
      });
    }

    // Update contract status
    const updateData = {
      status,
      updated_at: admin.firestore.FieldValue.serverTimestamp()
    };

    if (status === 'completed') {
      updateData.completed_at = admin.firestore.FieldValue.serverTimestamp();
    }

    if (status === 'disputed') {
      updateData.dispute_reason = reason || 'No reason provided';
      updateData.dispute_created_at = admin.firestore.FieldValue.serverTimestamp();
    }

    await admin.firestore()
      .collection('contracts')
      .doc(contractId)
      .update(updateData);

    res.json({ 
      message: 'Contract status updated successfully',
      new_status: status
    });

  } catch (error) {
    console.error('Contract status update error:', error);
    res.status(500).json({ error: 'Failed to update contract status' });
  }
});

/**
 * GET /api/contracts/:id/milestones
 * Get milestones for a contract
 */
router.get('/:id/milestones', authenticateToken, async (req, res) => {
  try {
    const contractId = req.params.id;

    // Check if user has access to contract
    const contractDoc = await admin.firestore()
      .collection('contracts')
      .doc(contractId)
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

    // Get milestones
    const milestonesSnapshot = await admin.firestore()
      .collection('milestones')
      .where('contract_id', '==', contractId)
      .orderBy('created_at', 'asc')
      .get();

    const milestones = [];
    milestonesSnapshot.forEach(doc => {
      milestones.push({
        id: doc.id,
        ...doc.data(),
        due_date: doc.data().due_date?.toDate(),
        submitted_at: doc.data().submitted_at?.toDate(),
        approved_at: doc.data().approved_at?.toDate()
      });
    });

    res.json({ milestones });

  } catch (error) {
    console.error('Milestones fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch milestones' });
  }
});

/**
 * GET /api/contracts/:id/tasks
 * Get tasks for a contract
 */
router.get('/:id/tasks', authenticateToken, async (req, res) => {
  try {
    const contractId = req.params.id;

    // Check if user has access to contract
    const contractDoc = await admin.firestore()
      .collection('contracts')
      .doc(contractId)
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

    // Get tasks
    const tasksSnapshot = await admin.firestore()
      .collection('tasks')
      .where('contract_id', '==', contractId)
      .orderBy('created_at', 'asc')
      .get();

    const tasks = [];
    tasksSnapshot.forEach(doc => {
      tasks.push({
        id: doc.id,
        ...doc.data(),
        created_at: doc.data().created_at?.toDate(),
        due_date: doc.data().due_date?.toDate(),
        completed_at: doc.data().completed_at?.toDate()
      });
    });

    res.json({ tasks });

  } catch (error) {
    console.error('Tasks fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

// Helper function to enrich contract data with related information
async function enrichContractData(contractData, userId) {
  try {
    // Get project information
    const projectDoc = await admin.firestore()
      .collection('projects')
      .doc(contractData.project_id)
      .get();

    const projectData = projectDoc.exists ? projectDoc.data() : null;

    // Get client information
    const clientDoc = await admin.firestore()
      .collection('users')
      .doc(contractData.client_id)
      .get();

    const clientData = clientDoc.exists ? clientDoc.data() : null;

    // Get freelancer information
    const freelancerDoc = await admin.firestore()
      .collection('users')
      .doc(contractData.freelancer_id)
      .get();

    const freelancerData = freelancerDoc.exists ? freelancerDoc.data() : null;

    // Get team information if applicable
    let teamData = null;
    if (contractData.team_id) {
      const teamDoc = await admin.firestore()
        .collection('teams')
        .doc(contractData.team_id)
        .get();

      teamData = teamDoc.exists ? teamDoc.data() : null;
    }

    return {
      id: contractData.id,
      ...contractData,
      created_at: contractData.created_at?.toDate(),
      started_at: contractData.started_at?.toDate(),
      completed_at: contractData.completed_at?.toDate(),
      project: projectData ? {
        id: projectData.id,
        title: projectData.title,
        description: projectData.description,
        budget: projectData.budget,
        deadline: projectData.deadline?.toDate()
      } : null,
      client: clientData ? {
        id: clientData.id,
        name: clientData.name,
        email: clientData.email
      } : null,
      freelancer: freelancerData ? {
        id: freelancerData.id,
        name: freelancerData.name,
        email: freelancerData.email
      } : null,
      team: teamData ? {
        id: teamData.id,
        name: teamData.name,
        member_count: teamData.member_ids?.length || 0
      } : null
    };

  } catch (error) {
    console.error('Contract enrichment error:', error);
    return contractData;
  }
}

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
