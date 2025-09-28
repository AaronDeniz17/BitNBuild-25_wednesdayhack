import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  Users,
  DollarSign,
  Flag,
  FileText,
  Eye,
  MessageSquare
} from "lucide-react";
import { Link } from "react-router-dom";

const Admin = () => {
  const disputes = [
    {
      id: 1,
      project: "E-commerce Website",
      client: "StartupTech Inc",
      freelancer: "John Doe",
      amount: "$1,500",
      reason: "Delayed delivery",
      status: "pending",
      priority: "high",
      createdAt: "2024-03-10",
    },
    {
      id: 2,
      project: "Mobile App Design",
      client: "FinanceCorv",
      freelancer: "Sarah Chen",
      amount: "$800",
      reason: "Quality concerns",
      status: "investigating",
      priority: "medium",
      createdAt: "2024-03-09",
    },
    {
      id: 3,
      project: "Content Writing",
      client: "BlogCorp",
      freelancer: "Mike Johnson",
      amount: "$400",
      reason: "Scope disagreement",
      status: "resolved",
      priority: "low",
      createdAt: "2024-03-08",
    },
  ];

  const flaggedReviews = [
    {
      id: 1,
      reviewer: "StartupTech Inc",
      reviewee: "John Doe",
      project: "E-commerce Website",
      rating: 1,
      comment: "Terrible work, completely unprofessional behavior.",
      reason: "Inappropriate language",
      status: "flagged",
      reportedBy: "System Auto-detection",
    },
    {
      id: 2,
      reviewer: "Jane Smith",
      reviewee: "TechCorp",
      project: "Logo Design",
      rating: 5,
      comment: "Amazing work! Best designer ever! Contact me for more projects at fake-email@spam.com",
      reason: "Suspected fake review",
      status: "under_review",
      reportedBy: "Community Report",
    },
  ];

  const transactions = [
    {
      id: 1,
      from: "StartupTech Inc",
      to: "John Doe",
      amount: "$1,125.00",
      fee: "$75.00",
      project: "E-commerce Website",
      status: "completed",
      date: "2024-03-10",
      type: "project_payment",
    },
    {
      id: 2,
      from: "FinanceCorv",
      to: "Sarah Chen",
      amount: "$600.00",
      fee: "$40.00",
      project: "Mobile App Design",
      status: "pending",
      date: "2024-03-09",
      type: "milestone_payment",
    },
    {
      id: 3,
      from: "WorkLink Collab",
      to: "Mike Johnson",
      amount: "$50.00",
      fee: "$0.00",
      project: "Referral Bonus",
      status: "completed",
      date: "2024-03-08",
      type: "bonus",
    },
  ];

  const contractFlags = [
    {
      id: 1,
      project: "Crypto Trading Bot",
      client: "CryptoVentures",
      freelancer: "Anonymous Dev",
      reason: "Suspicious activity - potential violation of terms",
      flaggedAt: "2024-03-10",
      status: "investigating",
    },
    {
      id: 2,
      project: "Essay Writing Service",
      client: "StudentHelper",
      freelancer: "Writing Pro",
      reason: "Academic dishonesty concerns",
      flaggedAt: "2024-03-09",
      status: "flagged",
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
      case "resolved":
        return "text-green-600";
      case "pending":
      case "flagged":
        return "text-orange-500";
      case "investigating":
      case "under_review":
        return "text-blue-600";
      case "failed":
        return "text-red-600";
      default:
        return "text-muted-foreground";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "text-red-600";
      case "medium":
        return "text-orange-500";
      case "low":
        return "text-green-600";
      default:
        return "text-muted-foreground";
    }
  };

  const getStatusBadgeVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case "completed":
      case "resolved":
        return "default";
      case "pending":
      case "flagged":
        return "destructive";
      case "investigating":
      case "under_review":
        return "secondary";
      default:
        return "outline";
    }
  };

  return (
    <div className="min-h-screen bg-background pt-16"> {/* Added pt-16 to account for fixed navbar */}

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Page Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold mb-4">Admin Dashboard</h1>
          <p className="text-muted-foreground">
            Monitor platform activity, resolve disputes, and maintain community standards
          </p>
        </motion.div>

        {/* Quick Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8"
        >
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="p-2 bg-red-500/10 rounded-lg">
                  <AlertTriangle className="h-6 w-6 text-red-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Active Disputes</p>
                  <p className="text-2xl font-bold">3</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="p-2 bg-orange-500/10 rounded-lg">
                  <Flag className="h-6 w-6 text-orange-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Flagged Content</p>
                  <p className="text-2xl font-bold">7</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="p-2 bg-blue-500/10 rounded-lg">
                  <DollarSign className="h-6 w-6 text-blue-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Pending Payments</p>
                  <p className="text-2xl font-bold">$2,400</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="p-2 bg-green-500/10 rounded-lg">
                  <Users className="h-6 w-6 text-green-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Active Users</p>
                  <p className="text-2xl font-bold">1,247</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Main Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Tabs defaultValue="disputes" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="disputes">Dispute Resolution</TabsTrigger>
              <TabsTrigger value="reviews">Flagged Reviews</TabsTrigger>
              <TabsTrigger value="transactions">Transactions</TabsTrigger>
              <TabsTrigger value="contracts">Contract Flags</TabsTrigger>
            </TabsList>

            <TabsContent value="disputes">
              <Card>
                <CardHeader>
                  <CardTitle>Active Disputes</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Dispute ID</TableHead>
                        <TableHead>Project</TableHead>
                        <TableHead>Parties</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Reason</TableHead>
                        <TableHead>Priority</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {disputes.map((dispute) => (
                        <TableRow key={dispute.id}>
                          <TableCell className="font-medium">#{dispute.id}</TableCell>
                          <TableCell>{dispute.project}</TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <div className="text-sm">{dispute.client}</div>
                              <div className="text-sm text-muted-foreground">vs {dispute.freelancer}</div>
                            </div>
                          </TableCell>
                          <TableCell className="font-medium">{dispute.amount}</TableCell>
                          <TableCell>{dispute.reason}</TableCell>
                          <TableCell>
                            <span className={`font-medium ${getPriorityColor(dispute.priority)}`}>
                              {dispute.priority.toUpperCase()}
                            </span>
                          </TableCell>
                          <TableCell>
                            <Badge variant={getStatusBadgeVariant(dispute.status)}>
                              {dispute.status.replace('_', ' ')}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              <Button variant="ghost" size="sm">
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="sm">
                                <MessageSquare className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="reviews">
              <Card>
                <CardHeader>
                  <CardTitle>Flagged Reviews</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {flaggedReviews.map((review) => (
                      <div key={review.id} className="border border-border rounded-lg p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h4 className="font-semibold">{review.project}</h4>
                            <p className="text-sm text-muted-foreground">
                              Review by {review.reviewer} for {review.reviewee}
                            </p>
                          </div>
                          <Badge variant={getStatusBadgeVariant(review.status)}>
                            {review.status.replace('_', ' ')}
                          </Badge>
                        </div>
                        <div className="bg-muted p-3 rounded-lg mb-3">
                          <div className="flex items-center space-x-2 mb-2">
                            <div className="flex">
                              {Array.from({ length: 5 }, (_, i) => (
                                <span key={i} className={i < review.rating ? "text-yellow-500" : "text-gray-300"}>
                                  ★
                                </span>
                              ))}
                            </div>
                            <span className="text-sm font-medium">{review.rating}/5</span>
                          </div>
                          <p className="text-sm">"{review.comment}"</p>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="text-sm text-muted-foreground">
                            Flagged for: {review.reason} • Reported by: {review.reportedBy}
                          </div>
                          <div className="flex space-x-2">
                            <Button variant="ghost" size="sm">
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Approve
                            </Button>
                            <Button variant="destructive" size="sm">
                              <XCircle className="h-4 w-4 mr-1" />
                              Remove
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="transactions">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Transactions</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Transaction ID</TableHead>
                        <TableHead>From</TableHead>
                        <TableHead>To</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Fee</TableHead>
                        <TableHead>Project</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {transactions.map((transaction) => (
                        <TableRow key={transaction.id}>
                          <TableCell className="font-medium">#{transaction.id}</TableCell>
                          <TableCell>{transaction.from}</TableCell>
                          <TableCell>{transaction.to}</TableCell>
                          <TableCell className="font-medium">{transaction.amount}</TableCell>
                          <TableCell>{transaction.fee}</TableCell>
                          <TableCell>{transaction.project}</TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {transaction.type.replace('_', ' ')}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={getStatusBadgeVariant(transaction.status)}>
                              {transaction.status}
                            </Badge>
                          </TableCell>
                          <TableCell>{transaction.date}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="contracts">
              <Card>
                <CardHeader>
                  <CardTitle>Flagged Contracts</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {contractFlags.map((contract) => (
                      <div key={contract.id} className="border border-border rounded-lg p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h4 className="font-semibold">{contract.project}</h4>
                            <p className="text-sm text-muted-foreground">
                              Client: {contract.client} • Freelancer: {contract.freelancer}
                            </p>
                          </div>
                          <Badge variant={getStatusBadgeVariant(contract.status)}>
                            {contract.status}
                          </Badge>
                        </div>
                        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-3">
                          <div className="flex items-center space-x-2">
                            <AlertTriangle className="h-4 w-4 text-red-500" />
                            <span className="text-sm font-medium text-red-700">Flag Reason:</span>
                          </div>
                          <p className="text-sm text-red-600 mt-1">{contract.reason}</p>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="text-sm text-muted-foreground">
                            Flagged on: {contract.flaggedAt}
                          </div>
                          <div className="flex space-x-2">
                            <Button variant="ghost" size="sm">
                              <Eye className="h-4 w-4 mr-1" />
                              Review
                            </Button>
                            <Button variant="destructive" size="sm">
                              <XCircle className="h-4 w-4 mr-1" />
                              Suspend
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </div>
  );
};

export default Admin;