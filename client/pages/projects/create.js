// Project Creation Page for GigCampus
// Allows clients to post new projects with milestones and requirements

import { useState } from 'react';
import { useRouter } from 'next/router';
import { 
  PlusIcon,
  TrashIcon,
  CalendarIcon,
  CurrencyDollarIcon
} from '@heroicons/react/24/outline';

import Layout from '../../components/Layout/Layout';
import { useAuth } from '../../contexts/AuthContext';
import { projectsAPI } from '../../lib/api';
import toast from 'react-hot-toast';

const CreateProjectPage = () => {
  const { user } = useAuth();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    required_skills: [],
    budget: '',
    deadline: '',
    category: 'web-development',
    urgency: 'medium',
    requires_team: false,
    team_size_min: 1,
    team_size_max: 5,
    estimated_hours: '',
    milestones: [
      { title: '', description: '', weight_pct: 100, due_date: '' }
    ]
  });

  const skillOptions = [
    'React', 'Vue.js', 'Angular', 'Node.js', 'Python', 'Django', 'Flask',
    'JavaScript', 'TypeScript', 'HTML/CSS', 'PHP', 'Laravel', 'Java',
    'Spring Boot', 'C#', '.NET', 'Ruby', 'Ruby on Rails', 'Go', 'Rust',
    'UI/UX Design', 'Figma', 'Adobe XD', 'Photoshop', 'Illustrator',
    'Mobile Development', 'React Native', 'Flutter', 'iOS', 'Android',
    'DevOps', 'AWS', 'Docker', 'Kubernetes', 'CI/CD',
    'Database Design', 'MySQL', 'PostgreSQL', 'MongoDB', 'Redis',
    'Machine Learning', 'Data Science', 'AI', 'TensorFlow', 'PyTorch',
    'Content Writing', 'Copywriting', 'Technical Writing', 'SEO',
    'Digital Marketing', 'Social Media', 'Video Editing', 'Animation'
  ];

  const categoryOptions = [
    { value: 'web-development', label: 'Web Development' },
    { value: 'mobile-development', label: 'Mobile Development' },
    { value: 'design', label: 'Design & Creative' },
    { value: 'writing', label: 'Writing & Content' },
    { value: 'marketing', label: 'Marketing & SEO' },
    { value: 'data-science', label: 'Data Science & AI' },
    { value: 'devops', label: 'DevOps & Infrastructure' },
    { value: 'other', label: 'Other' }
  ];

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSkillToggle = (skill) => {
    setFormData(prev => ({
      ...prev,
      required_skills: prev.required_skills.includes(skill)
        ? prev.required_skills.filter(s => s !== skill)
        : [...prev.required_skills, skill]
    }));
  };

  const handleMilestoneChange = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      milestones: prev.milestones.map((milestone, i) => 
        i === index ? { ...milestone, [field]: value } : milestone
      )
    }));
  };

  const addMilestone = () => {
    setFormData(prev => ({
      ...prev,
      milestones: [...prev.milestones, { title: '', description: '', weight_pct: 0, due_date: '' }]
    }));
  };

  const removeMilestone = (index) => {
    if (formData.milestones.length > 1) {
      setFormData(prev => ({
        ...prev,
        milestones: prev.milestones.filter((_, i) => i !== index)
      }));
    }
  };

  const validateForm = () => {
    if (!formData.title.trim()) {
      toast.error('Project title is required');
      return false;
    }
    if (!formData.description.trim()) {
      toast.error('Project description is required');
      return false;
    }
    if (!formData.budget || parseFloat(formData.budget) <= 0) {
      toast.error('Valid budget is required');
      return false;
    }
    if (!formData.deadline) {
      toast.error('Project deadline is required');
      return false;
    }
    if (new Date(formData.deadline) <= new Date()) {
      toast.error('Deadline must be in the future');
      return false;
    }
    if (formData.required_skills.length === 0) {
      toast.error('At least one skill is required');
      return false;
    }

    // Validate milestones
    const totalWeight = formData.milestones.reduce((sum, m) => sum + parseFloat(m.weight_pct || 0), 0);
    if (Math.abs(totalWeight - 100) > 0.01) {
      toast.error('Milestone percentages must add up to 100%');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      // Validate required fields
      if (!formData.title || !formData.description || !formData.budget || !formData.deadline) {
        toast.error('Please fill in all required fields');
        return;
      }

      // Validate budget is a number
      const budget = parseFloat(formData.budget);
      if (isNaN(budget) || budget <= 0) {
        toast.error('Please enter a valid budget amount');
        return;
      }

      // Validate at least one skill is selected
      if (formData.required_skills.length === 0) {
        toast.error('Please select at least one required skill');
        return;
      }

      // Format milestone dates to ensure they're valid
      const formattedMilestones = formData.milestones.map(m => {
        const milestone = {
          title: m.title.trim(),
          description: m.description.trim(),
          weight_pct: parseFloat(m.weight_pct) || 0
        };
        
        // Make sure the due date is a valid ISO string
        if (m.due_date) {
          try {
            milestone.due_date = new Date(m.due_date).toISOString();
          } catch (e) {
            console.error('Invalid milestone date:', e);
          }
        }
        return milestone;
      }).filter(m => m.title && m.due_date);

      // Format the project deadline
      let deadline;
      try {
        deadline = new Date(formData.deadline).toISOString();
      } catch (e) {
        toast.error('Invalid project deadline date');
        return;
      }

      const projectData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        budget: budget,
        deadline: deadline,
        category: formData.category,
        required_skills: formData.required_skills,
        urgency: formData.urgency || 'medium',
        requires_team: Boolean(formData.requires_team),
        team_size_min: Math.max(1, parseInt(formData.team_size_min) || 1),
        team_size_max: Math.max(1, parseInt(formData.team_size_max) || 1),
        estimated_hours: parseFloat(formData.estimated_hours) || null,
        milestones: formattedMilestones
      };

      const response = await projectsAPI.createProject(projectData);
      
      if (response.data?.success) {
        toast.success('Project created successfully!');
        router.push(`/projects/${response.data.data.id}`);
      } else {
        throw new Error(response.data?.error || 'Failed to create project');
      }
    } catch (error) {
      console.error('Project creation error:', error);
      
      // Handle validation errors from the server
      if (error.data?.details) {
        error.data.details.forEach(detail => {
          toast.error(detail);
        });
      } else if (error.data?.error) {
        toast.error(error.data.error);
      } else {
        toast.error(error.message || 'Failed to create project. Please try again.');
      }
      
      // Log additional details for debugging
      if (error.status) {
        console.error(`Server responded with status ${error.status}`);
      }
      if (error.data) {
        console.error('Server response:', error.data);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user || user.role !== 'client') {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h2>
            <p className="text-gray-600">Only clients can create projects.</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Create New Project</h1>
            <p className="mt-2 text-gray-600">
              Post your project and connect with talented students
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Basic Information */}
            <div className="card p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Basic Information</h2>
              
              <div className="grid grid-cols-1 gap-6">
                <div>
                  <label htmlFor="title" className="label">
                    Project Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="title"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    className="input"
                    placeholder="e.g., Build a modern e-commerce website"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="description" className="label">
                    Project Description <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    rows={6}
                    value={formData.description}
                    onChange={handleChange}
                    className="input"
                    placeholder="Describe your project in detail, including goals, requirements, and expectations..."
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="category" className="label">Category</label>
                    <select
                      id="category"
                      name="category"
                      value={formData.category}
                      onChange={handleChange}
                      className="input"
                    >
                      {categoryOptions.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label htmlFor="urgency" className="label">Urgency Level</label>
                    <select
                      id="urgency"
                      name="urgency"
                      value={formData.urgency}
                      onChange={handleChange}
                      className="input"
                    >
                      <option value="low">Low - Flexible timeline</option>
                      <option value="medium">Medium - Standard timeline</option>
                      <option value="high">High - Urgent project</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Budget and Timeline */}
            <div className="card p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Budget & Timeline</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label htmlFor="budget" className="label">
                    Budget ($) <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <CurrencyDollarIcon className="h-5 w-5 text-gray-400 absolute left-3 top-3" />
                    <input
                      type="number"
                      id="budget"
                      name="budget"
                      value={formData.budget}
                      onChange={handleChange}
                      className="input pl-10"
                      placeholder="1000"
                      min="1"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="deadline" className="label">
                    Deadline <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <CalendarIcon className="h-5 w-5 text-gray-400 absolute left-3 top-3" />
                    <input
                      type="date"
                      id="deadline"
                      name="deadline"
                      value={formData.deadline}
                      onChange={handleChange}
                      className="input pl-10"
                      min={new Date().toISOString().split('T')[0]}
                      required
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="estimated_hours" className="label">
                    Estimated Hours
                  </label>
                  <input
                    type="number"
                    id="estimated_hours"
                    name="estimated_hours"
                    value={formData.estimated_hours}
                    onChange={handleChange}
                    className="input"
                    placeholder="40"
                    min="1"
                  />
                </div>
              </div>
            </div>

            {/* Required Skills */}
            <div className="card p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Required Skills <span className="text-red-500">*</span>
              </h2>
              <p className="text-gray-600 mb-4">
                Select the skills needed for this project
              </p>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {skillOptions.map(skill => (
                  <button
                    key={skill}
                    type="button"
                    onClick={() => handleSkillToggle(skill)}
                    className={`p-3 text-left rounded-lg border transition-colors ${
                      formData.required_skills.includes(skill)
                        ? 'border-primary-500 bg-primary-50 text-primary-700'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    {skill}
                  </button>
                ))}
              </div>
            </div>

            {/* Team Requirements */}
            <div className="card p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Team Requirements</h2>
              
              <div className="space-y-4">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="requires_team"
                    name="requires_team"
                    checked={formData.requires_team}
                    onChange={handleChange}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                  <label htmlFor="requires_team" className="ml-2 text-sm text-gray-700">
                    This project requires a team (multiple students)
                  </label>
                </div>

                {formData.requires_team && (
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="team_size_min" className="label">
                        Minimum Team Size
                      </label>
                      <input
                        type="number"
                        id="team_size_min"
                        name="team_size_min"
                        value={formData.team_size_min}
                        onChange={handleChange}
                        className="input"
                        min="2"
                        max="10"
                      />
                    </div>

                    <div>
                      <label htmlFor="team_size_max" className="label">
                        Maximum Team Size
                      </label>
                      <input
                        type="number"
                        id="team_size_max"
                        name="team_size_max"
                        value={formData.team_size_max}
                        onChange={handleChange}
                        className="input"
                        min="2"
                        max="10"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Milestones */}
            <div className="card p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">Project Milestones</h2>
                <button
                  type="button"
                  onClick={addMilestone}
                  className="btn-secondary flex items-center"
                >
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Add Milestone
                </button>
              </div>
              
              <div className="space-y-4">
                {formData.milestones.map((milestone, index) => (
                  <div key={index} className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-medium text-gray-900">
                        Milestone {index + 1}
                      </h3>
                      {formData.milestones.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeMilestone(index)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="label">Title</label>
                        <input
                          type="text"
                          value={milestone.title}
                          onChange={(e) => handleMilestoneChange(index, 'title', e.target.value)}
                          className="input"
                          placeholder="e.g., Design mockups"
                        />
                      </div>

                      <div>
                        <label className="label">Percentage (%)</label>
                        <input
                          type="number"
                          value={milestone.weight_pct}
                          onChange={(e) => handleMilestoneChange(index, 'weight_pct', e.target.value)}
                          className="input"
                          placeholder="25"
                          min="1"
                          max="100"
                        />
                      </div>

                      <div>
                        <label className="label">Due Date</label>
                        <input
                          type="date"
                          value={milestone.due_date}
                          onChange={(e) => handleMilestoneChange(index, 'due_date', e.target.value)}
                          className="input"
                          min={new Date().toISOString().split('T')[0]}
                        />
                      </div>
                    </div>

                    <div className="mt-4">
                      <label className="label">Description</label>
                      <textarea
                        rows={2}
                        value={milestone.description}
                        onChange={(e) => handleMilestoneChange(index, 'description', e.target.value)}
                        className="input"
                        placeholder="Describe what needs to be delivered for this milestone..."
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">
                  Total percentage: {formData.milestones.reduce((sum, m) => sum + parseFloat(m.weight_pct || 0), 0)}%
                  {Math.abs(formData.milestones.reduce((sum, m) => sum + parseFloat(m.weight_pct || 0), 0) - 100) > 0.01 && (
                    <span className="text-red-600 ml-2">
                      (Must equal 100%)
                    </span>
                  )}
                </p>
              </div>
            </div>

            {/* Submit */}
            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => router.back()}
                className="btn-secondary"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="btn-primary"
              >
                {isSubmitting ? 'Creating...' : 'Create Project'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
};

export default CreateProjectPage;