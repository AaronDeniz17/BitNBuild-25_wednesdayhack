// RecommendationService - Handles project recommendations and trending analysis
// Implements rule-based scoring with skill matching, availability, and similarity

const { db } = require('../config/firebase');

class RecommendationService {
  /**
   * Get recommended projects for a user
   * @param {string} userId - User ID
   * @param {Object} options - Recommendation options
   * @returns {Promise<Object>} Recommended projects
   */
  static async getRecommendedProjects(userId, options = {}) {
    try {
      const {
        limit = 10,
        includeTrending = true,
        skillWeight = 0.4,
        budgetWeight = 0.2,
        availabilityWeight = 0.2,
        similarityWeight = 0.2
      } = options;

      // Get user profile
      const userDoc = await db.collection('users').doc(userId).get();
      if (!userDoc.exists) {
        throw new Error('User not found');
      }

      const userData = userDoc.data();
      const userSkills = userData.skills || [];

      // Get user's past projects for similarity calculation
      const pastProjectsSnapshot = await db.collection('contracts')
        .where('freelancer_id', '==', userId)
        .where('status', '==', 'completed')
        .limit(10)
        .get();

      const pastProjectIds = pastProjectsSnapshot.docs.map(doc => doc.data().project_id);
      const pastProjectSkills = await this.getPastProjectSkills(pastProjectIds);

      // Get all open projects
      const projectsSnapshot = await db.collection('projects')
        .where('status', '==', 'open')
        .orderBy('created_at', 'desc')
        .limit(50) // Limit for performance
        .get();

      const projects = [];
      
      for (const doc of projectsSnapshot.docs) {
        const project = { id: doc.id, ...doc.data() };
        
        // Calculate recommendation score
        const score = await this.calculateRecommendationScore(
          project,
          userData,
          userSkills,
          pastProjectSkills,
          {
            skillWeight,
            budgetWeight,
            availabilityWeight,
            similarityWeight
          }
        );

        projects.push({
          ...project,
          recommendationScore: score.total,
          scoreBreakdown: score.breakdown
        });
      }

      // Sort by recommendation score
      projects.sort((a, b) => b.recommendationScore - a.recommendationScore);

      // Get trending projects if requested
      let trendingProjects = [];
      if (includeTrending) {
        trendingProjects = await this.getTrendingProjects(5);
      }

      return {
        success: true,
        data: {
          recommended: projects.slice(0, limit),
          trending: trendingProjects,
          userSkills,
          totalProjects: projects.length
        }
      };

    } catch (error) {
      console.error('Get recommended projects error:', error);
      throw error;
    }
  }

  /**
   * Calculate recommendation score for a project
   * @param {Object} project - Project data
   * @param {Object} userData - User data
   * @param {Array} userSkills - User skills
   * @param {Array} pastProjectSkills - Skills from past projects
   * @param {Object} weights - Scoring weights
   * @returns {Object} Score and breakdown
   */
  static async calculateRecommendationScore(project, userData, userSkills, pastProjectSkills, weights) {
    const breakdown = {};

    // 1. Skill Match Score (0-1)
    const skillMatch = this.calculateSkillMatch(project.required_skills || [], userSkills);
    breakdown.skillMatch = skillMatch;

    // 2. Budget Fit Score (0-1)
    const budgetFit = this.calculateBudgetFit(project, userData);
    breakdown.budgetFit = budgetFit;

    // 3. Availability Score (0-1)
    const availability = this.calculateAvailabilityScore(userData);
    breakdown.availability = availability;

    // 4. Past Project Similarity (0-1)
    const similarity = this.calculateSimilarity(project.required_skills || [], pastProjectSkills);
    breakdown.similarity = similarity;

    // 5. Recency Score (0-1) - newer projects get higher scores
    const recency = this.calculateRecencyScore(project.created_at);
    breakdown.recency = recency;

    // Calculate weighted total
    const total = (
      (skillMatch * weights.skillWeight) +
      (budgetFit * weights.budgetWeight) +
      (availability * weights.availabilityWeight) +
      (similarity * weights.similarityWeight) +
      (recency * 0.1) // Small weight for recency
    );

    return {
      total: Math.min(total, 1), // Cap at 1
      breakdown
    };
  }

  /**
   * Calculate skill match percentage
   * @param {Array} requiredSkills - Project required skills
   * @param {Array} userSkills - User skills
   * @returns {number} Match percentage (0-1)
   */
  static calculateSkillMatch(requiredSkills, userSkills) {
    if (!requiredSkills.length || !userSkills.length) return 0;
    
    const matches = requiredSkills.filter(skill => 
      userSkills.some(userSkill => 
        userSkill.toLowerCase().includes(skill.toLowerCase()) ||
        skill.toLowerCase().includes(userSkill.toLowerCase())
      )
    ).length;

    return matches / requiredSkills.length;
  }

  /**
   * Calculate budget fit score
   * @param {Object} project - Project data
   * @param {Object} userData - User data
   * @returns {number} Budget fit score (0-1)
   */
  static calculateBudgetFit(project, userData) {
    const userHourlyRate = userData.hourly_rate || 0;
    if (!userHourlyRate) return 0.5; // Neutral if no rate set

    const projectBudget = project.budget_min || project.budget_max || 0;
    const estimatedHours = project.estimated_hours || 1;
    const projectHourlyRate = projectBudget / estimatedHours;

    // Score based on how close user rate is to project rate
    const rateDifference = Math.abs(userHourlyRate - projectHourlyRate);
    const maxRate = Math.max(userHourlyRate, projectHourlyRate);
    
    if (maxRate === 0) return 0.5;
    
    return Math.max(0, 1 - (rateDifference / maxRate));
  }

  /**
   * Calculate availability score
   * @param {Object} userData - User data
   * @returns {number} Availability score (0-1)
   */
  static calculateAvailabilityScore(userData) {
    const availability = userData.availability || 'part-time';
    const isAvailable = userData.is_available !== false;

    if (!isAvailable) return 0;

    const availabilityScores = {
      'full-time': 1.0,
      'part-time': 0.7,
      'weekends-only': 0.4,
      'evenings-only': 0.5
    };

    return availabilityScores[availability] || 0.5;
  }

  /**
   * Calculate similarity to past projects
   * @param {Array} currentSkills - Current project skills
   * @param {Array} pastSkills - Skills from past projects
   * @returns {number} Similarity score (0-1)
   */
  static calculateSimilarity(currentSkills, pastSkills) {
    if (!currentSkills.length || !pastSkills.length) return 0;

    const matches = currentSkills.filter(skill =>
      pastSkills.some(pastSkill =>
        pastSkill.toLowerCase().includes(skill.toLowerCase()) ||
        skill.toLowerCase().includes(pastSkill.toLowerCase())
      )
    ).length;

    return matches / currentSkills.length;
  }

  /**
   * Calculate recency score
   * @param {Object} createdAt - Project creation timestamp
   * @returns {number} Recency score (0-1)
   */
  static calculateRecencyScore(createdAt) {
    if (!createdAt) return 0.5;

    const now = new Date();
    const created = createdAt.toDate ? createdAt.toDate() : new Date(createdAt);
    const daysSinceCreated = (now - created) / (1000 * 60 * 60 * 24);

    // Higher score for newer projects, decay over time
    return Math.max(0, 1 - (daysSinceCreated / 30)); // Decay over 30 days
  }

  /**
   * Get trending projects based on views, bids, and saves
   * @param {number} limit - Number of trending projects
   * @returns {Promise<Array>} Trending projects
   */
  static async getTrendingProjects(limit = 10) {
    try {
      const projectsSnapshot = await db.collection('projects')
        .where('status', '==', 'open')
        .orderBy('created_at', 'desc')
        .limit(50)
        .get();

      const projects = [];
      
      for (const doc of projectsSnapshot.docs) {
        const project = { id: doc.id, ...doc.data() };
        const trendingScore = this.calculateTrendingScore(project);
        
        projects.push({
          ...project,
          trendingScore
        });
      }

      // Sort by trending score and return top projects
      projects.sort((a, b) => b.trendingScore - a.trendingScore);
      
      return projects.slice(0, limit);

    } catch (error) {
      console.error('Get trending projects error:', error);
      throw error;
    }
  }

  /**
   * Calculate trending score for a project
   * @param {Object} project - Project data
   * @returns {number} Trending score
   */
  static calculateTrendingScore(project) {
    const views = project.view_count || 0;
    const bids = project.bid_count || 0;
    const saves = project.save_count || 0;
    
    // Time decay factor
    const now = new Date();
    const created = project.created_at?.toDate ? project.created_at.toDate() : new Date(project.created_at);
    const hoursSinceCreated = (now - created) / (1000 * 60 * 60);
    const timeDecay = Math.exp(-hoursSinceCreated / 168); // Decay over 1 week

    // Weighted score with time decay
    const score = (views * 1) + (bids * 3) + (saves * 2);
    return score * timeDecay;
  }

  /**
   * Get trending skills based on project frequency
   * @param {number} limit - Number of trending skills
   * @returns {Promise<Array>} Trending skills
   */
  static async getTrendingSkills(limit = 20) {
    try {
      const projectsSnapshot = await db.collection('projects')
        .where('status', '==', 'open')
        .limit(100)
        .get();

      const skillCount = {};
      
      projectsSnapshot.docs.forEach(doc => {
        const project = doc.data();
        if (project.required_skills && Array.isArray(project.required_skills)) {
          project.required_skills.forEach(skill => {
            skillCount[skill] = (skillCount[skill] || 0) + 1;
          });
        }
      });

      // Sort skills by frequency
      const trendingSkills = Object.entries(skillCount)
        .sort(([,a], [,b]) => b - a)
        .slice(0, limit)
        .map(([skill, count]) => ({
          skill,
          count,
          trending: count > 3
        }));

      return {
        success: true,
        data: trendingSkills
      };

    } catch (error) {
      console.error('Get trending skills error:', error);
      throw error;
    }
  }

  /**
   * Get skills from past projects
   * @param {Array} projectIds - Array of project IDs
   * @returns {Promise<Array>} Skills from past projects
   */
  static async getPastProjectSkills(projectIds) {
    if (!projectIds.length) return [];

    try {
      const skills = [];
      
      for (const projectId of projectIds) {
        const projectDoc = await db.collection('projects').doc(projectId).get();
        if (projectDoc.exists) {
          const project = projectDoc.data();
          if (project.required_skills) {
            skills.push(...project.required_skills);
          }
        }
      }

      return [...new Set(skills)]; // Remove duplicates

    } catch (error) {
      console.error('Get past project skills error:', error);
      return [];
    }
  }

  /**
   * Get project recommendations with explanation
   * @param {string} userId - User ID
   * @param {string} projectId - Project ID to explain
   * @returns {Promise<Object>} Recommendation explanation
   */
  static async explainRecommendation(userId, projectId) {
    try {
      const userDoc = await db.collection('users').doc(userId).get();
      if (!userDoc.exists) {
        throw new Error('User not found');
      }

      const userData = userDoc.data();
      const userSkills = userData.skills || [];

      const projectDoc = await db.collection('projects').doc(projectId).get();
      if (!projectDoc.exists) {
        throw new Error('Project not found');
      }

      const project = { id: projectId, ...projectDoc.data() };

      // Calculate detailed score breakdown
      const pastProjectSkills = await this.getPastProjectSkills([]);
      const score = await this.calculateRecommendationScore(
        project,
        userData,
        userSkills,
        pastProjectSkills,
        {
          skillWeight: 0.4,
          budgetWeight: 0.2,
          availabilityWeight: 0.2,
          similarityWeight: 0.2
        }
      );

      return {
        success: true,
        data: {
          project: {
            id: project.id,
            title: project.title,
            required_skills: project.required_skills || []
          },
          user: {
            skills: userSkills,
            availability: userData.availability,
            hourly_rate: userData.hourly_rate
          },
          explanation: {
            totalScore: score.total,
            breakdown: score.breakdown,
            topFactors: this.getTopFactors(score.breakdown)
          }
        }
      };

    } catch (error) {
      console.error('Explain recommendation error:', error);
      throw error;
    }
  }

  /**
   * Get top factors influencing recommendation
   * @param {Object} breakdown - Score breakdown
   * @returns {Array} Top factors
   */
  static getTopFactors(breakdown) {
    const factors = Object.entries(breakdown)
      .map(([factor, score]) => ({ factor, score }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);

    return factors.map(factor => ({
      factor: factor.factor,
      score: factor.score,
      description: this.getFactorDescription(factor.factor, factor.score)
    }));
  }

  /**
   * Get human-readable description for a factor
   * @param {string} factor - Factor name
   * @param {number} score - Factor score
   * @returns {string} Description
   */
  static getFactorDescription(factor, score) {
    const descriptions = {
      skillMatch: score > 0.8 ? 'Excellent skill match' : 
                  score > 0.5 ? 'Good skill match' : 'Limited skill match',
      budgetFit: score > 0.8 ? 'Budget aligns well' : 
                 score > 0.5 ? 'Budget is reasonable' : 'Budget mismatch',
      availability: score > 0.8 ? 'Highly available' : 
                   score > 0.5 ? 'Moderately available' : 'Limited availability',
      similarity: score > 0.8 ? 'Very similar to past work' : 
                 score > 0.5 ? 'Somewhat similar' : 'Different from past work'
    };

    return descriptions[factor] || 'Factor not analyzed';
  }
}

module.exports = RecommendationService;
