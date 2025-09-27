// Student Portfolio page
// Showcase student's work and skills

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  PencilIcon,
  PlusIcon,
  StarIcon,
  EyeIcon,
  ExternalLinkIcon
} from '@heroicons/react/24/outline';

import Layout from '../../components/Layout/Layout';
import { useAuth } from '../../contexts/AuthContext';

const StudentPortfolioPage = () => {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [portfolioData, setPortfolioData] = useState({
    bio: '',
    skills: [],
    projects: [],
    achievements: [],
    socialLinks: {
      github: '',
      linkedin: '',
      website: ''
    }
  });

  // Mock data for demonstration
  useEffect(() => {
    setPortfolioData({
      bio: 'Passionate computer science student with experience in web development and mobile app creation. Love solving complex problems and building innovative solutions.',
      skills: ['React', 'Node.js', 'Python', 'JavaScript', 'Mobile Development', 'UI/UX Design'],
      projects: [
        {
          id: 1,
          title: 'E-commerce Web App',
          description: 'Full-stack e-commerce platform built with React and Node.js',
          technologies: ['React', 'Node.js', 'MongoDB'],
          image: '/placeholder-project.jpg',
          liveUrl: 'https://example.com',
          githubUrl: 'https://github.com/username/project',
          status: 'completed'
        },
        {
          id: 2,
          title: 'Mobile Fitness Tracker',
          description: 'React Native app for tracking workouts and nutrition',
          technologies: ['React Native', 'Firebase'],
          image: '/placeholder-project.jpg',
          githubUrl: 'https://github.com/username/fitness-app',
          status: 'in-progress'
        }
      ],
      achievements: [
        {
          title: 'Dean\'s List',
          description: 'Achieved Dean\'s List for 3 consecutive semesters',
          date: '2024'
        },
        {
          title: 'Hackathon Winner',
          description: 'First place in University Hackathon 2024',
          date: '2024'
        }
      ],
      socialLinks: {
        github: 'https://github.com/username',
        linkedin: 'https://linkedin.com/in/username',
        website: 'https://myportfolio.com'
      }
    });
  }, []);

  if (!user) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <p className="text-gray-600">Please log in to view your portfolio.</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">My Portfolio</h1>
              <p className="text-gray-600 mt-2">Showcase your skills and projects</p>
            </div>
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="btn-primary flex items-center"
            >
              <PencilIcon className="h-4 w-4 mr-2" />
              {isEditing ? 'Save Changes' : 'Edit Portfolio'}
            </button>
          </div>

          <div className="space-y-8">
            {/* Profile Section */}
            <div className="card p-6">
              <div className="flex items-start space-x-6">
                <div className="flex-shrink-0">
                  <div className="h-24 w-24 bg-primary-600 rounded-full flex items-center justify-center">
                    <span className="text-white text-2xl font-bold">
                      {user.name?.charAt(0) || 'U'}
                    </span>
                  </div>
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-gray-900">{user.name}</h2>
                  <p className="text-gray-600">{user.email}</p>
                  <p className="text-gray-500 text-sm">Computer Science Student</p>
                  
                  <div className="mt-4">
                    {isEditing ? (
                      <textarea
                        value={portfolioData.bio}
                        onChange={(e) => setPortfolioData({...portfolioData, bio: e.target.value})}
                        className="input w-full"
                        rows={3}
                        placeholder="Tell us about yourself..."
                      />
                    ) : (
                      <p className="text-gray-700">{portfolioData.bio}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Skills Section */}
            <div className="card p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Skills</h3>
                {isEditing && (
                  <button className="text-primary-600 hover:text-primary-500">
                    <PlusIcon className="h-5 w-5" />
                  </button>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {portfolioData.skills.map((skill, index) => (
                  <span
                    key={index}
                    className="bg-primary-100 text-primary-800 px-3 py-1 rounded-full text-sm"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            {/* Projects Section */}
            <div className="card p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Projects</h3>
                {isEditing && (
                  <button className="btn-primary text-sm">
                    <PlusIcon className="h-4 w-4 mr-1" />
                    Add Project
                  </button>
                )}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {portfolioData.projects.map((project) => (
                  <div key={project.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <h4 className="font-medium text-gray-900">{project.title}</h4>
                      <span className={`text-xs px-2 py-1 rounded ${
                        project.status === 'completed' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {project.status}
                      </span>
                    </div>
                    
                    <p className="text-gray-600 text-sm mb-3">{project.description}</p>
                    
                    <div className="flex flex-wrap gap-1 mb-3">
                      {project.technologies.map((tech, index) => (
                        <span key={index} className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                          {tech}
                        </span>
                      ))}
                    </div>
                    
                    <div className="flex space-x-3">
                      {project.liveUrl && (
                        <a
                          href={project.liveUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary-600 hover:text-primary-500 text-sm flex items-center"
                        >
                          <EyeIcon className="h-4 w-4 mr-1" />
                          Live Demo
                        </a>
                      )}
                      {project.githubUrl && (
                        <a
                          href={project.githubUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-gray-600 hover:text-gray-500 text-sm flex items-center"
                        >
                          <ExternalLinkIcon className="h-4 w-4 mr-1" />
                          GitHub
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Achievements Section */}
            <div className="card p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Achievements</h3>
                {isEditing && (
                  <button className="text-primary-600 hover:text-primary-500">
                    <PlusIcon className="h-5 w-5" />
                  </button>
                )}
              </div>
              
              <div className="space-y-4">
                {portfolioData.achievements.map((achievement, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      <StarIcon className="h-5 w-5 text-yellow-500" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">{achievement.title}</h4>
                      <p className="text-gray-600 text-sm">{achievement.description}</p>
                      <p className="text-gray-500 text-xs">{achievement.date}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Social Links Section */}
            <div className="card p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Connect With Me</h3>
              <div className="flex space-x-4">
                {portfolioData.socialLinks.github && (
                  <a
                    href={portfolioData.socialLinks.github}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-600 hover:text-gray-900"
                  >
                    GitHub
                  </a>
                )}
                {portfolioData.socialLinks.linkedin && (
                  <a
                    href={portfolioData.socialLinks.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-600 hover:text-gray-900"
                  >
                    LinkedIn
                  </a>
                )}
                {portfolioData.socialLinks.website && (
                  <a
                    href={portfolioData.socialLinks.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-600 hover:text-gray-900"
                  >
                    Website
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default StudentPortfolioPage;