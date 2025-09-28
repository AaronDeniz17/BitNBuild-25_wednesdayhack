import { motion } from "framer-motion";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  MessageCircle, 
  Paperclip, 
  Send, 
  CheckCircle, 
  Clock, 
  FileText,
  Users,
  DollarSign
} from "lucide-react";
import { Link, useParams } from "react-router-dom";

const ProjectWorkspace = () => {
  const { id } = useParams();
  const [newMessage, setNewMessage] = useState("");

  const project = {
    id: 1,
    title: "E-commerce Website Development",
    description: "Build a modern e-commerce platform with React and Node.js. The project includes user authentication, payment integration, and admin dashboard.",
    budget: "$1,500",
    status: "In Progress",
    progress: 65,
    client: {
      name: "StartupTech Inc",
      avatar: "/placeholder-avatar.jpg",
      rating: 4.8,
    },
    freelancer: {
      name: "John Doe",
      avatar: "/placeholder-avatar.jpg",
      rating: 4.9,
    },
    startDate: "March 1, 2024",
    deadline: "March 22, 2024",
    skills: ["React", "Node.js", "MongoDB", "Stripe"],
  };

  const milestones = [
    {
      id: 1,
      title: "Project Setup & Authentication",
      description: "Set up React app, implement user authentication with JWT",
      status: "completed",
      dueDate: "March 5, 2024",
      amount: "$300",
    },
    {
      id: 2,
      title: "Product Catalog & Shopping Cart",
      description: "Create product listings, search functionality, and shopping cart",
      status: "in-progress",
      dueDate: "March 12, 2024",
      amount: "$500",
    },
    {
      id: 3,
      title: "Payment Integration",
      description: "Integrate Stripe payment system and order management",
      status: "pending",
      dueDate: "March 18, 2024",
      amount: "$400",
    },
    {
      id: 4,
      title: "Admin Dashboard",
      description: "Build admin panel for order and product management",
      status: "pending",
      dueDate: "March 22, 2024",
      amount: "$300",
    },
  ];

  const messages = [
    {
      id: 1,
      sender: "client",
      name: "StartupTech Inc",
      message: "Great progress on the authentication system! The login flow looks perfect.",
      timestamp: "2 hours ago",
      avatar: "/placeholder-avatar.jpg",
    },
    {
      id: 2,
      sender: "freelancer",
      name: "John Doe",
      message: "Thank you! I'm moving on to the product catalog now. Should have the first version ready by tomorrow.",
      timestamp: "1 hour ago",
      avatar: "/placeholder-avatar.jpg",
    },
    {
      id: 3,
      sender: "client",
      name: "StartupTech Inc",
      message: "Sounds good! Also, can we add a wishlist feature to the shopping cart?",
      timestamp: "30 minutes ago",
      avatar: "/placeholder-avatar.jpg",
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-500";
      case "in-progress":
        return "bg-primary";
      case "pending":
        return "bg-muted";
      default:
        return "bg-muted";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "in-progress":
        return <Clock className="h-4 w-4 text-primary" />;
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link to="/" className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            WorkLink Collab
          </Link>
          <div className="flex items-center space-x-4">
            <Link to="/projects">
              <Button variant="ghost">Back to Projects</Button>
            </Link>
            <Link to="/dashboard">
              <Button variant="ghost">Dashboard</Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Project Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <h1 className="text-3xl font-bold mb-2">{project.title}</h1>
              <p className="text-muted-foreground mb-4">{project.description}</p>
              <div className="flex flex-wrap gap-2">
                {project.skills.map((skill) => (
                  <Badge key={skill} variant="secondary">
                    {skill}
                  </Badge>
                ))}
              </div>
            </div>
            <div className="flex flex-col lg:items-end gap-4">
              <div className="text-3xl font-bold text-primary">{project.budget}</div>
              <Badge variant="default" className="w-fit">
                {project.status}
              </Badge>
            </div>
          </div>
        </motion.div>

        {/* Project Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8"
        >
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <DollarSign className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Budget</p>
                  <p className="text-xl font-bold">{project.budget}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="p-2 bg-accent/10 rounded-lg">
                  <Clock className="h-6 w-6 text-accent" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Progress</p>
                  <p className="text-xl font-bold">{project.progress}%</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <FileText className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Milestones</p>
                  <p className="text-xl font-bold">4</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="p-2 bg-accent/10 rounded-lg">
                  <Users className="h-6 w-6 text-accent" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Team Size</p>
                  <p className="text-xl font-bold">2</p>
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
          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="chat">Chat</TabsTrigger>
              <TabsTrigger value="files">Files</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <div className="grid lg:grid-cols-2 gap-8">
                {/* Progress & Milestones */}
                <Card>
                  <CardHeader>
                    <CardTitle>Project Progress</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div>
                      <div className="flex justify-between mb-2">
                        <span>Overall Progress</span>
                        <span className="font-semibold">{project.progress}%</span>
                      </div>
                      <Progress value={project.progress} />
                    </div>
                    
                    <div className="space-y-4">
                      <h4 className="font-semibold">Milestones</h4>
                      {milestones.map((milestone) => (
                        <div key={milestone.id} className="flex items-start space-x-3 p-3 border border-border rounded-lg">
                          {getStatusIcon(milestone.status)}
                          <div className="flex-1">
                            <h5 className="font-medium">{milestone.title}</h5>
                            <p className="text-sm text-muted-foreground mb-2">{milestone.description}</p>
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-muted-foreground">Due: {milestone.dueDate}</span>
                              <span className="font-semibold text-primary">{milestone.amount}</span>
                            </div>
                          </div>
                          {milestone.status === "completed" && (
                            <Button variant="ghost" size="sm" className="text-green-600">
                              Approved
                            </Button>
                          )}
                          {milestone.status === "in-progress" && (
                            <Button variant="outline" size="sm">
                              Submit
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Team Members */}
                <Card>
                  <CardHeader>
                    <CardTitle>Team Members</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center space-x-4 p-3 border border-border rounded-lg">
                      <Avatar>
                        <AvatarImage src={project.client.avatar} />
                        <AvatarFallback>CL</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <h4 className="font-semibold">{project.client.name}</h4>
                        <p className="text-sm text-muted-foreground">Client</p>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium">⭐ {project.client.rating}</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-4 p-3 border border-border rounded-lg">
                      <Avatar>
                        <AvatarImage src={project.freelancer.avatar} />
                        <AvatarFallback>FL</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <h4 className="font-semibold">{project.freelancer.name}</h4>
                        <p className="text-sm text-muted-foreground">Developer</p>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium">⭐ {project.freelancer.rating}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="chat">
              <Card>
                <CardHeader>
                  <CardTitle>Project Chat</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4 mb-6 max-h-96 overflow-y-auto">
                    {messages.map((message) => (
                      <div key={message.id} className="flex items-start space-x-3">
                        <Avatar className="w-8 h-8">
                          <AvatarImage src={message.avatar} />
                          <AvatarFallback>
                            {message.sender === "client" ? "CL" : "FL"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <span className="font-medium text-sm">{message.name}</span>
                            <span className="text-xs text-muted-foreground">{message.timestamp}</span>
                          </div>
                          <div className="bg-muted p-3 rounded-lg max-w-md">
                            <p className="text-sm">{message.message}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Button variant="ghost" size="icon">
                      <Paperclip className="h-4 w-4" />
                    </Button>
                    <Input
                      placeholder="Type your message..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      className="flex-1"
                    />
                    <Button variant="campus">
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="files">
              <Card>
                <CardHeader>
                  <CardTitle>Project Files</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12">
                    <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No files uploaded yet</h3>
                    <p className="text-muted-foreground mb-4">
                      Upload project files, designs, and documents here
                    </p>
                    <Button variant="campus">
                      <Paperclip className="mr-2 h-4 w-4" />
                      Upload Files
                    </Button>
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

export default ProjectWorkspace;