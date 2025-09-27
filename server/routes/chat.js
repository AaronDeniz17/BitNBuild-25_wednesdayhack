// Chat routes for GigCampus
// Handles real-time project communication

const express = require('express');
const { admin } = require('../config/firebase');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

/**
 * GET /api/chat/:contractId/messages
 * Get chat messages for a contract
 */
router.get('/:contractId/messages', authenticateToken, async (req, res) => {
  try {
    const contractId = req.params.contractId;
    const { page = 1, limit = 50 } = req.query;

    // Check if user has access to this contract
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

    // Get messages
    let query = admin.firestore()
      .collection('chat_messages')
      .where('contract_id', '==', contractId)
      .orderBy('created_at', 'desc');

    // Apply pagination
    const offset = (parseInt(page) - 1) * parseInt(limit);
    query = query.limit(parseInt(limit)).offset(offset);

    const snapshot = await query.get();
    const messages = [];

    for (const doc of snapshot.docs) {
      const messageData = doc.data();

      // Get sender information
      const senderDoc = await admin.firestore()
        .collection('users')
        .doc(messageData.sender_id)
        .get();

      const senderData = senderDoc.exists ? senderDoc.data() : null;

      messages.push({
        id: doc.id,
        ...messageData,
        created_at: messageData.created_at?.toDate(),
        sender: senderData ? {
          id: senderData.id,
          name: senderData.name,
          role: senderData.role
        } : null
      });
    }

    // Reverse to get chronological order
    messages.reverse();

    res.json({ messages });

  } catch (error) {
    console.error('Chat messages fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch chat messages' });
  }
});

/**
 * POST /api/chat/:contractId/messages
 * Send a new message
 */
router.post('/:contractId/messages', authenticateToken, async (req, res) => {
  try {
    const contractId = req.params.contractId;
    const { message, type = 'text', file_url } = req.body;

    if (!message && !file_url) {
      return res.status(400).json({ error: 'Message content is required' });
    }

    // Check if user has access to this contract
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

    // Create message
    const messageData = {
      id: admin.firestore().collection('chat_messages').doc().id,
      contract_id: contractId,
      sender_id: req.user.id,
      message: message || '',
      type,
      file_url: file_url || null,
      created_at: admin.firestore.FieldValue.serverTimestamp(),
      is_read: false,
      read_by: [req.user.id] // Sender has read their own message
    };

    await admin.firestore()
      .collection('chat_messages')
      .doc(messageData.id)
      .set(messageData);

    // Get sender information for response
    const senderDoc = await admin.firestore()
      .collection('users')
      .doc(req.user.id)
      .get();

    const senderData = senderDoc.exists ? senderDoc.data() : null;

    res.status(201).json({
      message: 'Message sent successfully',
      chat_message: {
        id: messageData.id,
        ...messageData,
        created_at: messageData.created_at?.toDate(),
        sender: senderData ? {
          id: senderData.id,
          name: senderData.name,
          role: senderData.role
        } : null
      }
    });

  } catch (error) {
    console.error('Chat message creation error:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

/**
 * PUT /api/chat/:contractId/messages/:messageId/read
 * Mark message as read
 */
router.put('/:contractId/messages/:messageId/read', authenticateToken, async (req, res) => {
  try {
    const contractId = req.params.contractId;
    const messageId = req.params.messageId;

    // Check if user has access to this contract
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

    // Get message
    const messageDoc = await admin.firestore()
      .collection('chat_messages')
      .doc(messageId)
      .get();

    if (!messageDoc.exists) {
      return res.status(404).json({ error: 'Message not found' });
    }

    const messageData = messageDoc.data();

    // Add user to read_by array if not already there
    if (!messageData.read_by.includes(req.user.id)) {
      await admin.firestore()
        .collection('chat_messages')
        .doc(messageId)
        .update({
          read_by: admin.firestore.FieldValue.arrayUnion(req.user.id)
        });
    }

    res.json({ message: 'Message marked as read' });

  } catch (error) {
    console.error('Mark message read error:', error);
    res.status(500).json({ error: 'Failed to mark message as read' });
  }
});

/**
 * GET /api/chat/:contractId/unread-count
 * Get unread message count for a contract
 */
router.get('/:contractId/unread-count', authenticateToken, async (req, res) => {
  try {
    const contractId = req.params.contractId;

    // Check if user has access to this contract
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

    // Get messages where user is not in read_by array
    const messagesSnapshot = await admin.firestore()
      .collection('chat_messages')
      .where('contract_id', '==', contractId)
      .get();

    let unreadCount = 0;
    messagesSnapshot.forEach(doc => {
      const messageData = doc.data();
      if (!messageData.read_by.includes(req.user.id)) {
        unreadCount++;
      }
    });

    res.json({ unread_count: unreadCount });

  } catch (error) {
    console.error('Unread count error:', error);
    res.status(500).json({ error: 'Failed to get unread count' });
  }
});

/**
 * GET /api/chat/contracts
 * Get user's chat contracts
 */
router.get('/contracts', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    // Get contracts where user is involved
    const contractsSnapshot = await admin.firestore()
      .collection('contracts')
      .where('client_id', '==', userId)
      .get();

    const freelancerContractsSnapshot = await admin.firestore()
      .collection('contracts')
      .where('freelancer_id', '==', userId)
      .get();

    const contracts = [];

    // Process client contracts
    for (const doc of contractsSnapshot.docs) {
      const contractData = doc.data();
      const contractWithDetails = await enrichContractForChat(contractData, userId);
      contracts.push(contractWithDetails);
    }

    // Process freelancer contracts
    for (const doc of freelancerContractsSnapshot.docs) {
      const contractData = doc.data();
      const contractWithDetails = await enrichContractForChat(contractData, userId);
      contracts.push(contractWithDetails);
    }

    // Remove duplicates
    const uniqueContracts = contracts.filter((contract, index, self) => 
      index === self.findIndex(c => c.id === contract.id)
    );

    res.json({ contracts: uniqueContracts });

  } catch (error) {
    console.error('Chat contracts fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch chat contracts' });
  }
});

// Helper function to enrich contract data for chat
async function enrichContractForChat(contractData, userId) {
  try {
    // Get project information
    const projectDoc = await admin.firestore()
      .collection('projects')
      .doc(contractData.project_id)
      .get();

    const projectData = projectDoc.exists ? projectDoc.data() : null;

    // Get other party information
    let otherParty = null;
    if (contractData.client_id === userId) {
      // User is client, get freelancer info
      const freelancerDoc = await admin.firestore()
        .collection('users')
        .doc(contractData.freelancer_id)
        .get();

      otherParty = freelancerDoc.exists ? freelancerDoc.data() : null;
    } else {
      // User is freelancer, get client info
      const clientDoc = await admin.firestore()
        .collection('users')
        .doc(contractData.client_id)
        .get();

      otherParty = clientDoc.exists ? clientDoc.data() : null;
    }

    // Get last message
    const lastMessageSnapshot = await admin.firestore()
      .collection('chat_messages')
      .where('contract_id', '==', contractData.id)
      .orderBy('created_at', 'desc')
      .limit(1)
      .get();

    let lastMessage = null;
    if (!lastMessageSnapshot.empty) {
      const lastMessageDoc = lastMessageSnapshot.docs[0];
      lastMessage = {
        id: lastMessageDoc.id,
        ...lastMessageDoc.data(),
        created_at: lastMessageDoc.data().created_at?.toDate()
      };
    }

    // Get unread count
    const messagesSnapshot = await admin.firestore()
      .collection('chat_messages')
      .where('contract_id', '==', contractData.id)
      .get();

    let unreadCount = 0;
    messagesSnapshot.forEach(doc => {
      const messageData = doc.data();
      if (!messageData.read_by.includes(userId)) {
        unreadCount++;
      }
    });

    return {
      id: contractData.id,
      status: contractData.status,
      created_at: contractData.created_at?.toDate(),
      project: projectData ? {
        id: projectData.id,
        title: projectData.title
      } : null,
      other_party: otherParty ? {
        id: otherParty.id,
        name: otherParty.name,
        role: otherParty.role
      } : null,
      last_message: lastMessage,
      unread_count: unreadCount
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
