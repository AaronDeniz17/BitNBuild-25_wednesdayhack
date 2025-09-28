// Database migration script
// Sets up Firestore collections and indexes for the application

const { admin, db } = require('../config/firebase');

const collections = {
  users: {
    indexes: [
      { fields: ['role', 'created_at'] },
      { fields: ['university_verified', 'created_at'] },
      { fields: ['skills', 'created_at'] }
    ]
  },
  projects: {
    indexes: [
      { fields: ['status', 'created_at'] },
      { fields: ['client_id', 'created_at'] },
      { fields: ['required_skills', 'created_at'] },
      { fields: ['project_type', 'status'] },
      { fields: ['category', 'status'] },
      { fields: ['budget_min', 'budget_max'] }
    ]
  },
  bids: {
    indexes: [
      { fields: ['project_id', 'status'] },
      { fields: ['proposer_id', 'proposer_type'] },
      { fields: ['status', 'created_at'] }
    ]
  },
  contracts: {
    indexes: [
      { fields: ['project_id', 'status'] },
      { fields: ['freelancer_id', 'status'] },
      { fields: ['team_id', 'status'] },
      { fields: ['client_id', 'status'] }
    ]
  },
  milestones: {
    indexes: [
      { fields: ['project_id', 'status'] },
      { fields: ['status', 'due_date'] }
    ]
  },
  teams: {
    indexes: [
      { fields: ['leader_id', 'created_at'] },
      { fields: ['member_ids', 'created_at'] },
      { fields: ['skills', 'created_at'] },
      { fields: ['is_active', 'created_at'] }
    ]
  },
  team_members: {
    indexes: [
      { fields: ['team_id', 'user_id'] },
      { fields: ['user_id', 'is_active'] },
      { fields: ['team_id', 'role'] }
    ]
  },
  transactions: {
    indexes: [
      { fields: ['project_id', 'created_at'] },
      { fields: ['from_id', 'to_id'] },
      { fields: ['type', 'status'] },
      { fields: ['status', 'created_at'] }
    ]
  },
  disputes: {
    indexes: [
      { fields: ['project_id', 'status'] },
      { fields: ['raised_by_id', 'status'] },
      { fields: ['status', 'created_at'] }
    ]
  },
  chat_rooms: {
    indexes: [
      { fields: ['project_id', 'created_at'] }
    ]
  },
  chat_messages: {
    indexes: [
      { fields: ['room_id', 'created_at'] },
      { fields: ['sender_id', 'created_at'] },
      { fields: ['project_id', 'created_at'] }
    ]
  },
  notifications: {
    indexes: [
      { fields: ['user_id', 'read'] },
      { fields: ['user_id', 'created_at'] },
      { fields: ['type', 'created_at'] }
    ]
  }
};

async function createCollection(collectionName, config) {
  try {
    console.log(`Creating collection: ${collectionName}`);
    
    // Create a dummy document to ensure the collection exists
    const docRef = db.collection(collectionName).doc('_migration');
    await docRef.set({
      created_at: admin.firestore.FieldValue.serverTimestamp(),
      migration: true
    });

    // Create indexes if specified
    if (config.indexes) {
      for (const index of config.indexes) {
        try {
          console.log(`Creating index for ${collectionName}: ${index.fields.join(', ')}`);
          // Note: Firestore composite indexes need to be created via Firebase Console
          // This is just a placeholder for the migration log
        } catch (error) {
          console.warn(`Failed to create index for ${collectionName}:`, error.message);
        }
      }
    }

    console.log(`✅ Collection ${collectionName} created successfully`);
  } catch (error) {
    console.error(`❌ Failed to create collection ${collectionName}:`, error.message);
  }
}

async function createIndexes() {
  console.log('📋 Creating Firestore indexes...');
  console.log('Note: Composite indexes need to be created manually via Firebase Console');
  console.log('Required indexes:');
  
  for (const [collectionName, config] of Object.entries(collections)) {
    if (config.indexes) {
      console.log(`\n${collectionName}:`);
      config.indexes.forEach(index => {
        console.log(`  - ${index.fields.join(', ')}`);
      });
    }
  }
}

async function seedInitialData() {
  console.log('🌱 Seeding initial data...');
  
  try {
    // Create admin user
    const adminUser = {
      id: 'admin-user',
      email: 'admin@bitnbuild.com',
      name: 'Admin User',
      role: 'admin',
      university_verified: true,
      university: 'System',
      wallet_balance: 0,
      escrow_balance: 0,
      skills: ['administration', 'management'],
      created_at: admin.firestore.FieldValue.serverTimestamp(),
      updated_at: admin.firestore.FieldValue.serverTimestamp(),
      is_active: true
    };

    await db.collection('users').doc('admin-user').set(adminUser);
    console.log('✅ Admin user created');

    // Create sample skills
    const skills = [
      'React', 'Node.js', 'Python', 'JavaScript', 'TypeScript',
      'HTML', 'CSS', 'MongoDB', 'PostgreSQL', 'Firebase',
      'AWS', 'Docker', 'Git', 'Figma', 'Photoshop',
      'Content Writing', 'SEO', 'Marketing', 'Data Analysis',
      'Machine Learning', 'AI', 'Blockchain', 'Web3'
    ];

    await db.collection('skills').doc('available-skills').set({
      skills: skills,
      updated_at: admin.firestore.FieldValue.serverTimestamp()
    });
    console.log('✅ Skills seeded');

    // Create sample categories
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
      'testing'
    ];

    await db.collection('categories').doc('available-categories').set({
      categories: categories,
      updated_at: admin.firestore.FieldValue.serverTimestamp()
    });
    console.log('✅ Categories seeded');

  } catch (error) {
    console.error('❌ Failed to seed initial data:', error.message);
  }
}

async function runMigration() {
  console.log('🚀 Starting database migration...');
  
  try {
    // Create all collections
    for (const [collectionName, config] of Object.entries(collections)) {
      await createCollection(collectionName, config);
    }

    // Create indexes documentation
    await createIndexes();

    // Seed initial data
    await seedInitialData();

    console.log('\n✅ Migration completed successfully!');
    console.log('\n📝 Next steps:');
    console.log('1. Create composite indexes in Firebase Console');
    console.log('2. Set up Firebase Authentication rules');
    console.log('3. Configure Firestore security rules');
    console.log('4. Test the application');

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  }
}

// Run migration if called directly
if (require.main === module) {
  runMigration()
    .then(() => {
      console.log('Migration completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration failed:', error);
      process.exit(1);
    });
}

module.exports = {
  runMigration,
  createCollection,
  createIndexes,
  seedInitialData
};
