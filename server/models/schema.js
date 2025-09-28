// Database Schema for GigCampus
// This file defines the data structure for all collections

/**
 * USERS COLLECTION
 * Base user information for both students and clients
 */
const userSchema = {
  id: 'string', // Firebase UID
  email: 'string',
  name: 'string',
  role: 'string', // 'student' | 'client' | 'admin'
  university_verified: 'boolean',
  university: 'string',
  created_at: 'timestamp',
  last_login: 'timestamp',
  profile_picture: 'string',
  phone: 'string',
  is_active: 'boolean',
  // New wallet and escrow fields
  wallet_balance: 'number', // Available balance
  escrow_balance: 'number', // Funds held in escrow
  skills: 'array', // User skills for matching
  updated_at: 'timestamp'
};

/**
 * STUDENT_PROFILES COLLECTION
 * Extended profile for student freelancers
 */
const studentProfileSchema = {
  user_id: 'string', // References users.id
  skills: 'array', // ['React', 'Node.js', 'Design']
  micro_skills: 'array', // ['UI/UX', 'API Design', 'Database Optimization']
  portfolio_links: 'array', // ['github.com/user', 'behance.net/user']
  availability: 'string', // 'full-time' | 'part-time' | 'weekends-only'
  hourly_rate: 'number',
  bio: 'string',
  badges: 'array', // ['verified-react', 'top-performer', 'on-time-delivery']
  reputation_score: 'number', // 0-100
  completed_projects: 'number',
  on_time_rate: 'number', // percentage
  total_earnings: 'number',
  university_major: 'string',
  graduation_year: 'number',
  linkedin_url: 'string',
  github_url: 'string',
  timezone: 'string',
  languages: 'array', // ['English', 'Spanish']
  is_available: 'boolean'
};

/**
 * PROJECTS COLLECTION
 * Client project postings
 */
const projectSchema = {
  id: 'string',
  client_id: 'string', // References users.id
  title: 'string',
  description: 'string',
  required_skills: 'array', // ['React', 'Node.js']
  budget_min: 'number', // Minimum budget
  budget_max: 'number', // Maximum budget
  is_fixed_budget: 'boolean', // true for fixed, false for range
  deadline: 'timestamp',
  milestones: 'array', // [{ title, description, percentage, due_date }]
  project_type: 'string', // 'individual' | 'team'
  status: 'string', // 'open' | 'in_progress' | 'submitted' | 'completed' | 'archived'
  created_at: 'timestamp',
  updated_at: 'timestamp',
  category: 'string', // 'web-development', 'design', 'writing', 'marketing'
  urgency: 'string', // 'low' | 'medium' | 'high'
  is_featured: 'boolean',
  tags: 'array', // ['urgent', 'long-term', 'startup']
  attachments: 'array', // File URLs
  estimated_hours: 'number',
  // New fields for enhanced functionality
  escrow_balance: 'number', // Funds held in escrow for this project
  view_count: 'number',
  save_count: 'number',
  bid_count: 'number'
};

/**
 * BIDS COLLECTION
 * Student proposals for projects
 */
const bidSchema = {
  id: 'string',
  project_id: 'string', // References projects.id
  proposer_type: 'string', // 'user' | 'team'
  proposer_id: 'string', // References users.id or teams.id
  price: 'number',
  eta_days: 'number',
  pitch: 'string', // Short proposal pitch
  portfolio_url: 'string', // Portfolio link
  status: 'string', // 'pending' | 'accepted' | 'rejected' | 'withdrawn'
  created_at: 'timestamp',
  updated_at: 'timestamp',
  // Enhanced fields
  proposed_team: 'array', // Team members if team bid
  skills_match: 'number', // Calculated skill match percentage
  previous_work: 'array', // Links to similar projects
  message: 'string' // Additional message to client
};

/**
 * CONTRACTS COLLECTION
 * Accepted bids become contracts
 */
const contractSchema = {
  id: 'string',
  project_id: 'string', // References projects.id
  accepted_bid_id: 'string', // References bids.id
  freelancer_id: 'string', // Individual freelancer
  team_id: 'string', // Team (if applicable)
  client_id: 'string', // References users.id
  status: 'string', // 'active' | 'completed' | 'disputed' | 'cancelled'
  escrow_balance: 'number',
  total_amount: 'number',
  milestones: 'array', // [{ id, title, weight_pct, status, due_date }]
  created_at: 'timestamp',
  started_at: 'timestamp',
  completed_at: 'timestamp',
  payment_terms: 'string', // 'milestone' | 'hourly' | 'fixed'
  dispute_reason: 'string',
  dispute_created_at: 'timestamp'
};

/**
 * MILESTONES COLLECTION
 * Project milestones and deliverables
 */
const milestoneSchema = {
  id: 'string',
  contract_id: 'string', // References contracts.id
  title: 'string',
  description: 'string',
  weight_pct: 'number', // Percentage of total payment
  due_date: 'timestamp',
  status: 'string', // 'pending' | 'in_progress' | 'submitted' | 'approved' | 'rejected'
  submitted_files: 'array', // File URLs
  submitted_at: 'timestamp',
  approved_at: 'timestamp',
  feedback: 'string',
  amount: 'number' // Calculated amount based on weight_pct
};

/**
 * TEAMS COLLECTION
 * Student teams for collaborative projects
 */
const teamSchema = {
  id: 'string',
  name: 'string',
  leader_id: 'string', // References users.id
  member_ids: 'array', // Array of user IDs
  skills: 'array', // Combined skills of all members
  team_wallet_balance: 'number',
  created_at: 'timestamp',
  is_active: 'boolean',
  description: 'string',
  portfolio_links: 'array',
  reputation_score: 'number',
  completed_projects: 'number'
};

/**
 * TASKS COLLECTION
 * Individual tasks within contracts
 */
const taskSchema = {
  id: 'string',
  contract_id: 'string', // References contracts.id
  milestone_id: 'string', // References milestones.id
  title: 'string',
  description: 'string',
  assignee_id: 'string', // References users.id
  status: 'string', // 'pending' | 'in_progress' | 'completed' | 'reviewed'
  time_logged: 'number', // Hours logged
  created_at: 'timestamp',
  due_date: 'timestamp',
  completed_at: 'timestamp',
  priority: 'string', // 'low' | 'medium' | 'high'
  estimated_hours: 'number'
};

/**
 * TRANSACTIONS COLLECTION
 * All financial transactions
 */
const transactionSchema = {
  id: 'string',
  contract_id: 'string', // References contracts.id
  from_id: 'string', // Payer user ID
  to_id: 'string', // Receiver user ID (or team_id)
  amount: 'number',
  type: 'string', // 'escrow_deposit' | 'milestone_payment' | 'refund' | 'dispute_resolution'
  status: 'string', // 'pending' | 'completed' | 'failed' | 'cancelled'
  created_at: 'timestamp',
  processed_at: 'timestamp',
  description: 'string',
  milestone_id: 'string', // If milestone payment
  dispute_id: 'string' // If dispute-related
};

/**
 * REVIEWS COLLECTION
 * Project reviews and ratings
 */
const reviewSchema = {
  id: 'string',
  contract_id: 'string', // References contracts.id
  reviewer_id: 'string', // References users.id
  reviewee_id: 'string', // References users.id (or team_id)
  rating: 'number', // 1-5 stars
  text: 'string',
  verified_flag: 'boolean', // Only true if linked to escrow release
  created_at: 'timestamp',
  is_public: 'boolean',
  project_quality: 'number', // 1-5
  communication: 'number', // 1-5
  timeliness: 'number', // 1-5
  would_recommend: 'boolean'
};

/**
 * REWARDS COLLECTION
 * User points and rewards system
 */
const rewardSchema = {
  user_id: 'string', // References users.id
  points_balance: 'number',
  total_points_earned: 'number',
  badges: 'array', // ['first_project', 'top_performer', 'team_player']
  level: 'string', // 'bronze' | 'silver' | 'gold' | 'platinum'
  history: 'array', // [{ action, points, date, description }]
  last_updated: 'timestamp'
};

/**
 * DISPUTES COLLECTION
 * Dispute resolution system
 */
const disputeSchema = {
  id: 'string',
  contract_id: 'string', // References contracts.id
  initiator_id: 'string', // References users.id
  reason: 'string',
  description: 'string',
  status: 'string', // 'open' | 'under_review' | 'resolved' | 'dismissed'
  created_at: 'timestamp',
  resolved_at: 'timestamp',
  admin_id: 'string', // References users.id (admin who resolved)
  resolution: 'string',
  evidence: 'array', // File URLs, chat logs, etc.
  priority: 'string' // 'low' | 'medium' | 'high'
};

/**
 * CHAT_MESSAGES COLLECTION
 * Real-time project communication
 */
const chatMessageSchema = {
  id: 'string',
  project_id: 'string', // References projects.id
  sender_id: 'string', // References users.id
  text: 'string',
  file_url: 'string', // File attachment URL
  created_at: 'timestamp',
  is_read: 'boolean',
  read_by: 'array' // Array of user IDs who read the message
};

/**
 * TEAM_MEMBERS COLLECTION
 * Team membership and roles
 */
const teamMemberSchema = {
  id: 'string',
  team_id: 'string', // References teams.id
  user_id: 'string', // References users.id
  role: 'string', // 'member' | 'lead'
  joined_at: 'timestamp',
  is_active: 'boolean'
};

/**
 * ASSIGNMENTS COLLECTION
 * Project role assignments
 */
const assignmentSchema = {
  id: 'string',
  project_id: 'string', // References projects.id
  assignee_type: 'string', // 'user' | 'team'
  assignee_id: 'string', // References users.id or teams.id
  role: 'string', // 'developer' | 'designer' | 'manager' | etc.
  created_at: 'timestamp'
};

/**
 * TASKS COLLECTION (Enhanced)
 * Individual tasks within projects
 */
const taskSchema = {
  id: 'string',
  project_id: 'string', // References projects.id
  milestone_id: 'string', // References milestones.id (optional)
  title: 'string',
  description: 'string',
  assignee_type: 'string', // 'user' | 'team'
  assignee_id: 'string', // References users.id or teams.id
  status: 'string', // 'todo' | 'in_progress' | 'done'
  completion_log: 'array', // [{ by: user_id, at: timestamp, note: string }]
  created_at: 'timestamp',
  updated_at: 'timestamp'
};

/**
 * TRANSACTIONS COLLECTION (Enhanced)
 * All financial transactions with audit trail
 */
const transactionSchema = {
  id: 'string',
  project_id: 'string', // References projects.id
  from_type: 'string', // 'user' | 'team' | 'system'
  from_id: 'string', // Payer ID
  to_type: 'string', // 'user' | 'team' | 'system'
  to_id: 'string', // Receiver ID
  amount: 'number',
  currency: 'string', // 'USD'
  type: 'string', // 'deposit' | 'escrow_fund' | 'milestone_release' | 'refund' | 'adjustment'
  status: 'string', // 'pending' | 'settled' | 'reversed'
  metadata: 'object', // Additional transaction data
  created_at: 'timestamp'
};

/**
 * DISPUTES COLLECTION (Enhanced)
 * Dispute resolution system
 */
const disputeSchema = {
  id: 'string',
  project_id: 'string', // References projects.id
  raised_by_id: 'string', // References users.id
  status: 'string', // 'open' | 'resolved' | 'rejected'
  summary: 'string',
  details: 'string',
  resolution: 'string',
  created_at: 'timestamp',
  updated_at: 'timestamp'
};

/**
 * NOTIFICATIONS COLLECTION
 * User notifications
 */
const notificationSchema = {
  id: 'string',
  user_id: 'string', // References users.id
  type: 'string', // 'bid_accepted' | 'milestone_approved' | 'payment_received' | etc.
  payload: 'object', // Notification data
  read: 'boolean',
  created_at: 'timestamp'
};

/**
 * CHAT_ROOMS COLLECTION
 * Project chat rooms
 */
const chatRoomSchema = {
  id: 'string',
  project_id: 'string', // References projects.id
  created_at: 'timestamp'
};

module.exports = {
  userSchema,
  studentProfileSchema,
  projectSchema,
  bidSchema,
  contractSchema,
  milestoneSchema,
  teamSchema,
  teamMemberSchema,
  assignmentSchema,
  taskSchema,
  transactionSchema,
  reviewSchema,
  rewardSchema,
  disputeSchema,
  chatMessageSchema,
  chatRoomSchema,
  notificationSchema
};
