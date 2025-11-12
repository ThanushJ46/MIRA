// Test script for Agentic AI with Memory
const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';
let authToken = '';
let userId = '';
let journalIds = [];

// Test user credentials
const testUser = {
  email: 'john@exampl.com',
  password: 'john12345',
  name: 'john'
};

// Helper function to delay
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Register or login
async function authenticate() {
  try {
    console.log('\n🔐 Authenticating test user...');
    
    // Try to login first
    try {
      const loginRes = await axios.post(`${BASE_URL}/auth/login`, {
        email: testUser.email,
        password: testUser.password
      });
      authToken = loginRes.data.data.token;
      userId = loginRes.data.data.userId;
      console.log('✅ Logged in successfully');
    } catch (loginError) {
      // If login fails, register
      console.log('📝 User not found, registering...');
      const registerRes = await axios.post(`${BASE_URL}/auth/signup`, testUser);
      authToken = registerRes.data.data.token;
      userId = registerRes.data.data.userId;
      console.log('✅ Registered successfully');
    }
    
    console.log(`   User ID: ${userId}`);
    return true;
  } catch (error) {
    console.error('❌ Authentication failed:', error.response?.data || error.message);
    return false;
  }
}

// Create a journal entry
async function createJournal(content, date) {
  try {
    const response = await axios.post(
      `${BASE_URL}/journals`,
      { content, date },
      { headers: { Authorization: `Bearer ${authToken}` } }
    );
    
    const journalId = response.data.data._id;
    journalIds.push(journalId);
    console.log(`✅ Created journal: ${journalId.substring(0, 8)}...`);
    return journalId;
  } catch (error) {
    console.error('❌ Failed to create journal:', error.response?.data || error.message);
    return null;
  }
}

// Analyze a journal
async function analyzeJournal(journalId, testName) {
  try {
    console.log(`\n🤖 ${testName}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    const response = await axios.post(
      `${BASE_URL}/journals/${journalId}/analyze`,
      {},
      { headers: { Authorization: `Bearer ${authToken}` } }
    );
    
    const analysis = response.data.data;
    
    console.log('📊 ANALYSIS RESULTS:');
    console.log(`   Productive: ${analysis.productive?.length || 0} activities`);
    console.log(`   Events Detected: ${analysis.detectedEvents?.length || 0}`);
    console.log(`   Reminders Created: ${analysis.aiRemindersCreated || 0}`);
    console.log(`   Synced to Calendar: ${analysis.autoSyncedToCalendar || 0}`);
    
    if (analysis.aiAgentResponse) {
      console.log('\n💬 AI SAYS:');
      console.log(`   "${analysis.aiAgentResponse.message}"`);
      console.log(`   Approved: ${analysis.aiAgentResponse.approved}`);
      console.log(`   Rejected: ${analysis.aiAgentResponse.rejected}`);
      console.log(`   Reasoning: ${analysis.aiAgentResponse.reasoning}`);
    }
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    return analysis;
  } catch (error) {
    console.error('❌ Analysis failed:', error.response?.data || error.message);
    return null;
  }
}

// Main test suite
async function runTests() {
  console.log('\n╔════════════════════════════════════════════════╗');
  console.log('║  AGENTIC AI WITH MEMORY - INTEGRATION TESTS   ║');
  console.log('╚════════════════════════════════════════════════╝');
  
  // Authenticate
  const authenticated = await authenticate();
  if (!authenticated) {
    console.error('❌ Cannot proceed without authentication');
    process.exit(1);
  }
  
  await delay(1000);
  
  // TEST 1: First journal with events (build history)
  console.log('\n📝 TEST 1: Creating first journal with events...');
  const journal1 = await createJournal(
    `Had a great day today! Completed my machine learning assignment on time. 
    I have a dentist appointment on November 19th at 2pm. 
    Need to remember the team standup meeting tomorrow at 9:30am.
    Also, deployment is scheduled for November 15th at 7pm - need to prepare!`,
    new Date('2024-11-11')
  );
  
  if (journal1) {
    await delay(2000);
    await analyzeJournal(journal1, 'TEST 1: Initial Analysis (No History)');
  }
  
  await delay(2000);
  
  // TEST 2: Second journal with duplicate event
  console.log('\n📝 TEST 2: Creating journal with DUPLICATE event...');
  const journal2 = await createJournal(
    `Standup at 9:30 went fine today. I paired with Sarah for an hour on the auth flow.
    Need to make sure I don't forget my dentist appointment on the 19th.
    Took a proper walk at lunch which felt good. Planning to finish JWT tests before deployment.`,
    new Date('2024-11-12')
  );
  
  if (journal2) {
    await delay(2000);
    await analyzeJournal(journal2, 'TEST 2: Analysis WITH History (Should Reject Duplicate)');
  }
  
  await delay(2000);
  
  // TEST 3: Journal with no events
  console.log('\n📝 TEST 3: Creating journal with NO events...');
  const journal3 = await createJournal(
    `Spent the afternoon debugging a tricky issue with the authentication middleware.
    Finally figured out it was a timing issue with the JWT token validation.
    Feeling productive even though it took hours. Tomorrow should be smoother.`,
    new Date('2024-11-13')
  );
  
  if (journal3) {
    await delay(2000);
    await analyzeJournal(journal3, 'TEST 3: Analysis with NO Events');
  }
  
  await delay(2000);
  
  // TEST 4: Journal with new unique events
  console.log('\n📝 TEST 4: Creating journal with NEW events...');
  const journal4 = await createJournal(
    `Got invited to speak at the tech conference on December 5th at 3pm.
    Also need to submit my quarterly report by November 20th.
    Excited about both! The conference is a great opportunity.`,
    new Date('2024-11-14')
  );
  
  if (journal4) {
    await delay(2000);
    await analyzeJournal(journal4, 'TEST 4: Analysis with NEW Events (Should Create)');
  }
  
  await delay(2000);
  
  // TEST 5: Journal with past events (should be filtered)
  console.log('\n📝 TEST 5: Creating journal with PAST events...');
  const journal5 = await createJournal(
    `Reflecting on the meeting I had last week on November 5th.
    Also the workshop from October was really useful.
    Need to apply those learnings in upcoming sprint starting November 25th.`,
    new Date('2024-11-14')
  );
  
  if (journal5) {
    await delay(2000);
    await analyzeJournal(journal5, 'TEST 5: Analysis with Past Events (Should Skip Past)');
  }
  
  console.log('\n╔════════════════════════════════════════════════╗');
  console.log('║           ALL TESTS COMPLETED                  ║');
  console.log('╚════════════════════════════════════════════════╝');
  console.log(`\n📊 Created ${journalIds.length} test journals`);
  console.log('✅ Check server console for detailed AI decision logs\n');
}

// Run the tests
runTests().catch(error => {
  console.error('❌ Test suite failed:', error);
  process.exit(1);
});
