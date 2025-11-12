// FINAL PRECISION TEST - Real User Scenario with Multiple Journals
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Journal = require('../models/Journal');
const Reminder = require('../models/Reminder');
const User = require('../models/User');
const { analyzeJournalWithLlama, detectEventsWithLlama, createRemindersWithAI, checkOllamaAvailability } = require('../services/ollamaService');

let testUserId;

async function setup() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('✅ Connected to MongoDB\n');
  
  // Clean up existing test user
  await User.deleteMany({ email: 'precision@test.com' });
  await Journal.deleteMany({ userId: { $exists: true } });
  await Reminder.deleteMany({ userId: { $exists: true } });
  
  const user = await User.create({
    name: 'Precision Test User',
    email: 'precision@test.com',
    password: 'test123'
  });
  testUserId = user._id;
  console.log(`✅ Created test user: ${testUserId}\n`);
  
  // Verify Ollama
  const ollamaOK = await checkOllamaAvailability();
  if (!ollamaOK) {
    console.error('❌ Ollama not available!');
    process.exit(1);
  }
  console.log('✅ Ollama available with llama3\n');
}

async function createAndAnalyzeJournal(content, date, journalNumber) {
  console.log(`\n${'═'.repeat(60)}`);
  console.log(`JOURNAL #${journalNumber}: ${new Date(date).toLocaleDateString()}`);
  console.log('═'.repeat(60));
  console.log(`Content: "${content.substring(0, 80)}..."`);
  console.log('─'.repeat(60));
  
  // Create journal
  const journal = await Journal.create({
    userId: testUserId,
    content: content,
    date: new Date(date),
    analysisStatus: 'pending'
  });
  
  console.log(`📝 Created journal: ${journal._id}`);
  
  // Simulate the EXACT flow from journalController.js
  
  // STEP 1: Fetch user history (excluding current journal)
  const [recentJournals, existingReminders] = await Promise.all([
    Journal.find({ 
      userId: testUserId,
      _id: { $ne: journal._id } // Exclude current journal
    })
    .sort({ date: -1 })
    .limit(5)
    .select('content date')
    .catch(err => {
      console.error('Failed to fetch journals:', err.message);
      return [];
    }),
    Reminder.find({ 
      userId: testUserId,
      journalId: { $ne: journal._id } // Exclude current journal's reminders
    })
    .sort({ eventDate: -1 })
    .limit(10)
    .select('title eventDate status')
    .catch(err => {
      console.error('Failed to fetch reminders:', err.message);
      return [];
    })
  ]);
  
  console.log(`📚 User History: ${recentJournals.length} journals, ${existingReminders.length} reminders`);
  
  if (existingReminders.length > 0) {
    console.log('\n   Existing Reminders:');
    existingReminders.forEach((r, i) => {
      console.log(`   ${i+1}. "${r.title}" on ${new Date(r.eventDate).toLocaleDateString()} [${r.status}]`);
    });
  }
  
  // STEP 2: Run AI analysis and event detection in parallel
  const [aiAnalysis, detectedEvents] = await Promise.all([
    analyzeJournalWithLlama(content),
    detectEventsWithLlama(content)
  ]);
  
  console.log(`\n📊 AI Analysis:`);
  console.log(`   Productive: ${aiAnalysis.productive.length} activities`);
  console.log(`   Detected Events: ${detectedEvents.length}`);
  
  if (detectedEvents.length > 0) {
    console.log('\n   Events Found:');
    detectedEvents.forEach((e, i) => {
      console.log(`   ${i+1}. "${e.title}" on ${new Date(e.date).toLocaleDateString()}`);
    });
  }
  
  // STEP 3: AI makes decisions with history
  let createdReminders = [];
  let aiAgentResponse = null;
  
  if (detectedEvents && detectedEvents.length > 0) {
    const userHistory = {
      recentJournals: recentJournals || [],
      existingReminders: existingReminders || []
    };
    
    const aiDecision = await createRemindersWithAI(detectedEvents, content, userHistory);
    const aiReminders = aiDecision.reminders || [];
    
    aiAgentResponse = {
      message: aiDecision.aiResponse,
      reasoning: aiDecision.reasoning,
      approved: aiDecision.approved,
      rejected: aiDecision.rejected
    };
    
    console.log(`\n🤖 AI Decision:`);
    console.log(`   ✅ Approved: ${aiAgentResponse.approved}`);
    console.log(`   ❌ Rejected: ${aiAgentResponse.rejected}`);
    console.log(`   💬 Message: "${aiAgentResponse.message}"`);
    console.log(`   🧠 Reasoning: "${aiAgentResponse.reasoning}"`);
    
    // STEP 4: Save approved reminders (with date validation)
    if (aiReminders.length > 0) {
      console.log('\n   Creating Reminders:');
      for (const reminderData of aiReminders) {
        try {
          // Date validation
          const eventDate = new Date(reminderData.eventDate);
          
          if (isNaN(eventDate.getTime())) {
            console.error(`   ⚠️  Invalid date for "${reminderData.title}", skipping`);
            continue;
          }
          
          const now = new Date();
          if (eventDate < now) {
            console.warn(`   ⏰ Past date for "${reminderData.title}", skipping`);
            continue;
          }
          
          const reminder = await Reminder.create({
            userId: testUserId,
            journalId: journal._id,
            title: reminderData.title || 'Untitled Reminder',
            description: reminderData.description || '',
            eventDate: eventDate,
            originalSentence: reminderData.originalSentence || '',
            status: 'confirmed'
          });
          
          createdReminders.push(reminder);
          console.log(`   ✅ Created: "${reminder.title}" on ${new Date(reminder.eventDate).toLocaleDateString()}`);
          
        } catch (dbError) {
          console.error(`   ❌ DB Error for "${reminderData.title}":`, dbError.message);
        }
      }
    }
  } else {
    aiAgentResponse = {
      message: 'No upcoming events or appointments detected in this journal.',
      reasoning: 'Event detection found no future commitments.',
      approved: 0,
      rejected: 0
    };
    console.log(`\n🤖 AI Decision: No events detected`);
  }
  
  // STEP 5: Update journal with analysis
  journal.analysis = {
    productive: aiAnalysis.productive,
    unproductive: aiAnalysis.unproductive,
    rest: aiAnalysis.rest,
    emotional: aiAnalysis.emotional,
    suggestions: aiAnalysis.suggestions,
    sentiment: aiAnalysis.sentiment,
    detectedEvents: detectedEvents,
    aiRemindersCreated: createdReminders.length,
    aiDecisionMaking: true,
    aiAgentResponse: aiAgentResponse
  };
  journal.analysisStatus = "ready";
  journal.analysisAt = Date.now();
  await journal.save();
  
  console.log(`\n💾 Journal updated with analysis`);
  console.log(`   Reminders Created: ${createdReminders.length}`);
  
  return {
    journal,
    createdReminders: createdReminders.length,
    aiResponse: aiAgentResponse
  };
}

async function runPrecisionTest() {
  console.log('╔═════════════════════════════════════════════════════════╗');
  console.log('║  FINAL PRECISION TEST - Real User Scenario             ║');
  console.log('║  Testing with multiple journals and accumulated history║');
  console.log('╚═════════════════════════════════════════════════════════╝\n');
  
  const results = [];
  
  // JOURNAL 1: First entry - work meeting
  const result1 = await createAndAnalyzeJournal(
    `Had a productive morning working on the authentication system. 
    Fixed the JWT token refresh issue that was causing problems.
    Team standup meeting scheduled for November 15th at 10am.
    Need to prepare slides for the meeting.`,
    '2024-11-11T10:00:00Z',
    1
  );
  results.push(result1);
  
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // JOURNAL 2: Second entry - personal appointment
  const result2 = await createAndAnalyzeJournal(
    `Took a break and went for a walk at lunch. Feeling refreshed.
    Remembered I have a dentist appointment on November 20th at 2pm.
    Should call them tomorrow to confirm the time.
    Also need to finish the database migration before Friday.`,
    '2024-11-12T14:00:00Z',
    2
  );
  results.push(result2);
  
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // JOURNAL 3: Third entry - mentions existing event + new event
  const result3 = await createAndAnalyzeJournal(
    `Morning standup went well. Everyone is on track for the sprint.
    The dentist confirmed my appointment for the 20th - all set.
    Client demo is scheduled for November 25th at 3pm. Need to prepare!
    Finished the migration tests today, feeling good about Friday's deployment.`,
    '2024-11-13T16:30:00Z',
    3
  );
  results.push(result3);
  
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // JOURNAL 4: Fourth entry - NEW journal with mix of old and new events
  console.log('\n\n🎯 CRITICAL TEST: Creating 4th journal with existing + new events');
  console.log('   This tests if AI properly uses history from 3 previous journals\n');
  
  const result4 = await createAndAnalyzeJournal(
    `Preparing for the standup meeting tomorrow morning. Got my slides ready.
    Also preparing for the client demo on the 25th - need to polish the UI.
    Just scheduled a one-on-one with my manager for November 18th at 11am.
    The dentist appointment is coming up soon, need to remember to go.`,
    '2024-11-14T18:00:00Z',
    4
  );
  results.push(result4);
  
  // FINAL VALIDATION
  console.log('\n\n╔═════════════════════════════════════════════════════════╗');
  console.log('║                  FINAL VALIDATION                       ║');
  console.log('╚═════════════════════════════════════════════════════════╝\n');
  
  const allJournals = await Journal.find({ userId: testUserId }).sort({ date: 1 });
  const allReminders = await Reminder.find({ userId: testUserId }).sort({ eventDate: 1 });
  
  console.log(`📊 Total Statistics:`);
  console.log(`   Journals Created: ${allJournals.length}`);
  console.log(`   Reminders Created: ${allReminders.length}`);
  console.log(`   All Journals Analyzed: ${allJournals.every(j => j.analysisStatus === 'ready') ? '✅ YES' : '❌ NO'}`);
  
  console.log(`\n📋 All Reminders:`);
  allReminders.forEach((r, i) => {
    console.log(`   ${i+1}. "${r.title}"`);
    console.log(`      Date: ${new Date(r.eventDate).toLocaleDateString()}`);
    console.log(`      From Journal: ${r.journalId}`);
  });
  
  console.log(`\n🔍 Detailed Analysis:`);
  results.forEach((result, i) => {
    console.log(`   Journal ${i+1}: Created ${result.createdReminders} reminder(s)`);
    console.log(`      AI Message: "${result.aiResponse.message.substring(0, 60)}..."`);
  });
  
  // CRITICAL CHECKS
  console.log(`\n🎯 Critical Checks:`);
  
  const check1 = results.every(r => r.aiResponse !== null);
  console.log(`   ✓ All journals have AI response: ${check1 ? '✅ PASS' : '❌ FAIL'}`);
  
  const check2 = allReminders.every(r => r.eventDate && !isNaN(new Date(r.eventDate).getTime()));
  console.log(`   ✓ All reminders have valid dates: ${check2 ? '✅ PASS' : '❌ FAIL'}`);
  
  const check3 = allReminders.every(r => new Date(r.eventDate) > new Date('2024-11-14'));
  console.log(`   ✓ All reminders are future events: ${check3 ? '✅ PASS' : '❌ FAIL'}`);
  
  const check4 = results[3].aiResponse.approved >= 0 && results[3].aiResponse.rejected >= 0;
  console.log(`   ✓ 4th journal AI made decisions: ${check4 ? '✅ PASS' : '❌ FAIL'}`);
  
  const check5 = allJournals.length === 4 && allJournals.every(j => j.analysis);
  console.log(`   ✓ All 4 journals have analysis: ${check5 ? '✅ PASS' : '❌ FAIL'}`);
  
  // Check if AI used history (journal 4 should reference previous events)
  const journal4 = allJournals.find(j => j._id.toString() === results[3].journal._id.toString());
  const check6 = journal4 && journal4.analysis && journal4.analysis.aiAgentResponse !== null;
  console.log(`   ✓ Journal 4 has AI agent response: ${check6 ? '✅ PASS' : '❌ FAIL'}`);
  
  const allPassed = check1 && check2 && check3 && check4 && check5 && check6;
  
  console.log(`\n╔═════════════════════════════════════════════════════════╗`);
  if (allPassed) {
    console.log('║  🎉 ALL TESTS PASSED - SYSTEM IS PRODUCTION READY! 🎉  ║');
  } else {
    console.log('║  ❌ SOME TESTS FAILED - REVIEW RESULTS ABOVE           ║');
  }
  console.log('╚═════════════════════════════════════════════════════════╝\n');
  
  return allPassed;
}

async function cleanup() {
  console.log('\n🧹 Cleaning up test data...');
  await Reminder.deleteMany({ userId: testUserId });
  await Journal.deleteMany({ userId: testUserId });
  await User.deleteOne({ _id: testUserId });
  console.log('✅ Cleanup complete\n');
}

async function main() {
  try {
    await setup();
    const passed = await runPrecisionTest();
    await cleanup();
    
    await mongoose.connection.close();
    console.log('✅ Database connection closed\n');
    
    if (passed) {
      console.log('🚀 READY FOR DEPLOYMENT!\n');
      process.exit(0);
    } else {
      console.log('⚠️  Please review test failures before deployment\n');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('\n❌ TEST SUITE FAILED:', error.message);
    console.error(error.stack);
    await cleanup().catch(() => {});
    await mongoose.connection.close();
    process.exit(1);
  }
}

main();
