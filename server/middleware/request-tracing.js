// Request tracing middleware for GigCampus
// Adds request ID and timing information to help debug API calls

const uuid = require('uuid');

const requestTracing = (req, res, next) => {
  // Add request ID
  req.requestId = uuid.v4();
  
  // Add timestamp
  req.requestTime = Date.now();
  
  // Log request start
  console.log(`[${req.requestId}] ${new Date().toISOString()} - START ${req.method} ${req.url}`);
  
  // Log request parameters
  if (Object.keys(req.params).length > 0) {
    console.log(`[${req.requestId}] Parameters:`, req.params);
  }
  
  // Log query parameters
  if (Object.keys(req.query).length > 0) {
    console.log(`[${req.requestId}] Query:`, req.query);
  }
  
  // Add response logging
  const originalSend = res.send;
  res.send = function (body) {
    // Log response time
    const duration = Date.now() - req.requestTime;
    console.log(`[${req.requestId}] ${new Date().toISOString()} - END ${req.method} ${req.url} (${duration}ms)`);
    
    // Log response status
    console.log(`[${req.requestId}] Status:`, res.statusCode);
    
    // Call original send
    return originalSend.call(this, body);
  };
  
  next();
};

module.exports = requestTracing;