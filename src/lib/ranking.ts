export interface UserStats {
  totalProjects: number;
  completedProjects: number;
  averageRating: number;
  totalReviews: number;
  onTimeDeliveries: number;
  repeatClients: number;
  totalEarnings: number;
  responseTime: number; // in hours
  profileCompleteness: number; // percentage
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  requirement: string;
  points: number;
  unlockedAt?: Date;
}

export interface UserRanking {
  userId: string;
  rank: number;
  score: number;
  level: number;
  points: number;
  badges: Badge[];
  stats: UserStats;
  tier: 'Bronze' | 'Silver' | 'Gold' | 'Platinum' | 'Diamond';
}

// Ranking calculation weights
const RANKING_WEIGHTS = {
  averageRating: 0.25,      // 25% - Quality of work
  completionRate: 0.20,     // 20% - Project completion rate
  onTimeRate: 0.20,         // 20% - On-time delivery rate
  repeatClientRate: 0.15,   // 15% - Client retention
  profileCompleteness: 0.10, // 10% - Profile quality
  responseTime: 0.10,       // 10% - Communication speed
};

export const calculateRankingScore = (stats: UserStats): number => {
  const completionRate = stats.totalProjects > 0 ? stats.completedProjects / stats.totalProjects : 0;
  const onTimeRate = stats.completedProjects > 0 ? stats.onTimeDeliveries / stats.completedProjects : 0;
  const repeatClientRate = stats.totalProjects > 0 ? stats.repeatClients / stats.totalProjects : 0;
  
  // Normalize response time (lower is better, max 24 hours)
  const normalizedResponseTime = Math.max(0, 1 - (stats.responseTime / 24));
  
  // Calculate weighted score (0-100)
  const score = (
    (stats.averageRating / 5) * RANKING_WEIGHTS.averageRating * 100 +
    completionRate * RANKING_WEIGHTS.completionRate * 100 +
    onTimeRate * RANKING_WEIGHTS.onTimeRate * 100 +
    repeatClientRate * RANKING_WEIGHTS.repeatClientRate * 100 +
    (stats.profileCompleteness / 100) * RANKING_WEIGHTS.profileCompleteness * 100 +
    normalizedResponseTime * RANKING_WEIGHTS.responseTime * 100
  );

  return Math.round(score * 100) / 100; // Round to 2 decimal places
};

export const calculateLevel = (points: number): number => {
  // Level progression: 100 points per level initially, increasing by 50 each level
  let level = 1;
  let requiredPoints = 100;
  let totalRequired = 0;

  while (points >= totalRequired + requiredPoints) {
    totalRequired += requiredPoints;
    level++;
    requiredPoints += 50;
  }

  return level;
};

export const getPointsForNextLevel = (points: number): { current: number; required: number; progress: number } => {
  const level = calculateLevel(points);
  let totalRequired = 0;
  let requiredPoints = 100;

  for (let i = 1; i < level; i++) {
    totalRequired += requiredPoints;
    requiredPoints += 50;
  }

  const currentLevelPoints = points - totalRequired;
  const nextLevelRequired = requiredPoints;
  const progress = (currentLevelPoints / nextLevelRequired) * 100;

  return {
    current: currentLevelPoints,
    required: nextLevelRequired,
    progress: Math.round(progress)
  };
};

export const getTier = (score: number): 'Bronze' | 'Silver' | 'Gold' | 'Platinum' | 'Diamond' => {
  if (score >= 90) return 'Diamond';
  if (score >= 80) return 'Platinum';
  if (score >= 70) return 'Gold';
  if (score >= 60) return 'Silver';
  return 'Bronze';
};

export const getTierColor = (tier: string): string => {
  switch (tier) {
    case 'Diamond': return 'text-cyan-400';
    case 'Platinum': return 'text-gray-300';
    case 'Gold': return 'text-yellow-500';
    case 'Silver': return 'text-gray-400';
    case 'Bronze': return 'text-amber-600';
    default: return 'text-muted-foreground';
  }
};

export const getAllBadges = (): Badge[] => [
  // Completion Badges
  {
    id: 'first-project',
    name: 'First Steps',
    description: 'Complete your first project',
    icon: '🎯',
    rarity: 'common',
    requirement: 'Complete 1 project',
    points: 50
  },
  {
    id: 'project-veteran',
    name: 'Project Veteran',
    description: 'Complete 10 projects successfully',
    icon: '🏆',
    rarity: 'uncommon',
    requirement: 'Complete 10 projects',
    points: 200
  },
  {
    id: 'project-master',
    name: 'Project Master',
    description: 'Complete 50 projects successfully',
    icon: '👑',
    rarity: 'rare',
    requirement: 'Complete 50 projects',
    points: 500
  },

  // Quality Badges
  {
    id: 'five-star',
    name: 'Five Star Performer',
    description: 'Maintain 5.0 rating across 10+ projects',
    icon: '⭐',
    rarity: 'rare',
    requirement: '5.0 rating with 10+ reviews',
    points: 300
  },
  {
    id: 'client-favorite',
    name: 'Client Favorite',
    description: 'Maintain 4.8+ rating across 25+ projects',
    icon: '💖',
    rarity: 'epic',
    requirement: '4.8+ rating with 25+ reviews',
    points: 400
  },

  // Speed Badges
  {
    id: 'speed-demon',
    name: 'Speed Demon',
    description: 'Deliver 5 projects ahead of deadline',
    icon: '⚡',
    rarity: 'uncommon',
    requirement: 'Deliver 5 projects early',
    points: 150
  },
  {
    id: 'lightning-fast',
    name: 'Lightning Fast',
    description: 'Respond to messages within 1 hour (50 times)',
    icon: '🚀',
    rarity: 'rare',
    requirement: 'Quick response 50 times',
    points: 250
  },

  // Loyalty Badges
  {
    id: 'loyal-freelancer',
    name: 'Loyal Freelancer',
    description: 'Work with 3 repeat clients',
    icon: '🤝',
    rarity: 'uncommon',
    requirement: '3 repeat clients',
    points: 200
  },
  {
    id: 'client-magnet',
    name: 'Client Magnet',
    description: 'Work with 10 repeat clients',
    icon: '🧲',
    rarity: 'epic',
    requirement: '10 repeat clients',
    points: 600
  },

  // Earnings Badges
  {
    id: 'first-earnings',
    name: 'First Paycheck',
    description: 'Earn your first $100',
    icon: '💰',
    rarity: 'common',
    requirement: 'Earn $100',
    points: 75
  },
  {
    id: 'high-earner',
    name: 'High Earner',
    description: 'Earn $5,000 total',
    icon: '💎',
    rarity: 'rare',
    requirement: 'Earn $5,000 total',
    points: 400
  },
  {
    id: 'top-earner',
    name: 'Top Earner',
    description: 'Earn $25,000 total',
    icon: '👑',
    rarity: 'legendary',
    requirement: 'Earn $25,000 total',
    points: 1000
  },

  // Special Badges
  {
    id: 'early-adopter',
    name: 'Early Adopter',
    description: 'One of the first 100 users on GigCampus',
    icon: '🌟',
    rarity: 'legendary',
    requirement: 'Join in first 100 users',
    points: 500
  },
  {
    id: 'community-helper',
    name: 'Community Helper',
    description: 'Help 10 new freelancers get started',
    icon: '🤗',
    rarity: 'epic',
    requirement: 'Mentor 10 new users',
    points: 350
  },
  {
    id: 'perfectionist',
    name: 'Perfectionist',
    description: 'Complete 20 projects with 0 revisions',
    icon: '✨',
    rarity: 'legendary',
    requirement: '20 projects, no revisions',
    points: 800
  }
];

export const checkUnlockedBadges = (stats: UserStats, currentBadges: Badge[]): Badge[] => {
  const allBadges = getAllBadges();
  const unlockedBadgeIds = currentBadges.map(b => b.id);
  const newBadges: Badge[] = [];

  allBadges.forEach(badge => {
    if (unlockedBadgeIds.includes(badge.id)) return;

    let shouldUnlock = false;

    switch (badge.id) {
      case 'first-project':
        shouldUnlock = stats.completedProjects >= 1;
        break;
      case 'project-veteran':
        shouldUnlock = stats.completedProjects >= 10;
        break;
      case 'project-master':
        shouldUnlock = stats.completedProjects >= 50;
        break;
      case 'five-star':
        shouldUnlock = stats.averageRating === 5.0 && stats.totalReviews >= 10;
        break;
      case 'client-favorite':
        shouldUnlock = stats.averageRating >= 4.8 && stats.totalReviews >= 25;
        break;
      case 'speed-demon':
        shouldUnlock = stats.onTimeDeliveries >= 5;
        break;
      case 'loyal-freelancer':
        shouldUnlock = stats.repeatClients >= 3;
        break;
      case 'client-magnet':
        shouldUnlock = stats.repeatClients >= 10;
        break;
      case 'first-earnings':
        shouldUnlock = stats.totalEarnings >= 100;
        break;
      case 'high-earner':
        shouldUnlock = stats.totalEarnings >= 5000;
        break;
      case 'top-earner':
        shouldUnlock = stats.totalEarnings >= 25000;
        break;
      case 'lightning-fast':
        shouldUnlock = stats.responseTime <= 1; // Assuming this tracks average response time
        break;
      case 'perfectionist':
        shouldUnlock = stats.completedProjects >= 20; // Simplified for demo
        break;
    }

    if (shouldUnlock) {
      newBadges.push({ ...badge, unlockedAt: new Date() });
    }
  });

  return newBadges;
};
