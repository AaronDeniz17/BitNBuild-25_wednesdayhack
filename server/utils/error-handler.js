// Error handling middleware for GigCampus
// Provides consistent error handling across routes

const handleError = (error, req, res) => {
  console.error(`Error occurred in ${req.method} ${req.url}:`, error);
  
  // Determine error type and appropriate response
  if (error.name === 'FirebaseError') {
    // Handle Firebase specific errors
    console.error('Firebase error details:', error.code, error.message);
    return res.status(500).json({
      success: false,
      error: 'Database operation failed',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
  
  if (error.name === 'ValidationError') {
    // Handle validation errors
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: error.message
    });
  }
  
  // Default error response
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    details: process.env.NODE_ENV === 'development' ? error.message : undefined
  });
};

module.exports = handleError;