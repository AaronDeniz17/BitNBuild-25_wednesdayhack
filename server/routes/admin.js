// Admin routes for GigCampus
// Handles admin functions, disputes, and moderation

const express = require('express');
const { admin } = require('../config/firebase');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

/**
 * GET /api/admin/dashboard
 * Get admin dashboard statistics
 */
router.get('/dashboard', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    // Get total users
    const usersSnapshot = await admin.firestore().collection('users').get();
    const totalUsers = usersSnapshot.size;

    // Get total projects
    const projectsSnapshot = await admin.firestore().collection('projects').get();
    const totalProjects = projectsSnapshot.size;

    // Get total contracts
    const contractsSnapshot = await admin.firestore().collection('contracts').get();
    const totalContracts = contractsSnapshot.size;

    // Get active disputes
    const disputesSnapshot = await admin.firestore()
      .collection('disputes')
      .where('status', '==', 'open')
      .get();
    const activeDisputes = disputesSnapshot.size;

    // Get total escrow amount
    const contracts = [];
    contractsSnapshot.forEach(doc => {
      contracts.push(doc.data());
    });
    const totalEscrow = contracts.reduce((sum, contract) => sum + (contract.escrow_balance || 0), 0);

    // Get recent activity
    const recentProjectsSnapshot = await admin.firestore()
      .collection('projects')
      .orderBy('created_at', 'desc')
      .limit(5)
      .get();

    const recentProjects = [];
    recentProjectsSnapshot.forEach(doc => {
      recentProjects.push({
        id: doc.id,
        ...doc.data(),
        created_at: doc.data().created_at?.toDate()
      });
    });

    res.json({
      stats: {
        total_users: totalUsers,
        total_projects: totalProjects,
        total_contracts: totalContracts,
        active_disputes: activeDisputes,
        total_escrow: totalEscrow
      },
      recent_activity: {
        projects: recentProjects
      }
    });

  } catch (error) {
    console.error('Admin dashboard error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
});

/**
 * GET /api/admin/disputes
 * Get all disputes
 */
router.get('/disputes', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;

    let query = admin.firestore().collection('disputes');

    if (status) {
      query = query.where('status', '==', status);
    }

    query = query.orderBy('created_at', 'desc');

    // Apply pagination
    const offset = (parseInt(page) - 1) * parseInt(limit);
    query = query.limit(parseInt(limit)).offset(offset);

    const snapshot = await query.get();
    const disputes = [];

    for (const doc of snapshot.docs) {
      const disputeData = doc.data();

      // Get contract information
      const contractDoc = await admin.firestore()
        .collection('contracts')
        .doc(disputeData.contract_id)
        .get();

      const contractData = contractDoc.exists ? contractDoc.data() : null;

      // Get initiator information
      const initiatorDoc = await admin.firestore()
        .collection('users')
        .doc(disputeData.initiator_id)
        .get();

      const initiatorData = initiatorDoc.exists ? initiatorDoc.data() : null;

      disputes.push({
        id: doc.id,
        ...disputeData,
        created_at: disputeData.created_at?.toDate(),
        resolved_at: disputeData.resolved_at?.toDate(),
        contract: contractData ? {
          id: contractData.id,
          total_amount: contractData.total_amount,
          escrow_balance: contractData.escrow_balance
        } : null,
        initiator: initiatorData ? {
          id: initiatorData.id,
          name: initiatorData.name,
          email: initiatorData.email
        } : null
      });
    }

    res.json({ disputes });

  } catch (error) {
    console.error('Disputes fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch disputes' });
  }
});

/**
 * GET /api/admin/disputes/:id
 * Get dispute details
 */
router.get('/disputes/:id', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const disputeId = req.params.id;

    const disputeDoc = await admin.firestore()
      .collection('disputes')
      .doc(disputeId)
      .get();

    if (!disputeDoc.exists) {
      return res.status(404).json({ error: 'Dispute not found' });
    }

    const disputeData = disputeDoc.data();

    // Get contract information
    const contractDoc = await admin.firestore()
      .collection('contracts')
      .doc(disputeData.contract_id)
      .get();

    const contractData = contractDoc.exists ? contractDoc.data() : null;

    // Get project information
    let projectData = null;
    if (contractData) {
      const projectDoc = await admin.firestore()
        .collection('projects')
        .doc(contractData.project_id)
        .get();

      projectData = projectDoc.exists ? projectDoc.data() : null;
    }

    // Get initiator information
    const initiatorDoc = await admin.firestore()
      .collection('users')
      .doc(disputeData.initiator_id)
      .get();

    const initiatorData = initiatorDoc.exists ? initiatorDoc.data() : null;

    // Get chat messages for context
    const chatSnapshot = await admin.firestore()
      .collection('chat_messages')
      .where('contract_id', '==', disputeData.contract_id)
      .orderBy('created_at', 'desc')
      .limit(50)
      .get();

    const chatMessages = [];
    chatSnapshot.forEach(doc => {
      chatMessages.push({
        id: doc.id,
        ...doc.data(),
        created_at: doc.data().created_at?.toDate()
      });
    });

    res.json({
      dispute: {
        id: disputeDoc.id,
        ...disputeData,
        created_at: disputeData.created_at?.toDate(),
        resolved_at: disputeData.resolved_at?.toDate()
      },
      contract: contractData,
      project: projectData,
      initiator: initiatorData,
      chat_messages: chatMessages
    });

  } catch (error) {
    console.error('Dispute fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch dispute' });
  }
});

/**
 * PUT /api/admin/disputes/:id/resolve
 * Resolve a dispute
 */
router.put('/disputes/:id/resolve', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const disputeId = req.params.id;
    const { resolution, refund_amount, winner_id } = req.body;

    if (!resolution) {
      return res.status(400).json({ error: 'Resolution is required' });
    }

    const disputeDoc = await admin.firestore()
      .collection('disputes')
      .doc(disputeId)
      .get();

    if (!disputeDoc.exists) {
      return res.status(404).json({ error: 'Dispute not found' });
    }

    const disputeData = disputeDoc.data();

    if (disputeData.status !== 'open') {
      return res.status(400).json({ error: 'Dispute is not open' });
    }

    // Start transaction
    const batch = admin.firestore().batch();

    // Update dispute status
    batch.update(disputeDoc.ref, {
      status: 'resolved',
      resolution,
      resolved_at: admin.firestore.FieldValue.serverTimestamp(),
      admin_id: req.user.id
    });

    // Update contract status
    const contractDoc = await admin.firestore()
      .collection('contracts')
      .doc(disputeData.contract_id)
      .get();

    if (contractDoc.exists) {
      const contractData = contractDoc.data();
      
      if (refund_amount && refund_amount > 0) {
        // Process refund
        const refundAmount = Math.min(refund_amount, contractData.escrow_balance);
        
        batch.update(contractDoc.ref, {
          escrow_balance: admin.firestore.FieldValue.increment(-refundAmount),
          status: 'cancelled'
        });

        // Create refund transaction
        const refundTransaction = {
          id: admin.firestore().collection('transactions').doc().id,
          contract_id: disputeData.contract_id,
          from_id: contractData.freelancer_id,
          to_id: contractData.client_id,
          amount: refundAmount,
          type: 'refund',
          status: 'completed',
          created_at: admin.firestore.FieldValue.serverTimestamp(),
          processed_at: admin.firestore.FieldValue.serverTimestamp(),
          description: `Dispute resolution refund of $${refundAmount}`,
          dispute_id: disputeId
        };

        const refundRef = admin.firestore().collection('transactions').doc(refundTransaction.id);
        batch.set(refundRef, refundTransaction);
      } else {
        // Release funds to winner
        batch.update(contractDoc.ref, {
          status: 'completed',
          escrow_balance: 0
        });
      }
    }

    // Commit transaction
    await batch.commit();

    res.json({ message: 'Dispute resolved successfully' });

  } catch (error) {
    console.error('Dispute resolution error:', error);
    res.status(500).json({ error: 'Failed to resolve dispute' });
  }
});

/**
 * GET /api/admin/users
 * Get all users with pagination
 */
router.get('/users', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { page = 1, limit = 20, role, search } = req.query;

    let query = admin.firestore().collection('users');

    if (role) {
      query = query.where('role', '==', role);
    }

    query = query.orderBy('created_at', 'desc');

    // Apply pagination
    const offset = (parseInt(page) - 1) * parseInt(limit);
    query = query.limit(parseInt(limit)).offset(offset);

    const snapshot = await query.get();
    const users = [];

    for (const doc of snapshot.docs) {
      const userData = doc.data();

      // Apply search filter if provided
      if (search) {
        const searchLower = search.toLowerCase();
        const matchesSearch = 
          userData.name.toLowerCase().includes(searchLower) ||
          userData.email.toLowerCase().includes(searchLower) ||
          (userData.university && userData.university.toLowerCase().includes(searchLower));
        
        if (!matchesSearch) continue;
      }

      // Get student profile if applicable
      let studentProfile = null;
      if (userData.role === 'student') {
        const studentDoc = await admin.firestore()
          .collection('student_profiles')
          .doc(userData.id)
          .get();

        if (studentDoc.exists) {
          studentProfile = studentDoc.data();
        }
      }

      users.push({
        id: doc.id,
        ...userData,
        created_at: userData.created_at?.toDate(),
        last_login: userData.last_login?.toDate(),
        studentProfile: studentProfile ? {
          skills: studentProfile.skills,
          reputation_score: studentProfile.reputation_score,
          completed_projects: studentProfile.completed_projects
        } : null
      });
    }

    res.json({ users });

  } catch (error) {
    console.error('Users fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

/**
 * PUT /api/admin/users/:id/status
 * Update user status (activate/deactivate)
 */
router.put('/users/:id/status', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const userId = req.params.id;
    const { is_active, reason } = req.body;

    if (typeof is_active !== 'boolean') {
      return res.status(400).json({ error: 'is_active must be a boolean' });
    }

    const userDoc = await admin.firestore()
      .collection('users')
      .doc(userId)
      .get();

    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Update user status
    await admin.firestore()
      .collection('users')
      .doc(userId)
      .update({
        is_active,
        status_updated_at: admin.firestore.FieldValue.serverTimestamp(),
        status_reason: reason || ''
      });

    res.json({ 
      message: `User ${is_active ? 'activated' : 'deactivated'} successfully` 
    });

  } catch (error) {
    console.error('User status update error:', error);
    res.status(500).json({ error: 'Failed to update user status' });
  }
});

/**
 * GET /api/admin/analytics
 * Get platform analytics
 */
router.get('/analytics', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { period = '30d' } = req.query;

    // Calculate date range
    const now = new Date();
    const startDate = new Date(now);
    
    switch (period) {
      case '7d':
        startDate.setDate(now.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(now.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(now.getDate() - 90);
        break;
      default:
        startDate.setDate(now.getDate() - 30);
    }

    // Get projects created in period
    const projectsSnapshot = await admin.firestore()
      .collection('projects')
      .where('created_at', '>=', admin.firestore.Timestamp.fromDate(startDate))
      .get();

    const projects = [];
    projectsSnapshot.forEach(doc => {
      projects.push(doc.data());
    });

    // Get contracts created in period
    const contractsSnapshot = await admin.firestore()
      .collection('contracts')
      .where('created_at', '>=', admin.firestore.Timestamp.fromDate(startDate))
      .get();

    const contracts = [];
    contractsSnapshot.forEach(doc => {
      contracts.push(doc.data());
    });

    // Calculate metrics
    const totalProjects = projects.length;
    const totalContracts = contracts.length;
    const totalRevenue = contracts.reduce((sum, contract) => sum + contract.total_amount, 0);
    const averageProjectValue = totalProjects > 0 ? totalRevenue / totalProjects : 0;
    const completionRate = totalContracts > 0 ? 
      (contracts.filter(c => c.status === 'completed').length / totalContracts) * 100 : 0;

    // Get category breakdown
    const categoryBreakdown = {};
    projects.forEach(project => {
      const category = project.category || 'general';
      categoryBreakdown[category] = (categoryBreakdown[category] || 0) + 1;
    });

    res.json({
      period,
      metrics: {
        total_projects: totalProjects,
        total_contracts: totalContracts,
        total_revenue: totalRevenue,
        average_project_value: Math.round(averageProjectValue * 100) / 100,
        completion_rate: Math.round(completionRate * 100) / 100
      },
      category_breakdown: categoryBreakdown
    });

  } catch (error) {
    console.error('Analytics fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

module.exports = router;
