// Student ranking system for GigCampus
const { admin } = require('../config/firebase');
const { categorizeStudentSkills } = require('./skills');

/**
 * Calculate student's ranking score based on multiple factors
 */
const calculateStudentRanking = async (studentId) => {
  try {
    // Get student profile and completed projects
    const studentDoc = await admin.firestore()
      .collection('student_profiles')
      .doc(studentId)
      .get();

    if (!studentDoc.exists) {
      throw new Error('Student profile not found');
    }

    const student = studentDoc.data();
    
    // Weights for different ranking factors
    const weights = {
      projectSuccess: 0.25,      // Completion rate and ratings
      skillStrength: 0.20,       // Skill diversity and depth
      activityScore: 0.15,       // Recent activity and responsiveness
      clientFeedback: 0.20,      // Average review score
      universityPerf: 0.10,      // Academic performance if available
      portfolioScore: 0.10       // Portfolio quality
    };

    // 1. Project Success Score (25%)
    const projectSuccessScore = await calculateProjectSuccessScore(student);

    // 2. Skill Strength Score (20%)
    const skillStrengthScore = await calculateSkillStrengthScore(student);

    // 3. Activity Score (15%)
    const activityScore = await calculateActivityScore(student);

    // 4. Client Feedback Score (20%)
    const clientFeedbackScore = await calculateClientFeedbackScore(student);

    // 5. University Performance Score (10%)
    const universityScore = await calculateUniversityScore(student);

    // 6. Portfolio Score (10%)
    const portfolioScore = await calculatePortfolioScore(student);

    // Calculate weighted total
    const totalScore = (
      (projectSuccessScore * weights.projectSuccess) +
      (skillStrengthScore * weights.skillStrength) +
      (activityScore * weights.activityScore) +
      (clientFeedbackScore * weights.clientFeedback) +
      (universityScore * weights.universityPerf) +
      (portfolioScore * weights.portfolioScore)
    );

    // Update student's ranking in Firestore
    await admin.firestore()
      .collection('student_profiles')
      .doc(studentId)
      .update({
        ranking_score: totalScore,
        ranking_details: {
          projectSuccessScore,
          skillStrengthScore,
          activityScore,
          clientFeedbackScore,
          universityScore,
          portfolioScore,
          lastUpdated: admin.firestore.FieldValue.serverTimestamp()
        }
      });

    return {
      totalScore,
      details: {
        projectSuccessScore,
        skillStrengthScore,
        activityScore,
        clientFeedbackScore,
        universityScore,
        portfolioScore
      }
    };
  } catch (error) {
    console.error('Error calculating student ranking:', error);
    throw error;
  }
};

/**
 * Calculate project success score
 */
const calculateProjectSuccessScore = async (student) => {
  const completedProjects = student.completed_projects || 0;
  const onTimeRate = student.on_time_rate || 0;
  const projectSuccess = (completedProjects * 0.4) + (onTimeRate * 0.6);
  return Math.min(100, projectSuccess);
};

/**
 * Calculate skill strength score
 */
const calculateSkillStrengthScore = async (student) => {
  const categorized = await categorizeStudentSkills(student.user_id);
  const categoryScores = Object.values(categorized).map(cat => cat.strength);
  return categoryScores.length > 0
    ? categoryScores.reduce((a, b) => a + b, 0) / categoryScores.length
    : 0;
};

/**
 * Calculate activity score based on recent engagement
 */
const calculateActivityScore = async (student) => {
  // Get recent bids and project activity
  const recentBids = await admin.firestore()
    .collection('bids')
    .where('freelancer_id', '==', student.user_id)
    .where('created_at', '>=', admin.firestore.Timestamp.fromDate(
      new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    ))
    .get();

  const bidCount = recentBids.size;
  const responseRate = student.response_rate || 0;
  
  return Math.min(100, (bidCount * 10) + (responseRate * 0.5));
};

/**
 * Calculate average client feedback score
 */
const calculateClientFeedbackScore = async (student) => {
  const reviews = await admin.firestore()
    .collection('reviews')
    .where('freelancer_id', '==', student.user_id)
    .get();

  if (reviews.empty) return 0;

  const totalScore = reviews.docs.reduce((sum, doc) => sum + doc.data().rating, 0);
  return (totalScore / reviews.size) * 20; // Convert 5-star rating to 100-point scale
};

/**
 * Calculate university performance score
 */
const calculateUniversityScore = async (student) => {
  // This could be enhanced with actual university data integration
  return student.university_verified ? 100 : 50;
};

/**
 * Calculate portfolio quality score
 */
const calculatePortfolioScore = async (student) => {
  const portfolioLinks = student.portfolio_links || [];
  const hasGithub = portfolioLinks.some(link => link.includes('github.com'));
  const hasLinkedIn = student.linkedin_url ? 1 : 0;
  const hasOtherPortfolio = portfolioLinks.length > (hasGithub ? 1 : 0);

  return Math.min(100, (hasGithub ? 40 : 0) + (hasLinkedIn * 30) + (hasOtherPortfolio ? 30 : 0));
};

module.exports = {
  calculateStudentRanking,
  calculateProjectSuccessScore,
  calculateSkillStrengthScore,
  calculateActivityScore,
  calculateClientFeedbackScore
};