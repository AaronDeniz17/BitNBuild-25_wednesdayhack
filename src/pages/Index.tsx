import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Users, Briefcase, Trophy, Zap } from "lucide-react";
import { Link } from "react-router-dom";
import heroImage from "@/assets/hero-image.jpg";

const Index = () => {
  const trendingProjects = [
    {
      id: 1,
      title: "Mobile App Design",
      budget: "$500",
      skills: ["UI/UX", "Figma", "Mobile"],
      deadline: "3 days",
    },
    {
      id: 2,
      title: "Website Development",
      budget: "$800",
      skills: ["React", "Node.js", "MongoDB"],
      deadline: "1 week",
    },
    {
      id: 3,
      title: "Content Writing",
      budget: "$200",
      skills: ["Writing", "SEO", "Research"],
      deadline: "2 days",
    },
  ];

  const features = [
    {
      icon: Users,
      title: "Connect with Peers",
      description: "Find talented students on your campus",
    },
    {
      icon: Briefcase,
      title: "Real Projects",
      description: "Work on actual client projects and build your portfolio",
    },
    {
      icon: Trophy,
      title: "Earn & Learn",
      description: "Get paid while gaining valuable experience",
    },
    {
      icon: Zap,
      title: "Quick Turnaround",
      description: "Fast project completion with local collaboration",
    },
  ];

  return (
    <div className="min-h-screen bg-background pt-16">{/* Added pt-16 to account for fixed navbar */}

      {/* Hero Section */}
      <section className="relative px-6 py-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-hero opacity-10" />
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="space-y-8"
          >
            <h1 className="text-5xl lg:text-6xl font-bold leading-tight">
              Your Campus.
              <br />
              <span className="bg-gradient-primary bg-clip-text text-transparent">
                Your Gigs.
              </span>
              <br />
              Your Future.
            </h1>
            <p className="text-xl text-muted-foreground max-w-md">
              Connect with talented students on your campus. Find freelance work, build your
              portfolio, and earn money while studying.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link to="/projects">
                <Button variant="hero" size="lg" className="group">
                  Find Work
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
              <Link to="/auth">
                <Button variant="accent" size="lg">
                  Get Started
                </Button>
              </Link>
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative"
          >
            <div className="absolute inset-0 bg-gradient-primary rounded-3xl blur-2xl opacity-20" />
            <img
              src={heroImage}
              alt="Students collaborating on campus"
              className="relative rounded-3xl shadow-glow"
            />
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="px-6 py-20 bg-muted/30">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold mb-4">Why Choose WorkLink Collab?</h2>
            <p className="text-xl text-muted-foreground">
              The easiest way to connect, collaborate, and grow on campus
            </p>
          </motion.div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="h-full p-6 text-center hover:shadow-hover transition-all duration-300">
                  <CardContent className="space-y-4">
                    <div className="mx-auto w-12 h-12 bg-gradient-primary rounded-xl flex items-center justify-center">
                      <feature.icon className="h-6 w-6 text-white" />
                    </div>
                    <h3 className="text-xl font-semibold">{feature.title}</h3>
                    <p className="text-muted-foreground">{feature.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Trending Projects */}
      <section className="px-6 py-20">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold mb-4">Trending Projects</h2>
            <p className="text-xl text-muted-foreground">
              Check out the hottest opportunities on campus
            </p>
          </motion.div>
          <div className="grid md:grid-cols-3 gap-8">
            {trendingProjects.map((project, index) => (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="h-full hover:shadow-hover transition-all duration-300 cursor-pointer group">
                  <CardContent className="p-6 space-y-4">
                    <div className="flex justify-between items-start">
                      <h3 className="text-xl font-semibold group-hover:text-primary transition-colors">
                        {project.title}
                      </h3>
                      <span className="text-2xl font-bold text-primary">{project.budget}</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {project.skills.map((skill) => (
                        <Badge key={skill} variant="secondary">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                    <div className="flex justify-between items-center text-sm text-muted-foreground">
                      <span>Deadline: {project.deadline}</span>
                      <ArrowRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
          <div className="text-center mt-12">
            <Link to="/projects">
              <Button variant="outline" size="lg">
                View All Projects
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-6 py-20 bg-gradient-hero relative overflow-hidden">
        <div className="absolute inset-0 bg-black/20" />
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="space-y-8"
          >
            <h2 className="text-4xl lg:text-5xl font-bold text-white">
              Ready to Start Your Freelance Journey?
            </h2>
            <p className="text-xl text-white/90">
              Join thousands of students already earning and learning on WorkLink Collab
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/auth">
                <Button variant="accent" size="lg">
                  Sign Up Now
                </Button>
              </Link>
              <Button variant="outline" size="lg" className="border-white text-white hover:bg-white hover:text-primary">
                Learn More
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 py-12 border-t border-border">
        <div className="max-w-7xl mx-auto text-center">
          <div className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent mb-4">
            WorkLink Collab
          </div>
          <p className="text-muted-foreground">
            Connecting students, creating opportunities.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
