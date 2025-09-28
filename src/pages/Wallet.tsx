import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { WalletPanel } from '@/components/wallet/WalletPanel';

export default function Wallet() {
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

  // Only students and clients have wallets
  if (userProfile.role === 'admin') {
    return <Navigate to="/admin" replace />;
  }

  // Redirect to onboarding if not completed
  if (!userProfile.isOnboarded) {
    return <Navigate to="/onboarding" replace />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">My Wallet</h1>
          <p className="text-muted-foreground">
            Manage your earnings, withdrawals, and transaction history
          </p>
        </div>
        
        <WalletPanel />
      </div>
    </div>
  );
}
