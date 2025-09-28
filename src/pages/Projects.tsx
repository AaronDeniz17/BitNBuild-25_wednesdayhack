import { motion } from "framer-motion";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Search, Filter, Clock, DollarSign, MapPin } from "lucide-react";
import { Link } from "react-router-dom";

const Projects = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSkill, setSelectedSkill] = useState("all");
  const [bidData, setBidData] = useState({ price: "", eta: "", pitch: "" });

  const projects = [
    {
      id: 1,
      title: "E-commerce Website Development",
      description: "Looking for a skilled developer to build a modern e-commerce platform with React and Node.js. The project includes user authentication, payment integration, and admin dashboard.",
      budget: "$1,500",
      skills: ["React", "Node.js", "MongoDB", "Stripe"],
      deadline: "3 weeks",
      location: "Campus Library",
      client: "StartupTech Inc",
      posted: "2 hours ago",
      proposals: 8,
    },
    {
      id: 2,
      title: "Mobile App UI/UX Design",
      description: "Design a clean and modern interface for a fitness tracking mobile app. Need wireframes, mockups, and interactive prototypes.",
      budget: "$800",
      skills: ["Figma", "UI/UX", "Mobile Design", "Prototyping"],
      deadline: "1 week",
      location: "Design Studio",
      client: "FitLife",
      posted: "5 hours ago",
      proposals: 12,
    },
    {
      id: 3,
      title: "Content Writing for Blog",
      description: "Need engaging blog posts about technology trends, AI, and startup culture. 10 articles, 1000 words each.",
      budget: "$600",
      skills: ["Writing", "SEO", "Research", "Tech"],
      deadline: "2 weeks",
      location: "Remote",
      client: "TechBlog",
      posted: "1 day ago",
      proposals: 15,
    },
    {
      id: 4,
      title: "Logo and Brand Identity",
      description: "Create a complete brand identity package including logo, color palette, typography, and business card design for a new coffee shop.",
      budget: "$400",
      skills: ["Illustrator", "Branding", "Logo Design"],
      deadline: "1 week",
      location: "Art Department",
      client: "Campus Cafe",
      posted: "3 hours ago",
      proposals: 6,
    },
    {
      id: 5,
      title: "Data Analysis Project",
      description: "Analyze customer data and create visualizations for business insights. Experience with Python and data visualization libraries required.",
      budget: "$700",
      skills: ["Python", "Pandas", "Matplotlib", "Data Analysis"],
      deadline: "10 days",
      location: "Computer Lab",
      client: "Analytics Corp",
      posted: "6 hours ago",
      proposals: 4,
    },
    {
      id: 6,
      title: "Social Media Management",
      description: "Manage Instagram and TikTok accounts for a local business. Create content, schedule posts, and engage with followers.",
      budget: "$500",
      skills: ["Social Media", "Content Creation", "Marketing"],
      deadline: "Ongoing",
      location: "Marketing Office",
      client: "Local Business",
      posted: "4 hours ago",
      proposals: 9,
    },
  ];

  const skills = ["all", "React", "Node.js", "UI/UX", "Python", "Writing", "Design", "Marketing"];

  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSkill = selectedSkill === "all" || project.skills.some(skill => 
      skill.toLowerCase().includes(selectedSkill.toLowerCase())
    );
    return matchesSearch && matchesSkill;
  });

  return (
    <div className="min-h-screen bg-background pt-16">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Page Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold mb-4">Find Your Next Project</h1>
          <p className="text-xl text-muted-foreground">
            Discover exciting opportunities on your campus
          </p>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8 space-y-4"
        >
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search projects..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={selectedSkill} onValueChange={setSelectedSkill}>
              <SelectTrigger className="w-full md:w-48">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Filter by skill" />
              </SelectTrigger>
              <SelectContent>
                {skills.map((skill) => (
                  <SelectItem key={skill} value={skill}>
                    {skill === "all" ? "All Skills" : skill}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </motion.div>

        {/* Projects Grid */}
        <div className="grid gap-6">
          {filteredProjects.map((project, index) => (
            <motion.div
              key={project.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className="hover:shadow-hover transition-all duration-300 cursor-pointer group">
                <CardContent className="p-6">
                  <div className="flex flex-col lg:flex-row gap-6">
                    <div className="flex-1 space-y-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <Link to={`/projects/${project.id}`}>
                            <h3 className="text-xl font-semibold group-hover:text-primary transition-colors mb-2">
                              {project.title}
                            </h3>
                          </Link>
                          <p className="text-muted-foreground line-clamp-3">
                            {project.description}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-primary mb-1">{project.budget}</div>
                          <div className="text-sm text-muted-foreground">{project.proposals} proposals</div>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {project.skills.map((skill) => (
                          <Badge key={skill} variant="secondary">
                            {skill}
                          </Badge>
                        ))}
                      </div>

                      <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {project.deadline}
                        </div>
                        <div className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          {project.location}
                        </div>
                        <div className="flex items-center gap-1">
                          <DollarSign className="h-4 w-4" />
                          {project.client}
                        </div>
                        <div>{project.posted}</div>
                      </div>
                    </div>

                    <div className="flex flex-col justify-between">
                      <div className="space-y-2">
                        <Link to={`/project/${project.id}`}>
                          <Button variant="outline" className="w-full lg:w-auto">
                            View Details
                          </Button>
                        </Link>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="campus" className="w-full lg:w-auto">
                              Quick Apply
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-md">
                            <DialogHeader>
                              <DialogTitle>Submit Your Proposal</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div>
                                <Label htmlFor="price">Your Price</Label>
                                <Input
                                  id="price"
                                  placeholder="$500"
                                  value={bidData.price}
                                  onChange={(e) => setBidData({...bidData, price: e.target.value})}
                                />
                              </div>
                              <div>
                                <Label htmlFor="eta">Estimated Time</Label>
                                <Input
                                  id="eta"
                                  placeholder="1 week"
                                  value={bidData.eta}
                                  onChange={(e) => setBidData({...bidData, eta: e.target.value})}
                                />
                              </div>
                              <div>
                                <Label htmlFor="pitch">Your Pitch</Label>
                                <Textarea
                                  id="pitch"
                                  placeholder="Tell the client why you're the best fit for this project..."
                                  value={bidData.pitch}
                                  onChange={(e) => setBidData({...bidData, pitch: e.target.value})}
                                />
                              </div>
                              <Button variant="campus" className="w-full">
                                Submit Proposal
                              </Button>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {filteredProjects.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <h3 className="text-xl font-semibold mb-2">No projects found</h3>
            <p className="text-muted-foreground">
              Try adjusting your search criteria or check back later for new opportunities.
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default Projects;