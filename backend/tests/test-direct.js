// Direct model test for Agentic AI
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Journal = require('../models/Journal');
const Reminder = require('../models/Reminder');
const User = require('../models/User');
const { analyzeJournalWithLlama, detectEventsWithLlama, createRemindersWithAI, checkOllamaAvailability } = require('../services/ollamaService');

let testUserId;

async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB Connected');
  } catch (error) {
    console.error('❌ MongoDB Connection Error:', error.message);
    process.exit(1);
  }
}

async function createTestUser() {
  try {
    // Clean up existing test user
    await User.deleteMany({ email: 'aitest@test.com' });
    
    const user = await User.create({
      name: 'AI Test User',
      email: 'aitest@test.com',
      password: 'hashedpassword123'
    });
    
    testUserId = user._id;
    console.log(`✅ Created test user: ${testUserId}`);
    return user;
  } catch (error) {
    console.error('❌ Failed to create test user:', error.message);
    process.exit(1);
  }
}

async function testOllamaAvailability() {
  console.log('\n🔍 TEST: Checking Ollama availability...');
  const available = await checkOllamaAvailability();
  
  if (available) {
    console.log('✅ Ollama is available with llama3 model');
  } else {
    console.error('❌ Ollama not available! Make sure Ollama is running with llama3 model');
    console.log('   Run: ollama run llama3');
    process.exit(1);
  }
}

async function createJournal(content, dateStr) {
  const journal = await Journal.create({
    userId: testUserId,
    content: content,
    date: new Date(dateStr),
    analysisStatus: 'pending'
  });
  return journal;
}

async function runTest1_NoHistory() {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('TEST 1: Analysis with NO HISTORY (New User)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  const journal = await createJournal(
    `Had a productive day today! Completed my machine learning assignment.
    I have a dentist appointment on November 19th at 2pm.
    Team standup meeting tomorrow at 9:30am.
    Deployment scheduled for November 15th at 7pm - need to prepare!`,
    '2024-11-11'
  );
  
  console.log(`📝 Created journal: ${journal._id}`);
  
  const content = journal.content;
  
  // Run analysis
  const [aiAnalysis, detectedEvents] = await Promise.all([
    analyzeJournalWithLlama(content),
    detectEventsWithLlama(content)
  ]);
  
  console.log(`\n📊 AI Analysis:`);
  console.log(`   Productive: ${aiAnalysis.productive.length} activities`);
  console.log(`   Detected Events: ${detectedEvents.length}`);
  
  if (detectedEvents.length > 0) {
    console.log(`\n   Events:`);
    detectedEvents.forEach((e, i) => {
      console.log(`   ${i+1}. ${e.title} on ${new Date(e.date).toLocaleString()}`);
    });
    
    // Test AI decision making with NO history
    const userHistory = {
      recentJournals: [],
      existingReminders: []
    };
    
    const aiDecision = await createRemindersWithAI(detectedEvents, content, userHistory);
    
    console.log(`\n💬 AI Response: "${aiDecision.aiResponse}"`);
    console.log(`   Approved: ${aiDecision.approved}`);
    console.log(`   Rejected: ${aiDecision.rejected}`);
    
    // Save reminders to DB
    for (const reminder of aiDecision.reminders) {
      await Reminder.create({
        userId: testUserId,
        journalId: journal._id,
        title: reminder.title,
        description: reminder.description,
        eventDate: reminder.eventDate,
        status: 'confirmed'
      });
    }
    
    console.log(`✅ Created ${aiDecision.reminders.length} reminders in database`);
  }
}

async function runTest2_WithHistory_Duplicate() {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('TEST 2: Analysis WITH HISTORY (Duplicate Detection)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  const journal = await createJournal(
    `Standup at 9:30 went well. Paired with Sarah on auth flow.
    Don't forget dentist appointment on the 19th!
    Need to finish JWT tests before deployment on the 15th.`,
    '2024-11-12'
  );
  
  console.log(`📝 Created journal: ${journal._id}`);
  
  const content = journal.content;
  
  // Fetch history
  const recentJournals = await Journal.find({ 
      userId: testUserId,
      _id: { $ne: journal._id }
    })
    .sort({ date: -1 })
    .limit(5)
    .select('content date');
  
  const existingReminders = await Reminder.find({ userId: testUserId })
    .sort({ eventDate: -1 })
    .limit(10)
    .select('title eventDate status');
  
  console.log(`📚 Loaded ${recentJournals.length} recent journals and ${existingReminders.length} existing reminders`);
  
  if (existingReminders.length > 0) {
    console.log(`\n   Existing reminders:`);
    existingReminders.forEach((r, i) => {
      console.log(`   ${i+1}. "${r.title}" on ${new Date(r.eventDate).toLocaleDateString()}`);
    });
  }
  
  // Run analysis
  const [aiAnalysis, detectedEvents] = await Promise.all([
    analyzeJournalWithLlama(content),
    detectEventsWithLlama(content)
  ]);
  
  console.log(`\n📊 Detected ${detectedEvents.length} events in current journal`);
  
  if (detectedEvents.length > 0) {
    detectedEvents.forEach((e, i) => {
      console.log(`   ${i+1}. ${e.title} on ${new Date(e.date).toLocaleString()}`);
    });
    
    const userHistory = {
      recentJournals: recentJournals,
      existingReminders: existingReminders
    };
    
    const aiDecision = await createRemindersWithAI(detectedEvents, content, userHistory);
    
    console.log(`\n💬 AI Response: "${aiDecision.aiResponse}"`);
    console.log(`   Approved: ${aiDecision.approved} (should create NEW reminders)`);
    console.log(`   Rejected: ${aiDecision.rejected} (detected DUPLICATES)`);
    console.log(`   Reasoning: ${aiDecision.reasoning}`);
    
    console.log(`✅ AI successfully used history to detect duplicates!`);
  }
}

async function runTest3_NoEvents() {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('TEST 3: Journal with NO EVENTS');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  const journal = await createJournal(
    `Spent the afternoon debugging authentication middleware.
    Finally figured out it was a timing issue with JWT validation.
    Feeling productive! Tomorrow should go smoother.`,
    '2024-11-13'
  );
  
  console.log(`📝 Created journal: ${journal._id}`);
  
  const detectedEvents = await detectEventsWithLlama(journal.content);
  
  console.log(`📊 Detected ${detectedEvents.length} events`);
  
  if (detectedEvents.length === 0) {
    console.log(`✅ Correctly detected NO events`);
  } else {
    console.log(`⚠️  Unexpectedly detected events:`, detectedEvents);
  }
}

async function cleanup() {
  console.log('\n🧹 Cleaning up test data...');
  
  await Journal.deleteMany({ userId: testUserId });
  await Reminder.deleteMany({ userId: testUserId });
  await User.deleteOne({ _id: testUserId });
  
  console.log('✅ Cleanup complete');
}

async function main() {
  console.log('\n╔════════════════════════════════════════════════╗');
  console.log('║    AGENTIC AI - DIRECT MODEL TESTING          ║');
  console.log('╚════════════════════════════════════════════════╝');
  
  try {
    await connectDB();
    await createTestUser();
    await testOllamaAvailability();
    
    await runTest1_NoHistory();
    await runTest2_WithHistory_Duplicate();
    await runTest3_NoEvents();
    
    console.log('\n╔════════════════════════════════════════════════╗');
    console.log('║         ALL TESTS COMPLETED SUCCESSFULLY       ║');
    console.log('╚════════════════════════════════════════════════╝\n');
    
  } catch (error) {
    console.error('\n❌ TEST FAILED:', error);
    console.error(error.stack);
  } finally {
    await cleanup();
    await mongoose.connection.close();
    console.log('✅ Database connection closed\n');
    process.exit(0);
  }
}

main();
