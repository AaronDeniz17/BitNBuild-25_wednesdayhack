// Skill categorization and analysis for GigCampus
const { admin } = require('../config/firebase');

// Skill categories with their micro-skills
const skillCategories = {
  'web-development': {
    name: 'Web Development',
    skills: ['React', 'Angular', 'Vue.js', 'Node.js', 'Express', 'Django', 'Laravel'],
    microSkills: {
      frontend: ['UI/UX', 'Responsive Design', 'State Management', 'Performance Optimization'],
      backend: ['API Design', 'Database Design', 'Authentication', 'Caching'],
      devops: ['CI/CD', 'Docker', 'AWS', 'Monitoring']
    }
  },
  'mobile-development': {
    name: 'Mobile Development',
    skills: ['React Native', 'Flutter', 'iOS', 'Android', 'Kotlin', 'Swift'],
    microSkills: {
      crossPlatform: ['State Management', 'Native Modules', 'Performance'],
      native: ['UI Design', 'Local Storage', 'Push Notifications'],
      deployment: ['App Store', 'Play Store', 'Beta Testing']
    }
  },
  'data-science': {
    name: 'Data Science',
    skills: ['Python', 'R', 'TensorFlow', 'PyTorch', 'SQL', 'Power BI'],
    microSkills: {
      analysis: ['Data Cleaning', 'Statistical Analysis', 'Visualization'],
      ml: ['Machine Learning', 'Deep Learning', 'NLP'],
      bigData: ['Hadoop', 'Spark', 'Data Pipeline']
    }
  },
  'design': {
    name: 'Design',
    skills: ['Figma', 'Adobe XD', 'Photoshop', 'Illustrator'],
    microSkills: {
      ui: ['Layout Design', 'Color Theory', 'Typography'],
      ux: ['User Research', 'Wireframing', 'Prototyping'],
      graphics: ['Logo Design', 'Brand Identity', 'Illustration']
    }
  }
};

/**
 * Categorize a student's skills into main categories and micro-skills
 */
const categorizeStudentSkills = async (studentId) => {
  try {
    const studentDoc = await admin.firestore()
      .collection('student_profiles')
      .doc(studentId)
      .get();

    if (!studentDoc.exists) {
      throw new Error('Student profile not found');
    }

    const studentData = studentDoc.data();
    const { skills = [], micro_skills = [] } = studentData;

    // Analyze and categorize skills
    const categorized = {};
    Object.entries(skillCategories).forEach(([key, category]) => {
      const matchedMainSkills = skills.filter(skill =>
        category.skills.some(catSkill =>
          catSkill.toLowerCase().includes(skill.toLowerCase()) ||
          skill.toLowerCase().includes(catSkill.toLowerCase())
        )
      );

      const matchedMicroSkills = {};
      Object.entries(category.microSkills).forEach(([microKey, microSkillList]) => {
        matchedMicroSkills[microKey] = micro_skills.filter(skill =>
          microSkillList.some(microSkill =>
            microSkill.toLowerCase().includes(skill.toLowerCase()) ||
            skill.toLowerCase().includes(microSkill.toLowerCase())
          )
        );
      });

      if (matchedMainSkills.length > 0 || Object.values(matchedMicroSkills).some(arr => arr.length > 0)) {
        categorized[key] = {
          mainSkills: matchedMainSkills,
          microSkills: matchedMicroSkills,
          strength: calculateCategoryStrength(matchedMainSkills, matchedMicroSkills, category)
        };
      }
    });

    return categorized;
  } catch (error) {
    console.error('Error categorizing skills:', error);
    throw error;
  }
};

/**
 * Calculate strength score for a skill category
 */
const calculateCategoryStrength = (mainSkills, microSkills, category) => {
  const mainSkillsWeight = 0.6;
  const microSkillsWeight = 0.4;

  const mainSkillsScore = (mainSkills.length / category.skills.length) * mainSkillsWeight;
  
  const microSkillsTotal = Object.values(category.microSkills).flat().length;
  const microSkillsMatched = Object.values(microSkills).flat().length;
  const microSkillsScore = (microSkillsMatched / microSkillsTotal) * microSkillsWeight;

  return Math.round((mainSkillsScore + microSkillsScore) * 100);
};

/**
 * Get trending skills in the university marketplace
 */
const getTrendingSkills = async (universityId, timeframe = 30) => {
  try {
    const projectsSnapshot = await admin.firestore()
      .collection('projects')
      .where('created_at', '>=', admin.firestore.Timestamp.fromDate(
        new Date(Date.now() - timeframe * 24 * 60 * 60 * 1000)
      ))
      .get();

    // Count skill occurrences
    const skillCounts = {};
    const totalProjects = projectsSnapshot.size;

    projectsSnapshot.forEach(doc => {
      const project = doc.data();
      project.required_skills?.forEach(skill => {
        skillCounts[skill] = (skillCounts[skill] || 0) + 1;
      });
    });

    // Calculate trend scores
    const trends = Object.entries(skillCounts).map(([skill, count]) => ({
      skill,
      count,
      demandScore: (count / totalProjects) * 100,
      category: findSkillCategory(skill)
    }));

    // Sort by demand score
    return trends.sort((a, b) => b.demandScore - a.demandScore);
  } catch (error) {
    console.error('Error getting trending skills:', error);
    throw error;
  }
};

/**
 * Find which category a skill belongs to
 */
const findSkillCategory = (skill) => {
  for (const [key, category] of Object.entries(skillCategories)) {
    if (category.skills.some(s => 
      s.toLowerCase().includes(skill.toLowerCase()) ||
      skill.toLowerCase().includes(s.toLowerCase())
    )) {
      return key;
    }
  }
  return 'other';
};

/**
 * Find which category a skill belongs to
 */
const findSkillCategory = (skill) => {
  const normalizedSkill = skill.toLowerCase();
  
  for (const [category, data] of Object.entries(skillCategories)) {
    // Check main skills
    if (data.skills.some(s => s.toLowerCase().includes(normalizedSkill) || 
        normalizedSkill.includes(s.toLowerCase()))) {
      return category;
    }
    
    // Check micro-skills
    for (const microCategory of Object.values(data.microSkills)) {
      if (microCategory.some(s => s.toLowerCase().includes(normalizedSkill) || 
          normalizedSkill.includes(s.toLowerCase()))) {
        return category;
      }
    }
  }
  
  return 'other';
};

/**
 * Get trending skills based on recent project postings and completions
 */
const getTrendingSkills = async (category = null, days = 30) => {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    // Get recent projects
    const projectsSnapshot = await admin.firestore()
      .collection('projects')
      .where('createdAt', '>=', cutoffDate)
      .get();
      
    // Count skill occurrences
    const skillCounts = {};
    projectsSnapshot.forEach(doc => {
      const project = doc.data();
      const skills = project.requiredSkills || [];
      
      skills.forEach(skill => {
        const skillCategory = findSkillCategory(skill);
        if (!category || skillCategory === category) {
          skillCounts[skill] = (skillCounts[skill] || 0) + 1;
        }
      });
    });
    
    // Sort by count and get top skills
    const trending = Object.entries(skillCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([skill, count]) => ({
        skill,
        count,
        category: findSkillCategory(skill),
        categoryName: skillCategories[findSkillCategory(skill)]?.name || 'Other'
      }));
      
    return trending;
  } catch (error) {
    console.error('Error getting trending skills:', error);
    throw error;
  }
};

module.exports = {
  skillCategories,
  findSkillCategory,
  categorizeStudentSkills,
  getTrendingSkills
  skillCategories,
  categorizeStudentSkills,
  getTrendingSkills,
  findSkillCategory
};