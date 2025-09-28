import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { doc, updateDoc, arrayUnion, collection, addDoc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/components/ui/use-toast';
import { Escrow, Milestone, Transaction } from '@/types/escrow';
import { DollarSign, Shield, Clock, CheckCircle, AlertTriangle, Plus } from 'lucide-react';

interface EscrowPanelProps {
  escrow: Escrow;
  onUpdate?: () => void;
}

export function EscrowPanel({ escrow, onUpdate }: EscrowPanelProps) {
  const { user, userProfile } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [depositAmount, setDepositAmount] = useState('');
  const [releaseAmount, setReleaseAmount] = useState('');
  const [selectedMilestone, setSelectedMilestone] = useState<string>('');
  const [feedback, setFeedback] = useState('');

  const isClient = userProfile?.role === 'client' && user?.uid === escrow.clientId;
  const isStudent = userProfile?.role === 'student' && user?.uid === escrow.studentId;
  
  const completedMilestones = escrow.milestones.filter(m => m.status === 'APPROVED');
  const totalMilestoneValue = escrow.milestones.reduce((sum, m) => sum + m.amount, 0);
  const completedValue = completedMilestones.reduce((sum, m) => sum + m.amount, 0);
  const progressPercentage = totalMilestoneValue > 0 ? (completedValue / totalMilestoneValue) * 100 : 0;

  const handleDepositFunds = async () => {
    if (!depositAmount || parseFloat(depositAmount) <= 0) {
      toast({
        title: "Invalid amount",
        description: "Please enter a valid deposit amount.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const amount = parseFloat(depositAmount);
      
      // Update escrow balance
      await updateDoc(doc(db, 'escrows', escrow.id), {
        escrowBalance: escrow.escrowBalance + amount,
        updatedAt: new Date(),
      });

      // Add transaction record
      await addDoc(collection(db, 'wallets', escrow.clientId, 'transactions'), {
        type: 'DEPOSIT',
        amount: -amount,
        description: `Deposited to escrow for project ${escrow.projectId}`,
        projectId: escrow.projectId,
        escrowId: escrow.id,
        status: 'COMPLETED',
        createdAt: new Date(),
      });

      setDepositAmount('');
      onUpdate?.();
      
      toast({
        title: "Funds deposited",
        description: `$${amount} has been deposited to escrow.`,
      });
    } catch (error) {
      console.error('Error depositing funds:', error);
      toast({
        title: "Error",
        description: "Failed to deposit funds. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleReleaseFunds = async (milestoneId: string, amount: number) => {
    if (amount > escrow.escrowBalance) {
      toast({
        title: "Insufficient funds",
        description: "Not enough funds in escrow to release this amount.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      // Update escrow
      const newReleasedAmount = escrow.releasedAmount + amount;
      const newEscrowBalance = escrow.escrowBalance - amount;
      const newStatus = newEscrowBalance === 0 ? 'COMPLETED' : 'PARTIAL_RELEASED';

      await updateDoc(doc(db, 'escrows', escrow.id), {
        escrowBalance: newEscrowBalance,
        releasedAmount: newReleasedAmount,
        status: newStatus,
        updatedAt: new Date(),
      });

      // Update milestone status
      const updatedMilestones = escrow.milestones.map(m => 
        m.id === milestoneId 
          ? { ...m, status: 'APPROVED' as const, approvedAt: new Date(), feedback }
          : m
      );

      await updateDoc(doc(db, 'escrows', escrow.id), {
        milestones: updatedMilestones,
      });

      // Add transaction to student wallet
      if (escrow.studentId) {
        await addDoc(collection(db, 'wallets', escrow.studentId, 'transactions'), {
          type: 'ESCROW_RELEASE',
          amount: amount,
          description: `Payment released for milestone completion`,
          projectId: escrow.projectId,
          escrowId: escrow.id,
          status: 'COMPLETED',
          createdAt: new Date(),
        });

        // Update student wallet balance
        const studentWalletRef = doc(db, 'wallets', escrow.studentId);
        const studentWallet = await getDoc(studentWalletRef);
        if (studentWallet.exists()) {
          await updateDoc(studentWalletRef, {
            balance: (studentWallet.data().balance || 0) + amount,
            updatedAt: new Date(),
          });
        }
      }

      setFeedback('');
      onUpdate?.();
      
      toast({
        title: "Funds released",
        description: `$${amount} has been released to the freelancer.`,
      });
    } catch (error) {
      console.error('Error releasing funds:', error);
      toast({
        title: "Error",
        description: "Failed to release funds. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePartialRelease = async () => {
    if (!releaseAmount || parseFloat(releaseAmount) <= 0) {
      toast({
        title: "Invalid amount",
        description: "Please enter a valid release amount.",
        variant: "destructive",
      });
      return;
    }

    const amount = parseFloat(releaseAmount);
    if (amount > escrow.escrowBalance) {
      toast({
        title: "Insufficient funds",
        description: "Not enough funds in escrow to release this amount.",
        variant: "destructive",
      });
      return;
    }

    await handleReleaseFunds('partial', amount);
    setReleaseAmount('');
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

  const getMilestoneStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'secondary';
      case 'SUBMITTED': return 'outline';
      case 'APPROVED': return 'default';
      case 'REJECTED': return 'destructive';
      default: return 'secondary';
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            <CardTitle>Escrow Management</CardTitle>
          </div>
          <Badge className={getStatusColor(escrow.status)}>
            {escrow.status.replace('_', ' ')}
          </Badge>
        </div>
        <CardDescription>
          Secure payment management for this project
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Escrow Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-muted/50 rounded-lg">
            <DollarSign className="w-6 h-6 mx-auto mb-2 text-green-600" />
            <p className="text-2xl font-bold">${escrow.escrowBalance.toFixed(2)}</p>
            <p className="text-sm text-muted-foreground">In Escrow</p>
          </div>
          <div className="text-center p-4 bg-muted/50 rounded-lg">
            <CheckCircle className="w-6 h-6 mx-auto mb-2 text-blue-600" />
            <p className="text-2xl font-bold">${escrow.releasedAmount.toFixed(2)}</p>
            <p className="text-sm text-muted-foreground">Released</p>
          </div>
          <div className="text-center p-4 bg-muted/50 rounded-lg">
            <Clock className="w-6 h-6 mx-auto mb-2 text-orange-600" />
            <p className="text-2xl font-bold">{escrow.milestones.length}</p>
            <p className="text-sm text-muted-foreground">Milestones</p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Project Progress</span>
            <span>{progressPercentage.toFixed(1)}%</span>
          </div>
          <Progress value={progressPercentage} className="w-full" />
        </div>

        <Separator />

        {/* Client Actions */}
        {isClient && (
          <div className="space-y-4">
            <h3 className="font-semibold">Client Actions</h3>
            
            {/* Deposit Funds */}
            <div className="flex gap-2">
              <Input
                placeholder="Amount to deposit"
                type="number"
                step="0.01"
                min="0"
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
              />
              <Button onClick={handleDepositFunds} disabled={isLoading}>
                <Plus className="w-4 h-4 mr-2" />
                Deposit
              </Button>
            </div>

            {/* Partial Release */}
            <div className="flex gap-2">
              <Input
                placeholder="Amount to release"
                type="number"
                step="0.01"
                min="0"
                max={escrow.escrowBalance}
                value={releaseAmount}
                onChange={(e) => setReleaseAmount(e.target.value)}
              />
              <Button onClick={handlePartialRelease} disabled={isLoading} variant="outline">
                Partial Release
              </Button>
            </div>
          </div>
        )}

        <Separator />

        {/* Milestones */}
        <div className="space-y-4">
          <h3 className="font-semibold">Project Milestones</h3>
          
          {escrow.milestones.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">
              No milestones defined for this project.
            </p>
          ) : (
            <div className="space-y-3">
              {escrow.milestones.map((milestone) => (
                <motion.div
                  key={milestone.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="border rounded-lg p-4"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">{milestone.title}</h4>
                    <div className="flex items-center gap-2">
                      <Badge variant={getMilestoneStatusColor(milestone.status)}>
                        {milestone.status}
                      </Badge>
                      <span className="font-semibold">${milestone.amount.toFixed(2)}</span>
                    </div>
                  </div>
                  
                  <p className="text-sm text-muted-foreground mb-3">
                    {milestone.description}
                  </p>

                  {milestone.status === 'SUBMITTED' && isClient && (
                    <div className="space-y-3">
                      <Textarea
                        placeholder="Provide feedback for this milestone..."
                        value={feedback}
                        onChange={(e) => setFeedback(e.target.value)}
                      />
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleReleaseFunds(milestone.id, milestone.amount)}
                          disabled={isLoading}
                        >
                          Approve & Release ${milestone.amount}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            // Handle rejection logic here
                            toast({
                              title: "Feature coming soon",
                              description: "Milestone rejection feature will be available soon.",
                            });
                          }}
                        >
                          Request Changes
                        </Button>
                      </div>
                    </div>
                  )}

                  {milestone.feedback && (
                    <div className="mt-3 p-3 bg-muted/50 rounded">
                      <p className="text-sm">
                        <strong>Feedback:</strong> {milestone.feedback}
                      </p>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Dispute Button */}
        {(isClient || isStudent) && escrow.status !== 'COMPLETED' && (
          <div className="pt-4 border-t">
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" className="w-full">
                  <AlertTriangle className="w-4 h-4 mr-2" />
                  Report Dispute
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Report Dispute</DialogTitle>
                  <DialogDescription>
                    If you're experiencing issues with this project, you can report a dispute. 
                    Our admin team will review and help resolve the issue.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Reason for dispute</Label>
                    <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                      <option>Work not delivered as agreed</option>
                      <option>Quality issues</option>
                      <option>Communication problems</option>
                      <option>Payment issues</option>
                      <option>Other</option>
                    </select>
                  </div>
                  <div>
                    <Label>Description</Label>
                    <Textarea placeholder="Please describe the issue in detail..." />
                  </div>
                  <Button className="w-full">Submit Dispute</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
