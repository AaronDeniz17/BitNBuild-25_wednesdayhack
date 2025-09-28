// Simple API test script
// Run this to test if the API endpoints are working

const { admin, db } = require('./config/firebase');

async function testDatabaseConnection() {
  try {
    console.log('Testing database connection...');
    
    // Test if we can read from the projects collection
    const projectsSnapshot = await db.collection('projects').limit(1).get();
    console.log('✅ Database connection successful');
    console.log(`Found ${projectsSnapshot.size} projects in database`);
    
    if (projectsSnapshot.size > 0) {
      const project = projectsSnapshot.docs[0];
      console.log('Sample project:', {
        id: project.id,
        title: project.data().title,
        status: project.data().status
      });
    }
    
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
  }
}

async function testProjectEndpoint() {
  try {
    console.log('\nTesting project endpoint...');
    
    // Get a project ID
    const projectsSnapshot = await db.collection('projects').limit(1).get();
    
    if (projectsSnapshot.size === 0) {
      console.log('❌ No projects found in database');
      return;
    }
    
    const projectId = projectsSnapshot.docs[0].id;
    console.log('Testing with project ID:', projectId);
    
    // Test the project endpoint logic
    const projectDoc = await db.collection('projects').doc(projectId).get();
    
    if (!projectDoc.exists) {
      console.log('❌ Project not found');
      return;
    }
    
    const projectData = projectDoc.data();
    console.log('✅ Project found:', projectData.title);
    
    // Test client lookup
    if (projectData.client_id) {
      const clientDoc = await db.collection('users').doc(projectData.client_id).get();
      if (clientDoc.exists) {
        console.log('✅ Client found:', clientDoc.data().name);
      } else {
        console.log('⚠️ Client not found for project');
      }
    }
    
  } catch (error) {
    console.error('❌ Project endpoint test failed:', error.message);
  }
}

async function runTests() {
  console.log('🧪 Running API tests...\n');
  
  await testDatabaseConnection();
  await testProjectEndpoint();
  
  console.log('\n✅ Tests completed');
}

// Run tests if called directly
if (require.main === module) {
  runTests()
    .then(() => {
      console.log('Test script completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Test script failed:', error);
      process.exit(1);
    });
}

module.exports = { runTests };
