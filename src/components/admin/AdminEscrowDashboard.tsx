import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { collection, query, where, orderBy, onSnapshot, doc, updateDoc, addDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/components/ui/use-toast';
import { Escrow, Dispute } from '@/types/escrow';
import { Shield, AlertTriangle, Users, DollarSign, Clock, CheckCircle, XCircle, Eye, MessageSquare } from 'lucide-react';

export function AdminEscrowDashboard() {
  const { user, userProfile } = useAuth();
  const [escrows, setEscrows] = useState<Escrow[]>([]);
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedEscrow, setSelectedEscrow] = useState<Escrow | null>(null);
  const [selectedDispute, setSelectedDispute] = useState<Dispute | null>(null);
  const [resolution, setResolution] = useState('');
  const [adjustmentAmount, setAdjustmentAmount] = useState('');
  const [adjustmentReason, setAdjustmentReason] = useState('');

  useEffect(() => {
    if (!user || userProfile?.role !== 'admin') return;

    // Listen to escrows
    const escrowsQuery = query(
      collection(db, 'escrows'),
      orderBy('updatedAt', 'desc')
    );

    const unsubscribeEscrows = onSnapshot(escrowsQuery, (snapshot) => {
      const escrowData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date(),
      })) as Escrow[];
      
      setEscrows(escrowData);
    });

    // Listen to disputes
    const disputesQuery = query(
      collection(db, 'disputes'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribeDisputes = onSnapshot(disputesQuery, (snapshot) => {
      const disputeData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        resolvedAt: doc.data().resolvedAt?.toDate(),
      })) as Dispute[];
      
      setDisputes(disputeData);
      setIsLoading(false);
    });

    return () => {
      unsubscribeEscrows();
      unsubscribeDisputes();
    };
  }, [user, userProfile]);

  const handleResolveDispute = async (disputeId: string) => {
    if (!resolution.trim()) {
      toast({
        title: "Resolution required",
        description: "Please provide a resolution before closing the dispute.",
        variant: "destructive",
      });
      return;
    }

    try {
      await updateDoc(doc(db, 'disputes', disputeId), {
        status: 'RESOLVED',
        resolution: resolution,
        adminId: user?.uid,
        resolvedAt: new Date(),
      });

      setResolution('');
      setSelectedDispute(null);
      
      toast({
        title: "Dispute resolved",
        description: "The dispute has been successfully resolved.",
      });
    } catch (error) {
      console.error('Error resolving dispute:', error);
      toast({
        title: "Error",
        description: "Failed to resolve dispute. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleAdjustBalance = async (escrowId: string, action: 'transfer' | 'refund' | 'hold') => {
    if (!adjustmentAmount || parseFloat(adjustmentAmount) <= 0) {
      toast({
        title: "Invalid amount",
        description: "Please enter a valid adjustment amount.",
        variant: "destructive",
      });
      return;
    }

    if (!adjustmentReason.trim()) {
      toast({
        title: "Reason required",
        description: "Please provide a reason for this adjustment.",
        variant: "destructive",
      });
      return;
    }

    try {
      const amount = parseFloat(adjustmentAmount);
      const escrow = escrows.find(e => e.id === escrowId);
      if (!escrow) return;

      let updates: any = {
        updatedAt: new Date(),
      };

      switch (action) {
        case 'transfer':
          updates.escrowBalance = Math.max(0, escrow.escrowBalance - amount);
          updates.releasedAmount = escrow.releasedAmount + amount;
          break;
        case 'refund':
          updates.escrowBalance = Math.max(0, escrow.escrowBalance - amount);
          break;
        case 'hold':
          updates.status = 'DISPUTED';
          break;
      }

      await updateDoc(doc(db, 'escrows', escrowId), updates);

      // Log the admin action
      await addDoc(collection(db, 'admin_actions'), {
        adminId: user?.uid,
        action: `escrow_${action}`,
        escrowId: escrowId,
        amount: amount,
        reason: adjustmentReason,
        timestamp: new Date(),
      });

      setAdjustmentAmount('');
      setAdjustmentReason('');
      setSelectedEscrow(null);
      
      toast({
        title: "Balance adjusted",
        description: `Escrow balance has been ${action}ed successfully.`,
      });
    } catch (error) {
      console.error('Error adjusting balance:', error);
      toast({
        title: "Error",
        description: "Failed to adjust balance. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'HOLDING': return 'bg-yellow-500';
      case 'PARTIAL_RELEASED': return 'bg-blue-500';
      case 'COMPLETED': return 'bg-green-500';
      case 'DISPUTED': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getDisputeStatusColor = (status: string) => {
    switch (status) {
      case 'OPEN': return 'destructive';
      case 'INVESTIGATING': return 'outline';
      case 'RESOLVED': return 'default';
      case 'CLOSED': return 'secondary';
      default: return 'secondary';
    }
  };

  if (userProfile?.role !== 'admin') {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-center">
            <Shield className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">Access denied. Admin privileges required.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </CardContent>
      </Card>
    );
  }

  const stats = {
    totalEscrows: escrows.length,
    activeDisputes: disputes.filter(d => d.status === 'OPEN' || d.status === 'INVESTIGATING').length,
    totalValue: escrows.reduce((sum, e) => sum + e.escrowBalance + e.releasedAmount, 0),
    disputedValue: escrows.filter(e => e.status === 'DISPUTED').reduce((sum, e) => sum + e.escrowBalance, 0),
  };

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="flex items-center p-6">
            <Shield className="w-8 h-8 text-blue-600 mr-3" />
            <div>
              <p className="text-2xl font-bold">{stats.totalEscrows}</p>
              <p className="text-sm text-muted-foreground">Total Escrows</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="flex items-center p-6">
            <AlertTriangle className="w-8 h-8 text-red-600 mr-3" />
            <div>
              <p className="text-2xl font-bold">{stats.activeDisputes}</p>
              <p className="text-sm text-muted-foreground">Active Disputes</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="flex items-center p-6">
            <DollarSign className="w-8 h-8 text-green-600 mr-3" />
            <div>
              <p className="text-2xl font-bold">${stats.totalValue.toFixed(0)}</p>
              <p className="text-sm text-muted-foreground">Total Value</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="flex items-center p-6">
            <XCircle className="w-8 h-8 text-orange-600 mr-3" />
            <div>
              <p className="text-2xl font-bold">${stats.disputedValue.toFixed(0)}</p>
              <p className="text-sm text-muted-foreground">Disputed Value</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Dashboard */}
      <Tabs defaultValue="disputes" className="space-y-4">
        <TabsList>
          <TabsTrigger value="disputes">Active Disputes</TabsTrigger>
          <TabsTrigger value="escrows">All Escrows</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="disputes" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Dispute Management</CardTitle>
              <CardDescription>
                Review and resolve disputes between clients and freelancers
              </CardDescription>
            </CardHeader>
            <CardContent>
              {disputes.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="w-12 h-12 mx-auto mb-4 text-green-600" />
                  <p className="text-muted-foreground">No active disputes</p>
                  <p className="text-sm text-muted-foreground">
                    All disputes have been resolved or there are no disputes to review.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {disputes.map((dispute) => (
                    <motion.div
                      key={dispute.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="border rounded-lg p-4"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Badge variant={getDisputeStatusColor(dispute.status)}>
                            {dispute.status}
                          </Badge>
                          <span className="font-medium">Dispute #{dispute.id.slice(-6)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button size="sm" variant="outline">
                                <Eye className="w-4 h-4 mr-2" />
                                View Details
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl">
                              <DialogHeader>
                                <DialogTitle>Dispute Details</DialogTitle>
                                <DialogDescription>
                                  Review dispute information and take action
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <Label>Reason</Label>
                                    <p className="text-sm">{dispute.reason}</p>
                                  </div>
                                  <div>
                                    <Label>Created</Label>
                                    <p className="text-sm">{dispute.createdAt.toLocaleDateString()}</p>
                                  </div>
                                </div>
                                <div>
                                  <Label>Description</Label>
                                  <p className="text-sm bg-muted/50 p-3 rounded">
                                    {dispute.description}
                                  </p>
                                </div>
                                {dispute.status === 'OPEN' && (
                                  <div className="space-y-3">
                                    <Label>Resolution</Label>
                                    <Textarea
                                      placeholder="Provide your resolution and decision..."
                                      value={resolution}
                                      onChange={(e) => setResolution(e.target.value)}
                                    />
                                    <Button 
                                      onClick={() => handleResolveDispute(dispute.id)}
                                      className="w-full"
                                    >
                                      Resolve Dispute
                                    </Button>
                                  </div>
                                )}
                                {dispute.resolution && (
                                  <div>
                                    <Label>Resolution</Label>
                                    <p className="text-sm bg-green-50 p-3 rounded border border-green-200">
                                      {dispute.resolution}
                                    </p>
                                  </div>
                                )}
                              </div>
                            </DialogContent>
                          </Dialog>
                        </div>
                      </div>
                      
                      <p className="text-sm text-muted-foreground mb-2">
                        <strong>Reason:</strong> {dispute.reason}
                      </p>
                      <p className="text-sm">{dispute.description}</p>
                      
                      {dispute.resolution && (
                        <div className="mt-3 p-3 bg-green-50 rounded border border-green-200">
                          <p className="text-sm">
                            <strong>Resolution:</strong> {dispute.resolution}
                          </p>
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="escrows" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Escrow Management</CardTitle>
              <CardDescription>
                Monitor and manage all escrow accounts
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {escrows.map((escrow) => (
                  <motion.div
                    key={escrow.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="border rounded-lg p-4"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Badge className={getStatusColor(escrow.status)}>
                          {escrow.status.replace('_', ' ')}
                        </Badge>
                        <span className="font-medium">Project #{escrow.projectId.slice(-6)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">
                          Balance: ${escrow.escrowBalance.toFixed(2)}
                        </span>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button size="sm" variant="outline">
                              Manage
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Manage Escrow</DialogTitle>
                              <DialogDescription>
                                Adjust escrow balance or transfer funds
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <Label>Escrow Balance</Label>
                                  <p className="text-lg font-semibold">${escrow.escrowBalance.toFixed(2)}</p>
                                </div>
                                <div>
                                  <Label>Released Amount</Label>
                                  <p className="text-lg font-semibold">${escrow.releasedAmount.toFixed(2)}</p>
                                </div>
                              </div>
                              
                              <div className="space-y-2">
                                <Label>Adjustment Amount</Label>
                                <Input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  max={escrow.escrowBalance}
                                  placeholder="0.00"
                                  value={adjustmentAmount}
                                  onChange={(e) => setAdjustmentAmount(e.target.value)}
                                />
                              </div>
                              
                              <div className="space-y-2">
                                <Label>Reason</Label>
                                <Textarea
                                  placeholder="Provide reason for adjustment..."
                                  value={adjustmentReason}
                                  onChange={(e) => setAdjustmentReason(e.target.value)}
                                />
                              </div>
                              
                              <div className="flex gap-2">
                                <Button 
                                  onClick={() => handleAdjustBalance(escrow.id, 'transfer')}
                                  className="flex-1"
                                >
                                  Transfer to Student
                                </Button>
                                <Button 
                                  onClick={() => handleAdjustBalance(escrow.id, 'refund')}
                                  variant="outline"
                                  className="flex-1"
                                >
                                  Refund to Client
                                </Button>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Milestones:</span>
                        <span className="ml-2">{escrow.milestones.length}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Created:</span>
                        <span className="ml-2">{escrow.createdAt.toLocaleDateString()}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Updated:</span>
                        <span className="ml-2">{escrow.updatedAt.toLocaleDateString()}</span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Platform Analytics</CardTitle>
              <CardDescription>
                Overview of platform performance and metrics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="font-semibold">Escrow Status Distribution</h3>
                  <div className="space-y-2">
                    {['HOLDING', 'PARTIAL_RELEASED', 'COMPLETED', 'DISPUTED'].map(status => {
                      const count = escrows.filter(e => e.status === status).length;
                      const percentage = escrows.length > 0 ? (count / escrows.length) * 100 : 0;
                      return (
                        <div key={status} className="flex items-center justify-between">
                          <span className="text-sm">{status.replace('_', ' ')}</span>
                          <div className="flex items-center gap-2">
                            <div className="w-20 bg-muted rounded-full h-2">
                              <div 
                                className={`h-2 rounded-full ${getStatusColor(status)}`}
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                            <span className="text-sm w-8">{count}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h3 className="font-semibold">Recent Activity</h3>
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">
                      This feature will show recent platform activity, user registrations, 
                      project completions, and other key metrics.
                    </p>
                    <div className="bg-muted/50 p-4 rounded-lg">
                      <p className="text-sm">Analytics dashboard coming soon...</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
