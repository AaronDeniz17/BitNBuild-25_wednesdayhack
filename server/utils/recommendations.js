// Recommendation algorithms for GigCampus
// Handles project matching, skill suggestions, and trending analysis

const { admin } = require('../config/firebase');

/**
 * Calculate skill match score between student and project
 */
const { categorizeStudentSkills, findSkillCategory } = require('./skills');

const calculateSkillMatch = async (student, projectSkills) => {
  if (!projectSkills || projectSkills.length === 0) return 0;
  
  // Get categorized skills
  const categorizedSkills = await categorizeStudentSkills(student.user_id);
  
  let totalScore = 0;
  let matchCount = 0;

  for (const projectSkill of projectSkills) {
    const category = findSkillCategory(projectSkill);
    const studentCategory = categorizedSkills[category];

    if (studentCategory) {
      // Check main skills
      const hasMainSkill = studentCategory.mainSkills.some(skill =>
        skill.toLowerCase().includes(projectSkill.toLowerCase()) ||
        projectSkill.toLowerCase().includes(skill.toLowerCase())
      );

      if (hasMainSkill) {
        totalScore += 1.0; // Full point for main skill match
        matchCount++;
        continue;
      }

      // Check micro-skills
      const hasMicroSkill = Object.values(studentCategory.microSkills)
        .flat()
        .some(skill =>
          skill.toLowerCase().includes(projectSkill.toLowerCase()) ||
          projectSkill.toLowerCase().includes(skill.toLowerCase())
        );

      if (hasMicroSkill) {
        totalScore += 0.7; // Partial point for micro-skill match
        matchCount++;
      }
    }
  }

  // Calculate final score considering both matches and category strength
  const matchScore = matchCount > 0 ? (totalScore / projectSkills.length) * 100 : 0;
  const categoryStrengths = Object.values(categorizedSkills).map(cat => cat.strength);
  const avgCategoryStrength = categoryStrengths.length > 0
    ? categoryStrengths.reduce((a, b) => a + b, 0) / categoryStrengths.length
    : 0;

  // Weight match score more heavily than category strength
  return (matchScore * 0.7) + (avgCategoryStrength * 0.3);
};

/**
 * Calculate project recommendation score
 */
const calculateRecommendationScore = (student, project) => {
  const weights = {
    skillMatch: 0.4,
    budgetFit: 0.2,
    deadline: 0.1,
    projectType: 0.1,
    clientReputation: 0.1,
    recentActivity: 0.1
  };

  let score = 0;

  // Skill match (40%)
  const skillMatch = calculateSkillMatch(student.skills, project.required_skills);
  score += (skillMatch / 100) * weights.skillMatch;

  // Budget fit (20%) - prefer projects within student's hourly rate range
  const hourlyRate = student.hourly_rate || 20;
  const estimatedHours = project.estimated_hours || 40;
  const expectedBudget = hourlyRate * estimatedHours;
  const budgetDiff = Math.abs(project.budget - expectedBudget) / expectedBudget;
  const budgetFit = Math.max(0, 1 - budgetDiff);
  score += budgetFit * weights.budgetFit;

  // Deadline urgency (10%) - prefer projects with reasonable deadlines
  const daysUntilDeadline = (new Date(project.deadline) - new Date()) / (1000 * 60 * 60 * 24);
  const deadlineScore = daysUntilDeadline > 7 ? 1 : daysUntilDeadline / 7;
  score += Math.max(0, deadlineScore) * weights.deadline;

  // Project type preference (10%)
  const projectTypeScore = project.category === student.preferred_category ? 1 : 0.5;
  score += projectTypeScore * weights.projectType;

  // Client reputation (10%)
  const clientScore = Math.min(1, (project.client_reputation || 50) / 100);
  score += clientScore * weights.clientReputation;

  // Recent activity bonus (10%)
  const daysSinceCreated = (new Date() - new Date(project.created_at)) / (1000 * 60 * 60 * 24);
  const recencyScore = daysSinceCreated < 3 ? 1 : Math.max(0, (7 - daysSinceCreated) / 7);
  score += recencyScore * weights.recentActivity;

  return Math.min(100, score * 100);
};

/**
 * Get recommended projects for a student
 */
const getRecommendedProjects = async (studentId, limit = 10) => {
  try {
    // Get student profile
    const studentDoc = await admin.firestore()
      .collection('student_profiles')
      .doc(studentId)
      .get();

    if (!studentDoc.exists) {
      throw new Error('Student profile not found');
    }

    const student = studentDoc.data();

    // Get open projects
    const projectsSnapshot = await admin.firestore()
      .collection('projects')
      .where('status', '==', 'open')
      .limit(50) // Get more projects to filter from
      .get();

    const recommendations = [];

    for (const doc of projectsSnapshot.docs) {
      const project = { id: doc.id, ...doc.data() };
      
      // Skip projects where student already bid
      const existingBid = await admin.firestore()
        .collection('bids')
        .where('project_id', '==', project.id)
        .where('freelancer_id', '==', studentId)
        .get();

      if (!existingBid.empty) continue;

      const score = calculateRecommendationScore(student, project);
      
      if (score > 30) { // Only recommend projects with >30% match
        recommendations.push({
          ...project,
          recommendation_score: Math.round(score),
          skill_match_score: Math.round(calculateSkillMatch(student.skills, project.required_skills))
        });
      }
    }

    // Sort by recommendation score
    recommendations.sort((a, b) => b.recommendation_score - a.recommendation_score);

    return recommendations.slice(0, limit);
  } catch (error) {
    console.error('Recommendation error:', error);
    throw error;
  }
};

/**
 * Get trending skills based on project demand
 */
const getTrendingSkills = async (days = 30) => {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const projectsSnapshot = await admin.firestore()
      .collection('projects')
      .where('created_at', '>=', cutoffDate)
      .get();

    const skillCounts = {};
    let totalProjects = 0;

    projectsSnapshot.forEach(doc => {
      const project = doc.data();
      totalProjects++;
      
      (project.required_skills || []).forEach(skill => {
        skillCounts[skill] = (skillCounts[skill] || 0) + 1;
      });
    });

    // Calculate skill demand vs supply
    const skillTrends = Object.entries(skillCounts)
      .map(([skill, demand]) => ({
        skill,
        demand,
        demand_percentage: Math.round((demand / totalProjects) * 100),
        trend_strength: demand // Simplified trend calculation
      }))
      .sort((a, b) => b.demand - a.demand)
      .slice(0, 20);

    return skillTrends;
  } catch (error) {
    console.error('Trending skills error:', error);
    throw error;
  }
};

/**
 * Suggest skills for student to learn
 */
const getSkillSuggestions = async (studentId) => {
  try {
    const studentDoc = await admin.firestore()
      .collection('student_profiles')
      .doc(studentId)
      .get();

    if (!studentDoc.exists) {
      throw new Error('Student profile not found');
    }

    const student = studentDoc.data();
    const currentSkills = student.skills || [];

    // Get trending skills
    const trendingSkills = await getTrendingSkills();

    // Skills related to current skills (simplified - in production use ML/graph algorithms)
    const skillRelationships = {
      'React': ['Next.js', 'TypeScript', 'Redux', 'JavaScript'],
      'Node.js': ['Express', 'MongoDB', 'TypeScript', 'GraphQL'],
      'Python': ['Django', 'Flask', 'Machine Learning', 'Data Science'],
      'Design': ['Figma', 'Adobe XD', 'UI/UX', 'Prototyping'],
      'JavaScript': ['React', 'Vue.js', 'Node.js', 'TypeScript']
    };

    const suggestions = [];

    // Add trending skills not already known
    trendingSkills.forEach(trendingSkill => {
      if (!currentSkills.includes(trendingSkill.skill)) {
        suggestions.push({
          skill: trendingSkill.skill,
          reason: 'High demand',
          demand: trendingSkill.demand,
          learning_priority: 'high'
        });
      }
    });

    // Add related skills
    currentSkills.forEach(skill => {
      const relatedSkills = skillRelationships[skill] || [];
      relatedSkills.forEach(relatedSkill => {
        if (!currentSkills.includes(relatedSkill) && 
            !suggestions.find(s => s.skill === relatedSkill)) {
          suggestions.push({
            skill: relatedSkill,
            reason: `Complements ${skill}`,
            learning_priority: 'medium'
          });
        }
      });
    });

    return suggestions.slice(0, 10);
  } catch (error) {
    console.error('Skill suggestions error:', error);
    throw error;
  }
};

module.exports = {
  calculateSkillMatch,
  calculateRecommendationScore,
  getRecommendedProjects,
  getTrendingSkills,
  getSkillSuggestions
};