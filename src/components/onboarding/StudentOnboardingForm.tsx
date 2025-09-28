import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/components/ui/use-toast';
import { X, Plus, Github, Globe, Linkedin } from 'lucide-react';

interface StudentOnboardingData {
  skills: string[];
  portfolioLinks: {
    github?: string;
    behance?: string;
    linkedin?: string;
    website?: string;
  };
  availability: number;
  hourlyRate: number;
  bio: string;
  badges: string[];
}

const predefinedSkills = [
  'JavaScript', 'TypeScript', 'React', 'Node.js', 'Python', 'Java', 'C++',
  'HTML/CSS', 'Vue.js', 'Angular', 'Express.js', 'MongoDB', 'PostgreSQL',
  'GraphQL', 'Docker', 'AWS', 'Git', 'Figma', 'Photoshop', 'Illustrator',
  'UI/UX Design', 'Mobile Development', 'Machine Learning', 'Data Science',
  'DevOps', 'Blockchain', 'Cybersecurity', 'Game Development', 'WordPress'
];

const availableBadges = [
  'Verified GitHub', 'Portfolio Reviewed', 'Quick Responder', 
  'Top Rated', 'Reliable Freelancer', 'Expert Level'
];

export function StudentOnboardingForm() {
  const { user, refreshProfile } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [customSkill, setCustomSkill] = useState('');
  const [formData, setFormData] = useState<StudentOnboardingData>({
    skills: [],
    portfolioLinks: {},
    availability: 20,
    hourlyRate: 15,
    bio: '',
    badges: [],
  });

  const handleSkillToggle = (skill: string) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.includes(skill)
        ? prev.skills.filter(s => s !== skill)
        : [...prev.skills, skill]
    }));
  };

  const handleAddCustomSkill = () => {
    if (customSkill.trim() && !formData.skills.includes(customSkill.trim())) {
      setFormData(prev => ({
        ...prev,
        skills: [...prev.skills, customSkill.trim()]
      }));
      setCustomSkill('');
    }
  };

  const handleRemoveSkill = (skill: string) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.filter(s => s !== skill)
    }));
  };

  const handlePortfolioLinkChange = (platform: keyof StudentOnboardingData['portfolioLinks'], value: string) => {
    setFormData(prev => ({
      ...prev,
      portfolioLinks: {
        ...prev.portfolioLinks,
        [platform]: value
      }
    }));
  };

  const handleBadgeToggle = (badge: string) => {
    setFormData(prev => ({
      ...prev,
      badges: prev.badges.includes(badge)
        ? prev.badges.filter(b => b !== badge)
        : [...prev.badges, badge]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) return;
    
    if (formData.skills.length === 0) {
      toast({
        title: "Skills required",
        description: "Please select at least one skill.",
        variant: "destructive",
      });
      return;
    }

    if (!formData.bio.trim()) {
      toast({
        title: "Bio required",
        description: "Please provide a brief bio about yourself.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      await updateDoc(doc(db, 'students', user.uid), {
        ...formData,
        isOnboarded: true,
        updatedAt: new Date(),
      });

      await refreshProfile();
      
      toast({
        title: "Profile completed!",
        description: "Your student profile has been set up successfully.",
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5 p-4">
      <div className="max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-bold">Complete Your Student Profile</CardTitle>
              <CardDescription>
                Help clients find you by showcasing your skills and experience
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Skills Section */}
                <div className="space-y-4">
                  <Label className="text-base font-semibold">Skills & Technologies</Label>
                  <div className="flex flex-wrap gap-2">
                    {predefinedSkills.map((skill) => (
                      <Badge
                        key={skill}
                        variant={formData.skills.includes(skill) ? "default" : "outline"}
                        className="cursor-pointer hover:bg-primary/80"
                        onClick={() => handleSkillToggle(skill)}
                      >
                        {skill}
                      </Badge>
                    ))}
                  </div>
                  
                  <div className="flex gap-2">
                    <Input
                      placeholder="Add custom skill"
                      value={customSkill}
                      onChange={(e) => setCustomSkill(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddCustomSkill())}
                    />
                    <Button type="button" onClick={handleAddCustomSkill} size="sm">
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>

                  {formData.skills.length > 0 && (
                    <div className="space-y-2">
                      <Label className="text-sm">Selected Skills:</Label>
                      <div className="flex flex-wrap gap-2">
                        {formData.skills.map((skill) => (
                          <Badge key={skill} variant="secondary" className="group">
                            {skill}
                            <X
                              className="w-3 h-3 ml-1 cursor-pointer opacity-50 group-hover:opacity-100"
                              onClick={() => handleRemoveSkill(skill)}
                            />
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Portfolio Links */}
                <div className="space-y-4">
                  <Label className="text-base font-semibold">Portfolio Links</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="github" className="flex items-center gap-2">
                        <Github className="w-4 h-4" />
                        GitHub
                      </Label>
                      <Input
                        id="github"
                        placeholder="https://github.com/username"
                        value={formData.portfolioLinks.github || ''}
                        onChange={(e) => handlePortfolioLinkChange('github', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="linkedin" className="flex items-center gap-2">
                        <Linkedin className="w-4 h-4" />
                        LinkedIn
                      </Label>
                      <Input
                        id="linkedin"
                        placeholder="https://linkedin.com/in/username"
                        value={formData.portfolioLinks.linkedin || ''}
                        onChange={(e) => handlePortfolioLinkChange('linkedin', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="website" className="flex items-center gap-2">
                        <Globe className="w-4 h-4" />
                        Website/Portfolio
                      </Label>
                      <Input
                        id="website"
                        placeholder="https://yourportfolio.com"
                        value={formData.portfolioLinks.website || ''}
                        onChange={(e) => handlePortfolioLinkChange('website', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="behance">Behance</Label>
                      <Input
                        id="behance"
                        placeholder="https://behance.net/username"
                        value={formData.portfolioLinks.behance || ''}
                        onChange={(e) => handlePortfolioLinkChange('behance', e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                {/* Availability & Rate */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="availability">Availability (hours/week)</Label>
                    <Input
                      id="availability"
                      type="number"
                      min="1"
                      max="168"
                      value={formData.availability}
                      onChange={(e) => setFormData(prev => ({ ...prev, availability: parseInt(e.target.value) || 0 }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="hourlyRate">Hourly Rate ($)</Label>
                    <Input
                      id="hourlyRate"
                      type="number"
                      min="1"
                      step="0.01"
                      value={formData.hourlyRate}
                      onChange={(e) => setFormData(prev => ({ ...prev, hourlyRate: parseFloat(e.target.value) || 0 }))}
                    />
                  </div>
                </div>

                {/* Bio */}
                <div className="space-y-2">
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea
                    id="bio"
                    placeholder="Tell clients about yourself, your experience, and what makes you unique..."
                    rows={4}
                    value={formData.bio}
                    onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                  />
                </div>

                {/* Badges */}
                <div className="space-y-4">
                  <Label className="text-base font-semibold">Skill Badges (Optional)</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {availableBadges.map((badge) => (
                      <div key={badge} className="flex items-center space-x-2">
                        <Checkbox
                          id={badge}
                          checked={formData.badges.includes(badge)}
                          onCheckedChange={() => handleBadgeToggle(badge)}
                        />
                        <Label htmlFor={badge} className="text-sm">{badge}</Label>
                      </div>
                    ))}
                  </div>
                </div>

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? 'Saving Profile...' : 'Complete Profile'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
