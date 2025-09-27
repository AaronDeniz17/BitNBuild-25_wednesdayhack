// Skill taxonomy and categorization system

// Main skill categories with their corresponding micro-skills
const SKILL_CATEGORIES = {
  'Web Development': {
    name: 'Web Development',
    weight: 1.0,
    skills: {
      'Frontend': ['React', 'Vue.js', 'Angular', 'HTML/CSS', 'JavaScript', 'TypeScript', 'UI/UX'],
      'Backend': ['Node.js', 'Express.js', 'Django', 'Flask', 'PHP', 'Laravel', 'Spring Boot'],
      'Database': ['MySQL', 'PostgreSQL', 'MongoDB', 'Redis', 'Firebase'],
      'DevOps': ['Docker', 'Kubernetes', 'CI/CD', 'AWS', 'Azure']
    }
  },
  'Mobile Development': {
    name: 'Mobile Development',
    weight: 1.0,
    skills: {
      'Native': ['iOS', 'Android', 'Swift', 'Kotlin'],
      'Cross-Platform': ['React Native', 'Flutter', 'Ionic'],
      'Mobile Design': ['Mobile UI/UX', 'App Architecture']
    }
  },
  'Data Science': {
    name: 'Data Science',
    weight: 1.2, // Higher weight due to specialized nature
    skills: {
      'Machine Learning': ['TensorFlow', 'PyTorch', 'Scikit-learn'],
      'Data Analysis': ['Python', 'R', 'Pandas', 'NumPy'],
      'Big Data': ['Hadoop', 'Spark', 'Data Warehousing'],
      'Visualization': ['Tableau', 'Power BI', 'D3.js']
    }
  },
  'Design': {
    name: 'Design',
    weight: 0.9,
    skills: {
      'UI Design': ['Figma', 'Adobe XD', 'Sketch'],
      'Graphic Design': ['Photoshop', 'Illustrator', 'InDesign'],
      'Motion Design': ['After Effects', 'Animation', 'Video Editing'],
      'UX Design': ['User Research', 'Wireframing', 'Prototyping']
    }
  },
  'Project Management': {
    name: 'Project Management',
    weight: 0.8,
    skills: {
      'Methodologies': ['Agile', 'Scrum', 'Kanban'],
      'Tools': ['Jira', 'Trello', 'Asana'],
      'Documentation': ['Technical Writing', 'Requirements Gathering']
    }
  }
};

// Helper function to get all micro-skills from a category
const getMicroSkills = (category) => {
  const categoryData = SKILL_CATEGORIES[category];
  if (!categoryData) return [];
  
  return Object.values(categoryData.skills)
    .flat()
    .filter((skill, index, self) => self.indexOf(skill) === index);
};

// Get all micro-skills across all categories
const getAllMicroSkills = () => {
  return Object.values(SKILL_CATEGORIES)
    .map(category => Object.values(category.skills).flat())
    .flat()
    .filter((skill, index, self) => self.indexOf(skill) === index);
};

// Find categories for a given micro-skill
const findSkillCategories = (microSkill) => {
  return Object.entries(SKILL_CATEGORIES)
    .filter(([_, categoryData]) => 
      Object.values(categoryData.skills)
        .flat()
        .includes(microSkill)
    )
    .map(([categoryName]) => categoryName);
};

// Calculate skill weight based on category and specialization
const calculateSkillWeight = (skill) => {
  const categories = findSkillCategories(skill);
  if (categories.length === 0) return 1.0;
  
  return categories
    .map(category => SKILL_CATEGORIES[category].weight)
    .reduce((acc, weight) => acc * weight, 1.0);
};

module.exports = {
  SKILL_CATEGORIES,
  getMicroSkills,
  getAllMicroSkills,
  findSkillCategories,
  calculateSkillWeight
};