import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Star, 
  MapPin, 
  Calendar, 
  ExternalLink,
  Github,
  Linkedin,
  Mail,
  Phone
} from "lucide-react";
import { Link, useParams } from "react-router-dom";

const Portfolio = () => {
  const { id } = useParams();

  const profile = {
    id: 1,
    name: "John Doe",
    title: "Full-Stack Developer & UI/UX Designer",
    avatar: "/placeholder-avatar.jpg",
    location: "University Campus, Building A",
    email: "john.doe@university.edu",
    phone: "+1 (555) 123-4567",
    bio: "Passionate computer science student with 3+ years of experience in web development. I specialize in creating modern, responsive applications using React, Node.js, and cutting-edge design principles. Always eager to take on challenging projects and collaborate with amazing teams.",
    rating: 4.9,
    totalReviews: 24,
    completedProjects: 18,
    totalEarnings: "$12,450",
    skills: [
      "React", "Node.js", "TypeScript", "MongoDB", "PostgreSQL",
      "UI/UX Design", "Figma", "Tailwind CSS", "Next.js", "Python"
    ],
    education: {
      degree: "Computer Science, 3rd Year",
      university: "Tech University",
      gpa: "3.8/4.0",
    },
    social: {
      github: "https://github.com/johndoe",
      linkedin: "https://linkedin.com/in/johndoe",
    },
  };

  const projects = [
    {
      id: 1,
      title: "E-commerce Platform",
      description: "A full-featured e-commerce platform with React frontend and Node.js backend, including payment integration and admin dashboard.",
      image: "/placeholder-project.jpg",
      technologies: ["React", "Node.js", "MongoDB", "Stripe"],
      client: "StartupTech Inc",
      budget: "$2,500",
      duration: "3 weeks",
      rating: 5,
      review: "Outstanding work! John delivered exactly what we needed on time and within budget. Highly recommended!",
      liveUrl: "https://example.com",
      githubUrl: "https://github.com/johndoe/ecommerce",
    },
    {
      id: 2,
      title: "Mobile Banking App Design",
      description: "Complete UI/UX design for a mobile banking application, including wireframes, prototypes, and design system.",
      image: "/placeholder-project.jpg",
      technologies: ["Figma", "UI/UX", "Design Systems", "Prototyping"],
      client: "FinanceCorv",
      budget: "$1,800",
      duration: "2 weeks",
      rating: 5,
      review: "Amazing design work! The user experience is intuitive and the visuals are stunning.",
      liveUrl: "https://figma.com/proto/example",
    },
    {
      id: 3,
      title: "Restaurant Management System",
      description: "Web application for restaurant management including order tracking, inventory management, and customer relations.",
      image: "/placeholder-project.jpg",
      technologies: ["React", "Python", "Django", "PostgreSQL"],
      client: "Tasty Bites Restaurant",
      budget: "$1,200",
      duration: "2 weeks",
      rating: 4,
      review: "Great work overall. John was professional and delivered a solid solution for our restaurant.",
      githubUrl: "https://github.com/johndoe/restaurant-mgmt",
    },
    {
      id: 4,
      title: "Corporate Website Redesign",
      description: "Complete website redesign for a consulting firm, focusing on modern design and improved user experience.",
      image: "/placeholder-project.jpg",
      technologies: ["Next.js", "Tailwind CSS", "Framer Motion"],
      client: "Business Solutions Inc",
      budget: "$900",
      duration: "1 week",
      rating: 5,
      review: "Excellent work! The new website looks amazing and has improved our online presence significantly.",
      liveUrl: "https://businesssolutions.example.com",
    },
  ];

  const reviews = [
    {
      id: 1,
      client: "StartupTech Inc",
      rating: 5,
      comment: "John is an exceptional developer. His attention to detail and ability to understand complex requirements made our project a huge success.",
      project: "E-commerce Platform",
      date: "March 2024",
    },
    {
      id: 2,
      client: "FinanceCorv",
      rating: 5,
      comment: "Outstanding design work! John created a beautiful and intuitive user interface that our customers love.",
      project: "Mobile Banking App Design",
      date: "February 2024",
    },
    {
      id: 3,
      client: "Local Coffee Shop",
      rating: 4,
      comment: "Professional service and good communication throughout the project. Delivered on time and within budget.",
      project: "POS System Integration",
      date: "January 2024",
    },
  ];

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${i < rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`}
      />
    ));
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
              <Button variant="ghost">Browse Projects</Button>
            </Link>
            <Link to="/dashboard">
              <Button variant="campus">Hire John</Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Profile Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Card>
            <CardContent className="p-8">
              <div className="flex flex-col lg:flex-row gap-8">
                <div className="flex flex-col items-center lg:items-start">
                  <Avatar className="w-32 h-32 mb-4">
                    <AvatarImage src={profile.avatar} />
                    <AvatarFallback className="text-3xl">JD</AvatarFallback>
                  </Avatar>
                  <div className="flex items-center space-x-2 mb-4">
                    <div className="flex">{renderStars(Math.floor(profile.rating))}</div>
                    <span className="font-bold">{profile.rating}</span>
                    <span className="text-muted-foreground">({profile.totalReviews} reviews)</span>
                  </div>
                  <div className="flex space-x-3">
                    <Button variant="ghost" size="icon" asChild>
                      <a href={profile.social.github} target="_blank" rel="noopener noreferrer">
                        <Github className="h-4 w-4" />
                      </a>
                    </Button>
                    <Button variant="ghost" size="icon" asChild>
                      <a href={profile.social.linkedin} target="_blank" rel="noopener noreferrer">
                        <Linkedin className="h-4 w-4" />
                      </a>
                    </Button>
                    <Button variant="ghost" size="icon" asChild>
                      <a href={`mailto:${profile.email}`}>
                        <Mail className="h-4 w-4" />
                      </a>
                    </Button>
                    <Button variant="ghost" size="icon" asChild>
                      <a href={`tel:${profile.phone}`}>
                        <Phone className="h-4 w-4" />
                      </a>
                    </Button>
                  </div>
                </div>
                
                <div className="flex-1">
                  <h1 className="text-3xl font-bold mb-2">{profile.name}</h1>
                  <h2 className="text-xl text-primary font-semibold mb-4">{profile.title}</h2>
                  
                  <div className="flex flex-wrap items-center gap-4 mb-6 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      {profile.location}
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {profile.education.degree} • {profile.education.university}
                    </div>
                  </div>
                  
                  <p className="text-muted-foreground mb-6 leading-relaxed">
                    {profile.bio}
                  </p>
                  
                  <div className="flex flex-wrap gap-2 mb-6">
                    {profile.skills.map((skill) => (
                      <Badge key={skill} variant="secondary">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
        >
          <Card>
            <CardContent className="p-6 text-center">
              <div className="text-3xl font-bold text-primary mb-2">{profile.completedProjects}</div>
              <div className="text-sm text-muted-foreground">Projects Completed</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center">
              <div className="text-3xl font-bold text-primary mb-2">{profile.totalEarnings}</div>
              <div className="text-sm text-muted-foreground">Total Earned</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center">
              <div className="text-3xl font-bold text-primary mb-2">{profile.rating}</div>
              <div className="text-sm text-muted-foreground">Average Rating</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center">
              <div className="text-3xl font-bold text-primary mb-2">{profile.education.gpa}</div>
              <div className="text-sm text-muted-foreground">Academic GPA</div>
            </CardContent>
          </Card>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Portfolio Projects */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-2"
          >
            <h2 className="text-2xl font-bold mb-6">Portfolio Projects</h2>
            <div className="grid gap-6">
              {projects.map((project, index) => (
                <motion.div
                  key={project.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * index }}
                >
                  <Card className="hover:shadow-hover transition-all duration-300">
                    <CardContent className="p-6">
                      <div className="flex flex-col md:flex-row gap-6">
                        <div className="w-full md:w-48 h-32 bg-muted rounded-lg flex items-center justify-center">
                          <span className="text-muted-foreground">Project Image</span>
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-3">
                            <h3 className="text-xl font-semibold">{project.title}</h3>
                            <div className="flex space-x-2">
                              {project.liveUrl && (
                                <Button variant="ghost" size="icon" asChild>
                                  <a href={project.liveUrl} target="_blank" rel="noopener noreferrer">
                                    <ExternalLink className="h-4 w-4" />
                                  </a>
                                </Button>
                              )}
                              {project.githubUrl && (
                                <Button variant="ghost" size="icon" asChild>
                                  <a href={project.githubUrl} target="_blank" rel="noopener noreferrer">
                                    <Github className="h-4 w-4" />
                                  </a>
                                </Button>
                              )}
                            </div>
                          </div>
                          
                          <p className="text-muted-foreground mb-4">{project.description}</p>
                          
                          <div className="flex flex-wrap gap-2 mb-4">
                            {project.technologies.map((tech) => (
                              <Badge key={tech} variant="outline">
                                {tech}
                              </Badge>
                            ))}
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                              <span>Client: {project.client}</span>
                              <span>•</span>
                              <span>{project.budget}</span>
                              <span>•</span>
                              <span>{project.duration}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <div className="flex">{renderStars(project.rating)}</div>
                              <span className="text-sm font-medium">{project.rating}</span>
                            </div>
                          </div>
                          
                          {project.review && (
                            <div className="mt-4 p-3 bg-muted rounded-lg">
                              <p className="text-sm italic">"{project.review}"</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Reviews Sidebar */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <h2 className="text-2xl font-bold mb-6">Client Reviews</h2>
            <div className="space-y-6">
              {reviews.map((review) => (
                <Card key={review.id}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold">{review.client}</h4>
                      <div className="flex">{renderStars(review.rating)}</div>
                    </div>
                    <p className="text-muted-foreground mb-3">"{review.comment}"</p>
                    <div className="text-sm text-muted-foreground">
                      <div>{review.project}</div>
                      <div>{review.date}</div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              <Card>
                <CardContent className="p-6 text-center">
                  <h4 className="font-semibold mb-2">Want to work with John?</h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    Get in touch to discuss your project requirements
                  </p>
                  <Button variant="campus" className="w-full">
                    Contact Now
                  </Button>
                </CardContent>
              </Card>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Portfolio;