// Review routes for GigCampus
// Handles project reviews and ratings

const express = require('express');
const { admin } = require('../config/firebase');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

/**
 * POST /api/reviews
 * Create a new review (after project completion)
 */
router.post('/', authenticateToken, async (req, res) => {
  try {
    const {
      contract_id,
      reviewee_id,
      rating,
      text,
      project_quality,
      communication,
      timeliness,
      would_recommend
    } = req.body;

    // Validate required fields
    if (!contract_id || !reviewee_id || !rating) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Validate rating
    if (rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }

    // Get contract
    const contractDoc = await admin.firestore()
      .collection('contracts')
      .doc(contract_id)
      .get();

    if (!contractDoc.exists) {
      return res.status(404).json({ error: 'Contract not found' });
    }

    const contractData = contractDoc.data();

    // Check if user has permission to review
    const canReview = contractData.client_id === req.user.id || 
                     contractData.freelancer_id === req.user.id ||
                     (contractData.team_id && await isTeamMember(contractData.team_id, req.user.id));

    if (!canReview) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Check if contract is completed
    if (contractData.status !== 'completed') {
      return res.status(400).json({ error: 'Can only review completed contracts' });
    }

    // Check if user already reviewed this contract
    const existingReviewQuery = await admin.firestore()
      .collection('reviews')
      .where('contract_id', '==', contract_id)
      .where('reviewer_id', '==', req.user.id)
      .get();

    if (!existingReviewQuery.empty) {
      return res.status(400).json({ error: 'You have already reviewed this contract' });
    }

    // Check if escrow funds were released (for verification)
    const escrowReleased = contractData.escrow_balance === 0;
    
    // Create review
    const reviewData = {
      id: admin.firestore().collection('reviews').doc().id,
      contract_id,
      reviewer_id: req.user.id,
      reviewee_id,
      rating: parseInt(rating),
      text: text || '',
      verified_flag: escrowReleased, // Only verified if escrow was released
      created_at: admin.firestore.FieldValue.serverTimestamp(),
      is_public: true,
      project_quality: project_quality || rating,
      communication: communication || rating,
      timeliness: timeliness || rating,
      would_recommend: would_recommend || rating >= 4
    };

    await admin.firestore()
      .collection('reviews')
      .doc(reviewData.id)
      .set(reviewData);

    // Update reviewee's reputation score
    await updateReputationScore(reviewee_id);

    res.status(201).json({
      message: 'Review submitted successfully',
      review: reviewData
    });

  } catch (error) {
    console.error('Review creation error:', error);
    res.status(500).json({ error: 'Failed to create review' });
  }
});

/**
 * GET /api/reviews/user/:userId
 * Get reviews for a specific user
 */
router.get('/user/:userId', authenticateToken, async (req, res) => {
  try {
    const userId = req.params.userId;
    const { page = 1, limit = 10 } = req.query;

    // Get user reviews
    let query = admin.firestore()
      .collection('reviews')
      .where('reviewee_id', '==', userId)
      .where('is_public', '==', true)
      .orderBy('created_at', 'desc');

    // Apply pagination
    const offset = (parseInt(page) - 1) * parseInt(limit);
    query = query.limit(parseInt(limit)).offset(offset);

    const snapshot = await query.get();
    const reviews = [];

    for (const doc of snapshot.docs) {
      const reviewData = doc.data();

      // Get reviewer information
      const reviewerDoc = await admin.firestore()
        .collection('users')
        .doc(reviewData.reviewer_id)
        .get();

      const reviewerData = reviewerDoc.exists ? reviewerDoc.data() : null;

      // Get project information
      const contractDoc = await admin.firestore()
        .collection('contracts')
        .doc(reviewData.contract_id)
        .get();

      const contractData = contractDoc.exists ? contractDoc.data() : null;

      let projectData = null;
      if (contractData) {
        const projectDoc = await admin.firestore()
          .collection('projects')
          .doc(contractData.project_id)
          .get();

        projectData = projectDoc.exists ? projectDoc.data() : null;
      }

      reviews.push({
        id: doc.id,
        ...reviewData,
        created_at: reviewData.created_at?.toDate(),
        reviewer: reviewerData ? {
          id: reviewerData.id,
          name: reviewerData.name,
          university: reviewerData.university
        } : null,
        project: projectData ? {
          id: projectData.id,
          title: projectData.title
        } : null
      });
    }

    // Get total count for pagination
    const totalQuery = admin.firestore()
      .collection('reviews')
      .where('reviewee_id', '==', userId)
      .where('is_public', '==', true);

    const totalSnapshot = await totalQuery.get();
    const total = totalSnapshot.size;

    res.json({
      reviews,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });

  } catch (error) {
    console.error('Reviews fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
});

/**
 * GET /api/reviews/portfolio/:userId
 * Get portfolio reviews for a user (public endpoint)
 */
router.get('/portfolio/:userId', async (req, res) => {
  try {
    const userId = req.params.userId;
    const { limit = 5 } = req.query;

    // Get recent verified reviews
    const snapshot = await admin.firestore()
      .collection('reviews')
      .where('reviewee_id', '==', userId)
      .where('is_public', '==', true)
      .where('verified_flag', '==', true)
      .orderBy('created_at', 'desc')
      .limit(parseInt(limit))
      .get();

    const reviews = [];

    for (const doc of snapshot.docs) {
      const reviewData = doc.data();

      // Get reviewer information
      const reviewerDoc = await admin.firestore()
        .collection('users')
        .doc(reviewData.reviewer_id)
        .get();

      const reviewerData = reviewerDoc.exists ? reviewerDoc.data() : null;

      reviews.push({
        id: doc.id,
        rating: reviewData.rating,
        text: reviewData.text,
        project_quality: reviewData.project_quality,
        communication: reviewData.communication,
        timeliness: reviewData.timeliness,
        would_recommend: reviewData.would_recommend,
        created_at: reviewData.created_at?.toDate(),
        reviewer: reviewerData ? {
          name: reviewerData.name,
          university: reviewerData.university
        } : null
      });
    }

    res.json({ reviews });

  } catch (error) {
    console.error('Portfolio reviews fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch portfolio reviews' });
  }
});

/**
 * GET /api/reviews/stats/:userId
 * Get review statistics for a user
 */
router.get('/stats/:userId', async (req, res) => {
  try {
    const userId = req.params.userId;

    // Get all reviews for user
    const snapshot = await admin.firestore()
      .collection('reviews')
      .where('reviewee_id', '==', userId)
      .where('is_public', '==', true)
      .get();

    const reviews = [];
    snapshot.forEach(doc => {
      reviews.push(doc.data());
    });

    // Calculate statistics
    const totalReviews = reviews.length;
    const averageRating = totalReviews > 0 ? 
      reviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews : 0;

    const ratingDistribution = {
      5: reviews.filter(r => r.rating === 5).length,
      4: reviews.filter(r => r.rating === 4).length,
      3: reviews.filter(r => r.rating === 3).length,
      2: reviews.filter(r => r.rating === 2).length,
      1: reviews.filter(r => r.rating === 1).length
    };

    const averageProjectQuality = totalReviews > 0 ?
      reviews.reduce((sum, review) => sum + (review.project_quality || review.rating), 0) / totalReviews : 0;

    const averageCommunication = totalReviews > 0 ?
      reviews.reduce((sum, review) => sum + (review.communication || review.rating), 0) / totalReviews : 0;

    const averageTimeliness = totalReviews > 0 ?
      reviews.reduce((sum, review) => sum + (review.timeliness || review.rating), 0) / totalReviews : 0;

    const recommendationRate = totalReviews > 0 ?
      (reviews.filter(r => r.would_recommend).length / totalReviews) * 100 : 0;

    const verifiedReviews = reviews.filter(r => r.verified_flag).length;

    res.json({
      total_reviews: totalReviews,
      average_rating: Math.round(averageRating * 10) / 10,
      rating_distribution: ratingDistribution,
      average_project_quality: Math.round(averageProjectQuality * 10) / 10,
      average_communication: Math.round(averageCommunication * 10) / 10,
      average_timeliness: Math.round(averageTimeliness * 10) / 10,
      recommendation_rate: Math.round(recommendationRate * 10) / 10,
      verified_reviews: verifiedReviews
    });

  } catch (error) {
    console.error('Review stats error:', error);
    res.status(500).json({ error: 'Failed to fetch review statistics' });
  }
});

/**
 * PUT /api/reviews/:id
 * Update a review (reviewer only)
 */
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const reviewId = req.params.id;
    const updates = req.body;

    const reviewDoc = await admin.firestore()
      .collection('reviews')
      .doc(reviewId)
      .get();

    if (!reviewDoc.exists) {
      return res.status(404).json({ error: 'Review not found' });
    }

    const reviewData = reviewDoc.data();

    // Check if user is the reviewer
    if (reviewData.reviewer_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Remove fields that shouldn't be updated
    delete updates.id;
    delete updates.contract_id;
    delete updates.reviewer_id;
    delete updates.reviewee_id;
    delete updates.verified_flag;
    delete updates.created_at;

    // Update review
    await admin.firestore()
      .collection('reviews')
      .doc(reviewId)
      .update(updates);

    // Update reputation score
    await updateReputationScore(reviewData.reviewee_id);

    res.json({ message: 'Review updated successfully' });

  } catch (error) {
    console.error('Review update error:', error);
    res.status(500).json({ error: 'Failed to update review' });
  }
});

/**
 * DELETE /api/reviews/:id
 * Delete a review (reviewer only)
 */
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const reviewId = req.params.id;

    const reviewDoc = await admin.firestore()
      .collection('reviews')
      .doc(reviewId)
      .get();

    if (!reviewDoc.exists) {
      return res.status(404).json({ error: 'Review not found' });
    }

    const reviewData = reviewDoc.data();

    // Check if user is the reviewer
    if (reviewData.reviewer_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Delete review
    await admin.firestore()
      .collection('reviews')
      .doc(reviewId)
      .delete();

    // Update reputation score
    await updateReputationScore(reviewData.reviewee_id);

    res.json({ message: 'Review deleted successfully' });

  } catch (error) {
    console.error('Review deletion error:', error);
    res.status(500).json({ error: 'Failed to delete review' });
  }
});

// Helper function to update user's reputation score
async function updateReputationScore(userId) {
  try {
    // Get all reviews for user
    const snapshot = await admin.firestore()
      .collection('reviews')
      .where('reviewee_id', '==', userId)
      .where('is_public', '==', true)
      .get();

    const reviews = [];
    snapshot.forEach(doc => {
      reviews.push(doc.data());
    });

    if (reviews.length === 0) return;

    // Calculate new reputation score
    const averageRating = reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length;
    const verifiedReviews = reviews.filter(r => r.verified_flag).length;
    const verificationBonus = (verifiedReviews / reviews.length) * 10; // Up to 10 points bonus
    const reputationScore = Math.min(100, Math.round(averageRating * 20 + verificationBonus));

    // Update user's reputation score
    await admin.firestore()
      .collection('users')
      .doc(userId)
      .update({
        reputation_score: reputationScore
      });

    // Update student profile if applicable
    const studentDoc = await admin.firestore()
      .collection('student_profiles')
      .doc(userId)
      .get();

    if (studentDoc.exists) {
      await admin.firestore()
        .collection('student_profiles')
        .doc(userId)
        .update({
          reputation_score: reputationScore
        });
    }

  } catch (error) {
    console.error('Reputation score update error:', error);
  }
}

// Helper function to check if user is team member
async function isTeamMember(teamId, userId) {
  const teamDoc = await admin.firestore()
    .collection('teams')
    .doc(teamId)
    .get();

  if (!teamDoc.exists) return false;

  const teamData = teamDoc.data();
  return teamData.member_ids && teamData.member_ids.includes(userId);
}

module.exports = router;
