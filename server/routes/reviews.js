// Reviews routes for GigCampus
// Handles review and rating system for completed projects

const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { admin, db } = require('../config/firebase');
const { auth, userRateLimit } = require('../middleware/auth');

const router = express.Router();

// Review type constants
const REVIEW_TYPES = {
  CLIENT_TO_FREELANCER: 'client_to_freelancer',
  FREELANCER_TO_CLIENT: 'freelancer_to_client'
};

/**
 * GET /api/reviews
 * Get reviews for a user or project
 */
router.get('/', async (req, res) => {
  try {
    const { user_id, project_id, type, page = 1, limit = 20 } = req.query;

    let query = db.collection('reviews');

    if (user_id) {
      query = query.where('reviewed_user_id', '==', user_id);
    }

    if (project_id) {
      query = query.where('project_id', '==', project_id);
    }

    if (type && Object.values(REVIEW_TYPES).includes(type)) {
      query = query.where('type', '==', type);
    }

    query = query.orderBy('created_at', 'desc');

    const pageSize = Math.min(parseInt(limit), 50);
    const offset = (parseInt(page) - 1) * pageSize;
    
    query = query.limit(pageSize).offset(offset);

    const snapshot = await query.get();
    const reviews = [];

    for (const doc of snapshot.docs) {
      const reviewData = doc.data();
      
      // Get reviewer info
      const reviewerDoc = await db.collection('users').doc(reviewData.reviewer_id).get();
      const reviewerData = reviewerDoc.exists ? reviewerDoc.data() : null;

      // Get reviewed user info
      const reviewedUserDoc = await db.collection('users').doc(reviewData.reviewed_user_id).get();
      const reviewedUserData = reviewedUserDoc.exists ? reviewedUserDoc.data() : null;

      // Get project info
      const projectDoc = await db.collection('projects').doc(reviewData.project_id).get();
      const projectData = projectDoc.exists ? projectDoc.data() : null;

      reviews.push({
        id: doc.id,
        ...reviewData,
        reviewer: reviewerData ? {
          id: reviewData.reviewer_id,
          name: reviewerData.display_name,
          university: reviewerData.university
        } : null,
        reviewed_user: reviewedUserData ? {
          id: reviewData.reviewed_user_id,
          name: reviewedUserData.display_name,
          university: reviewedUserData.university
        } : null,
        project: projectData ? {
          id: reviewData.project_id,
          title: projectData.title
        } : null
      });
    }

    res.json({
      success: true,
      data: reviews
    });

  } catch (error) {
    console.error('Get reviews error:', error);
    res.status(500).json({ error: 'Failed to get reviews' });
  }
});

/**
 * GET /api/reviews/user/:id/stats
 * Get review statistics for a user
 */
router.get('/user/:id/stats', async (req, res) => {
  try {
    const { id } = req.params;

    // Get all reviews for the user
    const reviewsSnapshot = await db.collection('reviews')
      .where('reviewed_user_id', '==', id)
      .get();

    if (reviewsSnapshot.empty) {
      return res.json({
        success: true,
        data: {
          average_rating: 0,
          total_reviews: 0,
          rating_distribution: {
            1: 0, 2: 0, 3: 0, 4: 0, 5: 0
          },
          recent_reviews: []
        }
      });
    }

    const reviews = reviewsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Calculate statistics
    const totalReviews = reviews.length;
    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
    const averageRating = totalRating / totalReviews;

    // Rating distribution
    const ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    reviews.forEach(review => {
      ratingDistribution[review.rating]++;
    });

    // Get recent reviews with additional info
    const recentReviews = await Promise.all(
      reviews
        .sort((a, b) => b.created_at.toMillis() - a.created_at.toMillis())
        .slice(0, 5)
        .map(async (review) => {
          const reviewerDoc = await db.collection('users').doc(review.reviewer_id).get();
          const reviewerData = reviewerDoc.exists ? reviewerDoc.data() : null;

          const projectDoc = await db.collection('projects').doc(review.project_id).get();
          const projectData = projectDoc.exists ? projectDoc.data() : null;

          return {
            id: review.id,
            rating: review.rating,
            comment: review.comment,
            type: review.type,
            created_at: review.created_at,
            reviewer: reviewerData ? {
              id: review.reviewer_id,
              name: reviewerData.display_name,
              university: reviewerData.university
            } : null,
            project: projectData ? {
              id: review.project_id,
              title: projectData.title
            } : null
          };
        })
    );

    res.json({
      success: true,
      data: {
        average_rating: Math.round(averageRating * 10) / 10,
        total_reviews: totalReviews,
        rating_distribution: ratingDistribution,
        recent_reviews: recentReviews
      }
    });

  } catch (error) {
    console.error('Get user review stats error:', error);
    res.status(500).json({ error: 'Failed to get review statistics' });
  }
});

/**
 * POST /api/reviews
 * Create a review for a completed project
 */
router.post('/', auth, userRateLimit(5, 60 * 60 * 1000), async (req, res) => {
  try {
    const { project_id, reviewed_user_id, rating, comment, type } = req.body;

    // Validation
    if (!project_id || !reviewed_user_id || !rating || !type) {
      return res.status(400).json({ 
        error: 'Project ID, reviewed user ID, rating, and type are required' 
      });
    }

    if (!Object.values(REVIEW_TYPES).includes(type)) {
      return res.status(400).json({ error: 'Invalid review type' });
    }

    if (rating < 1 || rating > 5 || !Number.isInteger(rating)) {
      return res.status(400).json({ error: 'Rating must be an integer between 1 and 5' });
    }

    if (reviewed_user_id === req.user.id) {
      return res.status(400).json({ error: 'Cannot review yourself' });
    }

    // Check if project exists and is completed
    const projectDoc = await db.collection('projects').doc(project_id).get();
    
    if (!projectDoc.exists) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const projectData = projectDoc.data();
    
    if (projectData.status !== 'completed') {
      return res.status(400).json({ error: 'Can only review completed projects' });
    }

    // Check if user has permission to review (must be involved in the project)
    const contractsSnapshot = await db.collection('contracts')
      .where('project_id', '==', project_id)
      .where('status', '==', 'completed')
      .get();

    const userContract = contractsSnapshot.docs.find(doc => {
      const contractData = doc.data();
      return contractData.client_id === req.user.id || contractData.freelancer_id === req.user.id;
    });

    if (!userContract) {
      return res.status(403).json({ error: 'You can only review projects you were involved in' });
    }

    const contractData = userContract.data();

    // Validate review type matches user role
    const isClient = contractData.client_id === req.user.id;
    const isFreelancer = contractData.freelancer_id === req.user.id;

    if (type === REVIEW_TYPES.CLIENT_TO_FREELANCER && !isClient) {
      return res.status(403).json({ error: 'Only clients can leave client-to-freelancer reviews' });
    }

    if (type === REVIEW_TYPES.FREELANCER_TO_CLIENT && !isFreelancer) {
      return res.status(403).json({ error: 'Only freelancers can leave freelancer-to-client reviews' });
    }

    // Validate reviewed user matches the contract
    if (isClient && reviewed_user_id !== contractData.freelancer_id) {
      return res.status(400).json({ error: 'Invalid reviewed user for this contract' });
    }

    if (isFreelancer && reviewed_user_id !== contractData.client_id) {
      return res.status(400).json({ error: 'Invalid reviewed user for this contract' });
    }

    // Check if review already exists
    const existingReviewSnapshot = await db.collection('reviews')
      .where('project_id', '==', project_id)
      .where('contract_id', '==', userContract.id)
      .where('reviewer_id', '==', req.user.id)
      .where('reviewed_user_id', '==', reviewed_user_id)
      .get();

    if (!existingReviewSnapshot.empty) {
      return res.status(400).json({ error: 'You have already reviewed this project' });
    }

    const reviewId = uuidv4();
    
    const reviewData = {
      id: reviewId,
      project_id,
      contract_id: userContract.id,
      reviewer_id: req.user.id,
      reviewed_user_id,
      rating: parseInt(rating),
      comment: comment ? comment.trim() : '',
      type,
      created_at: admin.firestore.FieldValue.serverTimestamp(),
      updated_at: admin.firestore.FieldValue.serverTimestamp()
    };

    // Create review and update user stats in transaction
    await db.runTransaction(async (transaction) => {
      // Create review
      transaction.set(db.collection('reviews').doc(reviewId), reviewData);

      // Update reviewed user's rating stats
      const userDoc = await transaction.get(db.collection('users').doc(reviewed_user_id));
      
      if (userDoc.exists) {
        const userData = userDoc.data();
        const currentTotalReviews = userData.total_reviews || 0;
        const currentAverageRating = userData.average_rating || 0;
        
        const newTotalReviews = currentTotalReviews + 1;
        const newAverageRating = 
          ((currentAverageRating * currentTotalReviews) + rating) / newTotalReviews;

        transaction.update(db.collection('users').doc(reviewed_user_id), {
          total_reviews: newTotalReviews,
          average_rating: Math.round(newAverageRating * 10) / 10,
          updated_at: admin.firestore.FieldValue.serverTimestamp()
        });
      }
    });

    res.status(201).json({
      success: true,
      message: 'Review created successfully',
      data: { id: reviewId, ...reviewData }
    });

  } catch (error) {
    console.error('Create review error:', error);
    res.status(500).json({ error: 'Failed to create review' });
  }
});

/**
 * PUT /api/reviews/:id
 * Update a review (within 24 hours of creation)
 */
router.put('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { rating, comment } = req.body;

    const reviewDoc = await db.collection('reviews').doc(id).get();
    
    if (!reviewDoc.exists) {
      return res.status(404).json({ error: 'Review not found' });
    }

    const reviewData = reviewDoc.data();
    
    // Check if user owns the review
    if (reviewData.reviewer_id !== req.user.id) {
      return res.status(403).json({ error: 'You can only update your own reviews' });
    }

    // Check if review is within 24 hours
    const reviewCreatedAt = reviewData.created_at.toMillis();
    const now = Date.now();
    const twentyFourHours = 24 * 60 * 60 * 1000;

    if (now - reviewCreatedAt > twentyFourHours) {
      return res.status(400).json({ error: 'Reviews can only be updated within 24 hours of creation' });
    }

    const updates = {};
    
    if (rating !== undefined) {
      if (rating < 1 || rating > 5 || !Number.isInteger(rating)) {
        return res.status(400).json({ error: 'Rating must be an integer between 1 and 5' });
      }
      updates.rating = parseInt(rating);
    }
    
    if (comment !== undefined) {
      updates.comment = comment.trim();
    }
    
    updates.updated_at = admin.firestore.FieldValue.serverTimestamp();

    // Update review and user stats in transaction
    await db.runTransaction(async (transaction) => {
      // Update review
      transaction.update(db.collection('reviews').doc(id), updates);

      // If rating changed, update user stats
      if (updates.rating && updates.rating !== reviewData.rating) {
        const userDoc = await transaction.get(db.collection('users').doc(reviewData.reviewed_user_id));
        
        if (userDoc.exists) {
          const userData = userDoc.data();
          const totalReviews = userData.total_reviews || 1;
          const currentAverageRating = userData.average_rating || reviewData.rating;
          
          // Recalculate average (remove old rating, add new rating)
          const totalRatingPoints = currentAverageRating * totalReviews;
          const newTotalRatingPoints = totalRatingPoints - reviewData.rating + updates.rating;
          const newAverageRating = newTotalRatingPoints / totalReviews;

          transaction.update(db.collection('users').doc(reviewData.reviewed_user_id), {
            average_rating: Math.round(newAverageRating * 10) / 10,
            updated_at: admin.firestore.FieldValue.serverTimestamp()
          });
        }
      }
    });

    // Get updated review
    const updatedReviewDoc = await db.collection('reviews').doc(id).get();

    res.json({
      success: true,
      message: 'Review updated successfully',
      data: { id, ...updatedReviewDoc.data() }
    });

  } catch (error) {
    console.error('Update review error:', error);
    res.status(500).json({ error: 'Failed to update review' });
  }
});

/**
 * DELETE /api/reviews/:id
 * Delete a review (admin only or within 1 hour of creation)
 */
router.delete('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;

    const reviewDoc = await db.collection('reviews').doc(id).get();
    
    if (!reviewDoc.exists) {
      return res.status(404).json({ error: 'Review not found' });
    }

    const reviewData = reviewDoc.data();
    
    // Check permissions
    const isOwner = reviewData.reviewer_id === req.user.id;
    const isAdmin = req.user.role === 'admin';
    
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    // If not admin, check if within 1 hour
    if (!isAdmin) {
      const reviewCreatedAt = reviewData.created_at.toMillis();
      const now = Date.now();
      const oneHour = 60 * 60 * 1000;

      if (now - reviewCreatedAt > oneHour) {
        return res.status(400).json({ error: 'Reviews can only be deleted within 1 hour of creation' });
      }
    }

    // Delete review and update user stats in transaction
    await db.runTransaction(async (transaction) => {
      // Delete review
      transaction.delete(db.collection('reviews').doc(id));

      // Update reviewed user's rating stats
      const userDoc = await transaction.get(db.collection('users').doc(reviewData.reviewed_user_id));
      
      if (userDoc.exists) {
        const userData = userDoc.data();
        const currentTotalReviews = userData.total_reviews || 1;
        const currentAverageRating = userData.average_rating || reviewData.rating;
        
        if (currentTotalReviews > 1) {
          // Recalculate average without this review
          const totalRatingPoints = currentAverageRating * currentTotalReviews;
          const newTotalRatingPoints = totalRatingPoints - reviewData.rating;
          const newTotalReviews = currentTotalReviews - 1;
          const newAverageRating = newTotalRatingPoints / newTotalReviews;

          transaction.update(db.collection('users').doc(reviewData.reviewed_user_id), {
            total_reviews: newTotalReviews,
            average_rating: Math.round(newAverageRating * 10) / 10,
            updated_at: admin.firestore.FieldValue.serverTimestamp()
          });
        } else {
          // Last review, reset to 0
          transaction.update(db.collection('users').doc(reviewData.reviewed_user_id), {
            total_reviews: 0,
            average_rating: 0,
            updated_at: admin.firestore.FieldValue.serverTimestamp()
          });
        }
      }
    });

    res.json({
      success: true,
      message: 'Review deleted successfully'
    });

  } catch (error) {
    console.error('Delete review error:', error);
    res.status(500).json({ error: 'Failed to delete review' });
  }
});

/**
 * POST /api/reviews/:id/report
 * Report a review for inappropriate content
 */
router.post('/:id/report', auth, userRateLimit(5, 60 * 60 * 1000), async (req, res) => {
  try {
    const { id } = req.params;
    const { reason, description } = req.body;

    if (!reason) {
      return res.status(400).json({ error: 'Reason is required' });
    }

    const reviewDoc = await db.collection('reviews').doc(id).get();
    
    if (!reviewDoc.exists) {
      return res.status(404).json({ error: 'Review not found' });
    }

    const reviewData = reviewDoc.data();

    // Can't report your own reviews
    if (reviewData.reviewer_id === req.user.id) {
      return res.status(400).json({ error: 'Cannot report your own review' });
    }

    // Check if already reported by this user
    const existingReportSnapshot = await db.collection('review_reports')
      .where('review_id', '==', id)
      .where('reporter_id', '==', req.user.id)
      .get();

    if (!existingReportSnapshot.empty) {
      return res.status(400).json({ error: 'You have already reported this review' });
    }

    const reportId = uuidv4();
    
    const reportData = {
      id: reportId,
      review_id: id,
      reporter_id: req.user.id,
      reported_user_id: reviewData.reviewer_id,
      reason: reason.trim(),
      description: description ? description.trim() : '',
      status: 'pending',
      created_at: admin.firestore.FieldValue.serverTimestamp()
    };

    await db.collection('review_reports').doc(reportId).add(reportData);

    res.status(201).json({
      success: true,
      message: 'Review reported successfully'
    });

  } catch (error) {
    console.error('Report review error:', error);
    res.status(500).json({ error: 'Failed to report review' });
  }
});

module.exports = router;