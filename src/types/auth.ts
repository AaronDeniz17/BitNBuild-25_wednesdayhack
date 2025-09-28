export type UserRole = 'student' | 'client' | 'admin';

export interface StudentProfile {
  uid: string;
  name: string;
  email: string;
  role: 'student';
  skills: string[];
  portfolioLinks: {
    github?: string;
    behance?: string;
    linkedin?: string;
    website?: string;
  };
  availability: number; // hours per week
  hourlyRate: number;
  bio: string;
  badges: string[];
  createdAt: Date;
  updatedAt: Date;
  isOnboarded: boolean;
}

export interface ClientProfile {
  uid: string;
  name: string;
  email: string;
  role: 'client';
  companyName: string;
  kycVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
  isOnboarded: boolean;
}

export interface AdminProfile {
  uid: string;
  name: string;
  email: string;
  role: 'admin';
  permissions: string[];
  createdAt: Date;
  updatedAt: Date;
  isOnboarded: boolean;
}

export type UserProfile = StudentProfile | ClientProfile | AdminProfile;
