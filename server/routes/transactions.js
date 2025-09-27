// Transactions routes for GigCampus
// Handles payment transactions, earnings, and financial history

const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { admin, db } = require('../config/firebase');
const { auth, userRateLimit } = require('../middleware/auth');

const router = express.Router();

// Transaction status constants
const TRANSACTION_STATUS = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  FAILED: 'failed',
  CANCELLED: 'cancelled',
  REFUNDED: 'refunded'
};

// Transaction type constants
const TRANSACTION_TYPES = {
  MILESTONE_PAYMENT: 'milestone_payment',
  PROJECT_PAYMENT: 'project_payment',
  DEPOSIT: 'deposit',
  WITHDRAWAL: 'withdrawal',
  REFUND: 'refund',
  FEE: 'platform_fee',
  BONUS: 'bonus'
};

/**
 * GET /api/transactions
 * Get user's transaction history
 */
router.get('/', auth, async (req, res) => {
  try {
    const { type, status, project_id, page = 1, limit = 20 } = req.query;

    let query = db.collection('transactions');

    // Filter by user involvement (either sender or receiver)
    const userTransactionsQuery1 = db.collection('transactions')
      .where('from_user_id', '==', req.user.id);
    
    const userTransactionsQuery2 = db.collection('transactions')
      .where('to_user_id', '==', req.user.id);

    // Execute both queries
    const [fromTransactions, toTransactions] = await Promise.all([
      userTransactionsQuery1.get(),
      userTransactionsQuery2.get()
    ]);

    // Combine and deduplicate results
    const allTransactionDocs = new Map();
    
    fromTransactions.docs.forEach(doc => {
      allTransactionDocs.set(doc.id, doc);
    });
    
    toTransactions.docs.forEach(doc => {
      allTransactionDocs.set(doc.id, doc);
    });

    let transactions = Array.from(allTransactionDocs.values()).map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Apply filters
    if (type && Object.values(TRANSACTION_TYPES).includes(type)) {
      transactions = transactions.filter(t => t.type === type);
    }

    if (status && Object.values(TRANSACTION_STATUS).includes(status)) {
      transactions = transactions.filter(t => t.status === status);
    }

    if (project_id) {
      transactions = transactions.filter(t => t.project_id === project_id);
    }

    // Sort by creation date (newest first)
    transactions.sort((a, b) => {
      const aTime = a.created_at?.toMillis() || 0;
      const bTime = b.created_at?.toMillis() || 0;
      return bTime - aTime;
    });

    // Pagination
    const pageSize = Math.min(parseInt(limit), 50);
    const offset = (parseInt(page) - 1) * pageSize;
    const paginatedTransactions = transactions.slice(offset, offset + pageSize);

    // Enrich with additional data
    const enrichedTransactions = await Promise.all(
      paginatedTransactions.map(async (transaction) => {
        // Get other user info
        const otherUserId = transaction.from_user_id === req.user.id ? 
          transaction.to_user_id : transaction.from_user_id;
        
        let otherUser = null;
        if (otherUserId) {
          const otherUserDoc = await db.collection('users').doc(otherUserId).get();
          if (otherUserDoc.exists) {
            const userData = otherUserDoc.data();
            otherUser = {
              id: otherUserId,
              name: userData.display_name,
              university: userData.university
            };
          }
        }

        // Get project info
        let project = null;
        if (transaction.project_id) {
          const projectDoc = await db.collection('projects').doc(transaction.project_id).get();
          if (projectDoc.exists) {
            const projectData = projectDoc.data();
            project = {
              id: transaction.project_id,
              title: projectData.title
            };
          }
        }

        return {
          ...transaction,
          direction: transaction.from_user_id === req.user.id ? 'outgoing' : 'incoming',
          other_user: otherUser,
          project
        };
      })
    );

    res.json({
      success: true,
      data: enrichedTransactions,
      pagination: {
        page: parseInt(page),
        limit: pageSize,
        total: transactions.length
      }
    });

  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({ error: 'Failed to get transactions' });
  }
});

/**
 * GET /api/transactions/:id
 * Get specific transaction details
 */
router.get('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    
    const transactionDoc = await db.collection('transactions').doc(id).get();
    
    if (!transactionDoc.exists) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    const transactionData = transactionDoc.data();
    
    // Check if user has access to this transaction
    const hasAccess = transactionData.from_user_id === req.user.id || 
                     transactionData.to_user_id === req.user.id ||
                     req.user.role === 'admin';
    
    if (!hasAccess) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Get additional info
    const [fromUserDoc, toUserDoc, projectDoc, contractDoc, milestoneDoc] = await Promise.all([
      transactionData.from_user_id ? db.collection('users').doc(transactionData.from_user_id).get() : null,
      transactionData.to_user_id ? db.collection('users').doc(transactionData.to_user_id).get() : null,
      transactionData.project_id ? db.collection('projects').doc(transactionData.project_id).get() : null,
      transactionData.contract_id ? db.collection('contracts').doc(transactionData.contract_id).get() : null,
      transactionData.milestone_id ? db.collection('milestones').doc(transactionData.milestone_id).get() : null
    ]);

    const transaction = {
      id,
      ...transactionData,
      from_user: fromUserDoc?.exists ? {
        id: transactionData.from_user_id,
        name: fromUserDoc.data().display_name,
        university: fromUserDoc.data().university
      } : null,
      to_user: toUserDoc?.exists ? {
        id: transactionData.to_user_id,
        name: toUserDoc.data().display_name,
        university: toUserDoc.data().university
      } : null,
      project: projectDoc?.exists ? {
        id: transactionData.project_id,
        title: projectDoc.data().title
      } : null,
      contract: contractDoc?.exists ? {
        id: transactionData.contract_id,
        status: contractDoc.data().status
      } : null,
      milestone: milestoneDoc?.exists ? {
        id: transactionData.milestone_id,
        title: milestoneDoc.data().title
      } : null,
      direction: transactionData.from_user_id === req.user.id ? 'outgoing' : 'incoming'
    };

    res.json({
      success: true,
      data: transaction
    });

  } catch (error) {
    console.error('Get transaction error:', error);
    res.status(500).json({ error: 'Failed to get transaction' });
  }
});

/**
 * GET /api/transactions/stats/summary
 * Get user's financial summary
 */
router.get('/stats/summary', auth, async (req, res) => {
  try {
    const { period = '30d' } = req.query;

    // Calculate date range
    let startDate = new Date();
    switch (period) {
      case '7d':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(startDate.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(startDate.getDate() - 90);
        break;
      case '1y':
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
      default:
        startDate.setDate(startDate.getDate() - 30);
    }

    // Get transactions in the period
    const [incomingQuery, outgoingQuery] = await Promise.all([
      db.collection('transactions')
        .where('to_user_id', '==', req.user.id)
        .where('status', '==', TRANSACTION_STATUS.COMPLETED)
        .where('created_at', '>=', admin.firestore.Timestamp.fromDate(startDate))
        .get(),
      db.collection('transactions')
        .where('from_user_id', '==', req.user.id)
        .where('status', '==', TRANSACTION_STATUS.COMPLETED)
        .where('created_at', '>=', admin.firestore.Timestamp.fromDate(startDate))
        .get()
    ]);

    const incomingTransactions = incomingQuery.docs.map(doc => doc.data());
    const outgoingTransactions = outgoingQuery.docs.map(doc => doc.data());

    // Calculate totals
    const totalEarnings = incomingTransactions
      .filter(t => [TRANSACTION_TYPES.MILESTONE_PAYMENT, TRANSACTION_TYPES.PROJECT_PAYMENT, TRANSACTION_TYPES.BONUS].includes(t.type))
      .reduce((sum, t) => sum + (t.amount || 0), 0);

    const totalSpent = outgoingTransactions
      .filter(t => [TRANSACTION_TYPES.MILESTONE_PAYMENT, TRANSACTION_TYPES.PROJECT_PAYMENT].includes(t.type))
      .reduce((sum, t) => sum + (t.amount || 0), 0);

    const platformFees = outgoingTransactions
      .filter(t => t.type === TRANSACTION_TYPES.FEE)
      .reduce((sum, t) => sum + (t.amount || 0), 0);

    // Get pending transactions
    const pendingQuery = await db.collection('transactions')
      .where('from_user_id', '==', req.user.id)
      .where('status', '==', TRANSACTION_STATUS.PENDING)
      .get();

    const pendingAmount = pendingQuery.docs
      .map(doc => doc.data())
      .reduce((sum, t) => sum + (t.amount || 0), 0);

    // Calculate earnings by type
    const earningsByType = {};
    Object.values(TRANSACTION_TYPES).forEach(type => {
      earningsByType[type] = incomingTransactions
        .filter(t => t.type === type)
        .reduce((sum, t) => sum + (t.amount || 0), 0);
    });

    // Get recent transactions
    const recentTransactions = [...incomingTransactions, ...outgoingTransactions]
      .sort((a, b) => b.created_at.toMillis() - a.created_at.toMillis())
      .slice(0, 5)
      .map(t => ({
        id: t.id,
        type: t.type,
        amount: t.amount,
        description: t.description,
        created_at: t.created_at,
        direction: t.from_user_id === req.user.id ? 'outgoing' : 'incoming'
      }));

    res.json({
      success: true,
      data: {
        period,
        total_earnings: Math.round(totalEarnings * 100) / 100,
        total_spent: Math.round(totalSpent * 100) / 100,
        platform_fees: Math.round(platformFees * 100) / 100,
        pending_amount: Math.round(pendingAmount * 100) / 100,
        net_earnings: Math.round((totalEarnings - totalSpent - platformFees) * 100) / 100,
        earnings_by_type: earningsByType,
        recent_transactions: recentTransactions
      }
    });

  } catch (error) {
    console.error('Get transaction stats error:', error);
    res.status(500).json({ error: 'Failed to get transaction statistics' });
  }
});

/**
 * POST /api/transactions/withdraw
 * Request withdrawal of earnings
 */
router.post('/withdraw', auth, userRateLimit(3, 60 * 60 * 1000), async (req, res) => {
  try {
    const { amount, method, account_details } = req.body;

    // Validation
    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Valid amount is required' });
    }

    if (!method || !account_details) {
      return res.status(400).json({ error: 'Withdrawal method and account details are required' });
    }

    const withdrawalAmount = parseFloat(amount);
    const minimumWithdrawal = 10; // $10 minimum

    if (withdrawalAmount < minimumWithdrawal) {
      return res.status(400).json({ error: `Minimum withdrawal amount is $${minimumWithdrawal}` });
    }

    // Check user's available balance
    const userDoc = await db.collection('users').doc(req.user.id).get();
    const userData = userDoc.data();
    const availableBalance = userData.available_balance || 0;

    if (withdrawalAmount > availableBalance) {
      return res.status(400).json({ error: 'Insufficient balance' });
    }

    // Check for pending withdrawals
    const pendingWithdrawalsSnapshot = await db.collection('transactions')
      .where('from_user_id', '==', req.user.id)
      .where('type', '==', TRANSACTION_TYPES.WITHDRAWAL)
      .where('status', 'in', [TRANSACTION_STATUS.PENDING, TRANSACTION_STATUS.PROCESSING])
      .get();

    if (!pendingWithdrawalsSnapshot.empty) {
      return res.status(400).json({ error: 'You have a pending withdrawal request' });
    }

    const transactionId = uuidv4();
    
    const transactionData = {
      id: transactionId,
      from_user_id: req.user.id,
      to_user_id: null, // Platform withdrawal
      amount: withdrawalAmount,
      type: TRANSACTION_TYPES.WITHDRAWAL,
      status: TRANSACTION_STATUS.PENDING,
      description: `Withdrawal request - ${method}`,
      withdrawal_method: method,
      account_details: account_details, // In real app, this should be encrypted
      created_at: admin.firestore.FieldValue.serverTimestamp(),
      processed_at: null
    };

    // Create withdrawal request and update user balance
    await db.runTransaction(async (transaction) => {
      // Create withdrawal transaction
      transaction.set(db.collection('transactions').doc(transactionId), transactionData);
      
      // Update user's available balance
      transaction.update(db.collection('users').doc(req.user.id), {
        available_balance: availableBalance - withdrawalAmount,
        pending_withdrawals: admin.firestore.FieldValue.increment(withdrawalAmount),
        updated_at: admin.firestore.FieldValue.serverTimestamp()
      });
    });

    res.status(201).json({
      success: true,
      message: 'Withdrawal request submitted successfully',
      data: { id: transactionId, ...transactionData }
    });

  } catch (error) {
    console.error('Withdrawal request error:', error);
    res.status(500).json({ error: 'Failed to process withdrawal request' });
  }
});

/**
 * GET /api/transactions/withdraw/methods
 * Get available withdrawal methods
 */
router.get('/withdraw/methods', auth, async (req, res) => {
  try {
    const methods = [
      {
        id: 'paypal',
        name: 'PayPal',
        description: 'Withdraw to your PayPal account',
        processing_time: '1-2 business days',
        minimum_amount: 10,
        fee_percentage: 0,
        required_fields: ['email']
      },
      {
        id: 'bank_transfer',
        name: 'Bank Transfer',
        description: 'Direct deposit to your bank account',
        processing_time: '3-5 business days',
        minimum_amount: 25,
        fee_percentage: 0,
        required_fields: ['account_number', 'routing_number', 'account_holder_name']
      },
      {
        id: 'stripe',
        name: 'Stripe Connect',
        description: 'Instant transfer via Stripe',
        processing_time: 'Instant',
        minimum_amount: 5,
        fee_percentage: 2.9,
        required_fields: ['stripe_account_id']
      }
    ];

    res.json({
      success: true,
      data: methods
    });

  } catch (error) {
    console.error('Get withdrawal methods error:', error);
    res.status(500).json({ error: 'Failed to get withdrawal methods' });
  }
});

/**
 * PUT /api/transactions/:id/cancel
 * Cancel a pending transaction (user or admin)
 */
router.put('/:id/cancel', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    
    const transactionDoc = await db.collection('transactions').doc(id).get();
    
    if (!transactionDoc.exists) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    const transactionData = transactionDoc.data();
    
    // Check permissions
    const canCancel = transactionData.from_user_id === req.user.id || 
                     req.user.role === 'admin';
    
    if (!canCancel) {
      return res.status(403).json({ error: 'You can only cancel your own transactions' });
    }

    // Can only cancel pending transactions
    if (transactionData.status !== TRANSACTION_STATUS.PENDING) {
      return res.status(400).json({ error: 'Can only cancel pending transactions' });
    }

    await db.runTransaction(async (transaction) => {
      // Update transaction status
      transaction.update(db.collection('transactions').doc(id), {
        status: TRANSACTION_STATUS.CANCELLED,
        cancelled_at: admin.firestore.FieldValue.serverTimestamp(),
        cancellation_reason: reason || 'Cancelled by user',
        updated_at: admin.firestore.FieldValue.serverTimestamp()
      });

      // If withdrawal, restore user balance
      if (transactionData.type === TRANSACTION_TYPES.WITHDRAWAL) {
        const userDoc = await transaction.get(db.collection('users').doc(transactionData.from_user_id));
        if (userDoc.exists) {
          const userData = userDoc.data();
          transaction.update(db.collection('users').doc(transactionData.from_user_id), {
            available_balance: (userData.available_balance || 0) + transactionData.amount,
            pending_withdrawals: admin.firestore.FieldValue.increment(-transactionData.amount),
            updated_at: admin.firestore.FieldValue.serverTimestamp()
          });
        }
      }
    });

    res.json({
      success: true,
      message: 'Transaction cancelled successfully'
    });

  } catch (error) {
    console.error('Cancel transaction error:', error);
    res.status(500).json({ error: 'Failed to cancel transaction' });
  }
});

module.exports = router;