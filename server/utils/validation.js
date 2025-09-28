// Validation utilities for API endpoints
// Provides comprehensive input validation and sanitization

const { z } = require('zod');

// User validation schemas
const userSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100, 'Name too long'),
  email: z.string().email('Invalid email format'),
  role: z.enum(['student', 'client', 'admin'], 'Invalid role'),
  university: z.string().optional(),
  skills: z.array(z.string()).optional(),
  wallet_balance: z.number().min(0, 'Balance cannot be negative').optional(),
  escrow_balance: z.number().min(0, 'Escrow balance cannot be negative').optional()
});

// Project validation schemas
const projectSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters').max(200, 'Title too long'),
  description: z.string().min(20, 'Description must be at least 20 characters').max(5000, 'Description too long'),
  required_skills: z.array(z.string()).min(1, 'At least one skill required'),
  budget_min: z.number().min(25, 'Minimum budget is $25'),
  budget_max: z.number().min(25, 'Maximum budget is $25').optional(),
  is_fixed_budget: z.boolean(),
  deadline: z.string().datetime('Invalid deadline format'),
  project_type: z.enum(['individual', 'team'], 'Invalid project type'),
  category: z.string().optional(),
  estimated_hours: z.number().min(1, 'Estimated hours must be at least 1').optional(),
  is_urgent: z.boolean().optional()
});

// Milestone validation schema
const milestoneSchema = z.object({
  title: z.string().min(3, 'Milestone title must be at least 3 characters'),
  description: z.string().optional(),
  percentage: z.number().min(0, 'Percentage must be positive').max(100, 'Percentage cannot exceed 100%'),
  due_date: z.string().datetime('Invalid due date format')
});

// Bid/Proposal validation schema
const bidSchema = z.object({
  project_id: z.string().uuid('Invalid project ID'),
  proposer_type: z.enum(['user', 'team'], 'Invalid proposer type'),
  proposer_id: z.string().uuid('Invalid proposer ID'),
  price: z.number().min(1, 'Price must be at least $1'),
  eta_days: z.number().min(1, 'ETA must be at least 1 day').max(365, 'ETA cannot exceed 365 days'),
  pitch: z.string().min(10, 'Pitch must be at least 10 characters').max(1000, 'Pitch too long'),
  portfolio_url: z.string().url('Invalid portfolio URL').optional(),
  message: z.string().max(500, 'Message too long').optional()
});

// Team validation schema
const teamSchema = z.object({
  name: z.string().min(3, 'Team name must be at least 3 characters').max(100, 'Team name too long'),
  description: z.string().max(500, 'Description too long').optional(),
  skills: z.array(z.string()).optional()
});

// Escrow validation schemas
const escrowDepositSchema = z.object({
  amount: z.number().min(1, 'Amount must be at least $1').max(100000, 'Amount too large')
});

const milestoneReleaseSchema = z.object({
  percent: z.number().min(0, 'Percentage must be positive').max(100, 'Percentage cannot exceed 100%').optional()
});

// Chat validation schema
const chatMessageSchema = z.object({
  text: z.string().min(1, 'Message cannot be empty').max(2000, 'Message too long'),
  file_url: z.string().url('Invalid file URL').optional()
});

// Admin validation schemas
const disputeResolutionSchema = z.object({
  status: z.enum(['resolved', 'rejected'], 'Invalid status'),
  resolution: z.string().min(10, 'Resolution must be at least 10 characters').optional(),
  action: z.string().optional()
});

const balanceAdjustmentSchema = z.object({
  toType: z.enum(['user', 'team'], 'Invalid adjustment type'),
  toId: z.string().uuid('Invalid ID'),
  amount: z.number().min(-100000, 'Amount too large').max(100000, 'Amount too large'),
  reason: z.string().min(10, 'Reason must be at least 10 characters')
});

const userStatusUpdateSchema = z.object({
  is_active: z.boolean(),
  reason: z.string().min(10, 'Reason must be at least 10 characters')
});

// Validation middleware factory
const createValidationMiddleware = (schema) => {
  return (req, res, next) => {
    try {
      const validatedData = schema.parse(req.body);
      req.validatedData = validatedData;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }));
        
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors
        });
      }
      
      return res.status(500).json({
        success: false,
        error: 'Validation error',
        details: ['Internal validation error']
      });
    }
  };
};

// Sanitization utilities
const sanitizeInput = (input) => {
  if (typeof input === 'string') {
    return input.trim().replace(/[<>]/g, '');
  }
  return input;
};

const sanitizeObject = (obj) => {
  const sanitized = {};
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      sanitized[key] = sanitizeInput(value);
    } else if (Array.isArray(value)) {
      sanitized[key] = value.map(item => 
        typeof item === 'string' ? sanitizeInput(item) : item
      );
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeObject(value);
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
};

// Rate limiting validation
const validateRateLimit = (req, res, next) => {
  const rateLimitKey = `rate_limit_${req.user?.id || req.ip}`;
  const now = Date.now();
  const windowMs = 15 * 60 * 1000; // 15 minutes
  const maxRequests = 100;

  // This would integrate with Redis or similar in production
  // For now, we'll use a simple in-memory approach
  if (!global.rateLimitStore) {
    global.rateLimitStore = new Map();
  }

  const userRequests = global.rateLimitStore.get(rateLimitKey) || [];
  const recentRequests = userRequests.filter(time => now - time < windowMs);

  if (recentRequests.length >= maxRequests) {
    return res.status(429).json({
      success: false,
      error: 'Rate limit exceeded',
      details: ['Too many requests. Please try again later.']
    });
  }

  recentRequests.push(now);
  global.rateLimitStore.set(rateLimitKey, recentRequests);
  next();
};

// File upload validation
const validateFileUpload = (req, res, next) => {
  if (!req.file) {
    return next();
  }

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

  const maxSize = 10 * 1024 * 1024; // 10MB

  if (!allowedTypes.includes(req.file.mimetype)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid file type',
      details: ['File type not allowed']
    });
  }

  if (req.file.size > maxSize) {
    return res.status(400).json({
      success: false,
      error: 'File too large',
      details: ['File size must be less than 10MB']
    });
  }

  next();
};

// Business logic validation
const validateMilestonePercentages = (milestones) => {
  if (!milestones || milestones.length === 0) {
    return { valid: true };
  }

  const totalPercentage = milestones.reduce((sum, milestone) => {
    return sum + (parseFloat(milestone.percentage) || 0);
  }, 0);

  if (Math.abs(totalPercentage - 100) > 0.01) {
    return {
      valid: false,
      error: 'Milestone percentages must sum to 100%',
      details: [`Current total: ${totalPercentage.toFixed(2)}%`]
    };
  }

  return { valid: true };
};

const validateBudgetRange = (budgetMin, budgetMax, isFixedBudget) => {
  if (isFixedBudget) {
    if (budgetMin <= 0) {
      return {
        valid: false,
        error: 'Fixed budget must be greater than 0'
      };
    }
  } else {
    if (budgetMin <= 0 || budgetMax <= 0) {
      return {
        valid: false,
        error: 'Budget range values must be greater than 0'
      };
    }
    if (budgetMin >= budgetMax) {
      return {
        valid: false,
        error: 'Minimum budget must be less than maximum budget'
      };
    }
  }

  return { valid: true };
};

const validateEscrowAmount = (amount, userBalance) => {
  if (amount <= 0) {
    return {
      valid: false,
      error: 'Amount must be greater than 0'
    };
  }

  if (amount > userBalance) {
    return {
      valid: false,
      error: 'Insufficient balance',
      details: [`Available: $${userBalance}, Requested: $${amount}`]
    };
  }

  return { valid: true };
};

// Export validation middleware
module.exports = {
  // Schemas
  userSchema,
  projectSchema,
  milestoneSchema,
  bidSchema,
  teamSchema,
  escrowDepositSchema,
  milestoneReleaseSchema,
  chatMessageSchema,
  disputeResolutionSchema,
  balanceAdjustmentSchema,
  userStatusUpdateSchema,

  // Middleware
  createValidationMiddleware,
  validateRateLimit,
  validateFileUpload,

  // Utilities
  sanitizeInput,
  sanitizeObject,
  validateMilestonePercentages,
  validateBudgetRange,
  validateEscrowAmount
};
