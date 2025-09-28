// Admin routes for GigCampus
// Handles dispute resolution, transaction management, and platform administration

const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { admin, db } = require('../config/firebase');
const { auth } = require('../middleware/auth');
const EscrowService = require('../services/EscrowService');

const router = express.Router();

// Admin middleware
const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      error: 'Admin access required'
    });
  }
  next();
};

/**
 * GET /api/admin/dashboard
 * Get admin dashboard data
 */
router.get('/dashboard', auth, requireAdmin, async (req, res) => {
  try {
    // Get platform statistics
    const [
      usersSnapshot,
      projectsSnapshot,
      contractsSnapshot,
      disputesSnapshot,
      transactionsSnapshot
    ] = await Promise.all([
      db.collection('users').get(),
      db.collection('projects').get(),
      db.collection('contracts').get(),
      db.collection('disputes').get(),
      db.collection('transactions').get()
    ]);

    const stats = {
      total_users: usersSnapshot.size,
      total_projects: projectsSnapshot.size,
      active_contracts: contractsSnapshot.docs.filter(doc => doc.data().status === 'active').length,
      open_disputes: disputesSnapshot.docs.filter(doc => doc.data().status === 'open').length,
      total_transactions: transactionsSnapshot.size
    };

    // Get recent disputes
    const recentDisputes = disputesSnapshot.docs
      .filter(doc => doc.data().status === 'open')
      .slice(0, 5)
      .map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

    // Get recent transactions
    const recentTransactions = transactionsSnapshot.docs
      .sort((a, b) => b.data().created_at - a.data().created_at)
      .slice(0, 10)
      .map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

    res.json({
      success: true,
      data: {
        stats,
        recent_disputes: recentDisputes,
        recent_transactions: recentTransactions
      }
    });

  } catch (error) {
    console.error('Admin dashboard error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get dashboard data',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * GET /api/admin/disputes
 * Get all disputes with filtering
 */
router.get('/disputes', auth, requireAdmin, async (req, res) => {
  try {
    const { status = 'all', page = 1, limit = 20 } = req.query;

    let query = db.collection('disputes').orderBy('created_at', 'desc');

    if (status !== 'all') {
      query = query.where('status', '==', status);
    }

    const pageSize = Math.min(parseInt(limit), 50);
    const offset = (parseInt(page) - 1) * pageSize;
    
    query = query.limit(pageSize).offset(offset);

    const snapshot = await query.get();
    const disputes = await Promise.all(snapshot.docs.map(async (doc) => {
      const disputeData = doc.data();
      
      // Get project details
      const projectDoc = await db.collection('projects').doc(disputeData.project_id).get();
      const projectData = projectDoc.exists ? projectDoc.data() : null;

      // Get user details
      const userDoc = await db.collection('users').doc(disputeData.raised_by_id).get();
      const userData = userDoc.exists ? userDoc.data() : null;

      return {
        id: doc.id,
        ...disputeData,
        project: projectData ? {
          id: projectData.id,
          title: projectData.title,
          client_id: projectData.client_id
        } : null,
        raised_by: userData ? {
          id: userData.id,
          name: userData.name,
          email: userData.email
        } : null
      };
    }));

    res.json({
      success: true,
      data: disputes,
      pagination: {
        page: parseInt(page),
        limit: pageSize,
        total: disputes.length,
        pages: Math.ceil(disputes.length / pageSize)
      }
    });

  } catch (error) {
    console.error('Get disputes error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get disputes',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * PUT /api/admin/disputes/:id/resolve
 * Resolve a dispute
 */
router.put('/disputes/:id/resolve', auth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, resolution, action } = req.body;

    if (!['resolved', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid status',
        details: ['Status must be "resolved" or "rejected"']
      });
    }

    const disputeDoc = await db.collection('disputes').doc(id).get();
    
    if (!disputeDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Dispute not found'
      });
    }

    const disputeData = disputeDoc.data();

    if (disputeData.status !== 'open') {
      return res.status(400).json({
        success: false,
        error: 'Dispute is not open',
        details: [`Current status: ${disputeData.status}`]
      });
    }

    // Update dispute
    await db.collection('disputes').doc(id).update({
      status,
      resolution: resolution || '',
      resolved_at: admin.firestore.FieldValue.serverTimestamp(),
      resolved_by: req.user.id,
      admin_action: action || ''
    });

    // If dispute is resolved and action involves fund adjustment
    if (status === 'resolved' && action) {
      await handleDisputeResolution(disputeData, action, req.user.id);
    }

    res.json({
      success: true,
      message: `Dispute ${status} successfully`
    });

  } catch (error) {
    console.error('Resolve dispute error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to resolve dispute',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * GET /api/admin/transactions
 * Get transaction history with filtering
 */
router.get('/transactions', auth, requireAdmin, async (req, res) => {
  try {
    const { 
      project_id, 
      type, 
      status, 
      from_date, 
      to_date, 
      page = 1, 
      limit = 20 
    } = req.query;

    let query = db.collection('transactions').orderBy('created_at', 'desc');

    if (project_id) {
      query = query.where('project_id', '==', project_id);
    }

    if (type) {
      query = query.where('type', '==', type);
    }

    if (status) {
      query = query.where('status', '==', status);
    }

    const pageSize = Math.min(parseInt(limit), 50);
    const offset = (parseInt(page) - 1) * pageSize;
    
    query = query.limit(pageSize).offset(offset);

    const snapshot = await query.get();
    const transactions = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    res.json({
      success: true,
      data: transactions,
      pagination: {
        page: parseInt(page),
        limit: pageSize,
        total: transactions.length,
        pages: Math.ceil(transactions.length / pageSize)
      }
    });

  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get transactions',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * POST /api/admin/transactions/adjust
 * Adjust user/team balance (admin only)
 */
router.post('/transactions/adjust', auth, requireAdmin, async (req, res) => {
  try {
    const { to_type, to_id, amount, reason, project_id } = req.body;

    if (!to_type || !to_id || !amount || !reason) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        details: ['to_type, to_id, amount, and reason are required']
      });
    }

    if (!['user', 'team'].includes(to_type)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid to_type',
        details: ['to_type must be "user" or "team"']
      });
    }

    const transactionId = uuidv4();
    const adjustmentAmount = parseFloat(amount);

    // Use transaction for atomicity
    const result = await db.runTransaction(async (transaction) => {
      // Update balance
      if (to_type === 'user') {
        const userRef = db.collection('users').doc(to_id);
        transaction.update(userRef, {
          wallet_balance: admin.firestore.FieldValue.increment(adjustmentAmount)
        });
      } else {
        const teamRef = db.collection('teams').doc(to_id);
        transaction.update(teamRef, {
          team_wallet_balance: admin.firestore.FieldValue.increment(adjustmentAmount)
        });
      }

      // Create transaction record
      const transactionRef = db.collection('transactions').doc(transactionId);
      transaction.set(transactionRef, {
        id: transactionId,
        project_id: project_id || 'system',
        from_type: 'system',
        from_id: 'admin',
        to_type,
        to_id,
        amount: Math.abs(adjustmentAmount),
        currency: 'USD',
        type: 'adjustment',
        status: 'settled',
        metadata: {
          description: reason,
          adjusted_by: req.user.id,
          adjustment_type: adjustmentAmount > 0 ? 'credit' : 'debit'
        },
        created_at: admin.firestore.FieldValue.serverTimestamp()
      });

      return { transactionId, adjustmentAmount };
    });

    res.json({
      success: true,
      message: 'Balance adjusted successfully',
      data: {
        transaction_id: result.transactionId,
        adjustment_amount: result.adjustmentAmount,
        new_balance_type: to_type,
        new_balance_id: to_id
      }
    });

  } catch (error) {
    console.error('Adjust balance error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to adjust balance',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * GET /api/admin/users
 * Get all users with filtering
 */
router.get('/users', auth, requireAdmin, async (req, res) => {
  try {
    const { role, status, page = 1, limit = 20 } = req.query;

    let query = db.collection('users').orderBy('created_at', 'desc');

    if (role) {
      query = query.where('role', '==', role);
    }

    if (status) {
      query = query.where('is_active', '==', status === 'active');
    }

    const pageSize = Math.min(parseInt(limit), 50);
    const offset = (parseInt(page) - 1) * pageSize;
    
    query = query.limit(pageSize).offset(offset);

    const snapshot = await query.get();
    const users = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    res.json({
      success: true,
      data: users,
      pagination: {
        page: parseInt(page),
        limit: pageSize,
        total: users.length,
        pages: Math.ceil(users.length / pageSize)
      }
    });

  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get users',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * PUT /api/admin/users/:id/status
 * Update user status
 */
router.put('/users/:id/status', auth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { is_active, reason } = req.body;

    if (typeof is_active !== 'boolean') {
      return res.status(400).json({
        success: false,
        error: 'Invalid status',
        details: ['is_active must be a boolean']
      });
    }

    const userDoc = await db.collection('users').doc(id).get();
    
    if (!userDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    await db.collection('users').doc(id).update({
      is_active,
      status_updated_at: admin.firestore.FieldValue.serverTimestamp(),
      status_updated_by: req.user.id,
      status_reason: reason || ''
    });

    res.json({
      success: true,
      message: `User ${is_active ? 'activated' : 'deactivated'} successfully`
    });

  } catch (error) {
    console.error('Update user status error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update user status',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * Helper function to handle dispute resolution actions
 */
async function handleDisputeResolution(disputeData, action, adminId) {
  try {
    switch (action) {
      case 'refund_client':
        // Refund client for disputed amount
        // Implementation depends on specific dispute resolution logic
        break;
      case 'release_to_freelancer':
        // Release funds to freelancer
        // Implementation depends on specific dispute resolution logic
        break;
      case 'split_funds':
        // Split funds between client and freelancer
        // Implementation depends on specific dispute resolution logic
        break;
      default:
        console.log('No specific action required for dispute resolution');
    }
  } catch (error) {
    console.error('Handle dispute resolution error:', error);
  }
}

module.exports = router;