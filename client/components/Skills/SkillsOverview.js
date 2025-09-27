// Component for displaying skill categories and trending skills
import { useState, useEffect } from 'react';
import { projectsAPI } from '../../lib/api';

const SkillsOverview = () => {
  const [categories, setCategories] = useState({});
  const [trendingSkills, setTrendingSkills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState(30); // 30 days default

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [categoriesRes, trendingRes] = await Promise.all([
          projectsAPI.getSkillCategories(),
          projectsAPI.getTrendingSkills(timeframe)
        ]);

        setCategories(categoriesRes.data.data);
        setTrendingSkills(trendingRes.data.data);
      } catch (error) {
        console.error('Error fetching skills data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [timeframe]);

  if (loading) {
    return <div className="loading">Loading skills data...</div>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Skill Categories */}
      <div className="card p-6">
        <h2 className="text-xl font-semibold mb-4">Skill Categories</h2>
        <div className="space-y-4">
          {Object.entries(categories).map(([category, data]) => (
            <div key={category} className="border rounded-lg p-4">
              <h3 className="font-medium text-lg mb-2">{data.name}</h3>
              <div className="space-y-2">
                {Object.entries(data.skills).map(([subCategory, skills]) => (
                  <div key={subCategory} className="ml-4">
                    <h4 className="text-sm font-medium text-gray-600">{subCategory}</h4>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {skills.map(skill => (
                        <span key={skill} className="px-2 py-1 text-sm bg-blue-50 text-blue-700 rounded">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Trending Skills */}
      <div className="card p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Trending Skills</h2>
          <select 
            value={timeframe}
            onChange={(e) => setTimeframe(parseInt(e.target.value))}
            className="input w-32"
          >
            <option value={7}>7 days</option>
            <option value={30}>30 days</option>
            <option value={90}>90 days</option>
          </select>
        </div>

        <div className="space-y-4">
          {trendingSkills.map((skill, index) => (
            <div 
              key={skill.skill} 
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
            >
              <div className="flex items-center space-x-4">
                <span className="text-lg font-semibold text-gray-500">#{index + 1}</span>
                <div>
                  <h3 className="font-medium">{skill.skill}</h3>
                  <p className="text-sm text-gray-500">
                    {skill.categories.join(', ')}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-lg font-semibold">
                  {skill.count} projects
                </div>
                <div className="text-sm text-gray-500">
                  Score: {skill.score.toFixed(1)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SkillsOverview;