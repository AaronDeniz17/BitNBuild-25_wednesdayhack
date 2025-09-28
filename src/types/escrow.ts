export type EscrowStatus = 'HOLDING' | 'PARTIAL_RELEASED' | 'COMPLETED' | 'DISPUTED';

export interface Escrow {
  id: string;
  projectId: string;
  clientId: string;
  studentId?: string;
  escrowBalance: number;
  releasedAmount: number;
  status: EscrowStatus;
  milestones: Milestone[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Milestone {
  id: string;
  title: string;
  description: string;
  amount: number;
  status: 'PENDING' | 'SUBMITTED' | 'APPROVED' | 'REJECTED';
  submittedAt?: Date;
  approvedAt?: Date;
  feedback?: string;
}

export interface Wallet {
  uid: string;
  balance: number;
  pendingBalance: number;
  transactions: Transaction[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Transaction {
  id: string;
  type: 'DEPOSIT' | 'WITHDRAWAL' | 'ESCROW_RELEASE' | 'REFUND';
  amount: number;
  description: string;
  projectId?: string;
  escrowId?: string;
  status: 'PENDING' | 'COMPLETED' | 'FAILED';
  createdAt: Date;
}

export interface Dispute {
  id: string;
  escrowId: string;
  projectId: string;
  clientId: string;
  studentId: string;
  reason: string;
  description: string;
  status: 'OPEN' | 'INVESTIGATING' | 'RESOLVED' | 'CLOSED';
  resolution?: string;
  adminId?: string;
  createdAt: Date;
  resolvedAt?: Date;
}
