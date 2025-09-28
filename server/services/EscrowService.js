// EscrowService - Handles escrow deposits, milestone approvals, and fund releases
// Implements idempotent operations and audit logging

const { v4: uuidv4 } = require('uuid');
const { admin, db } = require('../config/firebase');

class EscrowService {
  /**
   * Deposit funds into project escrow
   * @param {string} projectId - Project ID
   * @param {string} clientId - Client user ID
   * @param {number} amount - Amount to deposit
   * @returns {Promise<Object>} Transaction result
   */
  static async depositToEscrow(projectId, clientId, amount) {
    const transactionId = uuidv4();
    
    try {
      // Validate inputs
      if (!projectId || !clientId || !amount || amount <= 0) {
        throw new Error('Invalid deposit parameters');
      }

      // Get client wallet balance
      const clientDoc = await db.collection('users').doc(clientId).get();
      if (!clientDoc.exists) {
        throw new Error('Client not found');
      }

      const clientData = clientDoc.data();
      const currentBalance = clientData.wallet_balance || 0;

      // Check if client has sufficient funds
      if (currentBalance < amount) {
        // In dev mode, simulate top-up by system
        if (process.env.NODE_ENV === 'development') {
          console.log('Dev mode: Simulating wallet top-up');
          await db.collection('users').doc(clientId).update({
            wallet_balance: admin.firestore.FieldValue.increment(amount)
          });
        } else {
          throw new Error('Insufficient wallet balance');
        }
      }

      // Get project
      const projectDoc = await db.collection('projects').doc(projectId).get();
      if (!projectDoc.exists) {
        throw new Error('Project not found');
      }

      const projectData = projectDoc.data();
      
      // Verify client owns the project
      if (projectData.client_id !== clientId) {
        throw new Error('Unauthorized: Client does not own this project');
      }

      // Use Firestore transaction for atomicity
      const result = await db.runTransaction(async (transaction) => {
        // Deduct from client wallet
        const clientRef = db.collection('users').doc(clientId);
        transaction.update(clientRef, {
          wallet_balance: admin.firestore.FieldValue.increment(-amount)
        });

        // Add to project escrow
        const projectRef = db.collection('projects').doc(projectId);
        transaction.update(projectRef, {
          escrow_balance: admin.firestore.FieldValue.increment(amount)
        });

        // Create transaction record
        const transactionRef = db.collection('transactions').doc(transactionId);
        transaction.set(transactionRef, {
          id: transactionId,
          project_id: projectId,
          from_type: 'user',
          from_id: clientId,
          to_type: 'system',
          to_id: 'escrow',
          amount: amount,
          currency: 'USD',
          type: 'escrow_fund',
          status: 'settled',
          metadata: {
            description: 'Escrow deposit for project',
            project_title: projectData.title
          },
          created_at: admin.firestore.FieldValue.serverTimestamp()
        });

        return { success: true, transactionId };
      });

      return {
        success: true,
        message: 'Funds deposited to escrow successfully',
        transactionId,
        newEscrowBalance: (projectData.escrow_balance || 0) + amount
      };

    } catch (error) {
      console.error('Escrow deposit error:', error);
      throw error;
    }
  }

  /**
   * Approve a milestone (mark as approved, but don't release funds yet)
   * @param {string} projectId - Project ID
   * @param {string} milestoneId - Milestone ID
   * @param {string} approverId - User ID of approver (client)
   * @returns {Promise<Object>} Approval result
   */
  static async approveMilestone(projectId, milestoneId, approverId) {
    try {
      // Get project and verify ownership
      const projectDoc = await db.collection('projects').doc(projectId).get();
      if (!projectDoc.exists) {
        throw new Error('Project not found');
      }

      const projectData = projectDoc.data();
      if (projectData.client_id !== approverId) {
        throw new Error('Unauthorized: Only project owner can approve milestones');
      }

      // Get milestone
      const milestoneDoc = await db.collection('milestones').doc(milestoneId).get();
      if (!milestoneDoc.exists) {
        throw new Error('Milestone not found');
      }

      const milestoneData = milestoneDoc.data();
      if (milestoneData.project_id !== projectId) {
        throw new Error('Milestone does not belong to this project');
      }

      if (milestoneData.status === 'approved') {
        return {
          success: true,
          message: 'Milestone already approved',
          alreadyApproved: true
        };
      }

      // Update milestone status
      await db.collection('milestones').doc(milestoneId).update({
        status: 'approved',
        approved_at: admin.firestore.FieldValue.serverTimestamp(),
        approved_by: approverId
      });

      return {
        success: true,
        message: 'Milestone approved successfully',
        milestone: {
          id: milestoneId,
          title: milestoneData.title,
          percentage: milestoneData.percentage,
          status: 'approved'
        }
      };

    } catch (error) {
      console.error('Milestone approval error:', error);
      throw error;
    }
  }

  /**
   * Release funds for an approved milestone
   * @param {string} projectId - Project ID
   * @param {string} milestoneId - Milestone ID
   * @param {string} releaserId - User ID of releaser (client)
   * @returns {Promise<Object>} Release result
   */
  static async releaseMilestone(projectId, milestoneId, releaserId) {
    const transactionId = uuidv4();
    
    try {
      // Get project and verify ownership
      const projectDoc = await db.collection('projects').doc(projectId).get();
      if (!projectDoc.exists) {
        throw new Error('Project not found');
      }

      const projectData = projectDoc.data();
      if (projectData.client_id !== releaserId) {
        throw new Error('Unauthorized: Only project owner can release funds');
      }

      // Get milestone
      const milestoneDoc = await db.collection('milestones').doc(milestoneId).get();
      if (!milestoneDoc.exists) {
        throw new Error('Milestone not found');
      }

      const milestoneData = milestoneDoc.data();
      if (milestoneData.project_id !== projectId) {
        throw new Error('Milestone does not belong to this project');
      }

      if (milestoneData.status !== 'approved') {
        throw new Error('Milestone must be approved before funds can be released');
      }

      // Calculate release amount based on milestone percentage
      const totalEscrow = projectData.escrow_balance || 0;
      const releaseAmount = (totalEscrow * milestoneData.percentage) / 100;

      if (releaseAmount <= 0) {
        throw new Error('Invalid release amount');
      }

      if (totalEscrow < releaseAmount) {
        throw new Error('Insufficient escrow balance');
      }

      // Get project assignee (freelancer or team)
      const contractDoc = await db.collection('contracts')
        .where('project_id', '==', projectId)
        .where('status', '==', 'active')
        .limit(1)
        .get();

      if (contractDoc.empty) {
        throw new Error('No active contract found for this project');
      }

      const contractData = contractDoc.docs[0].data();
      const assigneeType = contractData.freelancer_id ? 'user' : 'team';
      const assigneeId = contractData.freelancer_id || contractData.team_id;

      // Use Firestore transaction for atomicity
      const result = await db.runTransaction(async (transaction) => {
        // Deduct from project escrow
        const projectRef = db.collection('projects').doc(projectId);
        transaction.update(projectRef, {
          escrow_balance: admin.firestore.FieldValue.increment(-releaseAmount)
        });

        // Add to assignee wallet
        if (assigneeType === 'user') {
          const userRef = db.collection('users').doc(assigneeId);
          transaction.update(userRef, {
            wallet_balance: admin.firestore.FieldValue.increment(releaseAmount)
          });
        } else {
          const teamRef = db.collection('teams').doc(assigneeId);
          transaction.update(teamRef, {
            team_wallet_balance: admin.firestore.FieldValue.increment(releaseAmount)
          });
        }

        // Update milestone status
        const milestoneRef = db.collection('milestones').doc(milestoneId);
        transaction.update(milestoneRef, {
          status: 'released',
          released_at: admin.firestore.FieldValue.serverTimestamp(),
          released_amount: releaseAmount
        });

        // Create transaction record
        const transactionRef = db.collection('transactions').doc(transactionId);
        transaction.set(transactionRef, {
          id: transactionId,
          project_id: projectId,
          from_type: 'system',
          from_id: 'escrow',
          to_type: assigneeType,
          to_id: assigneeId,
          amount: releaseAmount,
          currency: 'USD',
          type: 'milestone_release',
          status: 'settled',
          metadata: {
            description: 'Milestone payment release',
            milestone_id: milestoneId,
            milestone_title: milestoneData.title,
            percentage: milestoneData.percentage
          },
          created_at: admin.firestore.FieldValue.serverTimestamp()
        });

        return { success: true, transactionId, releaseAmount };
      });

      return {
        success: true,
        message: 'Milestone funds released successfully',
        transactionId,
        releaseAmount,
        assigneeType,
        assigneeId
      };

    } catch (error) {
      console.error('Milestone release error:', error);
      throw error;
    }
  }

  /**
   * Partial release of milestone funds
   * @param {string} projectId - Project ID
   * @param {string} milestoneId - Milestone ID
   * @param {number} percent - Percentage to release (0-100)
   * @param {string} releaserId - User ID of releaser
   * @returns {Promise<Object>} Partial release result
   */
  static async partialRelease(projectId, milestoneId, percent, releaserId) {
    if (percent <= 0 || percent > 100) {
      throw new Error('Release percentage must be between 0 and 100');
    }

    // Get milestone to calculate partial amount
    const milestoneDoc = await db.collection('milestones').doc(milestoneId).get();
    if (!milestoneDoc.exists) {
      throw new Error('Milestone not found');
    }

    const milestoneData = milestoneDoc.data();
    const partialPercentage = (milestoneData.percentage * percent) / 100;

    // Temporarily update milestone percentage for release calculation
    await db.collection('milestones').doc(milestoneId).update({
      percentage: partialPercentage
    });

    try {
      const result = await this.releaseMilestone(projectId, milestoneId, releaserId);
      
      // Restore original percentage
      await db.collection('milestones').doc(milestoneId).update({
        percentage: milestoneData.percentage
      });

      return {
        ...result,
        partialRelease: true,
        originalPercentage: milestoneData.percentage,
        releasedPercentage: partialPercentage
      };

    } catch (error) {
      // Restore original percentage on error
      await db.collection('milestones').doc(milestoneId).update({
        percentage: milestoneData.percentage
      });
      throw error;
    }
  }

  /**
   * Get escrow balance for a project
   * @param {string} projectId - Project ID
   * @returns {Promise<Object>} Escrow balance info
   */
  static async getEscrowBalance(projectId) {
    try {
      const projectDoc = await db.collection('projects').doc(projectId).get();
      if (!projectDoc.exists) {
        throw new Error('Project not found');
      }

      const projectData = projectDoc.data();
      
      return {
        success: true,
        projectId,
        escrowBalance: projectData.escrow_balance || 0,
        projectTitle: projectData.title
      };

    } catch (error) {
      console.error('Get escrow balance error:', error);
      throw error;
    }
  }

  /**
   * Get transaction history for a project
   * @param {string} projectId - Project ID
   * @returns {Promise<Object>} Transaction history
   */
  static async getTransactionHistory(projectId) {
    try {
      const transactionsSnapshot = await db.collection('transactions')
        .where('project_id', '==', projectId)
        .orderBy('created_at', 'desc')
        .get();

      const transactions = transactionsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      return {
        success: true,
        projectId,
        transactions
      };

    } catch (error) {
      console.error('Get transaction history error:', error);
      throw error;
    }
  }
}

module.exports = EscrowService;
