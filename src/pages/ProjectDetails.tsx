import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ArrowLeft,
  DollarSign,
  Clock,
  MapPin,
  Calendar,
  Users,
  MessageSquare,
  Send,
  Star,
  Briefcase
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { BidForm } from '@/components/bidding/BidForm';
import { BidCard, Bid } from '@/components/bidding/BidCard';
import { ChatBox, ChatUser } from '@/components/chat/ChatBox';
import { useToast } from '@/hooks/use-toast';

interface Project {
  id: string;
  title: string;
  description: string;
  budget: string;
  duration: string;
  location: string;
  postedDate: Date;
  clientId: string;
  clientName: string;
  clientAvatar?: string;
  clientRating: number;
  skills: string[];
  category: string;
  status: 'open' | 'in_progress' | 'completed';
  bidsCount: number;
}

const ProjectDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, userProfile } = useAuth();
  const { toast } = useToast();
  
  const [project, setProject] = useState<Project | null>(null);
  const [bids, setBids] = useState<Bid[]>([]);
  const [showBidForm, setShowBidForm] = useState(false);
  const [chatUser, setChatUser] = useState<ChatUser | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isChatMinimized, setIsChatMinimized] = useState(false);
  const [loading, setLoading] = useState(true);

  // Sample project data
  useEffect(() => {
    const fetchProject = async () => {
      // Simulate API call
      setTimeout(() => {
        const sampleProject: Project = {
          id: id || '1',
          title: 'Modern E-commerce Website Development',
          description: `We are looking for an experienced full-stack developer to build a modern e-commerce website for our growing business. The project includes:

• Responsive web design with modern UI/UX
• Product catalog with search and filtering
• Shopping cart and checkout system
• Payment gateway integration (Stripe/PayPal)
• User authentication and account management
• Admin dashboard for inventory management
• SEO optimization and performance optimization

The ideal candidate should have experience with React, Node.js, and modern web development practices. We value clean code, attention to detail, and timely delivery.

This is a great opportunity to work on an exciting project with potential for long-term collaboration.`,
          budget: '$2,000 - $3,500',
          duration: '4-6 weeks',
          location: 'Remote',
          postedDate: new Date(Date.now() - 86400000 * 2),
          clientId: 'client-1',
          clientName: 'TechStart Solutions',
          clientAvatar: '/placeholder-avatar.jpg',
          clientRating: 4.8,
          skills: ['React', 'Node.js', 'MongoDB', 'Stripe API', 'UI/UX Design'],
          category: 'Web Development',
          status: 'open',
          bidsCount: 12
        };

        const sampleBids: Bid[] = [
          {
            id: 'bid-1',
            freelancerId: 'freelancer-1',
            freelancerName: 'Sarah Chen',
            freelancerAvatar: '/placeholder-avatar.jpg',
            freelancerRating: 4.9,
            amount: 2800,
            deliveryTime: 35,
            proposal: 'I have over 5 years of experience building e-commerce platforms with React and Node.js. I can deliver a modern, responsive website with all the features you mentioned. My approach includes thorough planning, regular updates, and clean, maintainable code.',
            skills: ['React', 'Node.js', 'MongoDB', 'Stripe'],
            status: 'pending',
            createdAt: new Date(Date.now() - 3600000)
          },
          {
            id: 'bid-2',
            freelancerId: 'freelancer-2',
            freelancerName: 'Alex Rodriguez',
            freelancerAvatar: '/placeholder-avatar.jpg',
            freelancerRating: 4.7,
            amount: 3200,
            deliveryTime: 42,
            proposal: 'I specialize in full-stack e-commerce development and have built similar platforms for 15+ clients. I offer comprehensive testing, documentation, and post-launch support. My solution will be scalable and optimized for performance.',
            skills: ['React', 'Node.js', 'PostgreSQL', 'AWS'],
            status: 'pending',
            createdAt: new Date(Date.now() - 7200000)
          }
        ];

        setProject(sampleProject);
        setBids(sampleBids);
        setLoading(false);
      }, 1000);
    };

    fetchProject();
  }, [id]);

  const handleSubmitBid = async (bidData: any) => {
    if (!userProfile || userProfile.role !== 'student') {
      throw new Error('Only students can submit bids');
    }

    // Simulate API call
    const newBid: Bid = {
      id: `bid-${Date.now()}`,
      freelancerId: user?.uid || '',
      freelancerName: userProfile.name,
      freelancerRating: 4.5,
      amount: bidData.amount,
      deliveryTime: bidData.deliveryTime,
      proposal: bidData.proposal,
      skills: userProfile.skills?.slice(0, 4) || [],
      status: 'pending',
      createdAt: new Date()
    };

    setBids(prev => [newBid, ...prev]);
    setShowBidForm(false);
  };

  const handleAcceptBid = async (bidId: string) => {
    setBids(prev => prev.map(bid => 
      bid.id === bidId ? { ...bid, status: 'accepted' as const } : bid
    ));
    toast({
      title: "Bid Accepted",
      description: "The freelancer has been notified and the project will begin soon.",
    });
  };

  const handleRejectBid = async (bidId: string) => {
    setBids(prev => prev.map(bid => 
      bid.id === bidId ? { ...bid, status: 'rejected' as const } : bid
    ));
    toast({
      title: "Bid Rejected",
      description: "The freelancer has been notified.",
    });
  };

  const handleMessageFreelancer = (freelancerId: string) => {
    const freelancer = bids.find(bid => bid.freelancerId === freelancerId);
    if (freelancer) {
      setChatUser({
        id: freelancer.freelancerId,
        name: freelancer.freelancerName,
        avatar: freelancer.freelancerAvatar,
        role: 'student',
        isOnline: Math.random() > 0.5
      });
      setIsChatOpen(true);
      setIsChatMinimized(false);
    }
  };

  const handleMessageClient = () => {
    if (project) {
      setChatUser({
        id: project.clientId,
        name: project.clientName,
        avatar: project.clientAvatar,
        role: 'client',
        isOnline: true
      });
      setIsChatOpen(true);
      setIsChatMinimized(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Project Not Found</h2>
          <p className="text-muted-foreground mb-4">The project you're looking for doesn't exist.</p>
          <Button onClick={() => navigate('/projects')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Projects
          </Button>
        </div>
      </div>
    );
  }

  const isClient = userProfile?.role === 'client';
  const isStudent = userProfile?.role === 'student';
  const hasUserBid = bids.some(bid => bid.freelancerId === user?.uid);

  return (
    <div className="min-h-screen bg-background pt-16">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Button variant="ghost" onClick={() => navigate('/projects')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Projects
          </Button>
          {isStudent && !hasUserBid && project.status === 'open' && (
            <Button onClick={() => setShowBidForm(true)}>
              <Send className="h-4 w-4 mr-2" />
              Submit Bid
            </Button>
          )}
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Project Info */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-2xl mb-2">{project.title}</CardTitle>
                      <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                        <div className="flex items-center space-x-1">
                          <Calendar className="h-4 w-4" />
                          <span>Posted {project.postedDate.toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <MapPin className="h-4 w-4" />
                          <span>{project.location}</span>
                        </div>
                        <Badge variant="outline">{project.category}</Badge>
                      </div>
                    </div>
                    <Badge variant={project.status === 'open' ? 'default' : 'secondary'}>
                      {project.status.replace('_', ' ')}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="flex items-center space-x-2">
                      <DollarSign className="h-4 w-4 text-green-600" />
                      <div>
                        <p className="text-sm text-muted-foreground">Budget</p>
                        <p className="font-semibold">{project.budget}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4 text-blue-600" />
                      <div>
                        <p className="text-sm text-muted-foreground">Duration</p>
                        <p className="font-semibold">{project.duration}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Users className="h-4 w-4 text-purple-600" />
                      <div>
                        <p className="text-sm text-muted-foreground">Bids</p>
                        <p className="font-semibold">{bids.length}</p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-2">Required Skills</h3>
                    <div className="flex flex-wrap gap-2">
                      {project.skills.map((skill) => (
                        <Badge key={skill} variant="secondary">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-2">Project Description</h3>
                    <div className="prose prose-sm max-w-none">
                      {project.description.split('\n').map((paragraph, index) => (
                        <p key={index} className="mb-2">
                          {paragraph}
                        </p>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Bids Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Tabs defaultValue="bids" className="w-full">
                <TabsList>
                  <TabsTrigger value="bids">
                    Bids ({bids.length})
                  </TabsTrigger>
                  <TabsTrigger value="details">
                    Project Details
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="bids" className="space-y-4">
                  {bids.length > 0 ? (
                    bids.map((bid) => (
                      <BidCard
                        key={bid.id}
                        bid={bid}
                        isClient={isClient}
                        onAccept={handleAcceptBid}
                        onReject={handleRejectBid}
                        onMessage={handleMessageFreelancer}
                      />
                    ))
                  ) : (
                    <Card>
                      <CardContent className="p-8 text-center">
                        <Briefcase className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="font-semibold mb-2">No bids yet</h3>
                        <p className="text-muted-foreground">
                          Be the first to submit a bid for this project!
                        </p>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>

                <TabsContent value="details">
                  <Card>
                    <CardContent className="p-6">
                      <div className="space-y-4">
                        <div>
                          <h3 className="font-semibold mb-2">Project Timeline</h3>
                          <p className="text-sm text-muted-foreground">
                            Expected completion: {project.duration}
                          </p>
                        </div>
                        <div>
                          <h3 className="font-semibold mb-2">Work Location</h3>
                          <p className="text-sm text-muted-foreground">
                            {project.location}
                          </p>
                        </div>
                        <div>
                          <h3 className="font-semibold mb-2">Project Category</h3>
                          <Badge variant="outline">{project.category}</Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </motion.div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Client Info */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">About the Client</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={project.clientAvatar} />
                      <AvatarFallback>
                        {project.clientName.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-semibold">{project.clientName}</h3>
                      <div className="flex items-center space-x-1">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span className="text-sm font-medium">{project.clientRating}</span>
                        <span className="text-sm text-muted-foreground">(4.8)</span>
                      </div>
                    </div>
                  </div>
                  
                  {isStudent && (
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={handleMessageClient}
                    >
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Message Client
                    </Button>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Project Stats */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Project Stats</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Total Bids</span>
                    <span className="font-medium">{bids.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Average Bid</span>
                    <span className="font-medium">
                      ${bids.length > 0 ? Math.round(bids.reduce((sum, bid) => sum + bid.amount, 0) / bids.length) : 0}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Posted</span>
                    <span className="font-medium">
                      {Math.ceil((Date.now() - project.postedDate.getTime()) / (1000 * 60 * 60 * 24))} days ago
                    </span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Bid Form Modal */}
      {showBidForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-2xl">
            <BidForm
              projectId={project.id}
              projectTitle={project.title}
              projectBudget={project.budget}
              onSubmit={handleSubmitBid}
              onCancel={() => setShowBidForm(false)}
            />
          </div>
        </div>
      )}

      {/* Chat Box */}
      {chatUser && (
        <ChatBox
          chatUser={chatUser}
          projectId={project.id}
          isOpen={isChatOpen}
          isMinimized={isChatMinimized}
          onClose={() => setIsChatOpen(false)}
          onMinimize={() => setIsChatMinimized(true)}
          onMaximize={() => setIsChatMinimized(false)}
        />
      )}
    </div>
  );
};

export default ProjectDetails;
