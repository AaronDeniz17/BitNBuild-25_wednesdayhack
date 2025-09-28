import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { user, userProfile, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // If user profile doesn't exist but user is logged in, show loading
  // This handles the case where profile is still being fetched after signup
  if (!userProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Skip onboarding check for certain routes
  const skipOnboardingRoutes = ['/onboarding', '/auth'];
  const shouldCheckOnboarding = !skipOnboardingRoutes.includes(location.pathname);

  // Redirect to onboarding if not completed (except for admins and certain routes)
  if (shouldCheckOnboarding && userProfile.role !== 'admin' && !userProfile.isOnboarded) {
    return <Navigate to="/onboarding" replace />;
  }

  return <>{children}</>;
};