import { useState } from 'react';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { 
  DollarSign, 
  Clock, 
  Send,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

const bidSchema = z.object({
  amount: z.number().min(1, 'Bid amount must be at least $1'),
  deliveryTime: z.number().min(1, 'Delivery time must be at least 1 day').max(365, 'Delivery time cannot exceed 365 days'),
  proposal: z.string().min(50, 'Proposal must be at least 50 characters').max(1000, 'Proposal cannot exceed 1000 characters'),
});

type BidFormData = z.infer<typeof bidSchema>;

interface BidFormProps {
  projectId: string;
  projectTitle: string;
  projectBudget?: string;
  onSubmit: (bidData: BidFormData & { projectId: string }) => Promise<void>;
  onCancel?: () => void;
}

export const BidForm = ({ projectId, projectTitle, projectBudget, onSubmit, onCancel }: BidFormProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { userProfile } = useAuth();
  const { toast } = useToast();

  const form = useForm<BidFormData>({
    resolver: zodResolver(bidSchema),
    defaultValues: {
      amount: 0,
      deliveryTime: 7,
      proposal: '',
    },
  });

  const handleSubmit = async (data: BidFormData) => {
    if (!userProfile || userProfile.role !== 'student') {
      toast({
        title: "Access Denied",
        description: "Only students can submit bids",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({ ...data, projectId });
      toast({
        title: "Bid Submitted!",
        description: "Your bid has been submitted successfully. The client will review it soon.",
      });
      form.reset();
      onCancel?.();
    } catch (error) {
      toast({
        title: "Submission Failed",
        description: "Failed to submit your bid. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const proposalLength = form.watch('proposal')?.length || 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-2xl mx-auto"
    >
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Send className="h-5 w-5" />
            <span>Submit Your Bid</span>
          </CardTitle>
          <div className="text-sm text-muted-foreground">
            <p><strong>Project:</strong> {projectTitle}</p>
            {projectBudget && <p><strong>Client Budget:</strong> {projectBudget}</p>}
          </div>
        </CardHeader>

        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
              {/* Bid Amount */}
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center space-x-2">
                      <DollarSign className="h-4 w-4" />
                      <span>Your Bid Amount (USD)</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="Enter your bid amount"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Delivery Time */}
              <FormField
                control={form.control}
                name="deliveryTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center space-x-2">
                      <Clock className="h-4 w-4" />
                      <span>Delivery Time (Days)</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="Number of days to complete"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Proposal */}
              <FormField
                control={form.control}
                name="proposal"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Your Proposal</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe your approach, experience, and why you're the best fit for this project..."
                        className="min-h-[120px]"
                        {...field}
                      />
                    </FormControl>
                    <div className="flex justify-between items-center text-xs text-muted-foreground">
                      <span>{proposalLength}/1000 characters</span>
                      <span>Minimum 50 characters required</span>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Skills Preview */}
              {userProfile && 'skills' in userProfile && userProfile.skills && (
                <div>
                  <Label className="text-sm font-medium">Your Skills</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {userProfile.skills.slice(0, 6).map((skill) => (
                      <Badge key={skill} variant="secondary" className="text-xs">
                        {skill}
                      </Badge>
                    ))}
                    {userProfile.skills.length > 6 && (
                      <Badge variant="outline" className="text-xs">
                        +{userProfile.skills.length - 6} more
                      </Badge>
                    )}
                  </div>
                </div>
              )}

              {/* Warning */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start space-x-2">
                  <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-yellow-800">Important:</p>
                    <p className="text-yellow-700">
                      Make sure your bid is competitive and your proposal clearly explains your approach. 
                      Once submitted, you cannot edit your bid.
                    </p>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex space-x-3 pt-4">
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Submit Bid
                    </>
                  )}
                </Button>
                {onCancel && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={onCancel}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                )}
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </motion.div>
  );
};
