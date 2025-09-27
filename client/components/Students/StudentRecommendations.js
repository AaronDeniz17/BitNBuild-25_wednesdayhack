// Student recommendations component
import { useState, useEffect } from 'react';
import { projectsAPI } from '../../lib/api';
import Link from 'next/link';

const StudentRecommendations = ({ projectId }) => {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        const response = await projectsAPI.getRecommendedStudents(projectId);
        setRecommendations(response.data.data);
      } catch (error) {
        console.error('Error fetching recommendations:', error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    if (projectId) {
      fetchRecommendations();
    }
  }, [projectId]);

  if (loading) {
    return <div className="loading">Loading recommendations...</div>;
  }

  if (error) {
    return (
      <div className="text-red-500">
        Error loading recommendations: {error}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Recommended Students</h2>
      
      {recommendations.length === 0 ? (
        <p className="text-gray-500">No recommendations available</p>
      ) : (
        <div className="grid gap-4">
          {recommendations.map(student => (
            <div 
              key={student.id}
              className="p-4 border rounded-lg hover:shadow-md transition-shadow"
            >
              <div className="flex items-start space-x-4">
                <img 
                  src={student.avatar || '/default-avatar.png'}
                  alt={student.name}
                  className="w-12 h-12 rounded-full"
                />
                
                <div className="flex-grow">
                  <Link href={`/profile/${student.id}`}>
                    <h3 className="font-medium hover:text-blue-600">
                      {student.name}
                    </h3>
                  </Link>
                  
                  <p className="text-sm text-gray-600">
                    {student.university}
                  </p>
                  
                  <div className="mt-2 flex flex-wrap gap-2">
                    {student.skills?.slice(0, 5).map(skill => (
                      <span 
                        key={skill}
                        className="px-2 py-1 text-xs bg-blue-50 text-blue-700 rounded"
                      >
                        {skill}
                      </span>
                    ))}
                    {student.skills?.length > 5 && (
                      <span className="text-xs text-gray-500">
                        +{student.skills.length - 5} more
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="text-lg font-semibold">
                    {student.score.total.toFixed(1)}%
                  </div>
                  <div className="text-sm text-gray-500">
                    Match Score
                  </div>
                </div>
              </div>
              
              <div className="mt-3 grid grid-cols-4 gap-2 text-sm">
                <div className="text-center p-2 bg-gray-50 rounded">
                  <div className="font-medium">{student.score.factors.skillMatch.toFixed(1)}%</div>
                  <div className="text-xs text-gray-500">Skill Match</div>
                </div>
                <div className="text-center p-2 bg-gray-50 rounded">
                  <div className="font-medium">{student.score.factors.experience.toFixed(1)}%</div>
                  <div className="text-xs text-gray-500">Experience</div>
                </div>
                <div className="text-center p-2 bg-gray-50 rounded">
                  <div className="font-medium">{student.score.factors.rating.toFixed(1)}%</div>
                  <div className="text-xs text-gray-500">Rating</div>
                </div>
                <div className="text-center p-2 bg-gray-50 rounded">
                  <div className="font-medium">{student.score.factors.completionRate.toFixed(1)}%</div>
                  <div className="text-xs text-gray-500">Completion</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default StudentRecommendations;