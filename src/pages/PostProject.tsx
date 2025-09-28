import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { PostProjectForm } from '@/components/projects/PostProjectForm';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface ProjectData {
  title: string;
  description: string;
  category: string;
  budget: {
    min: number;
    max: number;
    type: 'fixed' | 'hourly';
  };
  duration: string;
  location: string;
  experienceLevel: 'beginner' | 'intermediate' | 'expert';
  projectType: 'one-time' | 'ongoing';
  skills: string[];
}

const PostProject = () => {
  const navigate = useNavigate();
  const { user, userProfile } = useAuth();
  const { toast } = useToast();

  // Redirect if not a client
  if (userProfile && userProfile.role !== 'client') {
    return (
      <div className="min-h-screen bg-background pt-16 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
          <p className="text-muted-foreground mb-4">Only clients can post projects.</p>
          <Button onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  const handleSubmitProject = async (projectData: ProjectData) => {
    if (!user || !userProfile) {
      throw new Error('User not authenticated');
    }

    // Create project object with additional metadata
    const newProject = {
      id: `project_${Date.now()}`,
      ...projectData,
      clientId: user.uid,
      clientName: userProfile.name,
      clientAvatar: user.photoURL || '',
      status: 'open' as const,
      postedDate: new Date(),
      bidsCount: 0,
      proposals: 0,
    };

    // In a real app, this would save to Firestore
    // For now, we'll store in localStorage for demo purposes
    const existingProjects = JSON.parse(localStorage.getItem('gigcampus_projects') || '[]');
    const updatedProjects = [newProject, ...existingProjects];
    localStorage.setItem('gigcampus_projects', JSON.stringify(updatedProjects));

    // Also trigger a custom event to notify other components
    window.dispatchEvent(new CustomEvent('projectPosted', { detail: newProject }));

    // Navigate back to dashboard
    setTimeout(() => {
      navigate('/dashboard');
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-background pt-16">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Button variant="ghost" onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>

        {/* Page Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl font-bold mb-4">Post a New Project</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Find the perfect freelancer for your project. Create a detailed listing to attract 
            the best talent on GigCampus.
          </p>
        </motion.div>

        {/* Project Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <PostProjectForm
            onSubmit={handleSubmitProject}
            onCancel={() => navigate('/dashboard')}
          />
        </motion.div>

        {/* Tips Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-12 bg-muted/30 rounded-lg p-6"
        >
          <h3 className="text-lg font-semibold mb-4">Tips for a Successful Project Post</h3>
          <div className="grid md:grid-cols-2 gap-4 text-sm text-muted-foreground">
            <div>
              <h4 className="font-medium text-foreground mb-2">Clear Requirements</h4>
              <p>Be specific about what you need. Include technical requirements, design preferences, and expected deliverables.</p>
            </div>
            <div>
              <h4 className="font-medium text-foreground mb-2">Realistic Budget</h4>
              <p>Set a fair budget range that reflects the complexity and time required for your project.</p>
            </div>
            <div>
              <h4 className="font-medium text-foreground mb-2">Detailed Description</h4>
              <p>Provide context about your business, target audience, and project goals to help freelancers understand your vision.</p>
            </div>
            <div>
              <h4 className="font-medium text-foreground mb-2">Relevant Skills</h4>
              <p>List the specific skills and technologies required. This helps the right freelancers find your project.</p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default PostProject;
