// Notification system for GigCampus
// Handles real-time notifications, emails, and push notifications

const { admin } = require('../config/firebase');

/**
 * Notification types
 */
const NOTIFICATION_TYPES = {
  BID_RECEIVED: 'bid_received',
  BID_ACCEPTED: 'bid_accepted',
  BID_REJECTED: 'bid_rejected',
  MILESTONE_SUBMITTED: 'milestone_submitted',
  MILESTONE_APPROVED: 'milestone_approved',
  MILESTONE_REJECTED: 'milestone_rejected',
  PAYMENT_RECEIVED: 'payment_received',
  PAYMENT_RELEASED: 'payment_released',
  PROJECT_COMPLETED: 'project_completed',
  NEW_MESSAGE: 'new_message',
  TEAM_INVITE: 'team_invite',
  TEAM_JOINED: 'team_joined',
  REVIEW_RECEIVED: 'review_received',
  DISPUTE_CREATED: 'dispute_created',
  DISPUTE_RESOLVED: 'dispute_resolved',
  PROJECT_DEADLINE_REMINDER: 'project_deadline_reminder',
  SKILL_MATCH_FOUND: 'skill_match_found'
};

/**
 * Create a notification
 */
const createNotification = async (notification) => {
  try {
    const notificationData = {
      id: admin.firestore().collection('notifications').doc().id,
      user_id: notification.userId,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      data: notification.data || {},
      is_read: false,
      created_at: admin.firestore.FieldValue.serverTimestamp(),
      priority: notification.priority || 'normal', // 'low', 'normal', 'high', 'urgent'
      category: notification.category || 'general' // 'project', 'payment', 'team', 'system'
    };

    await admin.firestore()
      .collection('notifications')
      .doc(notificationData.id)
      .set(notificationData);

    // Send real-time notification if user is online
    await sendRealtimeNotification(notification.userId, notificationData);

    return notificationData;
  } catch (error) {
    console.error('Create notification error:', error);
    throw error;
  }
};

/**
 * Send real-time notification via Firebase Realtime Database
 */
const sendRealtimeNotification = async (userId, notification) => {
  try {
    const realtimeDb = admin.database();
    await realtimeDb.ref(`notifications/${userId}`).push({
      ...notification,
      timestamp: admin.database.ServerValue.TIMESTAMP
    });
  } catch (error) {
    console.error('Realtime notification error:', error);
  }
};

/**
 * Send email notification (placeholder for production email service)
 */
const sendEmailNotification = async (userId, subject, body) => {
  try {
    // Get user email
    const userDoc = await admin.firestore()
      .collection('users')
      .doc(userId)
      .get();

    if (!userDoc.exists) return;

    const user = userDoc.data();
    
    // TODO: Integrate with email service (SendGrid, AWS SES, etc.)
    console.log(`📧 EMAIL TO: ${user.email}`);
    console.log(`📧 SUBJECT: ${subject}`);
    console.log(`📧 BODY: ${body}`);
    
    // In production, use actual email service:
    // await emailService.send({
    //   to: user.email,
    //   subject,
    //   html: body
    // });

  } catch (error) {
    console.error('Email notification error:', error);
  }
};

/**
 * Notification handlers for different events
 */
const notificationHandlers = {
  // Bid received notification
  bidReceived: async (projectId, bidId, clientId) => {
    const projectDoc = await admin.firestore().collection('projects').doc(projectId).get();
    const bidDoc = await admin.firestore().collection('bids').doc(bidId).get();
    
    if (!projectDoc.exists || !bidDoc.exists) return;
    
    const project = projectDoc.data();
    const bid = bidDoc.data();

    await createNotification({
      userId: clientId,
      type: NOTIFICATION_TYPES.BID_RECEIVED,
      title: 'New Bid Received',
      message: `You received a new bid of $${bid.price} for "${project.title}"`,
      data: { projectId, bidId },
      priority: 'normal',
      category: 'project'
    });

    await sendEmailNotification(
      clientId,
      'New Bid on Your Project',
      `You have received a new bid for your project "${project.title}". Check your dashboard to review it.`
    );
  },

  // Bid accepted notification
  bidAccepted: async (bidId, freelancerId) => {
    const bidDoc = await admin.firestore().collection('bids').doc(bidId).get();
    if (!bidDoc.exists) return;

    const bid = bidDoc.data();
    const projectDoc = await admin.firestore().collection('projects').doc(bid.project_id).get();
    const project = projectDoc.data();

    await createNotification({
      userId: freelancerId,
      type: NOTIFICATION_TYPES.BID_ACCEPTED,
      title: 'Bid Accepted! 🎉',
      message: `Your bid for "${project.title}" has been accepted! Time to get started.`,
      data: { projectId: bid.project_id, bidId },
      priority: 'high',
      category: 'project'
    });

    await sendEmailNotification(
      freelancerId,
      'Congratulations! Your Bid Was Accepted',
      `Great news! Your bid for "${project.title}" has been accepted. You can now start working on the project.`
    );
  },

  // Milestone submitted notification
  milestoneSubmitted: async (milestoneId, contractId, clientId) => {
    const milestoneDoc = await admin.firestore().collection('milestones').doc(milestoneId).get();
    const contractDoc = await admin.firestore().collection('contracts').doc(contractId).get();
    
    if (!milestoneDoc.exists || !contractDoc.exists) return;
    
    const milestone = milestoneDoc.data();
    const contract = contractDoc.data();

    await createNotification({
      userId: clientId,
      type: NOTIFICATION_TYPES.MILESTONE_SUBMITTED,
      title: 'Milestone Submitted for Review',
      message: `"${milestone.title}" has been submitted and is ready for your review`,
      data: { milestoneId, contractId },
      priority: 'high',
      category: 'project'
    });
  },

  // Payment received notification
  paymentReceived: async (transactionId, userId, amount) => {
    await createNotification({
      userId,
      type: NOTIFICATION_TYPES.PAYMENT_RECEIVED,
      title: 'Payment Received! 💰',
      message: `You've received a payment of $${amount}`,
      data: { transactionId },
      priority: 'high',
      category: 'payment'
    });

    await sendEmailNotification(
      userId,
      'Payment Received',
      `You have received a payment of $${amount}. The funds are now available in your wallet.`
    );
  },

  // New message notification
  newMessage: async (contractId, senderId, recipientId, messagePreview) => {
    const senderDoc = await admin.firestore().collection('users').doc(senderId).get();
    if (!senderDoc.exists) return;

    const sender = senderDoc.data();

    await createNotification({
      userId: recipientId,
      type: NOTIFICATION_TYPES.NEW_MESSAGE,
      title: `New message from ${sender.name}`,
      message: messagePreview.substring(0, 100),
      data: { contractId, senderId },
      priority: 'normal',
      category: 'project'
    });
  },

  // Team invite notification
  teamInvite: async (teamId, inviteeId, inviterId) => {
    const teamDoc = await admin.firestore().collection('teams').doc(teamId).get();
    const inviterDoc = await admin.firestore().collection('users').doc(inviterId).get();
    
    if (!teamDoc.exists || !inviterDoc.exists) return;
    
    const team = teamDoc.data();
    const inviter = inviterDoc.data();

    await createNotification({
      userId: inviteeId,
      type: NOTIFICATION_TYPES.TEAM_INVITE,
      title: 'Team Invitation',
      message: `${inviter.name} invited you to join "${team.name}"`,
      data: { teamId, inviterId },
      priority: 'normal',
      category: 'team'
    });
  },

  // Project deadline reminder
  deadlineReminder: async (projectId, userId, daysLeft) => {
    const projectDoc = await admin.firestore().collection('projects').doc(projectId).get();
    if (!projectDoc.exists) return;

    const project = projectDoc.data();

    await createNotification({
      userId,
      type: NOTIFICATION_TYPES.PROJECT_DEADLINE_REMINDER,
      title: `Project Deadline Approaching ⏰`,
      message: `"${project.title}" is due in ${daysLeft} days`,
      data: { projectId },
      priority: daysLeft <= 1 ? 'urgent' : 'high',
      category: 'project'
    });
  }
};

/**
 * Get user notifications
 */
const getUserNotifications = async (userId, limit = 20, offset = 0) => {
  try {
    const snapshot = await admin.firestore()
      .collection('notifications')
      .where('user_id', '==', userId)
      .orderBy('created_at', 'desc')
      .limit(limit)
      .offset(offset)
      .get();

    const notifications = [];
    snapshot.forEach(doc => {
      notifications.push({
        id: doc.id,
        ...doc.data(),
        created_at: doc.data().created_at?.toDate()
      });
    });

    return notifications;
  } catch (error) {
    console.error('Get notifications error:', error);
    throw error;
  }
};

/**
 * Mark notification as read
 */
const markAsRead = async (notificationId) => {
  try {
    await admin.firestore()
      .collection('notifications')
      .doc(notificationId)
      .update({
        is_read: true,
        read_at: admin.firestore.FieldValue.serverTimestamp()
      });
  } catch (error) {
    console.error('Mark as read error:', error);
    throw error;
  }
};

/**
 * Get unread notification count
 */
const getUnreadCount = async (userId) => {
  try {
    const snapshot = await admin.firestore()
      .collection('notifications')
      .where('user_id', '==', userId)
      .where('is_read', '==', false)
      .get();

    return snapshot.size;
  } catch (error) {
    console.error('Get unread count error:', error);
    return 0;
  }
};

/**
 * Send bulk notifications
 */
const sendBulkNotifications = async (userIds, notification) => {
  try {
    const batch = admin.firestore().batch();

    userIds.forEach(userId => {
      const notificationRef = admin.firestore().collection('notifications').doc();
      batch.set(notificationRef, {
        id: notificationRef.id,
        user_id: userId,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        data: notification.data || {},
        is_read: false,
        created_at: admin.firestore.FieldValue.serverTimestamp(),
        priority: notification.priority || 'normal',
        category: notification.category || 'general'
      });
    });

    await batch.commit();
  } catch (error) {
    console.error('Bulk notifications error:', error);
    throw error;
  }
};

module.exports = {
  NOTIFICATION_TYPES,
  createNotification,
  sendRealtimeNotification,
  sendEmailNotification,
  notificationHandlers,
  getUserNotifications,
  markAsRead,
  getUnreadCount,
  sendBulkNotifications
};