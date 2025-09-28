import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { doc, getDoc, collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/components/ui/use-toast';
import { Wallet, Transaction } from '@/types/escrow';
import { Wallet as WalletIcon, TrendingUp, TrendingDown, Clock, DollarSign, CreditCard, Download } from 'lucide-react';

export function WalletPanel() {
  const { user } = useAuth();
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [withdrawAmount, setWithdrawAmount] = useState('');

  useEffect(() => {
    if (!user) return;

    const fetchWallet = async () => {
      try {
        const walletDoc = await getDoc(doc(db, 'wallets', user.uid));
        if (walletDoc.exists()) {
          setWallet({ ...walletDoc.data(), uid: user.uid } as Wallet);
        }
      } catch (error) {
        console.error('Error fetching wallet:', error);
      }
    };

    // Set up real-time listener for transactions
    const transactionsQuery = query(
      collection(db, 'wallets', user.uid, 'transactions'),
      orderBy('createdAt', 'desc'),
      limit(20)
    );

    const unsubscribe = onSnapshot(transactionsQuery, (snapshot) => {
      const transactionData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
      })) as Transaction[];
      
      setTransactions(transactionData);
      setIsLoading(false);
    });

    fetchWallet();

    return () => unsubscribe();
  }, [user]);

  const handleWithdraw = async () => {
    if (!wallet || !withdrawAmount || parseFloat(withdrawAmount) <= 0) {
      toast({
        title: "Invalid amount",
        description: "Please enter a valid withdrawal amount.",
        variant: "destructive",
      });
      return;
    }

    const amount = parseFloat(withdrawAmount);
    if (amount > wallet.balance) {
      toast({
        title: "Insufficient funds",
        description: "You don't have enough balance to withdraw this amount.",
        variant: "destructive",
      });
      return;
    }

    // In a real app, this would integrate with a payment processor
    toast({
      title: "Withdrawal requested",
      description: `Your withdrawal request for $${amount} has been submitted. Processing time: 1-3 business days.`,
    });
    
    setWithdrawAmount('');
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'DEPOSIT':
        return <TrendingUp className="w-4 h-4 text-green-600" />;
      case 'WITHDRAWAL':
        return <TrendingDown className="w-4 h-4 text-red-600" />;
      case 'ESCROW_RELEASE':
        return <DollarSign className="w-4 h-4 text-blue-600" />;
      case 'REFUND':
        return <CreditCard className="w-4 h-4 text-purple-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  const getTransactionColor = (type: string) => {
    switch (type) {
      case 'DEPOSIT':
      case 'ESCROW_RELEASE':
      case 'REFUND':
        return 'text-green-600';
      case 'WITHDRAWAL':
        return 'text-red-600';
      default:
        return 'text-muted-foreground';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <Badge variant="default">Completed</Badge>;
      case 'PENDING':
        return <Badge variant="outline">Pending</Badge>;
      case 'FAILED':
        return <Badge variant="destructive">Failed</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </CardContent>
      </Card>
    );
  }

  if (!wallet) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Wallet not found</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Wallet Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <WalletIcon className="w-5 h-5 text-primary" />
            <CardTitle>Wallet Overview</CardTitle>
          </div>
          <CardDescription>
            Manage your earnings and withdrawals
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Balance Cards */}
            <div className="space-y-4">
              <div className="text-center p-6 bg-gradient-to-r from-green-500/10 to-blue-500/10 rounded-lg border">
                <DollarSign className="w-8 h-8 mx-auto mb-2 text-green-600" />
                <p className="text-3xl font-bold text-green-600">
                  ${wallet.balance.toFixed(2)}
                </p>
                <p className="text-sm text-muted-foreground">Available Balance</p>
              </div>
              
              <div className="text-center p-6 bg-muted/50 rounded-lg border">
                <Clock className="w-8 h-8 mx-auto mb-2 text-orange-600" />
                <p className="text-3xl font-bold text-orange-600">
                  ${wallet.pendingBalance.toFixed(2)}
                </p>
                <p className="text-sm text-muted-foreground">Pending Balance</p>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-4">
              <div className="space-y-2">
                <h3 className="font-semibold">Quick Actions</h3>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button className="w-full">
                      <Download className="w-4 h-4 mr-2" />
                      Withdraw Funds
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Withdraw Funds</DialogTitle>
                      <DialogDescription>
                        Enter the amount you'd like to withdraw. Funds will be transferred to your linked bank account.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium">Amount</label>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          max={wallet.balance}
                          placeholder="0.00"
                          value={withdrawAmount}
                          onChange={(e) => setWithdrawAmount(e.target.value)}
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          Available: ${wallet.balance.toFixed(2)}
                        </p>
                      </div>
                      <div className="bg-muted/50 p-3 rounded-lg">
                        <p className="text-sm text-muted-foreground">
                          <strong>Processing Time:</strong> 1-3 business days<br />
                          <strong>Fee:</strong> $2.50 for withdrawals under $100
                        </p>
                      </div>
                      <Button onClick={handleWithdraw} className="w-full">
                        Request Withdrawal
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
                
                <Button variant="outline" className="w-full">
                  <CreditCard className="w-4 h-4 mr-2" />
                  Payment Methods
                </Button>
              </div>

              <div className="bg-muted/50 p-4 rounded-lg">
                <h4 className="font-medium mb-2">Earnings Summary</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>This Month:</span>
                    <span className="font-medium">
                      ${transactions
                        .filter(t => t.type === 'ESCROW_RELEASE' && 
                          t.createdAt.getMonth() === new Date().getMonth())
                        .reduce((sum, t) => sum + t.amount, 0)
                        .toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Earned:</span>
                    <span className="font-medium">
                      ${transactions
                        .filter(t => t.type === 'ESCROW_RELEASE')
                        .reduce((sum, t) => sum + t.amount, 0)
                        .toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Transaction History */}
      <Card>
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
          <CardDescription>
            Your recent transactions and payments
          </CardDescription>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <div className="text-center py-8">
              <WalletIcon className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">No transactions yet</p>
              <p className="text-sm text-muted-foreground">
                Your transaction history will appear here once you start working on projects.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {transactions.map((transaction, index) => (
                <motion.div
                  key={transaction.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {getTransactionIcon(transaction.type)}
                    <div>
                      <p className="font-medium">{transaction.description}</p>
                      <p className="text-sm text-muted-foreground">
                        {transaction.createdAt.toLocaleDateString()} at{' '}
                        {transaction.createdAt.toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-semibold ${getTransactionColor(transaction.type)}`}>
                      {transaction.type === 'WITHDRAWAL' ? '-' : '+'}${Math.abs(transaction.amount).toFixed(2)}
                    </p>
                    {getStatusBadge(transaction.status)}
                  </div>
                </motion.div>
              ))}
              
              {transactions.length >= 20 && (
                <div className="text-center pt-4">
                  <Button variant="outline" size="sm">
                    Load More Transactions
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
