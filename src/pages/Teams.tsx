import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { 
  Users, 
  DollarSign, 
  Trophy, 
  CheckCircle,
  Clock,
  Settings
} from "lucide-react";
import { Link, useParams } from "react-router-dom";

const Teams = () => {
  const { id } = useParams();

  const team = {
    id: 1,
    name: "WebDev Collective",
    description: "A team of passionate web developers specializing in modern React and Node.js applications.",
    totalEarnings: "$8,450",
    completedProjects: 12,
    activeProjects: 3,
    rating: 4.8,
    members: [
      {
        id: 1,
        name: "John Doe",
        role: "Team Leader",
        avatar: "/placeholder-avatar.jpg",
        skills: ["React", "Node.js", "MongoDB"],
        contribution: "$3,200",
        rating: 4.9,
      },
      {
        id: 2,
        name: "Sarah Smith",
        role: "UI/UX Designer",
        avatar: "/placeholder-avatar.jpg",
        skills: ["Figma", "UI/UX", "Design Systems"],
        contribution: "$2,800",
        rating: 4.7,
      },
      {
        id: 3,
        name: "Mike Johnson",
        role: "Backend Developer",
        avatar: "/placeholder-avatar.jpg",
        skills: ["Node.js", "Python", "PostgreSQL"],
        contribution: "$2,450",
        rating: 4.8,
      },
    ],
  };

  const activeProjects = [
    {
      id: 1,
      title: "E-commerce Platform",
      client: "StartupTech Inc",
      budget: "$2,500",
      progress: 75,
      deadline: "March 22, 2024",
      assignedTo: ["John Doe", "Sarah Smith"],
    },
    {
      id: 2,
      title: "Mobile Banking App",
      client: "FinanceCorv",
      budget: "$3,200",
      progress: 45,
      deadline: "April 5, 2024",
      assignedTo: ["Mike Johnson", "John Doe"],
    },
    {
      id: 3,
      title: "Restaurant Website",
      client: "Tasty Bites",
      budget: "$800",
      progress: 90,
      deadline: "March 15, 2024",
      assignedTo: ["Sarah Smith"],
    },
  ];

  const tasks = [
    {
      id: 1,
      title: "Implement payment gateway",
      project: "E-commerce Platform",
      assignee: "John Doe",
      status: "in-progress",
      dueDate: "March 14, 2024",
    },
    {
      id: 2,
      title: "Design user dashboard",
      project: "Mobile Banking App",
      assignee: "Sarah Smith",
      status: "pending",
      dueDate: "March 16, 2024",
    },
    {
      id: 3,
      title: "Set up database schema",
      project: "Mobile Banking App",
      assignee: "Mike Johnson",
      status: "completed",
      dueDate: "March 10, 2024",
    },
    {
      id: 4,
      title: "Create menu component",
      project: "Restaurant Website",
      assignee: "Sarah Smith",
      status: "in-progress",
      dueDate: "March 13, 2024",
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "text-green-600";
      case "in-progress":
        return "text-primary";
      case "pending":
        return "text-orange-500";
      default:
        return "text-muted-foreground";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "in-progress":
        return <Clock className="h-4 w-4 text-primary" />;
      default:
        return <Clock className="h-4 w-4 text-orange-500" />;
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
            <Link to="/dashboard">
              <Button variant="ghost">Dashboard</Button>
            </Link>
            <Button variant="ghost" size="icon">
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Team Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <h1 className="text-3xl font-bold mb-2">{team.name}</h1>
              <p className="text-muted-foreground mb-4">{team.description}</p>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-1">
                  <Trophy className="h-4 w-4 text-yellow-500" />
                  <span className="font-medium">{team.rating} rating</span>
                </div>
                <Badge variant="secondary">{team.members.length} members</Badge>
              </div>
            </div>
            <Button variant="campus">
              <Users className="mr-2 h-4 w-4" />
              Invite Member
            </Button>
          </div>
        </motion.div>

        {/* Team Stats */}
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
                  <p className="text-sm text-muted-foreground">Total Earnings</p>
                  <p className="text-2xl font-bold">{team.totalEarnings}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="p-2 bg-accent/10 rounded-lg">
                  <Trophy className="h-6 w-6 text-accent" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Completed</p>
                  <p className="text-2xl font-bold">{team.completedProjects}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Clock className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Active Projects</p>
                  <p className="text-2xl font-bold">{team.activeProjects}</p>
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
                  <p className="text-sm text-muted-foreground">Team Members</p>
                  <p className="text-2xl font-bold">{team.members.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Team Members */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>Team Members</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {team.members.map((member) => (
                  <div key={member.id} className="flex items-center space-x-4 p-4 border border-border rounded-lg hover:shadow-card transition-all">
                    <Avatar className="w-12 h-12">
                      <AvatarImage src={member.avatar} />
                      <AvatarFallback>{member.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <h4 className="font-semibold">{member.name}</h4>
                      <p className="text-sm text-muted-foreground mb-2">{member.role}</p>
                      <div className="flex flex-wrap gap-1">
                        {member.skills.slice(0, 3).map((skill) => (
                          <Badge key={skill} variant="outline" className="text-xs">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-primary">{member.contribution}</div>
                      <div className="text-sm text-muted-foreground">⭐ {member.rating}</div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </motion.div>

          {/* Active Projects */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>Active Projects</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {activeProjects.map((project) => (
                  <div key={project.id} className="border border-border rounded-lg p-4 hover:shadow-card transition-all">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <Link to={`/projects/${project.id}`}>
                          <h4 className="font-semibold hover:text-primary transition-colors cursor-pointer">
                            {project.title}
                          </h4>
                        </Link>
                        <p className="text-sm text-muted-foreground">{project.client}</p>
                      </div>
                      <span className="font-bold text-primary">{project.budget}</span>
                    </div>
                    
                    <div className="mb-3">
                      <div className="flex justify-between mb-1">
                        <span className="text-sm text-muted-foreground">Progress</span>
                        <span className="text-sm font-medium">{project.progress}%</span>
                      </div>
                      <Progress value={project.progress} />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex -space-x-2">
                        {project.assignedTo.map((name, index) => (
                          <Avatar key={index} className="w-6 h-6 border-2 border-background">
                            <AvatarFallback className="text-xs">
                              {name.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                        ))}
                      </div>
                      <span className="text-sm text-muted-foreground">Due: {project.deadline}</span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Tasks */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-8"
        >
          <Card>
            <CardHeader>
              <CardTitle>Recent Tasks</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {tasks.map((task) => (
                  <div key={task.id} className="flex items-center space-x-4 p-3 border border-border rounded-lg hover:shadow-card transition-all">
                    {getStatusIcon(task.status)}
                    <div className="flex-1">
                      <h4 className="font-medium">{task.title}</h4>
                      <p className="text-sm text-muted-foreground">
                        {task.project} • Assigned to {task.assignee}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className={`text-sm font-medium ${getStatusColor(task.status)}`}>
                        {task.status.replace('-', ' ').toUpperCase()}
                      </div>
                      <div className="text-sm text-muted-foreground">Due: {task.dueDate}</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default Teams;