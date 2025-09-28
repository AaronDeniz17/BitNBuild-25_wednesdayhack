import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Clock, 
  DollarSign, 
  MessageSquare, 
  Star,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export interface Bid {
  id: string;
  freelancerId: string;
  freelancerName: string;
  freelancerAvatar?: string;
  freelancerRating: number;
  amount: number;
  deliveryTime: number; // in days
  proposal: string;
  skills: string[];
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: Date;
}

interface BidCardProps {
  bid: Bid;
  isClient?: boolean;
  onAccept?: (bidId: string) => void;
  onReject?: (bidId: string) => void;
  onMessage?: (freelancerId: string) => void;
}

export const BidCard = ({ bid, isClient = false, onAccept, onReject, onMessage }: BidCardProps) => {
  const { userProfile } = useAuth();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'accepted':
        return 'bg-green-500/10 text-green-600 border-green-200';
      case 'rejected':
        return 'bg-red-500/10 text-red-600 border-red-200';
      default:
        return 'bg-yellow-500/10 text-yellow-600 border-yellow-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'accepted':
        return <CheckCircle className="h-4 w-4" />;
      case 'rejected':
        return <XCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full"
    >
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="pb-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              <Avatar className="h-12 w-12">
                <AvatarImage src={bid.freelancerAvatar} />
                <AvatarFallback>
                  {bid.freelancerName.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-semibold text-lg">{bid.freelancerName}</h3>
                <div className="flex items-center space-x-1">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <span className="text-sm font-medium">{bid.freelancerRating}</span>
                  <span className="text-sm text-muted-foreground">(4.8)</span>
                </div>
              </div>
            </div>
            <Badge className={`${getStatusColor(bid.status)} flex items-center space-x-1`}>
              {getStatusIcon(bid.status)}
              <span className="capitalize">{bid.status}</span>
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Bid Details */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center space-x-2">
              <DollarSign className="h-4 w-4 text-green-600" />
              <div>
                <p className="text-sm text-muted-foreground">Bid Amount</p>
                <p className="font-semibold text-lg">${bid.amount}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-blue-600" />
              <div>
                <p className="text-sm text-muted-foreground">Delivery Time</p>
                <p className="font-semibold">{bid.deliveryTime} days</p>
              </div>
            </div>
          </div>

          {/* Skills */}
          <div>
            <p className="text-sm text-muted-foreground mb-2">Skills</p>
            <div className="flex flex-wrap gap-2">
              {bid.skills.map((skill) => (
                <Badge key={skill} variant="outline" className="text-xs">
                  {skill}
                </Badge>
              ))}
            </div>
          </div>

          {/* Proposal */}
          <div>
            <p className="text-sm text-muted-foreground mb-2">Proposal</p>
            <p className="text-sm bg-muted p-3 rounded-lg">{bid.proposal}</p>
          </div>

          {/* Actions */}
          {isClient && bid.status === 'pending' && (
            <div className="flex space-x-2 pt-4 border-t">
              <Button 
                onClick={() => onAccept?.(bid.id)}
                className="flex-1"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Accept Bid
              </Button>
              <Button 
                variant="outline"
                onClick={() => onReject?.(bid.id)}
                className="flex-1"
              >
                <XCircle className="h-4 w-4 mr-2" />
                Reject
              </Button>
            </div>
          )}

          {/* Message Button */}
          <div className="pt-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => onMessage?.(bid.freelancerId)}
              className="w-full"
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              Message Freelancer
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};
