import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Trophy, 
  Medal, 
  Crown,
  Star,
  TrendingUp,
  Users,
  DollarSign
} from "lucide-react";
import { Link } from "react-router-dom";

const Leaderboard = () => {
  const topFreelancers = [
    {
      id: 1,
      name: "Sarah Chen",
      title: "Full-Stack Developer",
      avatar: "/placeholder-avatar.jpg",
      points: 2850,
      earnings: "$18,500",
      projects: 24,
      rating: 4.9,
      badges: ["Top Performer", "Fast Delivery", "Client Favorite"],
      specialty: "React & Node.js",
      position: 1,
    },
    {
      id: 2,
      name: "Alex Rodriguez",
      title: "UI/UX Designer",
      avatar: "/placeholder-avatar.jpg",
      points: 2720,
      earnings: "$16,200",
      projects: 19,
      rating: 4.8,
      badges: ["Design Expert", "Creative Solutions"],
      specialty: "Mobile Design",
      position: 2,
    },
    {
      id: 3,
      name: "Emily Johnson",
      title: "Content Strategist",
      avatar: "/placeholder-avatar.jpg",
      points: 2650,
      earnings: "$14,800",
      projects: 31,
      rating: 4.9,
      badges: ["Content Master", "SEO Expert"],
      specialty: "Digital Marketing",
      position: 3,
    },
    {
      id: 4,
      name: "Michael Park",
      title: "Backend Developer",
      avatar: "/placeholder-avatar.jpg",
      points: 2580,
      earnings: "$15,400",
      projects: 18,
      rating: 4.7,
      badges: ["Technical Excellence"],
      specialty: "Python & Django",
      position: 4,
    },
    {
      id: 5,
      name: "Jessica Liu",
      title: "Data Scientist",
      avatar: "/placeholder-avatar.jpg",
      points: 2510,
      earnings: "$17,200",
      projects: 16,
      rating: 4.8,
      badges: ["Analytics Pro", "AI Specialist"],
      specialty: "Machine Learning",
      position: 5,
    },
  ];

  const topTeams = [
    {
      id: 1,
      name: "WebDev Collective",
      members: 4,
      avatar: "/placeholder-team.jpg",
      points: 8950,
      earnings: "$45,200",
      projects: 18,
      rating: 4.9,
      specialty: "Full-Stack Development",
    },
    {
      id: 2,
      name: "Design Dynasty",
      members: 3,
      avatar: "/placeholder-team.jpg",
      points: 7820,
      earnings: "$38,600",
      projects: 22,
      rating: 4.8,
      specialty: "UI/UX & Branding",
    },
    {
      id: 3,
      name: "Code Crusaders",
      members: 5,
      avatar: "/placeholder-team.jpg",
      points: 7650,
      earnings: "$41,800",
      projects: 16,
      rating: 4.7,
      specialty: "Mobile Development",
    },
  ];

  const achievements = [
    {
      id: 1,
      title: "First Project",
      description: "Complete your first project successfully",
      icon: "🎯",
      rarity: "Common",
      points: 50,
    },
    {
      id: 2,
      title: "Speed Demon",
      description: "Deliver 5 projects ahead of deadline",
      icon: "⚡",
      rarity: "Rare",
      points: 200,
    },
    {
      id: 3,
      title: "Client Whisperer",
      description: "Maintain 4.8+ rating across 10+ projects",
      icon: "🌟",
      rarity: "Epic",
      points: 500,
    },
    {
      id: 4,
      title: "Team Player",
      description: "Successfully complete 3 team projects",
      icon: "🤝",
      rarity: "Uncommon",
      points: 150,
    },
    {
      id: 5,
      title: "Campus Legend",
      description: "Earn $10,000+ in total projects",
      icon: "👑",
      rarity: "Legendary",
      points: 1000,
    },
  ];

  const getPodiumIcon = (position: number) => {
    switch (position) {
      case 1:
        return <Crown className="h-8 w-8 text-yellow-500" />;
      case 2:
        return <Medal className="h-8 w-8 text-gray-400" />;
      case 3:
        return <Trophy className="h-8 w-8 text-amber-600" />;
      default:
        return null;
    }
  };

  const getPodiumHeight = (position: number) => {
    switch (position) {
      case 1:
        return "h-32";
      case 2:
        return "h-24";
      case 3:
        return "h-20";
      default:
        return "h-16";
    }
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case "Common":
        return "text-gray-600";
      case "Uncommon":
        return "text-green-600";
      case "Rare":
        return "text-blue-600";
      case "Epic":
        return "text-purple-600";
      case "Legendary":
        return "text-orange-600";
      default:
        return "text-gray-600";
    }
  };

  return (
    <div className="min-h-screen bg-background pt-16">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Page Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl font-bold mb-4">
            Campus <span className="bg-gradient-primary bg-clip-text text-transparent">Leaderboard</span>
          </h1>
          <p className="text-xl text-muted-foreground">
            Celebrating the top performers in our student freelancing community
          </p>
        </motion.div>

        <Tabs defaultValue="freelancers" className="space-y-8">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="freelancers" className="flex items-center gap-2">
              <Trophy className="h-4 w-4" />
              Top Freelancers
            </TabsTrigger>
            <TabsTrigger value="teams" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Top Teams
            </TabsTrigger>
            <TabsTrigger value="achievements" className="flex items-center gap-2">
              <Star className="h-4 w-4" />
              Achievements
            </TabsTrigger>
          </TabsList>

          <TabsContent value="freelancers">
            {/* Podium */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="mb-12"
            >
              <div className="flex items-end justify-center space-x-8 mb-8">
                {topFreelancers.slice(0, 3).map((freelancer, index) => {
                  const actualPosition = index === 0 ? 1 : index === 1 ? 2 : 3;
                  const displayOrder = [1, 0, 2]; // Center 1st place, left 2nd, right 3rd
                  const displayIndex = displayOrder[index];
                  const displayFreelancer = topFreelancers[displayIndex];
                  
                  return (
                    <motion.div
                      key={displayFreelancer.id}
                      initial={{ opacity: 0, y: 50 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 + index * 0.1 }}
                      className="flex flex-col items-center"
                    >
                      <div className="mb-4">
                        {getPodiumIcon(displayFreelancer.position)}
                      </div>
                      <Avatar className="w-20 h-20 mb-4 border-4 border-primary">
                        <AvatarImage src={displayFreelancer.avatar} />
                        <AvatarFallback>{displayFreelancer.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                      </Avatar>
                      <h3 className="font-bold text-lg mb-1">{displayFreelancer.name}</h3>
                      <p className="text-muted-foreground text-sm mb-2">{displayFreelancer.specialty}</p>
                      <div className="text-2xl font-bold text-primary mb-2">{displayFreelancer.points} pts</div>
                      <div className={`bg-gradient-primary rounded-t-lg w-24 ${getPodiumHeight(displayFreelancer.position)} flex items-end justify-center pb-2`}>
                        <span className="text-white font-bold text-lg">#{displayFreelancer.position}</span>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>

            {/* Full Rankings */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="space-y-4"
            >
              <h2 className="text-2xl font-bold mb-6">Complete Rankings</h2>
              {topFreelancers.map((freelancer, index) => (
                <motion.div
                  key={freelancer.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 * index }}
                >
                  <Card className="hover:shadow-hover transition-all duration-300">
                    <CardContent className="p-6">
                      <div className="flex items-center space-x-6">
                        <div className="text-3xl font-bold text-primary w-12 text-center">
                          #{freelancer.position}
                        </div>
                        
                        <Avatar className="w-16 h-16">
                          <AvatarImage src={freelancer.avatar} />
                          <AvatarFallback>{freelancer.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                        </Avatar>
                        
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <div>
                              <Link to={`/portfolio/${freelancer.id}`}>
                                <h3 className="text-xl font-semibold hover:text-primary transition-colors cursor-pointer">
                                  {freelancer.name}
                                </h3>
                              </Link>
                              <p className="text-muted-foreground">{freelancer.title}</p>
                            </div>
                            <div className="text-right">
                              <div className="text-2xl font-bold text-primary">{freelancer.points} pts</div>
                              <div className="flex items-center space-x-1">
                                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                <span className="font-medium">{freelancer.rating}</span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex flex-wrap gap-2 mb-3">
                            {freelancer.badges.map((badge) => (
                              <Badge key={badge} variant="secondary" className="text-xs">
                                {badge}
                              </Badge>
                            ))}
                          </div>
                          
                          <div className="flex items-center space-x-6 text-sm text-muted-foreground">
                            <div className="flex items-center space-x-1">
                              <DollarSign className="h-4 w-4" />
                              <span>{freelancer.earnings} earned</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <TrendingUp className="h-4 w-4" />
                              <span>{freelancer.projects} projects</span>
                            </div>
                            <div>
                              <span>Specializes in {freelancer.specialty}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          </TabsContent>

          <TabsContent value="teams">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <h2 className="text-2xl font-bold mb-6">Top Performing Teams</h2>
              {topTeams.map((team, index) => (
                <motion.div
                  key={team.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 * index }}
                >
                  <Card className="hover:shadow-hover transition-all duration-300">
                    <CardContent className="p-6">
                      <div className="flex items-center space-x-6">
                        <div className="text-3xl font-bold text-primary w-12 text-center">
                          #{index + 1}
                        </div>
                        
                        <div className="w-16 h-16 bg-gradient-primary rounded-xl flex items-center justify-center">
                          <Users className="h-8 w-8 text-white" />
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <div>
                              <Link to={`/teams/${team.id}`}>
                                <h3 className="text-xl font-semibold hover:text-primary transition-colors cursor-pointer">
                                  {team.name}
                                </h3>
                              </Link>
                              <p className="text-muted-foreground">{team.specialty}</p>
                            </div>
                            <div className="text-right">
                              <div className="text-2xl font-bold text-primary">{team.points} pts</div>
                              <div className="flex items-center space-x-1">
                                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                <span className="font-medium">{team.rating}</span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-6 text-sm text-muted-foreground">
                            <div className="flex items-center space-x-1">
                              <Users className="h-4 w-4" />
                              <span>{team.members} members</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <DollarSign className="h-4 w-4" />
                              <span>{team.earnings} earned</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <TrendingUp className="h-4 w-4" />
                              <span>{team.projects} projects</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          </TabsContent>

          <TabsContent value="achievements">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <h2 className="text-2xl font-bold mb-6">Available Achievements</h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {achievements.map((achievement, index) => (
                  <motion.div
                    key={achievement.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.1 * index }}
                  >
                    <Card className="hover:shadow-hover transition-all duration-300 cursor-pointer group">
                      <CardContent className="p-6 text-center">
                        <div className="text-4xl mb-4 group-hover:scale-110 transition-transform">
                          {achievement.icon}
                        </div>
                        <h3 className="text-lg font-semibold mb-2">{achievement.title}</h3>
                        <p className="text-muted-foreground text-sm mb-4">
                          {achievement.description}
                        </p>
                        <div className="flex items-center justify-between">
                          <Badge 
                            variant="outline" 
                            className={getRarityColor(achievement.rarity)}
                          >
                            {achievement.rarity}
                          </Badge>
                          <div className="font-bold text-primary">+{achievement.points} pts</div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Leaderboard;