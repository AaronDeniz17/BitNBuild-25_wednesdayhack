// Leaderboard routes for GigCampus
// Handles rankings, achievements, and user statistics

const express = require('express');
const { admin, db } = require('../config/firebase');
const { auth, optionalAuth } = require('../middleware/auth');

const router = express.Router();

/**
 * GET /api/leaderboard
 * Get leaderboard rankings by category
 */
router.get('/', optionalAuth, async (req, res) => {
  try {
    const { 
      category = 'overall', 
      period = 'all_time',
      university,
      limit = 50,
      page = 1
    } = req.query;

    const validCategories = [
      'overall', 'earnings', 'projects_completed', 'rating', 
      'new_talent', 'university', 'skills'
    ];

    if (!validCategories.includes(category)) {
      return res.status(400).json({ 
        error: 'Invalid category',
        validCategories 
      });
    }

    let rankings = [];

    switch (category) {
      case 'overall':
        rankings = await getOverallRankings(period, university, limit, page);
        break;
      case 'earnings':
        rankings = await getEarningsRankings(period, university, limit, page);
        break;
      case 'projects_completed':
        rankings = await getProjectsRankings(period, university, limit, page);
        break;
      case 'rating':
        rankings = await getRatingRankings(university, limit, page);
        break;
      case 'new_talent':
        rankings = await getNewTalentRankings(university, limit, page);
        break;
      case 'university':
        rankings = await getUniversityRankings(limit, page);
        break;
      case 'skills':
        rankings = await getSkillsRankings(req.query.skill, limit, page);
        break;
    }

    res.json({
      success: true,
      data: rankings,
      category,
      period,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit)
      }
    });

  } catch (error) {
    console.error('Get leaderboard error:', error);
    res.status(500).json({ error: 'Failed to get leaderboard' });
  }
});

/**
 * GET /api/leaderboard/user/:userId
 * Get user's ranking and stats
 */
router.get('/user/:userId', optionalAuth, async (req, res) => {
  try {
    const { userId } = req.params;

    const userDoc = await db.collection('users').doc(userId).get();
    
    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userData = userDoc.data();

    // Calculate user rankings
    const rankings = {
      overall: await getUserRanking(userId, 'overall_score'),
      earnings: await getUserRanking(userId, 'total_earnings'),
      projects: await getUserRanking(userId, 'completed_projects'),
      rating: await getUserRanking(userId, 'average_rating')
    };

    // Get user stats
    const stats = {
      total_earnings: userData.total_earnings || 0,
      completed_projects: userData.completed_projects || 0,
      average_rating: userData.average_rating || 0,
      total_reviews: userData.total_reviews || 0,
      success_rate: userData.success_rate || 0,
      response_time: userData.response_time || null,
      badges: userData.badges || []
    };

    // Get recent achievements
    const achievementsSnapshot = await db.collection('user_achievements')
      .where('user_id', '==', userId)
      .orderBy('earned_at', 'desc')
      .limit(5)
      .get();

    const achievements = achievementsSnapshot.docs.map(doc => doc.data());

    res.json({
      success: true,
      data: {
        user: {
          id: userData.id,
          name: userData.name,
          university: userData.university,
          university_verified: userData.university_verified
        },
        rankings,
        stats,
        achievements
      }
    });

  } catch (error) {
    console.error('Get user ranking error:', error);
    res.status(500).json({ error: 'Failed to get user ranking' });
  }
});

/**
 * GET /api/leaderboard/top-performers
 * Get top performers across different metrics
 */
router.get('/top-performers', optionalAuth, async (req, res) => {
  try {
    const { university } = req.query;

    // Get top performers in different categories
    const topEarners = await getTopPerformers('total_earnings', university, 5);
    const topRated = await getTopPerformers('average_rating', university, 5);
    const mostActive = await getTopPerformers('completed_projects', university, 5);
    const risingStars = await getRisingStars(university, 5);

    res.json({
      success: true,
      data: {
        top_earners: topEarners,
        top_rated: topRated,
        most_active: mostActive,
        rising_stars: risingStars
      }
    });

  } catch (error) {
    console.error('Get top performers error:', error);
    res.status(500).json({ error: 'Failed to get top performers' });
  }
});

// Helper function to get overall rankings
async function getOverallRankings(period, university, limit, page) {
  try {
    let query = db.collection('users');

    if (university) {
      query = query.where('university', '==', university);
    }

    // Filter by period if needed
    if (period !== 'all_time') {
      // Add date filtering logic here
    }

    query = query.where('completed_projects', '>', 0)
      .orderBy('overall_score', 'desc')
      .limit(parseInt(limit));

    const snapshot = await query.get();
    const users = [];

    snapshot.docs.forEach((doc, index) => {
      const userData = doc.data();
      users.push({
        rank: index + 1,
        user: {
          id: userData.id,
          name: userData.name,
          university: userData.university,
          university_verified: userData.university_verified
        },
        score: userData.overall_score || 0,
        earnings: userData.total_earnings || 0,
        projects: userData.completed_projects || 0,
        rating: userData.average_rating || 0,
        badges: userData.badges || []
      });
    });

    return users;
  } catch (error) {
    return [];
  }
}

// Helper function to get earnings rankings
async function getEarningsRankings(period, university, limit, page) {
  try {
    let query = db.collection('users');

    if (university) {
      query = query.where('university', '==', university);
    }

    query = query.where('total_earnings', '>', 0)
      .orderBy('total_earnings', 'desc')
      .limit(parseInt(limit));

    const snapshot = await query.get();
    const users = [];

    snapshot.docs.forEach((doc, index) => {
      const userData = doc.data();
      users.push({
        rank: index + 1,
        user: {
          id: userData.id,
          name: userData.name,
          university: userData.university,
          university_verified: userData.university_verified
        },
        earnings: userData.total_earnings || 0,
        projects: userData.completed_projects || 0,
        rating: userData.average_rating || 0
      });
    });

    return users;
  } catch (error) {
    return [];
  }
}

// Helper function to get projects completed rankings
async function getProjectsRankings(period, university, limit, page) {
  try {
    let query = db.collection('users');

    if (university) {
      query = query.where('university', '==', university);
    }

    query = query.where('completed_projects', '>', 0)
      .orderBy('completed_projects', 'desc')
      .limit(parseInt(limit));

    const snapshot = await query.get();
    const users = [];

    snapshot.docs.forEach((doc, index) => {
      const userData = doc.data();
      users.push({
        rank: index + 1,
        user: {
          id: userData.id,
          name: userData.name,
          university: userData.university,
          university_verified: userData.university_verified
        },
        projects: userData.completed_projects || 0,
        earnings: userData.total_earnings || 0,
        rating: userData.average_rating || 0,
        success_rate: userData.success_rate || 0
      });
    });

    return users;
  } catch (error) {
    return [];
  }
}

// Helper function to get rating rankings
async function getRatingRankings(university, limit, page) {
  try {
    let query = db.collection('users')
      .where('total_reviews', '>=', 3); // Must have at least 3 reviews

    if (university) {
      query = query.where('university', '==', university);
    }

    query = query.orderBy('average_rating', 'desc')
      .limit(parseInt(limit));

    const snapshot = await query.get();
    const users = [];

    snapshot.docs.forEach((doc, index) => {
      const userData = doc.data();
      users.push({
        rank: index + 1,
        user: {
          id: userData.id,
          name: userData.name,
          university: userData.university,
          university_verified: userData.university_verified
        },
        rating: userData.average_rating || 0,
        reviews: userData.total_reviews || 0,
        projects: userData.completed_projects || 0,
        earnings: userData.total_earnings || 0
      });
    });

    return users;
  } catch (error) {
    return [];
  }
}

// Helper function to get new talent rankings
async function getNewTalentRankings(university, limit, page) {
  try {
    // Users who joined in the last 6 months and have good performance
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    let query = db.collection('users')
      .where('created_at', '>=', admin.firestore.Timestamp.fromDate(sixMonthsAgo))
      .where('completed_projects', '>', 0);

    if (university) {
      query = query.where('university', '==', university);
    }

    query = query.orderBy('overall_score', 'desc')
      .limit(parseInt(limit));

    const snapshot = await query.get();
    const users = [];

    snapshot.docs.forEach((doc, index) => {
      const userData = doc.data();
      users.push({
        rank: index + 1,
        user: {
          id: userData.id,
          name: userData.name,
          university: userData.university,
          university_verified: userData.university_verified
        },
        score: userData.overall_score || 0,
        projects: userData.completed_projects || 0,
        rating: userData.average_rating || 0,
        joined_date: userData.created_at,
        badges: userData.badges || []
      });
    });

    return users;
  } catch (error) {
    return [];
  }
}

// Helper function to get university rankings
async function getUniversityRankings(limit, page) {
  try {
    // Aggregate by university
    const usersSnapshot = await db.collection('users')
      .where('university_verified', '==', true)
      .get();

    const universityStats = {};

    usersSnapshot.docs.forEach(doc => {
      const userData = doc.data();
      const university = userData.university;

      if (!universityStats[university]) {
        universityStats[university] = {
          name: university,
          total_users: 0,
          total_earnings: 0,
          total_projects: 0,
          total_reviews: 0,
          average_rating: 0
        };
      }

      const stats = universityStats[university];
      stats.total_users += 1;
      stats.total_earnings += userData.total_earnings || 0;
      stats.total_projects += userData.completed_projects || 0;
      stats.total_reviews += userData.total_reviews || 0;
    });

    // Calculate average ratings and sort
    const rankings = Object.values(universityStats).map((stats, index) => {
      stats.average_rating = stats.total_reviews > 0 ? 
        stats.total_earnings / stats.total_reviews : 0; // Simplified calculation
      
      return {
        rank: index + 1,
        ...stats
      };
    }).sort((a, b) => b.total_earnings - a.total_earnings)
      .slice(0, parseInt(limit));

    // Update ranks
    rankings.forEach((item, index) => {
      item.rank = index + 1;
    });

    return rankings;
  } catch (error) {
    return [];
  }
}

// Helper function to get skills rankings
async function getSkillsRankings(skill, limit, page) {
  try {
    if (!skill) {
      return [];
    }

    const query = db.collection('users')
      .where('skills', 'array-contains', skill)
      .where('completed_projects', '>', 0)
      .orderBy('overall_score', 'desc')
      .limit(parseInt(limit));

    const snapshot = await query.get();
    const users = [];

    snapshot.docs.forEach((doc, index) => {
      const userData = doc.data();
      users.push({
        rank: index + 1,
        user: {
          id: userData.id,
          name: userData.name,
          university: userData.university,
          university_verified: userData.university_verified
        },
        skill: skill,
        score: userData.overall_score || 0,
        projects: userData.completed_projects || 0,
        rating: userData.average_rating || 0,
        skills: userData.skills || []
      });
    });

    return users;
  } catch (error) {
    return [];
  }
}

// Helper function to get user ranking
async function getUserRanking(userId, field) {
  try {
    const userDoc = await db.collection('users').doc(userId).get();
    
    if (!userDoc.exists) return null;
    
    const userData = userDoc.data();
    const userValue = userData[field] || 0;

    // Count users with better performance
    const betterUsersSnapshot = await db.collection('users')
      .where(field, '>', userValue)
      .get();

    return {
      rank: betterUsersSnapshot.size + 1,
      value: userValue,
      field: field
    };
  } catch (error) {
    return null;
  }
}

// Helper function to get top performers
async function getTopPerformers(field, university, limit) {
  try {
    let query = db.collection('users');

    if (university) {
      query = query.where('university', '==', university);
    }

    query = query.where(field, '>', 0)
      .orderBy(field, 'desc')
      .limit(limit);

    const snapshot = await query.get();
    
    return snapshot.docs.map((doc, index) => {
      const userData = doc.data();
      return {
        rank: index + 1,
        user: {
          id: userData.id,
          name: userData.name,
          university: userData.university,
          university_verified: userData.university_verified
        },
        value: userData[field] || 0,
        projects: userData.completed_projects || 0,
        rating: userData.average_rating || 0
      };
    });
  } catch (error) {
    return [];
  }
}

// Helper function to get rising stars
async function getRisingStars(university, limit) {
  try {
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

    let query = db.collection('users')
      .where('created_at', '>=', admin.firestore.Timestamp.fromDate(oneMonthAgo))
      .where('completed_projects', '>', 0);

    if (university) {
      query = query.where('university', '==', university);
    }

    query = query.orderBy('overall_score', 'desc')
      .limit(limit);

    const snapshot = await query.get();
    
    return snapshot.docs.map((doc, index) => {
      const userData = doc.data();
      return {
        rank: index + 1,
        user: {
          id: userData.id,
          name: userData.name,
          university: userData.university,
          university_verified: userData.university_verified
        },
        score: userData.overall_score || 0,
        projects: userData.completed_projects || 0,
        rating: userData.average_rating || 0,
        joined_date: userData.created_at
      };
    });
  } catch (error) {
    return [];
  }
}

module.exports = router;