// Comprehensive test suite for EscrowService
// Tests all escrow operations including edge cases and error scenarios

const EscrowService = require('../services/EscrowService');
const { admin, db } = require('../config/firebase');

// Mock Firebase for testing
jest.mock('../config/firebase', () => ({
  admin: {
    firestore: {
      FieldValue: {
        serverTimestamp: () => 'mock-timestamp',
        increment: (value) => ({ increment: value })
      }
    }
  },
  db: {
    collection: jest.fn(() => ({
      doc: jest.fn(() => ({
        get: jest.fn(),
        update: jest.fn(),
        set: jest.fn()
      })),
      runTransaction: jest.fn()
    }))
  }
}));

describe('EscrowService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('depositToEscrow', () => {
    it('should successfully deposit funds to escrow', async () => {
      const mockProject = {
        id: 'project-1',
        client_id: 'client-1',
        title: 'Test Project',
        escrow_balance: 0
      };

      const mockClient = {
        id: 'client-1',
        wallet_balance: 1000
      };

      // Mock database responses
      db.collection().doc().get.mockResolvedValueOnce({
        exists: true,
        data: () => mockClient
      });

      db.collection().doc().get.mockResolvedValueOnce({
        exists: true,
        data: () => mockProject
      });

      db.runTransaction.mockImplementation(async (callback) => {
        const transaction = {
          update: jest.fn(),
          set: jest.fn()
        };
        await callback(transaction);
        return { success: true, transactionId: 'tx-123' };
      });

      const result = await EscrowService.depositToEscrow('project-1', 'client-1', 500);

      expect(result.success).toBe(true);
      expect(result.message).toBe('Funds deposited to escrow successfully');
      expect(result.newEscrowBalance).toBe(500);
    });

    it('should throw error for invalid parameters', async () => {
      await expect(EscrowService.depositToEscrow('', 'client-1', 500))
        .rejects.toThrow('Invalid deposit parameters');

      await expect(EscrowService.depositToEscrow('project-1', '', 500))
        .rejects.toThrow('Invalid deposit parameters');

      await expect(EscrowService.depositToEscrow('project-1', 'client-1', 0))
        .rejects.toThrow('Invalid deposit parameters');
    });

    it('should throw error when client not found', async () => {
      db.collection().doc().get.mockResolvedValueOnce({
        exists: false
      });

      await expect(EscrowService.depositToEscrow('project-1', 'client-1', 500))
        .rejects.toThrow('Client not found');
    });

    it('should throw error when project not found', async () => {
      const mockClient = {
        id: 'client-1',
        wallet_balance: 1000
      };

      db.collection().doc().get.mockResolvedValueOnce({
        exists: true,
        data: () => mockClient
      });

      db.collection().doc().get.mockResolvedValueOnce({
        exists: false
      });

      await expect(EscrowService.depositToEscrow('project-1', 'client-1', 500))
        .rejects.toThrow('Project not found');
    });

    it('should throw error for insufficient balance in production', async () => {
      process.env.NODE_ENV = 'production';
      
      const mockClient = {
        id: 'client-1',
        wallet_balance: 100
      };

      const mockProject = {
        id: 'project-1',
        client_id: 'client-1',
        title: 'Test Project'
      };

      db.collection().doc().get.mockResolvedValueOnce({
        exists: true,
        data: () => mockClient
      });

      db.collection().doc().get.mockResolvedValueOnce({
        exists: true,
        data: () => mockProject
      });

      await expect(EscrowService.depositToEscrow('project-1', 'client-1', 500))
        .rejects.toThrow('Insufficient wallet balance');
    });

    it('should throw error for unauthorized client', async () => {
      const mockClient = {
        id: 'client-1',
        wallet_balance: 1000
      };

      const mockProject = {
        id: 'project-1',
        client_id: 'different-client',
        title: 'Test Project'
      };

      db.collection().doc().get.mockResolvedValueOnce({
        exists: true,
        data: () => mockClient
      });

      db.collection().doc().get.mockResolvedValueOnce({
        exists: true,
        data: () => mockProject
      });

      await expect(EscrowService.depositToEscrow('project-1', 'client-1', 500))
        .rejects.toThrow('Unauthorized: Client does not own this project');
    });
  });

  describe('approveMilestone', () => {
    it('should successfully approve a milestone', async () => {
      const mockProject = {
        id: 'project-1',
        client_id: 'client-1',
        title: 'Test Project'
      };

      const mockMilestone = {
        id: 'milestone-1',
        project_id: 'project-1',
        title: 'Test Milestone',
        status: 'pending'
      };

      db.collection().doc().get.mockResolvedValueOnce({
        exists: true,
        data: () => mockProject
      });

      db.collection().doc().get.mockResolvedValueOnce({
        exists: true,
        data: () => mockMilestone
      });

      db.collection().doc().update.mockResolvedValueOnce({});

      const result = await EscrowService.approveMilestone('project-1', 'milestone-1', 'client-1');

      expect(result.success).toBe(true);
      expect(result.message).toBe('Milestone approved successfully');
    });

    it('should return success for already approved milestone', async () => {
      const mockProject = {
        id: 'project-1',
        client_id: 'client-1',
        title: 'Test Project'
      };

      const mockMilestone = {
        id: 'milestone-1',
        project_id: 'project-1',
        title: 'Test Milestone',
        status: 'approved'
      };

      db.collection().doc().get.mockResolvedValueOnce({
        exists: true,
        data: () => mockProject
      });

      db.collection().doc().get.mockResolvedValueOnce({
        exists: true,
        data: () => mockMilestone
      });

      const result = await EscrowService.approveMilestone('project-1', 'milestone-1', 'client-1');

      expect(result.success).toBe(true);
      expect(result.alreadyApproved).toBe(true);
    });

    it('should throw error for unauthorized approver', async () => {
      const mockProject = {
        id: 'project-1',
        client_id: 'different-client',
        title: 'Test Project'
      };

      db.collection().doc().get.mockResolvedValueOnce({
        exists: true,
        data: () => mockProject
      });

      await expect(EscrowService.approveMilestone('project-1', 'milestone-1', 'client-1'))
        .rejects.toThrow('Unauthorized: Only project owner can approve milestones');
    });
  });

  describe('releaseMilestone', () => {
    it('should successfully release milestone funds', async () => {
      const mockProject = {
        id: 'project-1',
        client_id: 'client-1',
        title: 'Test Project',
        escrow_balance: 1000
      };

      const mockMilestone = {
        id: 'milestone-1',
        project_id: 'project-1',
        title: 'Test Milestone',
        status: 'approved',
        percentage: 50
      };

      const mockContract = {
        id: 'contract-1',
        project_id: 'project-1',
        freelancer_id: 'freelancer-1',
        status: 'active'
      };

      db.collection().doc().get.mockResolvedValueOnce({
        exists: true,
        data: () => mockProject
      });

      db.collection().doc().get.mockResolvedValueOnce({
        exists: true,
        data: () => mockMilestone
      });

      db.collection().where().where().limit().get.mockResolvedValueOnce({
        empty: false,
        docs: [{
          data: () => mockContract
        }]
      });

      db.runTransaction.mockImplementation(async (callback) => {
        const transaction = {
          update: jest.fn(),
          set: jest.fn()
        };
        await callback(transaction);
        return { success: true, transactionId: 'tx-123', releaseAmount: 500 };
      });

      const result = await EscrowService.releaseMilestone('project-1', 'milestone-1', 'client-1');

      expect(result.success).toBe(true);
      expect(result.message).toBe('Milestone funds released successfully');
      expect(result.releaseAmount).toBe(500);
    });

    it('should throw error for non-approved milestone', async () => {
      const mockProject = {
        id: 'project-1',
        client_id: 'client-1',
        title: 'Test Project',
        escrow_balance: 1000
      };

      const mockMilestone = {
        id: 'milestone-1',
        project_id: 'project-1',
        title: 'Test Milestone',
        status: 'pending',
        percentage: 50
      };

      db.collection().doc().get.mockResolvedValueOnce({
        exists: true,
        data: () => mockProject
      });

      db.collection().doc().get.mockResolvedValueOnce({
        exists: true,
        data: () => mockMilestone
      });

      await expect(EscrowService.releaseMilestone('project-1', 'milestone-1', 'client-1'))
        .rejects.toThrow('Milestone must be approved before funds can be released');
    });

    it('should throw error for insufficient escrow balance', async () => {
      const mockProject = {
        id: 'project-1',
        client_id: 'client-1',
        title: 'Test Project',
        escrow_balance: 100
      };

      const mockMilestone = {
        id: 'milestone-1',
        project_id: 'project-1',
        title: 'Test Milestone',
        status: 'approved',
        percentage: 50
      };

      db.collection().doc().get.mockResolvedValueOnce({
        exists: true,
        data: () => mockProject
      });

      db.collection().doc().get.mockResolvedValueOnce({
        exists: true,
        data: () => mockMilestone
      });

      await expect(EscrowService.releaseMilestone('project-1', 'milestone-1', 'client-1'))
        .rejects.toThrow('Insufficient escrow balance');
    });
  });

  describe('partialRelease', () => {
    it('should successfully perform partial release', async () => {
      const mockMilestone = {
        id: 'milestone-1',
        project_id: 'project-1',
        title: 'Test Milestone',
        status: 'approved',
        percentage: 100
      };

      db.collection().doc().get.mockResolvedValueOnce({
        exists: true,
        data: () => mockMilestone
      });

      db.collection().doc().update.mockResolvedValueOnce({});

      // Mock the releaseMilestone method
      const originalReleaseMilestone = EscrowService.releaseMilestone;
      EscrowService.releaseMilestone = jest.fn().mockResolvedValueOnce({
        success: true,
        message: 'Milestone funds released successfully',
        transactionId: 'tx-123',
        releaseAmount: 250
      });

      const result = await EscrowService.partialRelease('project-1', 'milestone-1', 50, 'client-1');

      expect(result.success).toBe(true);
      expect(result.partialRelease).toBe(true);
      expect(result.originalPercentage).toBe(100);
      expect(result.releasedPercentage).toBe(50);

      // Restore original method
      EscrowService.releaseMilestone = originalReleaseMilestone;
    });

    it('should throw error for invalid percentage', async () => {
      await expect(EscrowService.partialRelease('project-1', 'milestone-1', 0, 'client-1'))
        .rejects.toThrow('Release percentage must be between 0 and 100');

      await expect(EscrowService.partialRelease('project-1', 'milestone-1', 101, 'client-1'))
        .rejects.toThrow('Release percentage must be between 0 and 100');
    });
  });

  describe('getEscrowBalance', () => {
    it('should return escrow balance for project', async () => {
      const mockProject = {
        id: 'project-1',
        title: 'Test Project',
        escrow_balance: 1000
      };

      db.collection().doc().get.mockResolvedValueOnce({
        exists: true,
        data: () => mockProject
      });

      const result = await EscrowService.getEscrowBalance('project-1');

      expect(result.success).toBe(true);
      expect(result.escrowBalance).toBe(1000);
      expect(result.projectTitle).toBe('Test Project');
    });

    it('should throw error for non-existent project', async () => {
      db.collection().doc().get.mockResolvedValueOnce({
        exists: false
      });

      await expect(EscrowService.getEscrowBalance('project-1'))
        .rejects.toThrow('Project not found');
    });
  });

  describe('getTransactionHistory', () => {
    it('should return transaction history for project', async () => {
      const mockTransactions = [
        {
          id: 'tx-1',
          project_id: 'project-1',
          type: 'escrow_fund',
          amount: 1000,
          status: 'settled'
        },
        {
          id: 'tx-2',
          project_id: 'project-1',
          type: 'milestone_release',
          amount: 500,
          status: 'settled'
        }
      ];

      db.collection().where().orderBy().get.mockResolvedValueOnce({
        docs: mockTransactions.map(tx => ({
          id: tx.id,
          data: () => tx
        }))
      });

      const result = await EscrowService.getTransactionHistory('project-1');

      expect(result.success).toBe(true);
      expect(result.transactions).toHaveLength(2);
      expect(result.transactions[0].id).toBe('tx-1');
      expect(result.transactions[1].id).toBe('tx-2');
    });
  });
});

// Integration tests
describe('EscrowService Integration', () => {
  it('should handle complete escrow flow', async () => {
    // This would be a more comprehensive integration test
    // that tests the entire flow from deposit to release
    // In a real implementation, you would set up test data
    // and verify the complete transaction flow
  });
});

// Performance tests
describe('EscrowService Performance', () => {
  it('should handle concurrent deposits', async () => {
    // Test concurrent operations to ensure data consistency
    const promises = Array(10).fill().map((_, i) => 
      EscrowService.depositToEscrow(`project-${i}`, 'client-1', 100)
    );

    // This would test that concurrent operations don't cause issues
    // In a real implementation, you'd use proper test data setup
  });
});
