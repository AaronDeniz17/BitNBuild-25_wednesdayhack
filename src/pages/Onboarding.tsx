import { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { StudentOnboardingForm } from '@/components/onboarding/StudentOnboardingForm';
import { ClientOnboardingForm } from '@/components/onboarding/ClientOnboardingForm';

export default function Onboarding() {
  const { user, userProfile, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user || !userProfile) {
    return <Navigate to="/auth" replace />;
  }

  // If already onboarded, redirect to dashboard
  if (userProfile.isOnboarded) {
    return <Navigate to="/dashboard" replace />;
  }

  // Show appropriate onboarding form based on role
  switch (userProfile.role) {
    case 'student':
      return <StudentOnboardingForm />;
    case 'client':
      return <ClientOnboardingForm />;
    case 'admin':
      // Admins don't need onboarding, redirect to dashboard
      return <Navigate to="/dashboard" replace />;
    default:
      return <Navigate to="/auth" replace />;
  }
}
