// Database seed script
// Populates the database with sample data for development and testing

const { admin, db } = require('../config/firebase');
const { v4: uuidv4 } = require('uuid');

// Sample data
const sampleUsers = [
  {
    id: 'client-1',
    email: 'client1@example.com',
    name: 'John Smith',
    role: 'client',
    university_verified: true,
    university: 'Stanford University',
    wallet_balance: 5000,
    escrow_balance: 0,
    skills: ['project management', 'business'],
    created_at: new Date('2024-01-01'),
    updated_at: new Date('2024-01-01'),
    is_active: true
  },
  {
    id: 'student-1',
    email: 'student1@example.com',
    name: 'Alice Johnson',
    role: 'student',
    university_verified: true,
    university: 'MIT',
    wallet_balance: 0,
    escrow_balance: 0,
    skills: ['React', 'Node.js', 'JavaScript', 'Python'],
    created_at: new Date('2024-01-02'),
    updated_at: new Date('2024-01-02'),
    is_active: true
  },
  {
    id: 'student-2',
    email: 'student2@example.com',
    name: 'Bob Wilson',
    role: 'student',
    university_verified: true,
    university: 'UC Berkeley',
    wallet_balance: 0,
    escrow_balance: 0,
    skills: ['Python', 'Machine Learning', 'Data Science', 'SQL'],
    created_at: new Date('2024-01-03'),
    updated_at: new Date('2024-01-03'),
    is_active: true
  },
  {
    id: 'student-3',
    email: 'student3@example.com',
    name: 'Carol Davis',
    role: 'student',
    university_verified: true,
    university: 'Harvard University',
    wallet_balance: 0,
    escrow_balance: 0,
    skills: ['Design', 'Figma', 'UI/UX', 'Photoshop'],
    created_at: new Date('2024-01-04'),
    updated_at: new Date('2024-01-04'),
    is_active: true
  }
];

const sampleProjects = [
  {
    id: 'project-1',
    client_id: 'client-1',
    title: 'E-commerce Website Development',
    description: 'Looking for a skilled developer to build a modern e-commerce website with React and Node.js. The project includes user authentication, payment integration, and admin dashboard.',
    required_skills: ['React', 'Node.js', 'JavaScript', 'MongoDB'],
    budget_min: 2000,
    budget_max: 3000,
    is_fixed_budget: false,
    deadline: new Date('2024-03-01'),
    project_type: 'individual',
    status: 'open',
    escrow_balance: 0,
    view_count: 45,
    save_count: 8,
    bid_count: 3,
    category: 'web-development',
    urgency: 'medium',
    is_featured: true,
    tags: ['urgent', 'long-term'],
    estimated_hours: 120,
    created_at: new Date('2024-01-15'),
    updated_at: new Date('2024-01-15')
  },
  {
    id: 'project-2',
    client_id: 'client-1',
    title: 'Mobile App Design',
    description: 'Need a talented designer to create a mobile app design for a fitness tracking application. The design should be modern, user-friendly, and follow current design trends.',
    required_skills: ['Design', 'Figma', 'UI/UX', 'Mobile Design'],
    budget_min: 800,
    budget_max: 1200,
    is_fixed_budget: false,
    deadline: new Date('2024-02-15'),
    project_type: 'individual',
    status: 'open',
    escrow_balance: 0,
    view_count: 32,
    save_count: 5,
    bid_count: 2,
    category: 'design',
    urgency: 'high',
    is_featured: false,
    tags: ['mobile', 'fitness'],
    estimated_hours: 40,
    created_at: new Date('2024-01-20'),
    updated_at: new Date('2024-01-20')
  },
  {
    id: 'project-3',
    client_id: 'client-1',
    title: 'Data Analysis Project',
    description: 'Seeking a data scientist to analyze customer data and provide insights. The project involves data cleaning, analysis, and visualization.',
    required_skills: ['Python', 'Data Science', 'Machine Learning', 'SQL'],
    budget_min: 1500,
    budget_max: 2000,
    is_fixed_budget: false,
    deadline: new Date('2024-02-28'),
    project_type: 'individual',
    status: 'open',
    escrow_balance: 0,
    view_count: 28,
    save_count: 3,
    bid_count: 1,
    category: 'data-science',
    urgency: 'low',
    is_featured: false,
    tags: ['analysis', 'insights'],
    estimated_hours: 80,
    created_at: new Date('2024-01-25'),
    updated_at: new Date('2024-01-25')
  }
];

const sampleTeams = [
  {
    id: 'team-1',
    name: 'Tech Titans',
    description: 'A team of experienced developers specializing in full-stack web development',
    leader_id: 'student-1',
    member_ids: ['student-1', 'student-2'],
    skills: ['React', 'Node.js', 'JavaScript', 'Python', 'MongoDB'],
    team_wallet_balance: 0,
    created_at: new Date('2024-01-10'),
    updated_at: new Date('2024-01-10'),
    is_active: true,
    portfolio_links: ['https://github.com/techtitans', 'https://techtitans.dev'],
    reputation_score: 0,
    completed_projects: 0
  }
];

const sampleBids = [
  {
    id: 'bid-1',
    project_id: 'project-1',
    proposer_type: 'user',
    proposer_id: 'student-1',
    price: 2500,
    eta_days: 30,
    pitch: 'I have extensive experience in React and Node.js development. I\'ve built several e-commerce platforms and can deliver a high-quality solution within your timeline.',
    portfolio_url: 'https://alicejohnson.dev',
    status: 'pending',
    created_at: new Date('2024-01-16'),
    updated_at: new Date('2024-01-16'),
    skills_match: 95,
    message: 'I can start immediately and provide regular updates throughout the development process.'
  },
  {
    id: 'bid-2',
    project_id: 'project-2',
    proposer_type: 'user',
    proposer_id: 'student-3',
    price: 1000,
    eta_days: 14,
    pitch: 'I specialize in mobile app design and have created designs for several successful apps. I can create a modern, user-friendly design that will engage your users.',
    portfolio_url: 'https://caroldavis.design',
    status: 'pending',
    created_at: new Date('2024-01-21'),
    updated_at: new Date('2024-01-21'),
    skills_match: 90,
    message: 'I can provide multiple design concepts and iterate based on your feedback.'
  }
];

const sampleMilestones = [
  {
    id: 'milestone-1',
    project_id: 'project-1',
    title: 'Project Setup and Authentication',
    description: 'Set up the project structure, implement user authentication, and create basic routing',
    percentage: 25,
    due_date: new Date('2024-02-01'),
    status: 'pending',
    created_at: new Date('2024-01-15'),
    updated_at: new Date('2024-01-15')
  },
  {
    id: 'milestone-2',
    project_id: 'project-1',
    title: 'Core E-commerce Features',
    description: 'Implement product catalog, shopping cart, and basic checkout functionality',
    percentage: 50,
    due_date: new Date('2024-02-15'),
    status: 'pending',
    created_at: new Date('2024-01-15'),
    updated_at: new Date('2024-01-15')
  },
  {
    id: 'milestone-3',
    project_id: 'project-1',
    title: 'Payment Integration and Testing',
    description: 'Integrate payment gateway, implement admin dashboard, and conduct thorough testing',
    percentage: 25,
    due_date: new Date('2024-03-01'),
    status: 'pending',
    created_at: new Date('2024-01-15'),
    updated_at: new Date('2024-01-15')
  }
];

async function seedUsers() {
  console.log('👥 Seeding users...');
  
  for (const user of sampleUsers) {
    try {
      await db.collection('users').doc(user.id).set(user);
      console.log(`✅ User created: ${user.name}`);
    } catch (error) {
      console.error(`❌ Failed to create user ${user.name}:`, error.message);
    }
  }
}

async function seedProjects() {
  console.log('📋 Seeding projects...');
  
  for (const project of sampleProjects) {
    try {
      await db.collection('projects').doc(project.id).set(project);
      console.log(`✅ Project created: ${project.title}`);
    } catch (error) {
      console.error(`❌ Failed to create project ${project.title}:`, error.message);
    }
  }
}

async function seedTeams() {
  console.log('👥 Seeding teams...');
  
  for (const team of sampleTeams) {
    try {
      await db.collection('teams').doc(team.id).set(team);
      console.log(`✅ Team created: ${team.name}`);
    } catch (error) {
      console.error(`❌ Failed to create team ${team.name}:`, error.message);
    }
  }

  // Create team members
  for (const team of sampleTeams) {
    for (const memberId of team.member_ids) {
      try {
        const teamMember = {
          id: uuidv4(),
          team_id: team.id,
          user_id: memberId,
          role: memberId === team.leader_id ? 'lead' : 'member',
          joined_at: new Date('2024-01-10'),
          is_active: true
        };
        
        await db.collection('team_members').doc(teamMember.id).set(teamMember);
        console.log(`✅ Team member added: ${memberId}`);
      } catch (error) {
        console.error(`❌ Failed to add team member ${memberId}:`, error.message);
      }
    }
  }
}

async function seedBids() {
  console.log('💰 Seeding bids...');
  
  for (const bid of sampleBids) {
    try {
      await db.collection('bids').doc(bid.id).set(bid);
      console.log(`✅ Bid created: ${bid.id}`);
    } catch (error) {
      console.error(`❌ Failed to create bid ${bid.id}:`, error.message);
    }
  }
}

async function seedMilestones() {
  console.log('🎯 Seeding milestones...');
  
  for (const milestone of sampleMilestones) {
    try {
      await db.collection('milestones').doc(milestone.id).set(milestone);
      console.log(`✅ Milestone created: ${milestone.title}`);
    } catch (error) {
      console.error(`❌ Failed to create milestone ${milestone.title}:`, error.message);
    }
  }
}

async function seedSkills() {
  console.log('🎯 Seeding skills...');
  
  const skills = [
    'React', 'Node.js', 'Python', 'JavaScript', 'TypeScript',
    'HTML', 'CSS', 'MongoDB', 'PostgreSQL', 'Firebase',
    'AWS', 'Docker', 'Git', 'Figma', 'Photoshop',
    'Content Writing', 'SEO', 'Marketing', 'Data Analysis',
    'Machine Learning', 'AI', 'Blockchain', 'Web3',
    'Vue.js', 'Angular', 'Express', 'Django', 'Flask',
    'React Native', 'Flutter', 'Swift', 'Kotlin',
    'UI/UX Design', 'Graphic Design', 'Video Editing',
    'Project Management', 'Business Analysis'
  ];

  try {
    await db.collection('skills').doc('available-skills').set({
      skills: skills,
      updated_at: admin.firestore.FieldValue.serverTimestamp()
    });
    console.log('✅ Skills seeded');
  } catch (error) {
    console.error('❌ Failed to seed skills:', error.message);
  }
}

async function seedCategories() {
  console.log('📂 Seeding categories...');
  
  const categories = [
    'web-development',
    'mobile-development',
    'design',
    'writing',
    'marketing',
    'data-science',
    'blockchain',
    'ai-ml',
    'devops',
    'testing',
    'consulting',
    'translation'
  ];

  try {
    await db.collection('categories').doc('available-categories').set({
      categories: categories,
      updated_at: admin.firestore.FieldValue.serverTimestamp()
    });
    console.log('✅ Categories seeded');
  } catch (error) {
    console.error('❌ Failed to seed categories:', error.message);
  }
}

async function runSeed() {
  console.log('🌱 Starting database seeding...');
  
  try {
    await seedUsers();
    await seedProjects();
    await seedTeams();
    await seedBids();
    await seedMilestones();
    await seedSkills();
    await seedCategories();

    console.log('\n✅ Seeding completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`- ${sampleUsers.length} users created`);
    console.log(`- ${sampleProjects.length} projects created`);
    console.log(`- ${sampleTeams.length} teams created`);
    console.log(`- ${sampleBids.length} bids created`);
    console.log(`- ${sampleMilestones.length} milestones created`);
    console.log('\n🎉 You can now test the application with sample data!');

  } catch (error) {
    console.error('❌ Seeding failed:', error.message);
    process.exit(1);
  }
}

// Run seed if called directly
if (require.main === module) {
  runSeed()
    .then(() => {
      console.log('Seeding completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Seeding failed:', error);
      process.exit(1);
    });
}

module.exports = {
  runSeed,
  seedUsers,
  seedProjects,
  seedTeams,
  seedBids,
  seedMilestones,
  seedSkills,
  seedCategories
};
