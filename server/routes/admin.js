// Admin routes for GigCampus
// Handles administrative functions and platform management

const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { admin, db } = require('../config/firebase');
const { auth, adminAuth } = require('../middleware/auth');

const router = express.Router();

// Apply admin authentication to all routes
router.use(adminAuth);

/**
 * GET /api/admin/dashboard
 * Get admin dashboard statistics
 */
router.get('/dashboard', async (req, res) => {
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
      default:
        startDate.setDate(startDate.getDate() - 30);
    }

    const startTimestamp = admin.firestore.Timestamp.fromDate(startDate);

    // Get various statistics
    const [
      usersSnapshot,
      projectsSnapshot,
      contractsSnapshot,
      transactionsSnapshot,
      recentUsersSnapshot,
      recentProjectsSnapshot,
      reportsSnapshot
    ] = await Promise.all([
      // Total users and new users
      db.collection('users').get(),
      // Total projects and new projects
      db.collection('projects').get(),
      // Total contracts and active contracts
      db.collection('contracts').get(),
      // Transactions in period
      db.collection('transactions')
        .where('created_at', '>=', startTimestamp)
        .where('status', '==', 'completed')
        .get(),
      // New users in period
      db.collection('users')
        .where('created_at', '>=', startTimestamp)
        .get(),
      // New projects in period
      db.collection('projects')
        .where('created_at', '>=', startTimestamp)
        .get(),
      // Pending reports
      db.collection('reports')
        .where('status', '==', 'pending')
        .get()
    ]);

    // Calculate statistics
    const totalUsers = usersSnapshot.size;
    const newUsers = recentUsersSnapshot.size;
    
    const totalProjects = projectsSnapshot.size;
    const newProjects = recentProjectsSnapshot.size;
    
    const totalContracts = contractsSnapshot.size;
    const activeContracts = contractsSnapshot.docs.filter(doc => 
      doc.data().status === 'active'
    ).length;
    
    const transactions = transactionsSnapshot.docs.map(doc => doc.data());
    const totalRevenue = transactions.reduce((sum, t) => sum + (t.amount || 0), 0);
    const platformFees = transactions
      .filter(t => t.type === 'platform_fee')
      .reduce((sum, t) => sum + (t.amount || 0), 0);
    
    const pendingReports = reportsSnapshot.size;

    // User distribution by university
    const universityDistribution = {};
    usersSnapshot.docs.forEach(doc => {
      const userData = doc.data();
      const university = userData.university || 'Unknown';
      universityDistribution[university] = (universityDistribution[university] || 0) + 1;
    });

    // Project status distribution
    const projectStatusDistribution = {};
    projectsSnapshot.docs.forEach(doc => {
      const projectData = doc.data();
      const status = projectData.status || 'unknown';
      projectStatusDistribution[status] = (projectStatusDistribution[status] || 0) + 1;
    });

    res.json({
      success: true,
      data: {
        period,
        users: {
          total: totalUsers,
          new: newUsers,
          growth_rate: totalUsers > 0 ? Math.round((newUsers / totalUsers) * 100) : 0
        },
        projects: {
          total: totalProjects,
          new: newProjects,
          status_distribution: projectStatusDistribution
        },
        contracts: {
          total: totalContracts,
          active: activeContracts
        },
        financial: {
          total_revenue: Math.round(totalRevenue * 100) / 100,
          platform_fees: Math.round(platformFees * 100) / 100,
          transaction_count: transactions.length
        },
        moderation: {
          pending_reports: pendingReports
        },
        university_distribution: Object.entries(universityDistribution)
          .sort(([,a], [,b]) => b - a)
          .slice(0, 10)
          .reduce((obj, [key, value]) => ({ ...obj, [key]: value }), {})
      }
    });

  } catch (error) {
    console.error('Admin dashboard error:', error);
    res.status(500).json({ error: 'Failed to get dashboard statistics' });
  }
});

/**
 * GET /api/admin/users
 * Get all users with filtering and pagination
 */
router.get('/users', async (req, res) => {
  try {
    const { 
      search, 
      university, 
      role, 
      status, 
      sort_by = 'created_at', 
      sort_order = 'desc',
      page = 1, 
      limit = 50 
    } = req.query;

    let query = db.collection('users');

    // Apply filters
    if (university) {
      query = query.where('university', '==', university);
    }

    if (role && role !== 'all') {
      query = query.where('role', '==', role);
    }

    if (status && status !== 'all') {
      query = query.where('status', '==', status);
    }

    // Apply sorting
    const sortDirection = sort_order === 'asc' ? 'asc' : 'desc';
    query = query.orderBy(sort_by, sortDirection);

    // Pagination
    const pageSize = Math.min(parseInt(limit), 100);
    const offset = (parseInt(page) - 1) * pageSize;
    
    query = query.limit(pageSize).offset(offset);

    const snapshot = await query.get();
    let users = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Apply search filter (client-side for now)
    if (search) {
      const searchTerm = search.toLowerCase();
      users = users.filter(user => 
        user.display_name?.toLowerCase().includes(searchTerm) ||
        user.email?.toLowerCase().includes(searchTerm) ||
        user.university?.toLowerCase().includes(searchTerm)
      );
    }

    // Remove sensitive data
    const safeUsers = users.map(user => {
      const { password, ...safeUser } = user;
      return safeUser;
    });

    res.json({
      success: true,
      data: safeUsers,
      pagination: {
        page: parseInt(page),
        limit: pageSize,
        total: snapshot.size
      }
    });

  } catch (error) {
    console.error('Admin get users error:', error);
    res.status(500).json({ error: 'Failed to get users' });
  }
});

/**
 * PUT /api/admin/users/:id/status
 * Update user status (suspend, activate, etc.)
 */
router.put('/users/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, reason } = req.body;

    if (!status || !['active', 'suspended', 'banned'].includes(status)) {
      return res.status(400).json({ error: 'Valid status is required (active, suspended, banned)' });
    }

    const userDoc = await db.collection('users').doc(id).get();
    
    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User not found' });
    }

    const updateData = {
      status,
      status_updated_at: admin.firestore.FieldValue.serverTimestamp(),
      status_updated_by: req.user.id,
      updated_at: admin.firestore.FieldValue.serverTimestamp()
    };

    if (reason) {
      updateData.status_reason = reason;
    }

    await db.collection('users').doc(id).update(updateData);

    // Log admin action
    const logId = uuidv4();
    await db.collection('admin_logs').doc(logId).set({
      id: logId,
      admin_id: req.user.id,
      action: 'user_status_update',
      target_type: 'user',
      target_id: id,
      details: { status, reason },
      created_at: admin.firestore.FieldValue.serverTimestamp()
    });

    res.json({
      success: true,
      message: `User status updated to ${status}`
    });

  } catch (error) {
    console.error('Update user status error:', error);
    res.status(500).json({ error: 'Failed to update user status' });
  }
});

/**
 * GET /api/admin/projects
 * Get all projects with filtering
 */
router.get('/projects', async (req, res) => {
  try {
    const { 
      status, 
      university,
      flagged,
      sort_by = 'created_at', 
      sort_order = 'desc',
      page = 1, 
      limit = 50 
    } = req.query;

    let query = db.collection('projects');

    // Apply filters
    if (status && status !== 'all') {
      query = query.where('status', '==', status);
    }

    if (flagged === 'true') {
      query = query.where('flagged', '==', true);
    }

    // Apply sorting
    const sortDirection = sort_order === 'asc' ? 'asc' : 'desc';
    query = query.orderBy(sort_by, sortDirection);

    // Pagination
    const pageSize = Math.min(parseInt(limit), 100);
    const offset = (parseInt(page) - 1) * pageSize;
    
    query = query.limit(pageSize).offset(offset);

    const snapshot = await query.get();
    const projects = [];

    for (const doc of snapshot.docs) {
      const projectData = doc.data();
      
      // Get client info
      const clientDoc = await db.collection('users').doc(projectData.client_id).get();
      const clientData = clientDoc.exists ? clientDoc.data() : null;

      projects.push({
        id: doc.id,
        ...projectData,
        client: clientData ? {
          id: projectData.client_id,
          name: clientData.display_name,
          university: clientData.university
        } : null
      });
    }

    res.json({
      success: true,
      data: projects,
      pagination: {
        page: parseInt(page),
        limit: pageSize,
        total: snapshot.size
      }
    });

  } catch (error) {
    console.error('Admin get projects error:', error);
    res.status(500).json({ error: 'Failed to get projects' });
  }
});

/**
 * PUT /api/admin/projects/:id/flag
 * Flag or unflag a project
 */
router.put('/projects/:id/flag', async (req, res) => {
  try {
    const { id } = req.params;
    const { flagged, reason } = req.body;

    const projectDoc = await db.collection('projects').doc(id).get();
    
    if (!projectDoc.exists) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const updateData = {
      flagged: Boolean(flagged),
      flag_updated_at: admin.firestore.FieldValue.serverTimestamp(),
      flag_updated_by: req.user.id,
      updated_at: admin.firestore.FieldValue.serverTimestamp()
    };

    if (reason) {
      updateData.flag_reason = reason;
    }

    await db.collection('projects').doc(id).update(updateData);

    // Log admin action
    const logId = uuidv4();
    await db.collection('admin_logs').doc(logId).set({
      id: logId,
      admin_id: req.user.id,
      action: flagged ? 'project_flagged' : 'project_unflagged',
      target_type: 'project',
      target_id: id,
      details: { reason },
      created_at: admin.firestore.FieldValue.serverTimestamp()
    });

    res.json({
      success: true,
      message: `Project ${flagged ? 'flagged' : 'unflagged'} successfully`
    });

  } catch (error) {
    console.error('Flag project error:', error);
    res.status(500).json({ error: 'Failed to update project flag status' });
  }
});

/**
 * GET /api/admin/reports
 * Get user reports and flags
 */
router.get('/reports', async (req, res) => {
  try {
    const { 
      type, 
      status = 'pending', 
      sort_by = 'created_at', 
      sort_order = 'desc',
      page = 1, 
      limit = 50 
    } = req.query;

    let query = db.collection('reports');

    // Apply filters
    if (type && type !== 'all') {
      query = query.where('type', '==', type);
    }

    if (status && status !== 'all') {
      query = query.where('status', '==', status);
    }

    // Apply sorting
    const sortDirection = sort_order === 'asc' ? 'asc' : 'desc';
    query = query.orderBy(sort_by, sortDirection);

    // Pagination
    const pageSize = Math.min(parseInt(limit), 100);
    const offset = (parseInt(page) - 1) * pageSize;
    
    query = query.limit(pageSize).offset(offset);

    const snapshot = await query.get();
    const reports = [];

    for (const doc of snapshot.docs) {
      const reportData = doc.data();
      
      // Get reporter info
      const reporterDoc = await db.collection('users').doc(reportData.reporter_id).get();
      const reporterData = reporterDoc.exists ? reporterDoc.data() : null;

      // Get reported user info
      let reportedUser = null;
      if (reportData.reported_user_id) {
        const reportedUserDoc = await db.collection('users').doc(reportData.reported_user_id).get();
        reportedUser = reportedUserDoc.exists ? reportedUserDoc.data() : null;
      }

      reports.push({
        id: doc.id,
        ...reportData,
        reporter: reporterData ? {
          id: reportData.reporter_id,
          name: reporterData.display_name,
          university: reporterData.university
        } : null,
        reported_user: reportedUser ? {
          id: reportData.reported_user_id,
          name: reportedUser.display_name,
          university: reportedUser.university
        } : null
      });
    }

    res.json({
      success: true,
      data: reports,
      pagination: {
        page: parseInt(page),
        limit: pageSize,
        total: snapshot.size
      }
    });

  } catch (error) {
    console.error('Admin get reports error:', error);
    res.status(500).json({ error: 'Failed to get reports' });
  }
});

/**
 * PUT /api/admin/reports/:id/resolve
 * Resolve a user report
 */
router.put('/reports/:id/resolve', async (req, res) => {
  try {
    const { id } = req.params;
    const { resolution, action_taken, notes } = req.body;

    if (!resolution || !['dismissed', 'warning_issued', 'user_suspended', 'content_removed'].includes(resolution)) {
      return res.status(400).json({ 
        error: 'Valid resolution is required (dismissed, warning_issued, user_suspended, content_removed)' 
      });
    }

    const reportDoc = await db.collection('reports').doc(id).get();
    
    if (!reportDoc.exists) {
      return res.status(404).json({ error: 'Report not found' });
    }

    const updateData = {
      status: 'resolved',
      resolution,
      action_taken: action_taken || '',
      resolution_notes: notes || '',
      resolved_at: admin.firestore.FieldValue.serverTimestamp(),
      resolved_by: req.user.id,
      updated_at: admin.firestore.FieldValue.serverTimestamp()
    };

    await db.collection('reports').doc(id).update(updateData);

    // Log admin action
    const logId = uuidv4();
    await db.collection('admin_logs').doc(logId).set({
      id: logId,
      admin_id: req.user.id,
      action: 'report_resolved',
      target_type: 'report',
      target_id: id,
      details: { resolution, action_taken, notes },
      created_at: admin.firestore.FieldValue.serverTimestamp()
    });

    res.json({
      success: true,
      message: 'Report resolved successfully'
    });

  } catch (error) {
    console.error('Resolve report error:', error);
    res.status(500).json({ error: 'Failed to resolve report' });
  }
});

/**
 * GET /api/admin/transactions
 * Get all transactions for monitoring
 */
router.get('/transactions', async (req, res) => {
  try {
    const { 
      type, 
      status, 
      user_id,
      amount_min,
      amount_max,
      page = 1, 
      limit = 50 
    } = req.query;

    let query = db.collection('transactions');

    // Apply filters
    if (type && type !== 'all') {
      query = query.where('type', '==', type);
    }

    if (status && status !== 'all') {
      query = query.where('status', '==', status);
    }

    if (user_id) {
      // This would need compound queries or client-side filtering
      // For now, we'll handle it client-side
    }

    query = query.orderBy('created_at', 'desc');

    // Pagination
    const pageSize = Math.min(parseInt(limit), 100);
    const offset = (parseInt(page) - 1) * pageSize;
    
    query = query.limit(pageSize).offset(offset);

    const snapshot = await query.get();
    let transactions = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Apply client-side filters
    if (user_id) {
      transactions = transactions.filter(t => 
        t.from_user_id === user_id || t.to_user_id === user_id
      );
    }

    if (amount_min) {
      transactions = transactions.filter(t => t.amount >= parseFloat(amount_min));
    }

    if (amount_max) {
      transactions = transactions.filter(t => t.amount <= parseFloat(amount_max));
    }

    // Enrich with user data
    const enrichedTransactions = await Promise.all(
      transactions.map(async (transaction) => {
        const [fromUserDoc, toUserDoc] = await Promise.all([
          transaction.from_user_id ? db.collection('users').doc(transaction.from_user_id).get() : null,
          transaction.to_user_id ? db.collection('users').doc(transaction.to_user_id).get() : null
        ]);

        return {
          ...transaction,
          from_user: fromUserDoc?.exists ? {
            id: transaction.from_user_id,
            name: fromUserDoc.data().display_name,
            email: fromUserDoc.data().email
          } : null,
          to_user: toUserDoc?.exists ? {
            id: transaction.to_user_id,
            name: toUserDoc.data().display_name,
            email: toUserDoc.data().email
          } : null
        };
      })
    );

    res.json({
      success: true,
      data: enrichedTransactions,
      pagination: {
        page: parseInt(page),
        limit: pageSize,
        total: snapshot.size
      }
    });

  } catch (error) {
    console.error('Admin get transactions error:', error);
    res.status(500).json({ error: 'Failed to get transactions' });
  }
});

/**
 * GET /api/admin/logs
 * Get admin action logs
 */
router.get('/logs', async (req, res) => {
  try {
    const { 
      admin_id, 
      action, 
      target_type,
      page = 1, 
      limit = 50 
    } = req.query;

    let query = db.collection('admin_logs');

    // Apply filters
    if (admin_id) {
      query = query.where('admin_id', '==', admin_id);
    }

    if (action && action !== 'all') {
      query = query.where('action', '==', action);
    }

    if (target_type && target_type !== 'all') {
      query = query.where('target_type', '==', target_type);
    }

    query = query.orderBy('created_at', 'desc');

    // Pagination
    const pageSize = Math.min(parseInt(limit), 100);
    const offset = (parseInt(page) - 1) * pageSize;
    
    query = query.limit(pageSize).offset(offset);

    const snapshot = await query.get();
    const logs = [];

    for (const doc of snapshot.docs) {
      const logData = doc.data();
      
      // Get admin info
      const adminDoc = await db.collection('users').doc(logData.admin_id).get();
      const adminData = adminDoc.exists ? adminDoc.data() : null;

      logs.push({
        id: doc.id,
        ...logData,
        admin: adminData ? {
          id: logData.admin_id,
          name: adminData.display_name,
          email: adminData.email
        } : null
      });
    }

    res.json({
      success: true,
      data: logs,
      pagination: {
        page: parseInt(page),
        limit: pageSize,
        total: snapshot.size
      }
    });

  } catch (error) {
    console.error('Admin get logs error:', error);
    res.status(500).json({ error: 'Failed to get admin logs' });
  }
});

module.exports = router;