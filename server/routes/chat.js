// Chat routes for real-time project communication
// Handles messaging and file uploads with adapter pattern

const express = require('express');
const multer = require('multer');
const { auth } = require('../middleware/auth');
const { chatService } = require('../services/ChatService');
const { fileStorageService } = require('../services/FileStorageService');

const router = express.Router();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow common file types
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'application/pdf',
      'text/plain',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/zip',
      'application/x-rar-compressed'
    ];

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('File type not allowed'), false);
    }
  }
});

/**
 * POST /api/chat/:projectId/messages
 * Send a message to project chat
 */
router.post('/:projectId/messages', auth, upload.single('file'), async (req, res) => {
  try {
    const { projectId } = req.params;
    const { text } = req.body;
    const senderId = req.user.id;

    // Validate inputs
    if (!text && !req.file) {
      return res.status(400).json({
        success: false,
        error: 'Message content required',
        details: ['Either text or file must be provided']
      });
    }

    let fileUrl = null;

    // Handle file upload if present
    if (req.file) {
      try {
        const uploadResult = await fileStorageService.uploadFile(
          req.file,
          'chat-files',
          projectId
        );

        if (uploadResult.success) {
          fileUrl = uploadResult.fileUrl;
        } else {
          throw new Error('File upload failed');
        }
      } catch (error) {
        console.error('File upload error:', error);
        return res.status(500).json({
          success: false,
          error: 'File upload failed',
          details: [error.message]
        });
      }
    }

    // Send message
    const result = await chatService.sendMessage(projectId, senderId, text, fileUrl);

    res.json(result);

  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send message',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * GET /api/chat/:projectId/messages
 * Get messages for a project
 */
router.get('/:projectId/messages', auth, async (req, res) => {
  try {
    const { projectId } = req.params;
    const { limit = 50 } = req.query;

    // Verify user has access to this project
    const projectDoc = await require('../config/firebase').db.collection('projects').doc(projectId).get();
    
    if (!projectDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Project not found'
      });
    }

    const project = projectDoc.data();
    
    // Check if user is project owner or assigned freelancer
    const isOwner = project.client_id === req.user.id;
    const isAssigned = await checkUserAssignment(projectId, req.user.id);
    
    if (!isOwner && !isAssigned) {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
        details: ['You do not have access to this project chat']
      });
    }

    const result = await chatService.getMessages(projectId, parseInt(limit));

    res.json(result);

  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get messages',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * POST /api/chat/:projectId/subscribe
 * Subscribe to real-time messages (WebSocket-like endpoint)
 */
router.post('/:projectId/subscribe', auth, async (req, res) => {
  try {
    const { projectId } = req.params;

    // Verify user has access to this project
    const projectDoc = await require('../config/firebase').db.collection('projects').doc(projectId).get();
    
    if (!projectDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Project not found'
      });
    }

    const project = projectDoc.data();
    
    // Check if user is project owner or assigned freelancer
    const isOwner = project.client_id === req.user.id;
    const isAssigned = await checkUserAssignment(projectId, req.user.id);
    
    if (!isOwner && !isAssigned) {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
        details: ['You do not have access to this project chat']
      });
    }

    // Set up Server-Sent Events for real-time updates
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control'
    });

    // Send initial connection message
    res.write(`data: ${JSON.stringify({ type: 'connected', projectId })}\n\n`);

    // Subscribe to messages
    const subscription = await chatService.subscribeToMessages(projectId, (message) => {
      try {
        res.write(`data: ${JSON.stringify({ type: 'message', data: message })}\n\n`);
      } catch (error) {
        console.error('SSE write error:', error);
      }
    });

    // Handle client disconnect
    req.on('close', () => {
      chatService.unsubscribeFromMessages(subscription);
    });

    // Keep connection alive
    const keepAlive = setInterval(() => {
      res.write(`data: ${JSON.stringify({ type: 'ping' })}\n\n`);
    }, 30000);

    req.on('close', () => {
      clearInterval(keepAlive);
    });

  } catch (error) {
    console.error('Subscribe to messages error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to subscribe to messages',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * POST /api/chat/:projectId/upload
 * Upload file to project chat
 */
router.post('/:projectId/upload', auth, upload.single('file'), async (req, res) => {
  try {
    const { projectId } = req.params;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file provided'
      });
    }

    // Verify user has access to this project
    const projectDoc = await require('../config/firebase').db.collection('projects').doc(projectId).get();
    
    if (!projectDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Project not found'
      });
    }

    const project = projectDoc.data();
    
    // Check if user is project owner or assigned freelancer
    const isOwner = project.client_id === req.user.id;
    const isAssigned = await checkUserAssignment(projectId, req.user.id);
    
    if (!isOwner && !isAssigned) {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
        details: ['You do not have access to this project']
      });
    }

    // Upload file
    const result = await fileStorageService.uploadFile(
      req.file,
      'chat-files',
      projectId
    );

    res.json(result);

  } catch (error) {
    console.error('File upload error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to upload file',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * Helper function to check if user is assigned to a project
 */
async function checkUserAssignment(projectId, userId) {
  try {
    const { db } = require('../config/firebase');
    
    // Check if user is assigned via contract
    const contractSnapshot = await db.collection('contracts')
      .where('project_id', '==', projectId)
      .where('status', '==', 'active')
      .get();

    for (const doc of contractSnapshot.docs) {
      const contract = doc.data();
      
      // Check if user is the freelancer
      if (contract.freelancer_id === userId) {
        return true;
      }
      
      // Check if user is part of the team
      if (contract.team_id) {
        const teamMemberSnapshot = await db.collection('team_members')
          .where('team_id', '==', contract.team_id)
          .where('user_id', '==', userId)
          .where('is_active', '==', true)
          .get();
          
        if (!teamMemberSnapshot.empty) {
          return true;
        }
      }
    }

    return false;

  } catch (error) {
    console.error('Check user assignment error:', error);
    return false;
  }
}

module.exports = router;