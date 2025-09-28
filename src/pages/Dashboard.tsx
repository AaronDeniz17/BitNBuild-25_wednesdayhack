import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Briefcase, 
  DollarSign, 
  Clock, 
  TrendingUp,
  Users,
  Star,
  Award,
  Wallet,
  Search,
  Plus,
  BarChart3,
  FileText,
  MessageSquare,
  Settings,
  Trophy,
  Target,
  Zap,
  CheckCircle,
  Shield
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate, Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { RankingCard } from "@/components/ranking/RankingCard";
import { calculateRankingScore, calculateLevel, UserRanking, UserStats, checkUnlockedBadges } from "@/lib/ranking";
import { StudentProfile, ClientProfile, AdminProfile } from "@/types/auth";

// Student Dashboard Component
const StudentDashboardContent = ({ userProfile }: { userProfile: StudentProfile }) => {
  const [availableProjects, setAvailableProjects] = useState<any[]>([]);
  const [userRanking, setUserRanking] = useState<UserRanking | null>(null);

  useEffect(() => {
    // Load available projects from localStorage
    const projects = JSON.parse(localStorage.getItem('gigcampus_projects') || '[]');
    setAvailableProjects(projects.slice(0, 3)); // Show top 3 recent projects

    // Generate sample user stats and ranking
    const stats: UserStats = {
      totalProjects: 8,
      completedProjects: 7,
      averageRating: 4.8,
      totalReviews: 12,
      onTimeDeliveries: 6,
      repeatClients: 3,
      totalEarnings: 2400,
      responseTime: 2.5,
      profileCompleteness: 85
    };

    const score = calculateRankingScore(stats);
    const level = calculateLevel(1250); // Sample points
    const badges = checkUnlockedBadges(stats, []);

    setUserRanking({
      userId: userProfile.uid || 'student',
      rank: 15,
      score,
      level,
      points: 1250,
      badges,
      stats,
      tier: score >= 80 ? 'Platinum' : score >= 70 ? 'Gold' : score >= 60 ? 'Silver' : 'Bronze'
    });

    // Listen for new projects
    const handleProjectPosted = (event: any) => {
      const newProject = event.detail;
      setAvailableProjects(prev => [newProject, ...prev.slice(0, 2)]);
    };

    window.addEventListener('projectPosted', handleProjectPosted);
    return () => window.removeEventListener('projectPosted', handleProjectPosted);
  }, [userProfile]);

  return (
    <div className="container mx-auto px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold mb-2">Welcome back, {userProfile.name}! 👋</h1>
        <p className="text-muted-foreground">Ready to work on some amazing projects on GigCampus?</p>
      </motion.div>

    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center space-x-4">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Briefcase className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Active Projects</p>
              <p className="text-2xl font-bold">2</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center space-x-4">
            <div className="p-2 bg-green-500/10 rounded-lg">
              <Wallet className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Earned</p>
              <p className="text-2xl font-bold">$1,250</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center space-x-4">
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <Trophy className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Completed</p>
              <p className="text-2xl font-bold">8</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center space-x-4">
            <div className="p-2 bg-orange-500/10 rounded-lg">
              <Clock className="h-6 w-6 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Hours/Week</p>
              <p className="text-2xl font-bold">{userProfile.availability}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>

    <div className="grid lg:grid-cols-2 gap-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            My Projects
            <Link to="/projects">
              <Button variant="ghost" size="sm">View All</Button>
            </Link>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="border rounded-lg p-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold">E-commerce Website</h3>
                  <p className="text-sm text-muted-foreground">Tech Startup</p>
                </div>
                <Badge>In Progress</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-lg font-bold text-primary">$800</span>
                <div className="flex items-center space-x-2">
                  <div className="w-20 h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-primary w-3/4" />
                  </div>
                  <span className="text-sm text-muted-foreground">75%</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Recommended Projects
            <Link to="/projects">
              <Button variant="ghost" size="sm">View All</Button>
            </Link>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer">
              <div className="flex items-start justify-between mb-3">
                <h3 className="font-semibold">Logo Design</h3>
                <span className="text-lg font-bold text-primary">$300</span>
              </div>
              <div className="flex flex-wrap gap-2 mb-3">
                <Badge variant="outline" className="text-xs">Design</Badge>
                <Badge variant="outline" className="text-xs">Illustrator</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Deadline: 2 days</span>
                <Button variant="outline" size="sm">Apply</Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>

    <div className="mt-8">
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link to="/projects">
              <Button variant="outline" className="w-full">
                <Search className="w-4 h-4 mr-2" />
                Find Work
              </Button>
            </Link>
            <Link to="/wallet">
              <Button variant="outline" className="w-full">
                <Wallet className="w-4 h-4 mr-2" />
                My Wallet
              </Button>
            </Link>
            <Link to={`/portfolio/${userProfile.uid}`}>
              <Button variant="outline" className="w-full">
                <Trophy className="w-4 h-4 mr-2" />
                Portfolio
              </Button>
            </Link>
            <Link to="/leaderboard">
              <Button variant="outline" className="w-full">
                <TrendingUp className="w-4 h-4 mr-2" />
                Leaderboard
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* New Available Projects Section */}
      {availableProjects.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center space-x-2">
                <Plus className="h-5 w-5 text-green-600" />
                <span>New Projects</span>
              </span>
              <Link to="/projects">
                <Button variant="ghost" size="sm">View All</Button>
              </Link>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {availableProjects.map((project) => (
                <div key={project.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="font-semibold">{project.title}</h3>
                    <span className="text-lg font-bold text-primary">
                      ${project.budget.min}-${project.budget.max}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                    {project.description}
                  </p>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {project.skills.slice(0, 3).map((skill: string) => (
                      <Badge key={skill} variant="outline" className="text-xs">
                        {skill}
                      </Badge>
                    ))}
                    {project.skills.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{project.skills.length - 3} more
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                      <span>Duration: {project.duration}</span>
                      <span>By: {project.clientName}</span>
                    </div>
                    <Link to={`/project/${project.id}`}>
                      <Button variant="outline" size="sm">View Details</Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* User Ranking Card */}
      {userRanking && (
        <div className="mt-8">
          <h2 className="text-2xl font-bold mb-4 flex items-center space-x-2">
            <Trophy className="h-6 w-6 text-yellow-500" />
            <span>Your Ranking & Progress</span>
          </h2>
          <RankingCard ranking={userRanking} showDetailed={true} />
        </div>
      )}
    </div>
  </div>
  );
};

// Client Dashboard Component
const ClientDashboardContent = ({ userProfile }: { userProfile: ClientProfile }) => (
  <div className="container mx-auto px-4 py-8">
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-8"
    >
      <h1 className="text-3xl font-bold mb-2">Welcome back, {userProfile.name}! 🏢</h1>
      <p className="text-muted-foreground">Manage your projects and find talented freelancers on GigCampus</p>
    </motion.div>

    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center space-x-4">
            <div className="p-2 bg-purple-500/10 rounded-lg">
              <Briefcase className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Active Projects</p>
              <p className="text-2xl font-bold">3</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center space-x-4">
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Freelancers Hired</p>
              <p className="text-2xl font-bold">12</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center space-x-4">
            <div className="p-2 bg-green-500/10 rounded-lg">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Completed</p>
              <p className="text-2xl font-bold">8</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center space-x-4">
            <div className="p-2 bg-orange-500/10 rounded-lg">
              <TrendingUp className="h-6 w-6 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Spent</p>
              <p className="text-2xl font-bold">$5,200</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>

    <div className="grid lg:grid-cols-2 gap-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            My Projects
            <Link to="/projects">
              <Button variant="ghost" size="sm">View All</Button>
            </Link>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="border rounded-lg p-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold">Mobile App Development</h3>
                  <p className="text-sm text-muted-foreground">Assigned to John Doe</p>
                </div>
                <Badge>In Progress</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-lg font-bold text-primary">$2,500</span>
                <div className="flex items-center space-x-2">
                  <div className="w-20 h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-primary w-1/2" />
                  </div>
                  <span className="text-sm text-muted-foreground">50%</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Button className="w-full justify-start">
              <Plus className="w-4 h-4 mr-2" />
              Post New Project
            </Button>
            <Link to="/projects">
              <Button variant="outline" className="w-full justify-start">
                <Search className="w-4 h-4 mr-2" />
                Browse Freelancers
              </Button>
            </Link>
            <Link to="/wallet">
              <Button variant="outline" className="w-full justify-start">
                <Wallet className="w-4 h-4 mr-2" />
                Manage Payments
              </Button>
            </Link>
            <Link to="/projects">
              <Button variant="outline" className="w-full justify-start">
                <FileText className="w-4 h-4 mr-2" />
                View Proposals
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>

    <div className="mt-8">
      <Card>
        <CardHeader>
          <CardTitle>Company Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm text-muted-foreground">Company</p>
              <p className="font-semibold">{userProfile.companyName || 'Not specified'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">KYC Status</p>
              <Badge variant={userProfile.kycVerified ? "default" : "secondary"}>
                {userProfile.kycVerified ? "Verified" : "Pending"}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  </div>
);

// Admin Dashboard Component
const AdminDashboardContent = ({ userProfile }: { userProfile: AdminProfile }) => (
  <div className="container mx-auto px-4 py-8">
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-8"
    >
      <h1 className="text-3xl font-bold mb-2">Admin Dashboard 🛡️</h1>
      <p className="text-muted-foreground">Monitor platform activity and manage disputes</p>
    </motion.div>

    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center space-x-4">
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Users</p>
              <p className="text-2xl font-bold">1,234</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center space-x-4">
            <div className="p-2 bg-green-500/10 rounded-lg">
              <Briefcase className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Active Projects</p>
              <p className="text-2xl font-bold">89</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center space-x-4">
            <div className="p-2 bg-red-500/10 rounded-lg">
              <Shield className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Open Disputes</p>
              <p className="text-2xl font-bold">3</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center space-x-4">
            <div className="p-2 bg-purple-500/10 rounded-lg">
              <TrendingUp className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Platform Revenue</p>
              <p className="text-2xl font-bold">$12.5K</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>

    <div className="grid lg:grid-cols-2 gap-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Recent Activity
            <Link to="/admin">
              <Button variant="ghost" size="sm">View All</Button>
            </Link>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center space-x-4 p-3 border rounded-lg">
              <div className="p-2 bg-green-500/10 rounded-lg">
                <CheckCircle className="h-4 w-4 text-green-600" />
              </div>
              <div className="flex-1">
                <p className="font-medium">Project completed</p>
                <p className="text-sm text-muted-foreground">E-commerce website by John Doe</p>
              </div>
              <span className="text-sm text-muted-foreground">2h ago</span>
            </div>
            <div className="flex items-center space-x-4 p-3 border rounded-lg">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <Users className="h-4 w-4 text-blue-600" />
              </div>
              <div className="flex-1">
                <p className="font-medium">New user registered</p>
                <p className="text-sm text-muted-foreground">Jane Smith joined as client</p>
              </div>
              <span className="text-sm text-muted-foreground">4h ago</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Admin Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Link to="/admin/escrow">
              <Button variant="outline" className="w-full justify-start">
                <Shield className="w-4 h-4 mr-2" />
                Dispute Resolution
              </Button>
            </Link>
            <Link to="/admin">
              <Button variant="outline" className="w-full justify-start">
                <Users className="w-4 h-4 mr-2" />
                User Management
              </Button>
            </Link>
            <Link to="/admin">
              <Button variant="outline" className="w-full justify-start">
                <TrendingUp className="w-4 h-4 mr-2" />
                Platform Analytics
              </Button>
            </Link>
            <Link to="/admin/escrow">
              <Button variant="outline" className="w-full justify-start">
                <Wallet className="w-4 h-4 mr-2" />
                Escrow Management
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  </div>
);

const Dashboard = () => {
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

  // Redirect to onboarding if not completed
  if (!userProfile.isOnboarded) {
    return <Navigate to="/onboarding" replace />;
  }


  // Render role-specific dashboard
  const renderDashboardContent = () => {
    switch (userProfile.role) {
      case 'student':
        return <StudentDashboardContent userProfile={userProfile as StudentProfile} />;
      case 'client':
        return <ClientDashboardContent userProfile={userProfile as ClientProfile} />;
      case 'admin':
        return <AdminDashboardContent userProfile={userProfile as AdminProfile} />;
      default:
        return (
          <div className="min-h-screen flex items-center justify-center">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-2">Unknown Role: {(userProfile as any)?.role}</h2>
              <p className="text-muted-foreground">Please contact support for assistance.</p>
              <p className="text-xs text-muted-foreground mt-2">Debug: {JSON.stringify(userProfile)}</p>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5">
      {renderDashboardContent()}
    </div>
  );
};

export default Dashboard;
