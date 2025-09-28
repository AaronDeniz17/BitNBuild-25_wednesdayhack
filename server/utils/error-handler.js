// Enhanced error handling utilities
// Provides comprehensive error handling, logging, and user-friendly error responses

const { admin } = require('../config/firebase');

// Error types
const ERROR_TYPES = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  AUTHENTICATION_ERROR: 'AUTHENTICATION_ERROR',
  AUTHORIZATION_ERROR: 'AUTHORIZATION_ERROR',
  NOT_FOUND_ERROR: 'NOT_FOUND_ERROR',
  CONFLICT_ERROR: 'CONFLICT_ERROR',
  RATE_LIMIT_ERROR: 'RATE_LIMIT_ERROR',
  EXTERNAL_SERVICE_ERROR: 'EXTERNAL_SERVICE_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR',
  BUSINESS_LOGIC_ERROR: 'BUSINESS_LOGIC_ERROR',
  INTERNAL_SERVER_ERROR: 'INTERNAL_SERVER_ERROR'
};

// Custom error class
class AppError extends Error {
  constructor(message, type, statusCode = 500, details = null) {
    super(message);
    this.name = 'AppError';
    this.type = type;
    this.statusCode = statusCode;
    this.details = details;
    this.isOperational = true;
  }
}

// Error factory functions
const createValidationError = (message, details = null) => {
  return new AppError(message, ERROR_TYPES.VALIDATION_ERROR, 400, details);
};

const createAuthenticationError = (message = 'Authentication required') => {
  return new AppError(message, ERROR_TYPES.AUTHENTICATION_ERROR, 401);
};

const createAuthorizationError = (message = 'Access denied') => {
  return new AppError(message, ERROR_TYPES.AUTHORIZATION_ERROR, 403);
};

const createNotFoundError = (resource = 'Resource') => {
  return new AppError(`${resource} not found`, ERROR_TYPES.NOT_FOUND_ERROR, 404);
};

const createConflictError = (message, details = null) => {
  return new AppError(message, ERROR_TYPES.CONFLICT_ERROR, 409, details);
};

const createRateLimitError = (message = 'Rate limit exceeded') => {
  return new AppError(message, ERROR_TYPES.RATE_LIMIT_ERROR, 429);
};

const createExternalServiceError = (service, message) => {
  return new AppError(
    `External service error: ${service}`,
    ERROR_TYPES.EXTERNAL_SERVICE_ERROR,
    502,
    { service, originalMessage: message }
  );
};

const createDatabaseError = (operation, message) => {
  return new AppError(
    `Database error during ${operation}`,
    ERROR_TYPES.DATABASE_ERROR,
    500,
    { operation, originalMessage: message }
  );
};

const createBusinessLogicError = (message, details = null) => {
  return new AppError(message, ERROR_TYPES.BUSINESS_LOGIC_ERROR, 422, details);
};

// Error logging
const logError = async (error, req = null) => {
  const errorLog = {
    timestamp: new Date().toISOString(),
    type: error.type || 'UNKNOWN',
    message: error.message,
    stack: error.stack,
    statusCode: error.statusCode || 500,
    details: error.details,
    request: req ? {
      method: req.method,
      url: req.url,
      userAgent: req.get('User-Agent'),
      ip: req.ip,
      userId: req.user?.id
    } : null
  };

  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.error('Error Log:', errorLog);
  }

  // In production, you might want to send to external logging service
  // For now, we'll store in Firestore for debugging
  try {
    await admin.firestore().collection('error_logs').add(errorLog);
  } catch (logError) {
    console.error('Failed to log error:', logError);
  }
};

// Error response formatter
const formatErrorResponse = (error, req = null) => {
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  const response = {
      success: false,
    error: {
      code: error.type || 'INTERNAL_SERVER_ERROR',
      message: error.message || 'Internal server error',
      statusCode: error.statusCode || 500
    }
  };

  // Add details in development or for specific error types
  if (isDevelopment || error.details) {
    response.error.details = error.details;
  }

  // Add stack trace in development
  if (isDevelopment && error.stack) {
    response.error.stack = error.stack;
  }

  // Add request info in development
  if (isDevelopment && req) {
    response.error.request = {
      method: req.method,
      url: req.url,
      body: req.body,
      query: req.query,
      params: req.params
    };
  }

  return response;
};

// Global error handler middleware
const globalErrorHandler = async (err, req, res, next) => {
  // Log the error
  await logError(err, req);

  // Handle specific error types
  if (err instanceof AppError) {
    return res.status(err.statusCode).json(formatErrorResponse(err, req));
  }

  // Handle Firestore errors
  if (err.code && err.code.startsWith('firestore/')) {
    const firestoreError = createDatabaseError('Firestore operation', err.message);
    return res.status(firestoreError.statusCode).json(formatErrorResponse(firestoreError, req));
  }

  // Handle Firebase Auth errors
  if (err.code && err.code.startsWith('auth/')) {
    const authError = createAuthenticationError(`Authentication error: ${err.message}`);
    return res.status(authError.statusCode).json(formatErrorResponse(authError, req));
  }

    // Handle validation errors
  if (err.name === 'ValidationError') {
    const validationError = createValidationError('Validation failed', err.details);
    return res.status(validationError.statusCode).json(formatErrorResponse(validationError, req));
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    const jwtError = createAuthenticationError('Invalid token');
    return res.status(jwtError.statusCode).json(formatErrorResponse(jwtError, req));
  }

  if (err.name === 'TokenExpiredError') {
    const tokenError = createAuthenticationError('Token expired');
    return res.status(tokenError.statusCode).json(formatErrorResponse(tokenError, req));
  }

  // Handle multer errors (file upload)
  if (err.code === 'LIMIT_FILE_SIZE') {
    const fileError = createValidationError('File too large', ['Maximum file size is 10MB']);
    return res.status(fileError.statusCode).json(formatErrorResponse(fileError, req));
  }

  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    const fileError = createValidationError('Unexpected file field');
    return res.status(fileError.statusCode).json(formatErrorResponse(fileError, req));
  }

  // Handle rate limiting errors
  if (err.statusCode === 429) {
    const rateLimitError = createRateLimitError('Too many requests');
    return res.status(rateLimitError.statusCode).json(formatErrorResponse(rateLimitError, req));
  }

  // Default to internal server error
  const internalError = new AppError(
    'Internal server error',
    ERROR_TYPES.INTERNAL_SERVER_ERROR,
    500
  );

  return res.status(internalError.statusCode).json(formatErrorResponse(internalError, req));
};

// Async error wrapper
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Business logic error handlers
const handleEscrowError = (error, operation) => {
  if (error.message.includes('Insufficient')) {
    return createBusinessLogicError('Insufficient funds for escrow operation', {
      operation,
      availableBalance: error.availableBalance,
      requestedAmount: error.requestedAmount
    });
  }

  if (error.message.includes('Unauthorized')) {
    return createAuthorizationError('Only project owner can perform escrow operations');
  }

  if (error.message.includes('not found')) {
    return createNotFoundError('Project or milestone');
  }

  return createBusinessLogicError(`Escrow operation failed: ${error.message}`, { operation });
};

const handleRecommendationError = (error) => {
  if (error.message.includes('User not found')) {
    return createNotFoundError('User');
  }

  return createBusinessLogicError(`Recommendation service error: ${error.message}`);
};

const handleChatError = (error, operation) => {
  if (error.message.includes('Access denied')) {
    return createAuthorizationError('You do not have access to this project chat');
  }

  if (error.message.includes('File upload failed')) {
    return createExternalServiceError('File Storage', error.message);
  }

  return createBusinessLogicError(`Chat operation failed: ${error.message}`, { operation });
};

// Error recovery utilities
const retryOperation = async (operation, maxRetries = 3, delay = 1000) => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      if (attempt === maxRetries) {
        throw error;
      }
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay * attempt));
    }
  }
};

const safeAsyncOperation = async (operation, fallback = null) => {
  try {
    return await operation();
  } catch (error) {
    await logError(error);
    return fallback;
  }
};

// Error monitoring and alerting
const shouldAlert = (error) => {
  // Alert on critical errors
  const criticalTypes = [
    ERROR_TYPES.DATABASE_ERROR,
    ERROR_TYPES.EXTERNAL_SERVICE_ERROR,
    ERROR_TYPES.INTERNAL_SERVER_ERROR
  ];

  return criticalTypes.includes(error.type) && error.statusCode >= 500;
};

const sendAlert = async (error) => {
  if (!shouldAlert(error)) return;

  // In production, you would send alerts to monitoring services
  // For now, we'll just log critical errors
  console.error('CRITICAL ERROR ALERT:', {
    type: error.type,
    message: error.message,
    timestamp: new Date().toISOString(),
    statusCode: error.statusCode
  });

  // You could integrate with services like:
  // - Sentry for error tracking
  // - Slack for team notifications
  // - Email for critical alerts
};

// Export all utilities
module.exports = {
  // Error types
  ERROR_TYPES,

  // Custom error class
  AppError,

  // Error factory functions
  createValidationError,
  createAuthenticationError,
  createAuthorizationError,
  createNotFoundError,
  createConflictError,
  createRateLimitError,
  createExternalServiceError,
  createDatabaseError,
  createBusinessLogicError,

  // Error handling utilities
  logError,
  formatErrorResponse,
  globalErrorHandler,
  asyncHandler,

  // Business logic error handlers
  handleEscrowError,
  handleRecommendationError,
  handleChatError,

  // Error recovery
  retryOperation,
  safeAsyncOperation,

  // Monitoring
  shouldAlert,
  sendAlert
};