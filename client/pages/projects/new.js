// Project Creation Wizard for GigCampus
// Client-only page for posting new projects

import { useState } from 'react';
import { useRouter } from 'next/router';
import { useForm } from 'react-hook-form';
import { toast } from 'react-hot-toast';
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  PlusIcon,
  XMarkIcon,
  DocumentTextIcon,
  CurrencyDollarIcon,
  CalendarIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline';

import Layout from '../../components/Layout/Layout';
import { useAuth } from '../../contexts/AuthContext';
import { projectsAPI } from '../../lib/api';
import { SKILL_CATEGORIES } from '../../lib/utils';

const ProjectCreationWizard = () => {
  const { user } = useAuth();
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm({
    defaultValues: {
      title: '',
      description: '',
      category: '',
      required_skills: [],
      budget: '',
      deadline: '',
      urgency: 'medium',
      requires_team: false,
      team_size_min: 1,
      team_size_max: 5,
      estimated_hours: '',
      milestones: [{ title: '', description: '', weight_pct: 100 }],
      tags: []
    }
  });

  const watchedValues = watch();

  // Redirect if not client
  if (user && user.role !== 'client') {
    router.push('/dashboard');
    return null;
  }

  const steps = [
    { id: 1, title: 'Project Basics', description: 'Title, description, and category' },
    { id: 2, title: 'Requirements', description: 'Skills, budget, and timeline' },
    { id: 3, title: 'Team & Milestones', description: 'Team requirements and project phases' },
    { id: 4, title: 'Review & Post', description: 'Final review before posting' }
  ];

  const addSkill = (skill) => {
    const currentSkills = watchedValues.required_skills;
    if (!currentSkills.includes(skill)) {
      setValue('required_skills', [...currentSkills, skill]);
    }
  };

  const removeSkill = (skillToRemove) => {
    const currentSkills = watchedValues.required_skills;
    setValue('required_skills', currentSkills.filter(skill => skill !== skillToRemove));
  };

  const addMilestone = () => {
    const currentMilestones = watchedValues.milestones;
    setValue('milestones', [...currentMilestones, { title: '', description: '', weight_pct: 0 }]);
  };

  const removeMilestone = (index) => {
    const currentMilestones = watchedValues.milestones;
    if (currentMilestones.length > 1) {
      setValue('milestones', currentMilestones.filter((_, i) => i !== index));
    }
  };

  const addTag = (tag) => {
    const currentTags = watchedValues.tags;
    if (!currentTags.includes(tag) && tag.trim()) {
      setValue('tags', [...currentTags, tag.trim()]);
    }
  };

  const removeTag = (tagToRemove) => {
    const currentTags = watchedValues.tags;
    setValue('tags', currentTags.filter(tag => tag !== tagToRemove));
  };

  const nextStep = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      // Validate milestones percentages sum to 100
      const totalPercentage = data.milestones.reduce((sum, milestone) => sum + parseFloat(milestone.weight_pct || 0), 0);
      if (Math.abs(totalPercentage - 100) > 0.01) {
        toast.error('Milestone percentages must sum to 100%');
        setIsSubmitting(false);
        return;
      }

      const response = await projectsAPI.createProject({
        ...data,
        budget: parseFloat(data.budget),
        estimated_hours: parseFloat(data.estimated_hours || 0),
        team_size_min: parseInt(data.team_size_min),
        team_size_max: parseInt(data.team_size_max),
        deadline: new Date(data.deadline).toISOString()
      });

      toast.success('Project posted successfully!');
      router.push(`/projects/${response.data.id}`);
    } catch (error) {
      console.error('Error creating project:', error);
      toast.error(error.response?.data?.error || 'Failed to create project');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Project Title *
              </label>
              <input
                {...register('title', { required: 'Project title is required' })}
                type="text"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., Build a React Native mobile app"
              />
              {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category *
              </label>
              <select
                {...register('category', { required: 'Category is required' })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select a category</option>
                <option value="web-development">Web Development</option>
                <option value="mobile-development">Mobile Development</option>
                <option value="design">Design & UI/UX</option>
                <option value="data-science">Data Science</option>
                <option value="writing">Writing & Content</option>
                <option value="marketing">Marketing</option>
                <option value="other">Other</option>
              </select>
              {errors.category && <p className="text-red-500 text-sm mt-1">{errors.category.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Project Description *
              </label>
              <textarea
                {...register('description', { required: 'Description is required', minLength: { value: 50, message: 'Description must be at least 50 characters' } })}
                rows={6}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Describe your project in detail. What needs to be built? What are your requirements?"
              />
              {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description.message}</p>}
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Required Skills
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-4">
                {Object.entries(SKILL_CATEGORIES).map(([category, skills]) => (
                  <div key={category}>
                    <h4 className="font-medium text-sm text-gray-600 mb-1">{category}</h4>
                    {skills.map(skill => (
                      <button
                        key={skill}
                        type="button"
                        onClick={() => addSkill(skill)}
                        className={`text-xs px-2 py-1 rounded-full mr-1 mb-1 ${
                          watchedValues.required_skills.includes(skill)
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {skill}
                      </button>
                    ))}
                  </div>
                ))}
              </div>
              
              {watchedValues.required_skills.length > 0 && (
                <div className="border-t pt-4">
                  <p className="text-sm font-medium text-gray-700 mb-2">Selected Skills:</p>
                  <div className="flex flex-wrap gap-2">
                    {watchedValues.required_skills.map(skill => (
                      <span
                        key={skill}
                        className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800"
                      >
                        {skill}
                        <button
                          type="button"
                          onClick={() => removeSkill(skill)}
                          className="ml-2 text-blue-600 hover:text-blue-800"
                        >
                          <XMarkIcon className="h-4 w-4" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Budget (USD) *
                </label>
                <div className="relative">
                  <CurrencyDollarIcon className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <input
                    {...register('budget', { required: 'Budget is required', min: { value: 10, message: 'Minimum budget is $10' } })}
                    type="number"
                    min="10"
                    step="10"
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="500"
                  />
                </div>
                {errors.budget && <p className="text-red-500 text-sm mt-1">{errors.budget.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Deadline *
                </label>
                <div className="relative">
                  <CalendarIcon className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <input
                    {...register('deadline', { required: 'Deadline is required' })}
                    type="date"
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                {errors.deadline && <p className="text-red-500 text-sm mt-1">{errors.deadline.message}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Estimated Hours
                </label>
                <input
                  {...register('estimated_hours')}
                  type="number"
                  min="1"
                  step="1"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="40"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Urgency
                </label>
                <select
                  {...register('urgency')}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="low">Low Priority</option>
                  <option value="medium">Medium Priority</option>
                  <option value="high">High Priority</option>
                </select>
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div>
              <div className="flex items-center mb-4">
                <input
                  {...register('requires_team')}
                  type="checkbox"
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label className="ml-2 block text-sm text-gray-700">
                  This project requires a team
                </label>
              </div>

              {watchedValues.requires_team && (
                <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Minimum Team Size
                    </label>
                    <input
                      {...register('team_size_min')}
                      type="number"
                      min="2"
                      max="10"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Maximum Team Size
                    </label>
                    <input
                      {...register('team_size_max')}
                      type="number"
                      min="2"
                      max="10"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Project Milestones</h3>
                <button
                  type="button"
                  onClick={addMilestone}
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <PlusIcon className="h-4 w-4 mr-1" />
                  Add Milestone
                </button>
              </div>

              <div className="space-y-4">
                {watchedValues.milestones.map((milestone, index) => (
                  <div key={index} className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium text-gray-900">Milestone {index + 1}</h4>
                      {watchedValues.milestones.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeMilestone(index)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <XMarkIcon className="h-5 w-5" />
                        </button>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="md:col-span-2">
                        <input
                          {...register(`milestones.${index}.title`)}
                          type="text"
                          placeholder="Milestone title"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <div className="relative">
                          <input
                            {...register(`milestones.${index}.weight_pct`)}
                            type="number"
                            min="1"
                            max="100"
                            step="1"
                            placeholder="Weight %"
                            className="w-full px-3 py-2 pr-8 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                          <span className="absolute right-3 top-2 text-gray-500">%</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-3">
                      <textarea
                        {...register(`milestones.${index}.description`)}
                        rows={2}
                        placeholder="Milestone description"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Project Summary</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-gray-700 mb-2">Basic Information</h4>
                  <p><span className="font-medium">Title:</span> {watchedValues.title}</p>
                  <p><span className="font-medium">Category:</span> {watchedValues.category}</p>
                  <p><span className="font-medium">Budget:</span> ${watchedValues.budget}</p>
                  <p><span className="font-medium">Deadline:</span> {watchedValues.deadline}</p>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-700 mb-2">Requirements</h4>
                  <p><span className="font-medium">Skills:</span> {watchedValues.required_skills.join(', ')}</p>
                  <p><span className="font-medium">Team Required:</span> {watchedValues.requires_team ? 'Yes' : 'No'}</p>
                  {watchedValues.requires_team && (
                    <p><span className="font-medium">Team Size:</span> {watchedValues.team_size_min}-{watchedValues.team_size_max} members</p>
                  )}
                </div>
              </div>
              
              <div className="mt-4">
                <h4 className="font-medium text-gray-700 mb-2">Description</h4>
                <p className="text-gray-600">{watchedValues.description}</p>
              </div>
              
              {watchedValues.milestones.length > 0 && (
                <div className="mt-4">
                  <h4 className="font-medium text-gray-700 mb-2">Milestones</h4>
                  <ul className="space-y-2">
                    {watchedValues.milestones.map((milestone, index) => (
                      <li key={index} className="flex justify-between">
                        <span>{milestone.title}</span>
                        <span>{milestone.weight_pct}%</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  if (!user) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Please log in to post a project</h1>
            <Link href="/login" className="text-blue-600 hover:text-blue-800">
              Go to Login
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Post a New Project</h1>
            <p className="text-gray-600">Find the perfect student freelancers for your project</p>
          </div>

          {/* Progress Steps */}
          <div className="mb-8">
            <nav aria-label="Progress">
              <ol className="flex items-center justify-center">
                {steps.map((step, stepIdx) => (
                  <li key={step.id} className={`${stepIdx !== steps.length - 1 ? 'pr-8 sm:pr-20' : ''} relative`}>
                    <div className="flex items-center">
                      <div
                        className={`flex items-center justify-center w-10 h-10 rounded-full ${
                          step.id <= currentStep
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-200 text-gray-500'
                        }`}
                      >
                        {step.id}
                      </div>
                      <div className="ml-4 min-w-0">
                        <p className={`text-sm font-medium ${step.id <= currentStep ? 'text-blue-600' : 'text-gray-500'}`}>
                          {step.title}
                        </p>
                        <p className="text-sm text-gray-500">{step.description}</p>
                      </div>
                    </div>
                    {stepIdx !== steps.length - 1 && (
                      <div className="absolute top-5 right-0 w-5 h-px bg-gray-300" aria-hidden="true" />
                    )}
                  </li>
                ))}
              </ol>
            </nav>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-8">
                {renderStep()}
              </div>

              {/* Navigation Buttons */}
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-between">
                <button
                  type="button"
                  onClick={prevStep}
                  disabled={currentStep === 1}
                  className={`inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
                    currentStep === 1
                      ? 'text-gray-400 cursor-not-allowed'
                      : 'text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
                  }`}
                >
                  <ArrowLeftIcon className="h-4 w-4 mr-2" />
                  Previous
                </button>

                {currentStep < steps.length ? (
                  <button
                    type="button"
                    onClick={nextStep}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Next
                    <ArrowRightIcon className="h-4 w-4 ml-2" />
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className={`inline-flex items-center px-6 py-2 border border-transparent text-sm font-medium rounded-md text-white ${
                      isSubmitting
                        ? 'bg-gray-400 cursor-not-allowed'
                        : 'bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500'
                    }`}
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Posting...
                      </>
                    ) : (
                      <>
                        <DocumentTextIcon className="h-4 w-4 mr-2" />
                        Post Project
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
};

export default ProjectCreationWizard;