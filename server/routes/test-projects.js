// Test route for project listing
const express = require('express');
const router = express.Router();

// Debug route to verify server is working
router.get('/', (req, res) => {
  res.json({
    success: true,
    projects: [
      {
        id: 'test-1',
        title: 'Test Project 1',
        description: 'This is a test project',
        status: 'open',
        budget: 1000,
        skills: ['JavaScript', 'React'],
        createdAt: new Date().toISOString()
      }
    ],
    pagination: {
      total: 1,
      currentPage: 1,
      totalPages: 1,
      hasMore: false
    }
  });
});

module.exports = router;