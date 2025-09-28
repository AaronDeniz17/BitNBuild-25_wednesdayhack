// Enhanced ProjectForm component with milestones and budget types
// Supports both individual and team-based projects

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

const ProjectForm = ({ onSubmit, initialData = null, isEdit = false }) => {
  const { user } = useAuth();
  const [milestones, setMilestones] = useState([]);
  const [budgetType, setBudgetType] = useState('fixed');
  const [projectType, setProjectType] = useState('individual');
  const [skills, setSkills] = useState([]);
  const [skillSuggestions, setSkillSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset
  } = useForm({
    defaultValues: {
      title: initialData?.title || '',
      description: initialData?.description || '',
      budget_min: initialData?.budget_min || '',
      budget_max: initialData?.budget_max || '',
      is_fixed_budget: initialData?.is_fixed_budget ?? true,
      deadline: initialData?.deadline || '',
      project_type: initialData?.project_type || 'individual',
      category: initialData?.category || 'web-development',
      required_skills: initialData?.required_skills || [],
      estimated_hours: initialData?.estimated_hours || '',
      is_urgent: initialData?.is_urgent || false
    }
  });

  const watchedBudgetType = watch('is_fixed_budget');
  const watchedProjectType = watch('project_type');

  useEffect(() => {
    if (initialData?.milestones) {
      setMilestones(initialData.milestones);
    }
    if (initialData?.required_skills) {
      setSkills(initialData.required_skills);
    }
  }, [initialData]);

  useEffect(() => {
    fetchSkillSuggestions();
  }, []);

  const fetchSkillSuggestions = async () => {
    try {
      const response = await fetch('/api/projects/skill-suggestions');
      const data = await response.json();
      if (data.success) {
        setSkillSuggestions(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch skill suggestions:', error);
    }
  };

  const addMilestone = () => {
    const newMilestone = {
      id: Date.now(),
      title: '',
      description: '',
      percentage: 0,
      due_date: ''
    };
    setMilestones([...milestones, newMilestone]);
  };

  const removeMilestone = (id) => {
    setMilestones(milestones.filter(m => m.id !== id));
  };

  const updateMilestone = (id, field, value) => {
    setMilestones(milestones.map(m => 
      m.id === id ? { ...m, [field]: value } : m
    ));
  };

  const addSkill = (skill) => {
    if (skill && !skills.includes(skill)) {
      setSkills([...skills, skill]);
      setValue('required_skills', [...skills, skill]);
    }
  };

  const removeSkill = (skill) => {
    const newSkills = skills.filter(s => s !== skill);
    setSkills(newSkills);
    setValue('required_skills', newSkills);
  };

  const validateMilestones = () => {
    if (milestones.length === 0) return true;
    
    const totalPercentage = milestones.reduce((sum, m) => sum + (parseFloat(m.percentage) || 0), 0);
    return Math.abs(totalPercentage - 100) < 0.01; // Allow small floating point differences
  };

  const onSubmitForm = async (data) => {
    if (!validateMilestones()) {
      toast.error('Milestone percentages must sum to 100%');
      return;
    }

    setLoading(true);
    try {
      const formData = {
        ...data,
        required_skills: skills,
        milestones: milestones.length > 0 ? milestones.map(m => ({
          title: m.title,
          description: m.description,
          percentage: parseFloat(m.percentage),
          due_date: m.due_date
        })) : []
      };

      await onSubmit(formData);
      toast.success(isEdit ? 'Project updated successfully!' : 'Project created successfully!');
    } catch (error) {
      toast.error(error.message || 'Failed to save project');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <form onSubmit={handleSubmit(onSubmitForm)} className="space-y-8">
        {/* Basic Information */}
        <div className="card">
          <div className="card-header">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              {isEdit ? 'Edit Project' : 'Create New Project'}
            </h2>
          </div>
          <div className="card-body space-y-6">
            {/* Title */}
            <div>
              <label className="label">Project Title *</label>
              <input
                {...register('title', { 
                  required: 'Title is required',
                  minLength: { value: 5, message: 'Title must be at least 5 characters' }
                })}
                className={`input ${errors.title ? 'input-error' : ''}`}
                placeholder="Enter project title"
              />
              {errors.title && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {errors.title.message}
                </p>
              )}
            </div>

            {/* Description */}
            <div>
              <label className="label">Project Description *</label>
              <textarea
                {...register('description', { 
                  required: 'Description is required',
                  minLength: { value: 20, message: 'Description must be at least 20 characters' }
                })}
                className={`input ${errors.description ? 'input-error' : ''}`}
                rows={6}
                placeholder="Describe your project in detail..."
              />
              {errors.description && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {errors.description.message}
                </p>
              )}
            </div>

            {/* Project Type */}
            <div>
              <label className="label">Project Type *</label>
              <div className="grid grid-cols-2 gap-4">
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="radio"
                    value="individual"
                    {...register('project_type')}
                    className="text-primary-600 focus:ring-primary-500"
                  />
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">Individual</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      One freelancer will work on this project
                    </div>
                  </div>
                </label>
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="radio"
                    value="team"
                    {...register('project_type')}
                    className="text-primary-600 focus:ring-primary-500"
                  />
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">Team</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      A team of freelancers will work together
                    </div>
                  </div>
                </label>
              </div>
            </div>

            {/* Budget */}
            <div>
              <label className="label">Budget *</label>
              <div className="space-y-4">
                {/* Budget Type */}
                <div className="flex space-x-4">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      value="fixed"
                      {...register('is_fixed_budget')}
                      className="text-primary-600 focus:ring-primary-500"
                    />
                    <span className="text-gray-900 dark:text-white">Fixed Price</span>
                  </label>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      value="range"
                      {...register('is_fixed_budget')}
                      className="text-primary-600 focus:ring-primary-500"
                    />
                    <span className="text-gray-900 dark:text-white">Price Range</span>
                  </label>
                </div>

                {/* Budget Input */}
                {watchedBudgetType === 'fixed' ? (
                  <div>
                    <input
                      {...register('budget_min', { 
                        required: 'Budget is required',
                        min: { value: 25, message: 'Minimum budget is $25' }
                      })}
                      type="number"
                      className={`input ${errors.budget_min ? 'input-error' : ''}`}
                      placeholder="Enter fixed budget amount"
                    />
                    {errors.budget_min && (
                      <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                        {errors.budget_min.message}
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Minimum Budget
                      </label>
                      <input
                        {...register('budget_min', { 
                          required: 'Minimum budget is required',
                          min: { value: 25, message: 'Minimum budget is $25' }
                        })}
                        type="number"
                        className={`input ${errors.budget_min ? 'input-error' : ''}`}
                        placeholder="Min amount"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Maximum Budget
                      </label>
                      <input
                        {...register('budget_max', { 
                          required: 'Maximum budget is required',
                          min: { value: 25, message: 'Maximum budget is $25' }
                        })}
                        type="number"
                        className={`input ${errors.budget_max ? 'input-error' : ''}`}
                        placeholder="Max amount"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Deadline */}
            <div>
              <label className="label">Project Deadline *</label>
              <input
                {...register('deadline', { 
                  required: 'Deadline is required',
                  validate: value => {
                    const date = new Date(value);
                    const now = new Date();
                    return date > now || 'Deadline must be in the future';
                  }
                })}
                type="datetime-local"
                className={`input ${errors.deadline ? 'input-error' : ''}`}
              />
              {errors.deadline && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {errors.deadline.message}
                </p>
              )}
            </div>

            {/* Skills */}
            <div>
              <label className="label">Required Skills *</label>
              <div className="space-y-4">
                {/* Skill Input */}
                <div className="flex space-x-2">
                  <input
                    type="text"
                    className="input flex-1"
                    placeholder="Add a skill..."
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addSkill(e.target.value.trim());
                        e.target.value = '';
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const input = document.querySelector('input[placeholder="Add a skill..."]');
                      if (input.value.trim()) {
                        addSkill(input.value.trim());
                        input.value = '';
                      }
                    }}
                    className="btn btn-primary"
                  >
                    Add
                  </button>
                </div>

                {/* Selected Skills */}
                {skills.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {skills.map((skill, index) => (
                      <span
                        key={index}
                        className="badge badge-primary flex items-center space-x-1"
                      >
                        <span>{skill}</span>
                        <button
                          type="button"
                          onClick={() => removeSkill(skill)}
                          className="ml-1 text-primary-600 hover:text-primary-800"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                {/* Skill Suggestions */}
                {skillSuggestions.length > 0 && (
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      Trending skills:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {skillSuggestions.slice(0, 10).map((suggestion, index) => (
                        <button
                          key={index}
                          type="button"
                          onClick={() => addSkill(suggestion.skill)}
                          className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-600"
                        >
                          {suggestion.skill} ({suggestion.count})
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Milestones */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <label className="label mb-0">Project Milestones (Optional)</label>
                <button
                  type="button"
                  onClick={addMilestone}
                  className="btn btn-secondary btn-sm"
                >
                  Add Milestone
                </button>
              </div>

              {milestones.length > 0 && (
                <div className="space-y-4">
                  {milestones.map((milestone, index) => (
                    <div key={milestone.id} className="card border border-gray-200 dark:border-gray-700">
                      <div className="card-body">
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="font-medium text-gray-900 dark:text-white">
                            Milestone {index + 1}
                          </h4>
                          <button
                            type="button"
                            onClick={() => removeMilestone(milestone.id)}
                            className="text-red-600 hover:text-red-800"
                          >
                            Remove
                          </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Title *
                            </label>
                            <input
                              type="text"
                              value={milestone.title}
                              onChange={(e) => updateMilestone(milestone.id, 'title', e.target.value)}
                              className="input"
                              placeholder="Milestone title"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Percentage *
                            </label>
                            <input
                              type="number"
                              value={milestone.percentage}
                              onChange={(e) => updateMilestone(milestone.id, 'percentage', e.target.value)}
                              className="input"
                              placeholder="0"
                              min="0"
                              max="100"
                            />
                          </div>
                          <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Description
                            </label>
                            <textarea
                              value={milestone.description}
                              onChange={(e) => updateMilestone(milestone.id, 'description', e.target.value)}
                              className="input"
                              rows={3}
                              placeholder="Describe this milestone..."
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Due Date
                            </label>
                            <input
                              type="datetime-local"
                              value={milestone.due_date}
                              onChange={(e) => updateMilestone(milestone.id, 'due_date', e.target.value)}
                              className="input"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}

                  {milestones.length > 0 && (
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Total: {milestones.reduce((sum, m) => sum + (parseFloat(m.percentage) || 0), 0)}%
                      {milestones.reduce((sum, m) => sum + (parseFloat(m.percentage) || 0), 0) !== 100 && (
                        <span className="text-red-600 ml-2">
                          (Must equal 100%)
                        </span>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => reset()}
            className="btn btn-secondary"
            disabled={loading}
          >
            Reset
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
          >
            {loading ? (
              <div className="flex items-center space-x-2">
                <div className="loading-spinner"></div>
                <span>Saving...</span>
              </div>
            ) : (
              isEdit ? 'Update Project' : 'Create Project'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ProjectForm;
