// Shared ProjectCard component for consistent UI across dashboards
import Link from 'next/link';
import { formatCurrency, formatDate } from '../lib/auth';
import { 
  ClockIcon,
  CurrencyDollarIcon,
  UserIcon,
  MapPinIcon
} from '@heroicons/react/24/outline';

const ProjectCard = ({ project, showClient = true, className = '' }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'open': return 'text-green-600 bg-green-50';
      case 'in_progress': return 'text-blue-600 bg-blue-50';
      case 'completed': return 'text-gray-600 bg-gray-50';
      case 'cancelled': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getUrgencyColor = (urgency) => {
    switch (urgency) {
      case 'high': return 'text-red-600';
      case 'medium': return 'text-yellow-600';
      case 'low': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  const formatDateSafe = (date) => {
    if (!date) return 'Not specified';
    try {
      // Handle Firestore timestamp format
      if (date._seconds) {
        return formatDate(new Date(date._seconds * 1000));
      }
      return formatDate(date);
    } catch (error) {
      console.error('Date formatting error:', error);
      return 'Invalid date';
    }
  };

  const getRelativeTime = (date) => {
    try {
      let dateObj;
      if (date._seconds) {
        dateObj = new Date(date._seconds * 1000);
      } else {
        dateObj = new Date(date);
      }
      
      const now = new Date();
      const diffInSeconds = Math.floor((now - dateObj) / 1000);
      
      if (diffInSeconds < 60) return 'Just now';
      if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
      if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
      if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d ago`;
      return `${Math.floor(diffInSeconds / 2592000)}mo ago`;
    } catch (error) {
      console.error('Relative time error:', error);
      return 'Recently';
    }
  };

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200 ${className}`}>
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <h3 className="text-lg font-semibold text-gray-900 line-clamp-2 flex-1 mr-2">
            {project.title}
          </h3>
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(project.status)}`}>
            {project.status}
          </span>
        </div>

        {/* Description */}
        <p className="text-gray-600 text-sm mb-4 line-clamp-3">
          {project.description}
        </p>

        {/* Skills */}
        {project.skills_required && project.skills_required.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-4">
            {project.skills_required.slice(0, 3).map((skill, index) => (
              <span key={index} className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-50 text-blue-700">
                {skill}
              </span>
            ))}
            {project.skills_required.length > 3 && (
              <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-50 text-gray-600">
                +{project.skills_required.length - 3} more
              </span>
            )}
          </div>
        )}

        {/* Project Details */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center text-sm text-gray-600">
            <CurrencyDollarIcon className="h-4 w-4 mr-2 text-gray-400" />
            <span className="font-medium text-green-600">
              {formatCurrency(project.budget)} 
              {project.budget_type && <span className="text-gray-500 ml-1">({project.budget_type})</span>}
            </span>
          </div>
          
          {project.deadline && (
            <div className="flex items-center text-sm text-gray-600">
              <ClockIcon className="h-4 w-4 mr-2 text-gray-400" />
              <span>Due {formatDateSafe(project.deadline)}</span>
            </div>
          )}

          {project.category && (
            <div className="flex items-center text-sm text-gray-600">
              <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-purple-50 text-purple-700 capitalize">
                {project.category.replace('-', ' ')}
              </span>
            </div>
          )}

          {project.urgency && (
            <div className="flex items-center text-sm">
              <span className={`font-medium ${getUrgencyColor(project.urgency)}`}>
                {project.urgency} priority
              </span>
            </div>
          )}
        </div>

        {/* Client Info */}
        {showClient && project.client && (
          <div className="flex items-center justify-between pt-3 mt-3 border-t border-gray-100">
            <div className="flex items-center">
              <UserIcon className="h-4 w-4 mr-2 text-gray-400" />
              <div>
                <p className="text-sm font-medium text-gray-900">{project.client.name}</p>
                {project.client.university && (
                  <p className="text-xs text-gray-500 flex items-center">
                    {project.client.university}
                    {project.client.university_verified && (
                      <span className="ml-1 text-green-500">✓</span>
                    )}
                  </p>
                )}
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500">
                Posted {getRelativeTime(project.created_at)}
              </p>
              {project.bid_count > 0 && (
                <p className="text-xs text-gray-500">
                  {project.bid_count} {project.bid_count === 1 ? 'bid' : 'bids'}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Action Button */}
        <div className="mt-4">
          <Link 
            href={`/projects/${project.id}`}
            className="inline-flex items-center justify-center w-full px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors duration-200"
          >
            View Details
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ProjectCard;