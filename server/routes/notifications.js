// Notifications routes for GigCampus
// Handles user notifications and real-time updates

const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { admin, db } = require('../config/firebase');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Notification type constants
const NOTIFICATION_TYPES = {
  PROJECT_BID: 'project_bid',
  BID_ACCEPTED: 'bid_accepted',
  BID_REJECTED: 'bid_rejected',
  CONTRACT_CREATED: 'contract_created',
  MILESTONE_STARTED: 'milestone_started',
  MILESTONE_SUBMITTED: 'milestone_submitted',
  MILESTONE_APPROVED: 'milestone_approved',
  MILESTONE_REJECTED: 'milestone_rejected',
  PROJECT_COMPLETED: 'project_completed',
  PAYMENT_RECEIVED: 'payment_received',
  REVIEW_RECEIVED: 'review_received',
  TEAM_INVITATION: 'team_invitation',
  TEAM_MEMBER_JOINED: 'team_member_joined',
  MESSAGE_RECEIVED: 'message_received',
  SYSTEM_ANNOUNCEMENT: 'system_announcement'
};

/**
 * GET /api/notifications
 * Get user's notifications
 */
router.get('/', auth, async (req, res) => {
  try {
    const { type, read, page = 1, limit = 50 } = req.query;

    let query = db.collection('notifications')
      .where('user_id', '==', req.user.id);

    if (type && Object.values(NOTIFICATION_TYPES).includes(type)) {
      query = query.where('type', '==', type);
    }

    if (read !== undefined) {
      query = query.where('read', '==', read === 'true');
    }

    query = query.orderBy('created_at', 'desc');

    const pageSize = Math.min(parseInt(limit), 100);
    const offset = (parseInt(page) - 1) * pageSize;
    
    query = query.limit(pageSize).offset(offset);

    const snapshot = await query.get();
    const notifications = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    res.json({
      success: true,
      data: notifications,
      pagination: {
        page: parseInt(page),
        limit: pageSize,
        total: snapshot.size
      }
    });

  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ error: 'Failed to get notifications' });
  }
});

/**
 * GET /api/notifications/unread-count
 * Get count of unread notifications
 */
router.get('/unread-count', auth, async (req, res) => {
  try {
    const snapshot = await db.collection('notifications')
      .where('user_id', '==', req.user.id)
      .where('read', '==', false)
      .get();

    res.json({
      success: true,
      data: { count: snapshot.size }
    });

  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({ error: 'Failed to get unread count' });
  }
});

/**
 * PUT /api/notifications/:id/read
 * Mark notification as read
 */
router.put('/:id/read', auth, async (req, res) => {
  try {
    const { id } = req.params;
    
    const notificationDoc = await db.collection('notifications').doc(id).get();
    
    if (!notificationDoc.exists) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    const notificationData = notificationDoc.data();
    
    // Check if user owns the notification
    if (notificationData.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    await db.collection('notifications').doc(id).update({
      read: true,
      read_at: admin.firestore.FieldValue.serverTimestamp(),
      updated_at: admin.firestore.FieldValue.serverTimestamp()
    });

    res.json({
      success: true,
      message: 'Notification marked as read'
    });

  } catch (error) {
    console.error('Mark notification read error:', error);
    res.status(500).json({ error: 'Failed to mark notification as read' });
  }
});

/**
 * PUT /api/notifications/mark-all-read
 * Mark all notifications as read
 */
router.put('/mark-all-read', auth, async (req, res) => {
  try {
    const unreadSnapshot = await db.collection('notifications')
      .where('user_id', '==', req.user.id)
      .where('read', '==', false)
      .get();

    const batch = db.batch();
    const timestamp = admin.firestore.FieldValue.serverTimestamp();

    unreadSnapshot.docs.forEach(doc => {
      batch.update(doc.ref, {
        read: true,
        read_at: timestamp,
        updated_at: timestamp
      });
    });

    await batch.commit();

    res.json({
      success: true,
      message: `${unreadSnapshot.size} notifications marked as read`
    });

  } catch (error) {
    console.error('Mark all read error:', error);
    res.status(500).json({ error: 'Failed to mark all notifications as read' });
  }
});

/**
 * DELETE /api/notifications/:id
 * Delete a notification
 */
router.delete('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    
    const notificationDoc = await db.collection('notifications').doc(id).get();
    
    if (!notificationDoc.exists) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    const notificationData = notificationDoc.data();
    
    // Check if user owns the notification
    if (notificationData.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    await db.collection('notifications').doc(id).delete();

    res.json({
      success: true,
      message: 'Notification deleted'
    });

  } catch (error) {
    console.error('Delete notification error:', error);
    res.status(500).json({ error: 'Failed to delete notification' });
  }
});

/**
 * DELETE /api/notifications/clear-all
 * Clear all notifications for user
 */
router.delete('/clear-all', auth, async (req, res) => {
  try {
    const { older_than_days } = req.query;
    
    let query = db.collection('notifications')
      .where('user_id', '==', req.user.id);

    // If specified, only delete notifications older than X days
    if (older_than_days) {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - parseInt(older_than_days));
      query = query.where('created_at', '<', admin.firestore.Timestamp.fromDate(cutoffDate));
    }

    const snapshot = await query.get();
    const batch = db.batch();

    snapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });

    await batch.commit();

    res.json({
      success: true,
      message: `${snapshot.size} notifications cleared`
    });

  } catch (error) {
    console.error('Clear notifications error:', error);
    res.status(500).json({ error: 'Failed to clear notifications' });
  }
});

/**
 * GET /api/notifications/settings
 * Get notification preferences
 */
router.get('/settings', auth, async (req, res) => {
  try {
    const userDoc = await db.collection('users').doc(req.user.id).get();
    const userData = userDoc.data();
    
    const defaultSettings = {
      email_notifications: true,
      push_notifications: true,
      project_updates: true,
      bid_updates: true,
      milestone_updates: true,
      payment_updates: true,
      team_updates: true,
      message_notifications: true,
      marketing_emails: false
    };

    const settings = {
      ...defaultSettings,
      ...userData.notification_settings
    };

    res.json({
      success: true,
      data: settings
    });

  } catch (error) {
    console.error('Get notification settings error:', error);
    res.status(500).json({ error: 'Failed to get notification settings' });
  }
});

/**
 * PUT /api/notifications/settings
 * Update notification preferences
 */
router.put('/settings', auth, async (req, res) => {
  try {
    const {
      email_notifications,
      push_notifications,
      project_updates,
      bid_updates,
      milestone_updates,
      payment_updates,
      team_updates,
      message_notifications,
      marketing_emails
    } = req.body;

    const settings = {};
    
    if (email_notifications !== undefined) settings.email_notifications = Boolean(email_notifications);
    if (push_notifications !== undefined) settings.push_notifications = Boolean(push_notifications);
    if (project_updates !== undefined) settings.project_updates = Boolean(project_updates);
    if (bid_updates !== undefined) settings.bid_updates = Boolean(bid_updates);
    if (milestone_updates !== undefined) settings.milestone_updates = Boolean(milestone_updates);
    if (payment_updates !== undefined) settings.payment_updates = Boolean(payment_updates);
    if (team_updates !== undefined) settings.team_updates = Boolean(team_updates);
    if (message_notifications !== undefined) settings.message_notifications = Boolean(message_notifications);
    if (marketing_emails !== undefined) settings.marketing_emails = Boolean(marketing_emails);

    await db.collection('users').doc(req.user.id).update({
      notification_settings: settings,
      updated_at: admin.firestore.FieldValue.serverTimestamp()
    });

    res.json({
      success: true,
      message: 'Notification settings updated',
      data: settings
    });

  } catch (error) {
    console.error('Update notification settings error:', error);
    res.status(500).json({ error: 'Failed to update notification settings' });
  }
});

// Helper function to create notifications (used by other routes)
const createNotification = async (userId, type, title, message, data = {}) => {
  try {
    const notificationId = uuidv4();
    
    const notificationData = {
      id: notificationId,
      user_id: userId,
      type,
      title,
      message,
      data,
      read: false,
      created_at: admin.firestore.FieldValue.serverTimestamp()
    };

    await db.collection('notifications').doc(notificationId).set(notificationData);
    
    return notificationId;
  } catch (error) {
    console.error('Create notification error:', error);
    throw error;
  }
};

// Helper function to send notifications to multiple users
const createBulkNotifications = async (userIds, type, title, message, data = {}) => {
  try {
    const batch = db.batch();
    const notificationIds = [];

    userIds.forEach(userId => {
      const notificationId = uuidv4();
      notificationIds.push(notificationId);
      
      const notificationData = {
        id: notificationId,
        user_id: userId,
        type,
        title,
        message,
        data,
        read: false,
        created_at: admin.firestore.FieldValue.serverTimestamp()
      };

      batch.set(db.collection('notifications').doc(notificationId), notificationData);
    });

    await batch.commit();
    return notificationIds;
  } catch (error) {
    console.error('Create bulk notifications error:', error);
    throw error;
  }
};

// Notification templates
const getNotificationTemplate = (type, data) => {
  const templates = {
    [NOTIFICATION_TYPES.PROJECT_BID]: {
      title: 'New Bid Received',
      message: `${data.bidder_name} placed a bid of $${data.amount} on your project "${data.project_title}"`
    },
    [NOTIFICATION_TYPES.BID_ACCEPTED]: {
      title: 'Bid Accepted!',
      message: `Your bid for "${data.project_title}" has been accepted. Time to get started!`
    },
    [NOTIFICATION_TYPES.BID_REJECTED]: {
      title: 'Bid Update',
      message: `Your bid for "${data.project_title}" was not selected this time.`
    },
    [NOTIFICATION_TYPES.CONTRACT_CREATED]: {
      title: 'New Contract Created',
      message: `A contract has been created for project "${data.project_title}"`
    },
    [NOTIFICATION_TYPES.MILESTONE_SUBMITTED]: {
      title: 'Milestone Submitted',
      message: `"${data.milestone_title}" has been submitted for review`
    },
    [NOTIFICATION_TYPES.MILESTONE_APPROVED]: {
      title: 'Milestone Approved!',
      message: `"${data.milestone_title}" has been approved. Payment is on the way!`
    },
    [NOTIFICATION_TYPES.MILESTONE_REJECTED]: {
      title: 'Milestone Needs Work',
      message: `"${data.milestone_title}" needs revisions. Check the feedback.`
    },
    [NOTIFICATION_TYPES.PAYMENT_RECEIVED]: {
      title: 'Payment Received',
      message: `You've received $${data.amount} payment for "${data.project_title}"`
    },
    [NOTIFICATION_TYPES.REVIEW_RECEIVED]: {
      title: 'New Review',
      message: `You received a ${data.rating}-star review from ${data.reviewer_name}`
    },
    [NOTIFICATION_TYPES.TEAM_INVITATION]: {
      title: 'Team Invitation',
      message: `${data.inviter_name} invited you to join team "${data.team_name}"`
    },
    [NOTIFICATION_TYPES.MESSAGE_RECEIVED]: {
      title: 'New Message',
      message: `${data.sender_name}: ${data.message_preview}`
    }
  };

  return templates[type] || {
    title: 'Notification',
    message: 'You have a new notification'
  };
};

// Export the router as default and utility functions as named exports
module.exports = router;
module.exports.createNotification = createNotification;
module.exports.createBulkNotifications = createBulkNotifications;
module.exports.getNotificationTemplate = getNotificationTemplate;
module.exports.NOTIFICATION_TYPES = NOTIFICATION_TYPES;