import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Trophy, 
  Star, 
  Clock, 
  Users, 
  Target,
  TrendingUp,
  Award,
  Zap
} from 'lucide-react';
import { UserRanking, getTierColor, getPointsForNextLevel } from '@/lib/ranking';

interface RankingCardProps {
  ranking: UserRanking;
  showDetailed?: boolean;
}

export const RankingCard = ({ ranking, showDetailed = false }: RankingCardProps) => {
  const nextLevel = getPointsForNextLevel(ranking.points);
  
  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'border-gray-400 bg-gray-50';
      case 'uncommon': return 'border-green-400 bg-green-50';
      case 'rare': return 'border-blue-400 bg-blue-50';
      case 'epic': return 'border-purple-400 bg-purple-50';
      case 'legendary': return 'border-yellow-400 bg-yellow-50';
      default: return 'border-gray-400 bg-gray-50';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full"
    >
      <Card className="hover:shadow-lg transition-shadow">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={`/placeholder-avatar-${ranking.userId}.jpg`} />
                  <AvatarFallback>
                    {ranking.userId.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full border-2 border-background flex items-center justify-center text-xs font-bold ${getTierColor(ranking.tier)} bg-background`}>
                  {ranking.level}
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-lg">User {ranking.userId.substring(0, 8)}</h3>
                <div className="flex items-center space-x-2">
                  <Badge className={`${getTierColor(ranking.tier)} border-current`} variant="outline">
                    {ranking.tier}
                  </Badge>
                  <div className="flex items-center space-x-1">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span className="text-sm font-medium">{ranking.stats.averageRating.toFixed(1)}</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="flex items-center space-x-1 text-primary">
                <Trophy className="h-4 w-4" />
                <span className="text-lg font-bold">#{ranking.rank}</span>
              </div>
              <div className="text-sm text-muted-foreground">
                Score: {ranking.score.toFixed(1)}
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Level Progress */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium">Level {ranking.level}</span>
              <span className="text-sm text-muted-foreground">
                {nextLevel.current}/{nextLevel.required} XP
              </span>
            </div>
            <Progress value={nextLevel.progress} className="h-2" />
          </div>

          {/* Key Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="flex items-center justify-center space-x-1 text-blue-600 mb-1">
                <Target className="h-4 w-4" />
                <span className="text-lg font-bold">{ranking.stats.completedProjects}</span>
              </div>
              <p className="text-xs text-muted-foreground">Completed</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center space-x-1 text-green-600 mb-1">
                <Clock className="h-4 w-4" />
                <span className="text-lg font-bold">
                  {ranking.stats.completedProjects > 0 
                    ? Math.round((ranking.stats.onTimeDeliveries / ranking.stats.completedProjects) * 100)
                    : 0}%
                </span>
              </div>
              <p className="text-xs text-muted-foreground">On Time</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center space-x-1 text-purple-600 mb-1">
                <Users className="h-4 w-4" />
                <span className="text-lg font-bold">{ranking.stats.repeatClients}</span>
              </div>
              <p className="text-xs text-muted-foreground">Repeat Clients</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center space-x-1 text-orange-600 mb-1">
                <TrendingUp className="h-4 w-4" />
                <span className="text-lg font-bold">${ranking.stats.totalEarnings.toLocaleString()}</span>
              </div>
              <p className="text-xs text-muted-foreground">Earned</p>
            </div>
          </div>

          {/* Recent Badges */}
          {ranking.badges.length > 0 && (
            <div>
              <h4 className="text-sm font-medium mb-2 flex items-center space-x-1">
                <Award className="h-4 w-4" />
                <span>Recent Badges</span>
              </h4>
              <div className="flex flex-wrap gap-2">
                {ranking.badges.slice(0, showDetailed ? 10 : 4).map((badge) => (
                  <div
                    key={badge.id}
                    className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs border ${getRarityColor(badge.rarity)}`}
                    title={badge.description}
                  >
                    <span>{badge.icon}</span>
                    <span className="font-medium">{badge.name}</span>
                  </div>
                ))}
                {ranking.badges.length > 4 && !showDetailed && (
                  <div className="inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs border border-gray-300 bg-gray-50">
                    <span>+{ranking.badges.length - 4} more</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Detailed Stats (if showDetailed) */}
          {showDetailed && (
            <div className="grid grid-cols-2 gap-4 pt-4 border-t">
              <div>
                <h4 className="text-sm font-medium mb-2">Performance</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Completion Rate:</span>
                    <span>{ranking.stats.totalProjects > 0 
                      ? Math.round((ranking.stats.completedProjects / ranking.stats.totalProjects) * 100)
                      : 0}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Response Time:</span>
                    <span className="flex items-center space-x-1">
                      <Zap className="h-3 w-3" />
                      <span>{ranking.stats.responseTime.toFixed(1)}h</span>
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total Reviews:</span>
                    <span>{ranking.stats.totalReviews}</span>
                  </div>
                </div>
              </div>
              <div>
                <h4 className="text-sm font-medium mb-2">Profile</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Completeness:</span>
                    <span>{ranking.stats.profileCompleteness}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total Points:</span>
                    <span className="font-medium">{ranking.points.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Badges Earned:</span>
                    <span>{ranking.badges.length}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};
