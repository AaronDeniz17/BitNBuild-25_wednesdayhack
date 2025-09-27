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
  is_active: 'boolean'
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
  budget: 'number',
  deadline: 'timestamp',
  milestones: 'array', // [{ title, description, weight_pct, due_date }]
  requires_team: 'boolean',
  team_size_min: 'number',
  team_size_max: 'number',
  status: 'string', // 'open' | 'in_progress' | 'completed' | 'cancelled'
  created_at: 'timestamp',
  updated_at: 'timestamp',
  category: 'string', // 'web-development', 'design', 'writing', 'marketing'
  urgency: 'string', // 'low' | 'medium' | 'high'
  is_featured: 'boolean',
  tags: 'array', // ['urgent', 'long-term', 'startup']
  attachments: 'array', // File URLs
  estimated_hours: 'number'
};

/**
 * BIDS COLLECTION
 * Student proposals for projects
 */
const bidSchema = {
  id: 'string',
  project_id: 'string', // References projects.id
  freelancer_id: 'string', // References users.id (for individual bids)
  team_id: 'string', // References teams.id (for team bids)
  price: 'number',
  proposal: 'string',
  eta_days: 'number',
  status: 'string', // 'pending' | 'accepted' | 'rejected'
  created_at: 'timestamp',
  updated_at: 'timestamp',
  portfolio_links: 'array',
  previous_work: 'array', // Links to similar projects
  is_individual: 'boolean',
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
  contract_id: 'string', // References contracts.id
  sender_id: 'string', // References users.id
  message: 'string',
  type: 'string', // 'text' | 'file' | 'system'
  file_url: 'string', // If type is 'file'
  created_at: 'timestamp',
  is_read: 'boolean',
  read_by: 'array' // Array of user IDs who read the message
};

module.exports = {
  userSchema,
  studentProfileSchema,
  projectSchema,
  bidSchema,
  contractSchema,
  milestoneSchema,
  teamSchema,
  taskSchema,
  transactionSchema,
  reviewSchema,
  rewardSchema,
  disputeSchema,
  chatMessageSchema
};
