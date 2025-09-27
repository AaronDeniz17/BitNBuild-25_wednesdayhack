// Main Dashboard Router for GigCampus
// Redirects users to appropriate dashboard based on role

import { useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '../components/Layout/Layout';
import { useAuth } from '../contexts/AuthContext';

const DashboardPage = () => {
  const { user, isAuthenticated, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!isAuthenticated) {
        router.push('/login');
        return;
      }

      // Redirect based on user role
      switch (user?.role) {
        case 'student':
          router.push('/student/dashboard');
          break;
        case 'client':
          router.push('/client/dashboard');
          break;
        case 'admin':
          router.push('/admin/dashboard');
          break;
        default:
          // If no role or unknown role, redirect to role selection
          router.push('/register?step=role');
          break;
      }
    }
  }, [user, isAuthenticated, loading, router]);

  if (loading || !isAuthenticated) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading dashboard...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Redirecting to your dashboard...</p>
        </div>
      </div>
    </Layout>
  );
};

export default DashboardPage;