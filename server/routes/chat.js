// Chat routes for GigCampus
// Handles real-time messaging and conversations

const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { admin, db } = require('../config/firebase');
const { auth, userRateLimit } = require('../middleware/auth');

const router = express.Router();

/**
 * GET /api/chat/conversations
 * Get user's conversations
 */
router.get('/conversations', auth, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;

    // Get conversations where user is a participant
    const conversationsSnapshot = await db.collection('conversations')
      .where('participants', 'array-contains', req.user.id)
      .orderBy('last_message_at', 'desc')
      .limit(parseInt(limit))
      .get();

    const conversations = [];

    for (const doc of conversationsSnapshot.docs) {
      const conversationData = doc.data();
      
      // Get other participants' info
      const otherParticipantIds = conversationData.participants.filter(id => id !== req.user.id);
      const participants = [];

      for (const participantId of otherParticipantIds) {
        const userDoc = await db.collection('users').doc(participantId).get();
        if (userDoc.exists) {
          const userData = userDoc.data();
          participants.push({
            id: userData.id,
            name: userData.name,
            university: userData.university,
            university_verified: userData.university_verified
          });
        }
      }

      // Get unread count for this user
      const unreadCount = await getUnreadCount(doc.id, req.user.id);

      conversations.push({
        id: doc.id,
        ...conversationData,
        participants,
        unread_count: unreadCount
      });
    }

    res.json({
      success: true,
      data: conversations
    });

  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({ error: 'Failed to get conversations' });
  }
});

/**
 * POST /api/chat/conversations
 * Create a new conversation
 */
router.post('/conversations', auth, userRateLimit(20, 60 * 60 * 1000), async (req, res) => {
  try {
    const { participant_id } = req.body;

    if (!participant_id) {
      return res.status(400).json({ error: 'Participant ID is required' });
    }

    if (participant_id === req.user.id) {
      return res.status(400).json({ error: 'Cannot create conversation with yourself' });
    }

    // Check if participant exists
    const participantDoc = await db.collection('users').doc(participant_id).get();
    if (!participantDoc.exists) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if conversation already exists
    const existingConversation = await db.collection('conversations')
      .where('participants', 'array-contains', req.user.id)
      .get();

    let conversationId = null;

    for (const doc of existingConversation.docs) {
      const data = doc.data();
      if (data.participants.includes(participant_id) && data.participants.length === 2) {
        conversationId = doc.id;
        break;
      }
    }

    // If conversation doesn't exist, create it
    if (!conversationId) {
      conversationId = uuidv4();
      
      const conversationData = {
        id: conversationId,
        participants: [req.user.id, participant_id],
        created_at: admin.firestore.FieldValue.serverTimestamp(),
        last_message_at: admin.firestore.FieldValue.serverTimestamp(),
        last_message: null,
        last_message_sender_id: null
      };

      await db.collection('conversations').doc(conversationId).set(conversationData);
    }

    // Get the conversation with participant info
    const conversationDoc = await db.collection('conversations').doc(conversationId).get();
    const conversationData = conversationDoc.data();

    const participantData = participantDoc.data();
    const participants = [{
      id: participantData.id,
      name: participantData.name,
      university: participantData.university,
      university_verified: participantData.university_verified
    }];

    res.json({
      success: true,
      data: {
        id: conversationId,
        ...conversationData,
        participants
      }
    });

  } catch (error) {
    console.error('Create conversation error:', error);
    res.status(500).json({ error: 'Failed to create conversation' });
  }
});

/**
 * GET /api/chat/conversations/:id/messages
 * Get messages for a conversation
 */
router.get('/conversations/:id/messages', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 50, before } = req.query;

    // Check if user is participant in this conversation
    const conversationDoc = await db.collection('conversations').doc(id).get();
    
    if (!conversationDoc.exists) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    const conversationData = conversationDoc.data();
    
    if (!conversationData.participants.includes(req.user.id)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    let query = db.collection('messages')
      .where('conversation_id', '==', id)
      .orderBy('created_at', 'desc');

    // Pagination with before cursor
    if (before) {
      const beforeDate = admin.firestore.Timestamp.fromDate(new Date(before));
      query = query.where('created_at', '<', beforeDate);
    }

    query = query.limit(parseInt(limit));

    const messagesSnapshot = await query.get();
    const messages = messagesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })).reverse(); // Reverse to get chronological order

    // Mark messages as read
    await markMessagesAsRead(id, req.user.id);

    res.json({
      success: true,
      data: messages
    });

  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ error: 'Failed to get messages' });
  }
});

/**
 * POST /api/chat/conversations/:id/messages
 * Send a message
 */
router.post('/conversations/:id/messages', auth, userRateLimit(60, 60 * 1000), async (req, res) => {
  try {
    const { id } = req.params;
    const { text, type = 'text' } = req.body;

    if (!text || text.trim().length === 0) {
      return res.status(400).json({ error: 'Message text is required' });
    }

    if (text.trim().length > 2000) {
      return res.status(400).json({ error: 'Message too long (max 2000 characters)' });
    }

    // Check if user is participant in this conversation
    const conversationDoc = await db.collection('conversations').doc(id).get();
    
    if (!conversationDoc.exists) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    const conversationData = conversationDoc.data();
    
    if (!conversationData.participants.includes(req.user.id)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const messageId = uuidv4();
    
    const messageData = {
      id: messageId,
      conversation_id: id,
      sender_id: req.user.id,
      text: text.trim(),
      type,
      created_at: admin.firestore.FieldValue.serverTimestamp(),
      
      // Read status for each participant
      read_by: {
        [req.user.id]: admin.firestore.FieldValue.serverTimestamp()
      }
    };

    // Use transaction to ensure atomicity
    await db.runTransaction(async (transaction) => {
      // Create message
      transaction.set(db.collection('messages').doc(messageId), messageData);
      
      // Update conversation with last message info
      transaction.update(db.collection('conversations').doc(id), {
        last_message: text.trim().substring(0, 100),
        last_message_sender_id: req.user.id,
        last_message_at: admin.firestore.FieldValue.serverTimestamp()
      });
    });

    res.status(201).json({
      success: true,
      message: 'Message sent successfully',
      data: { id: messageId, ...messageData }
    });

  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

/**
 * POST /api/chat/conversations/:id/mark-read
 * Mark conversation as read
 */
router.post('/conversations/:id/mark-read', auth, async (req, res) => {
  try {
    const { id } = req.params;

    // Check if user is participant in this conversation
    const conversationDoc = await db.collection('conversations').doc(id).get();
    
    if (!conversationDoc.exists) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    const conversationData = conversationDoc.data();
    
    if (!conversationData.participants.includes(req.user.id)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    await markMessagesAsRead(id, req.user.id);

    res.json({
      success: true,
      message: 'Messages marked as read'
    });

  } catch (error) {
    console.error('Mark read error:', error);
    res.status(500).json({ error: 'Failed to mark messages as read' });
  }
});

/**
 * GET /api/chat/project/:projectId/messages
 * Get project chat messages (for project discussions)
 */
router.get('/project/:projectId/messages', auth, async (req, res) => {
  try {
    const { projectId } = req.params;
    const { page = 1, limit = 50 } = req.query;

    // Check if user has access to this project
    const hasAccess = await checkProjectAccess(projectId, req.user.id);
    
    if (!hasAccess) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const messagesSnapshot = await db.collection('project_messages')
      .where('project_id', '==', projectId)
      .orderBy('created_at', 'desc')
      .limit(parseInt(limit))
      .get();

    const messages = [];

    for (const doc of messagesSnapshot.docs) {
      const messageData = doc.data();
      
      // Get sender info
      const senderDoc = await db.collection('users').doc(messageData.sender_id).get();
      const senderData = senderDoc.exists ? senderDoc.data() : null;

      messages.push({
        id: doc.id,
        ...messageData,
        sender: senderData ? {
          id: senderData.id,
          name: senderData.name,
          university: senderData.university
        } : null
      });
    }

    res.json({
      success: true,
      data: messages.reverse() // Chronological order
    });

  } catch (error) {
    console.error('Get project messages error:', error);
    res.status(500).json({ error: 'Failed to get project messages' });
  }
});

/**
 * POST /api/chat/project/:projectId/messages
 * Send a project message
 */
router.post('/project/:projectId/messages', auth, userRateLimit(30, 60 * 1000), async (req, res) => {
  try {
    const { projectId } = req.params;
    const { text, type = 'text' } = req.body;

    if (!text || text.trim().length === 0) {
      return res.status(400).json({ error: 'Message text is required' });
    }

    // Check if user has access to this project
    const hasAccess = await checkProjectAccess(projectId, req.user.id);
    
    if (!hasAccess) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const messageId = uuidv4();
    
    const messageData = {
      id: messageId,
      project_id: projectId,
      sender_id: req.user.id,
      text: text.trim(),
      type,
      created_at: admin.firestore.FieldValue.serverTimestamp()
    };

    await db.collection('project_messages').doc(messageId).set(messageData);

    // Get sender info for response
    const senderData = {
      id: req.user.id,
      name: req.user.name,
      university: req.user.university
    };

    res.status(201).json({
      success: true,
      message: 'Message sent successfully',
      data: {
        ...messageData,
        sender: senderData
      }
    });

  } catch (error) {
    console.error('Send project message error:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

/**
 * DELETE /api/chat/messages/:id
 * Delete a message (only by sender)
 */
router.delete('/messages/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;

    const messageDoc = await db.collection('messages').doc(id).get();
    
    if (!messageDoc.exists) {
      return res.status(404).json({ error: 'Message not found' });
    }

    const messageData = messageDoc.data();
    
    // Check if user is the sender
    if (messageData.sender_id !== req.user.id) {
      return res.status(403).json({ error: 'You can only delete your own messages' });
    }

    // Check if message is recent (can only delete messages within 5 minutes)
    const messageTime = messageData.created_at.toDate();
    const now = new Date();
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);

    if (messageTime < fiveMinutesAgo) {
      return res.status(400).json({ error: 'Can only delete messages within 5 minutes of sending' });
    }

    // Soft delete - mark as deleted instead of removing
    await db.collection('messages').doc(id).update({
      deleted_at: admin.firestore.FieldValue.serverTimestamp(),
      text: '[Message deleted]'
    });

    res.json({
      success: true,
      message: 'Message deleted successfully'
    });

  } catch (error) {
    console.error('Delete message error:', error);
    res.status(500).json({ error: 'Failed to delete message' });
  }
});

// Helper function to get unread message count
async function getUnreadCount(conversationId, userId) {
  try {
    const messagesSnapshot = await db.collection('messages')
      .where('conversation_id', '==', conversationId)
      .where(`read_by.${userId}`, '==', null)
      .get();
    
    return messagesSnapshot.size;
  } catch (error) {
    return 0;
  }
}

// Helper function to mark messages as read
async function markMessagesAsRead(conversationId, userId) {
  try {
    const unreadMessagesSnapshot = await db.collection('messages')
      .where('conversation_id', '==', conversationId)
      .where(`read_by.${userId}`, '==', null)
      .get();

    if (!unreadMessagesSnapshot.empty) {
      const batch = db.batch();
      
      unreadMessagesSnapshot.docs.forEach(doc => {
        batch.update(doc.ref, {
          [`read_by.${userId}`]: admin.firestore.FieldValue.serverTimestamp()
        });
      });
      
      await batch.commit();
    }
  } catch (error) {
    console.error('Mark messages as read error:', error);
  }
}

// Helper function to check project access
async function checkProjectAccess(projectId, userId) {
  try {
    const projectDoc = await db.collection('projects').doc(projectId).get();
    
    if (!projectDoc.exists) return false;
    
    const projectData = projectDoc.data();
    
    // User has access if they're the client or freelancer
    return projectData.client_id === userId || projectData.freelancer_id === userId;
  } catch (error) {
    return false;
  }
}

module.exports = router;