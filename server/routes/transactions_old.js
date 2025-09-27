// Transaction and Escrow routes for GigCampus
// Handles simulated escrow payments, deposits, and releases

const express = require('express');
const { admin } = require('../config/firebase');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { notificationHandlers } = require('../utils/notifications');

const router = express.Router();

/**
 * POST /api/transactions/escrow/deposit
 * Deposit funds into escrow (clients only)
 */
router.post('/escrow/deposit', authenticateToken, requireRole(['client']), async (req, res) => {
  try {
    const { contract_id, amount } = req.body;

    if (!contract_id || !amount || amount <= 0) {
      return res.status(400).json({ error: 'Invalid contract ID or amount' });
    }

    // Get contract
    const contractDoc = await admin.firestore()
      .collection('contracts')
      .doc(contract_id)
      .get();

    if (!contractDoc.exists) {
      return res.status(404).json({ error: 'Contract not found' });
    }

    const contractData = contractDoc.data();

    // Check if user owns the contract
    if (contractData.client_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Check if contract is active
    if (contractData.status !== 'active') {
      return res.status(400).json({ error: 'Contract is not active' });
    }

    // Validate amount doesn't exceed total contract amount
    if (amount > contractData.total_amount) {
      return res.status(400).json({ error: 'Amount exceeds contract total' });
    }

    // Start transaction
    const batch = admin.firestore().batch();

    // Update contract escrow balance
    batch.update(contractDoc.ref, {
      escrow_balance: admin.firestore.FieldValue.increment(amount),
      updated_at: admin.firestore.FieldValue.serverTimestamp()
    });

    // Create transaction record
    const transactionData = {
      id: admin.firestore().collection('transactions').doc().id,
      contract_id,
      from_id: req.user.id,
      to_id: contractData.freelancer_id,
      amount: parseFloat(amount),
      type: 'escrow_deposit',
      status: 'completed',
      created_at: admin.firestore.FieldValue.serverTimestamp(),
      processed_at: admin.firestore.FieldValue.serverTimestamp(),
      description: `Escrow deposit of $${amount} for contract ${contract_id}`
    };

    const transactionRef = admin.firestore().collection('transactions').doc(transactionData.id);
    batch.set(transactionRef, transactionData);

    // Commit transaction
    await batch.commit();

    res.json({
      message: 'Funds deposited successfully',
      transaction: transactionData,
      new_escrow_balance: contractData.escrow_balance + amount
    });

  } catch (error) {
    console.error('Escrow deposit error:', error);
    res.status(500).json({ error: 'Failed to deposit funds' });
  }
});

/**
 * POST /api/transactions/escrow/release
 * Release funds from escrow (clients only)
 */
router.post('/escrow/release', authenticateToken, requireRole(['client']), async (req, res) => {
  try {
    const { contract_id, milestone_id, amount, reason } = req.body;

    if (!contract_id || !amount || amount <= 0) {
      return res.status(400).json({ error: 'Invalid contract ID or amount' });
    }

    // Get contract
    const contractDoc = await admin.firestore()
      .collection('contracts')
      .doc(contract_id)
      .get();

    if (!contractDoc.exists) {
      return res.status(404).json({ error: 'Contract not found' });
    }

    const contractData = contractDoc.data();

    // Check if user owns the contract
    if (contractData.client_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Check if contract is active
    if (contractData.status !== 'active') {
      return res.status(400).json({ error: 'Contract is not active' });
    }

    // Check if sufficient escrow balance
    if (amount > contractData.escrow_balance) {
      return res.status(400).json({ error: 'Insufficient escrow balance' });
    }

    // Start transaction
    const batch = admin.firestore().batch();

    // Update contract escrow balance
    batch.update(contractDoc.ref, {
      escrow_balance: admin.firestore.FieldValue.increment(-amount),
      updated_at: admin.firestore.FieldValue.serverTimestamp()
    });

    // Create transaction record
    const transactionData = {
      id: admin.firestore().collection('transactions').doc().id,
      contract_id,
      from_id: req.user.id,
      to_id: contractData.freelancer_id,
      amount: parseFloat(amount),
      type: 'milestone_payment',
      status: 'completed',
      created_at: admin.firestore.FieldValue.serverTimestamp(),
      processed_at: admin.firestore.FieldValue.serverTimestamp(),
      description: reason || `Milestone payment of $${amount}`,
      milestone_id: milestone_id || null
    };

    const transactionRef = admin.firestore().collection('transactions').doc(transactionData.id);
    batch.set(transactionRef, transactionData);

    // Update freelancer wallet (simulated)
    if (contractData.team_id) {
      // Handle team payment split
      await handleTeamPaymentSplit(contractData.team_id, amount, batch);
    } else {
      // Individual freelancer payment
      await updateFreelancerWallet(contractData.freelancer_id, amount, batch);
    }

    // Update milestone status if milestone_id provided
    if (milestone_id) {
      const milestoneDoc = await admin.firestore()
        .collection('milestones')
        .doc(milestone_id)
        .get();

      if (milestoneDoc.exists) {
        batch.update(milestoneDoc.ref, {
          status: 'approved',
          approved_at: admin.firestore.FieldValue.serverTimestamp()
        });
      }
    }

    // Commit transaction
    await batch.commit();

    // Send payment notification to freelancer
    try {
      const recipientId = contractData.team_id || contractData.freelancer_id;
      await notificationHandlers.paymentReceived(transactionData.id, recipientId, amount);
    } catch (notificationError) {
      console.error('Failed to send payment notification:', notificationError);
    }

    res.json({
      message: 'Funds released successfully',
      transaction: transactionData,
      new_escrow_balance: contractData.escrow_balance - amount
    });

  } catch (error) {
    console.error('Escrow release error:', error);
    res.status(500).json({ error: 'Failed to release funds' });
  }
});

/**
 * POST /api/transactions/escrow/partial-release
 * Release partial funds based on completion percentage
 */
router.post('/escrow/partial-release', authenticateToken, requireRole(['client']), async (req, res) => {
  try {
    const { contract_id, completion_percentage } = req.body;

    if (!contract_id || !completion_percentage || completion_percentage <= 0 || completion_percentage > 100) {
      return res.status(400).json({ error: 'Invalid contract ID or completion percentage' });
    }

    // Get contract
    const contractDoc = await admin.firestore()
      .collection('contracts')
      .doc(contract_id)
      .get();

    if (!contractDoc.exists) {
      return res.status(404).json({ error: 'Contract not found' });
    }

    const contractData = contractDoc.data();

    // Check if user owns the contract
    if (contractData.client_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Calculate partial amount
    const partialAmount = (contractData.total_amount * completion_percentage) / 100;
    const availableAmount = Math.min(partialAmount, contractData.escrow_balance);

    if (availableAmount <= 0) {
      return res.status(400).json({ error: 'No funds available for release' });
    }

    // Start transaction
    const batch = admin.firestore().batch();

    // Update contract escrow balance
    batch.update(contractDoc.ref, {
      escrow_balance: admin.firestore.FieldValue.increment(-availableAmount),
      updated_at: admin.firestore.FieldValue.serverTimestamp()
    });

    // Create transaction record
    const transactionData = {
      id: admin.firestore().collection('transactions').doc().id,
      contract_id,
      from_id: req.user.id,
      to_id: contractData.freelancer_id,
      amount: availableAmount,
      type: 'milestone_payment',
      status: 'completed',
      created_at: admin.firestore.FieldValue.serverTimestamp(),
      processed_at: admin.firestore.FieldValue.serverTimestamp(),
      description: `Partial payment of $${availableAmount} (${completion_percentage}% completion)`
    };

    const transactionRef = admin.firestore().collection('transactions').doc(transactionData.id);
    batch.set(transactionRef, transactionData);

    // Update freelancer wallet
    if (contractData.team_id) {
      await handleTeamPaymentSplit(contractData.team_id, availableAmount, batch);
    } else {
      await updateFreelancerWallet(contractData.freelancer_id, availableAmount, batch);
    }

    // Commit transaction
    await batch.commit();

    res.json({
      message: 'Partial funds released successfully',
      transaction: transactionData,
      released_amount: availableAmount,
      new_escrow_balance: contractData.escrow_balance - availableAmount
    });

  } catch (error) {
    console.error('Partial release error:', error);
    res.status(500).json({ error: 'Failed to release partial funds' });
  }
});

/**
 * GET /api/transactions/contract/:contract_id
 * Get all transactions for a contract
 */
router.get('/contract/:contract_id', authenticateToken, async (req, res) => {
  try {
    const contractId = req.params.contract_id;

    // Get contract
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

    // Get transactions
    const transactionsSnapshot = await admin.firestore()
      .collection('transactions')
      .where('contract_id', '==', contractId)
      .orderBy('created_at', 'desc')
      .get();

    const transactions = [];
    transactionsSnapshot.forEach(doc => {
      transactions.push({
        id: doc.id,
        ...doc.data(),
        created_at: doc.data().created_at?.toDate(),
        processed_at: doc.data().processed_at?.toDate()
      });
    });

    res.json({
      contract: {
        id: contractData.id,
        total_amount: contractData.total_amount,
        escrow_balance: contractData.escrow_balance,
        status: contractData.status
      },
      transactions
    });

  } catch (error) {
    console.error('Transactions fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch transactions' });
  }
});

/**
 * GET /api/transactions/wallet
 * Get user's wallet balance and transaction history
 */
router.get('/wallet', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    // Get user's wallet balance (simulated)
    const walletDoc = await admin.firestore()
      .collection('user_wallets')
      .doc(userId)
      .get();

    const walletData = walletDoc.exists ? walletDoc.data() : { balance: 0 };

    // Get recent transactions
    const transactionsSnapshot = await admin.firestore()
      .collection('transactions')
      .where('to_id', '==', userId)
      .orderBy('created_at', 'desc')
      .limit(20)
      .get();

    const transactions = [];
    transactionsSnapshot.forEach(doc => {
      transactions.push({
        id: doc.id,
        ...doc.data(),
        created_at: doc.data().created_at?.toDate(),
        processed_at: doc.data().processed_at?.toDate()
      });
    });

    res.json({
      wallet: walletData,
      transactions
    });

  } catch (error) {
    console.error('Wallet fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch wallet data' });
  }
});

// Helper function to handle team payment splits
async function handleTeamPaymentSplit(teamId, amount, batch) {
  try {
    // Get team data
    const teamDoc = await admin.firestore()
      .collection('teams')
      .doc(teamId)
      .get();

    if (!teamDoc.exists) {
      throw new Error('Team not found');
    }

    const teamData = teamDoc.data();
    const memberIds = teamData.member_ids || [];

    if (memberIds.length === 0) {
      throw new Error('Team has no members');
    }

    // Calculate equal split (for MVP - can be enhanced with custom splits)
    const splitAmount = amount / memberIds.length;

    // Update team wallet
    batch.update(teamDoc.ref, {
      team_wallet_balance: admin.firestore.FieldValue.increment(amount)
    });

    // Update individual member wallets
    for (const memberId of memberIds) {
      await updateFreelancerWallet(memberId, splitAmount, batch);
    }

  } catch (error) {
    console.error('Team payment split error:', error);
    throw error;
  }
}

// Helper function to update freelancer wallet
async function updateFreelancerWallet(freelancerId, amount, batch) {
  const walletRef = admin.firestore().collection('user_wallets').doc(freelancerId);
  
  // Get current wallet or create new one
  const walletDoc = await walletRef.get();
  
  if (walletDoc.exists) {
    batch.update(walletRef, {
      balance: admin.firestore.FieldValue.increment(amount),
      last_updated: admin.firestore.FieldValue.serverTimestamp()
    });
  } else {
    batch.set(walletRef, {
      user_id: freelancerId,
      balance: amount,
      created_at: admin.firestore.FieldValue.serverTimestamp(),
      last_updated: admin.firestore.FieldValue.serverTimestamp()
    });
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
