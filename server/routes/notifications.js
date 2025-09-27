// Notification routes for GigCampus
// Handles user notifications and real-time updates

const express = require('express');
const { admin } = require('../config/firebase');
const { authenticateToken } = require('../middleware/auth');
const { 
  getUserNotifications, 
  markAsRead, 
  getUnreadCount,
  NOTIFICATION_TYPES 
} = require('../utils/notifications');

const router = express.Router();

/**
 * GET /api/notifications
 * Get user notifications with pagination
 */
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { limit = 20, offset = 0, unread_only = 'false' } = req.query;
    const userId = req.user.id;

    let query = admin.firestore()
      .collection('notifications')
      .where('user_id', '==', userId);

    if (unread_only === 'true') {
      query = query.where('is_read', '==', false);
    }

    query = query.orderBy('created_at', 'desc')
      .limit(parseInt(limit))
      .offset(parseInt(offset));

    const snapshot = await query.get();
    const notifications = [];

    snapshot.forEach(doc => {
      notifications.push({
        id: doc.id,
        ...doc.data(),
        created_at: doc.data().created_at?.toDate()
      });
    });

    res.json({ notifications });

  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

/**
 * GET /api/notifications/unread-count
 * Get count of unread notifications
 */
router.get('/unread-count', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const count = await getUnreadCount(userId);
    
    res.json({ unread_count: count });

  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({ error: 'Failed to get unread count' });
  }
});

/**
 * PUT /api/notifications/:id/read
 * Mark notification as read
 */
router.put('/:id/read', authenticateToken, async (req, res) => {
  try {
    const notificationId = req.params.id;
    const userId = req.user.id;

    // Verify notification belongs to user
    const notificationDoc = await admin.firestore()
      .collection('notifications')
      .doc(notificationId)
      .get();

    if (!notificationDoc.exists) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    const notification = notificationDoc.data();
    if (notification.user_id !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    await markAsRead(notificationId);

    res.json({ message: 'Notification marked as read' });

  } catch (error) {
    console.error('Mark as read error:', error);
    res.status(500).json({ error: 'Failed to mark as read' });
  }
});

/**
 * PUT /api/notifications/mark-all-read
 * Mark all notifications as read for user
 */
router.put('/mark-all-read', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    // Get all unread notifications for user
    const snapshot = await admin.firestore()
      .collection('notifications')
      .where('user_id', '==', userId)
      .where('is_read', '==', false)
      .get();

    // Batch update
    const batch = admin.firestore().batch();
    
    snapshot.forEach(doc => {
      batch.update(doc.ref, {
        is_read: true,
        read_at: admin.firestore.FieldValue.serverTimestamp()
      });
    });

    await batch.commit();

    res.json({ 
      message: 'All notifications marked as read',
      updated_count: snapshot.size
    });

  } catch (error) {
    console.error('Mark all as read error:', error);
    res.status(500).json({ error: 'Failed to mark all as read' });
  }
});

/**
 * DELETE /api/notifications/:id
 * Delete a notification
 */
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const notificationId = req.params.id;
    const userId = req.user.id;

    // Verify notification belongs to user
    const notificationDoc = await admin.firestore()
      .collection('notifications')
      .doc(notificationId)
      .get();

    if (!notificationDoc.exists) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    const notification = notificationDoc.data();
    if (notification.user_id !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    await admin.firestore()
      .collection('notifications')
      .doc(notificationId)
      .delete();

    res.json({ message: 'Notification deleted' });

  } catch (error) {
    console.error('Delete notification error:', error);
    res.status(500).json({ error: 'Failed to delete notification' });
  }
});

/**
 * GET /api/notifications/types
 * Get available notification types
 */
router.get('/types', authenticateToken, async (req, res) => {
  try {
    res.json({ 
      notification_types: Object.values(NOTIFICATION_TYPES),
      descriptions: {
        [NOTIFICATION_TYPES.BID_RECEIVED]: 'New bid received on your project',
        [NOTIFICATION_TYPES.BID_ACCEPTED]: 'Your bid was accepted',
        [NOTIFICATION_TYPES.BID_REJECTED]: 'Your bid was rejected',
        [NOTIFICATION_TYPES.MILESTONE_SUBMITTED]: 'Milestone submitted for review',
        [NOTIFICATION_TYPES.MILESTONE_APPROVED]: 'Milestone approved',
        [NOTIFICATION_TYPES.MILESTONE_REJECTED]: 'Milestone rejected',
        [NOTIFICATION_TYPES.PAYMENT_RECEIVED]: 'Payment received',
        [NOTIFICATION_TYPES.PAYMENT_RELEASED]: 'Payment released',
        [NOTIFICATION_TYPES.PROJECT_COMPLETED]: 'Project completed',
        [NOTIFICATION_TYPES.NEW_MESSAGE]: 'New message received',
        [NOTIFICATION_TYPES.TEAM_INVITE]: 'Team invitation received',
        [NOTIFICATION_TYPES.TEAM_JOINED]: 'Someone joined your team',
        [NOTIFICATION_TYPES.REVIEW_RECEIVED]: 'New review received',
        [NOTIFICATION_TYPES.DISPUTE_CREATED]: 'Dispute created',
        [NOTIFICATION_TYPES.DISPUTE_RESOLVED]: 'Dispute resolved',
        [NOTIFICATION_TYPES.PROJECT_DEADLINE_REMINDER]: 'Project deadline approaching',
        [NOTIFICATION_TYPES.SKILL_MATCH_FOUND]: 'New project matches your skills'
      }
    });

  } catch (error) {
    console.error('Get notification types error:', error);
    res.status(500).json({ error: 'Failed to get notification types' });
  }
});

module.exports = router;