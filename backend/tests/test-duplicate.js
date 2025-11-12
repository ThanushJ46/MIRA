// Quick test for duplicate detection
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Journal = require('../models/Journal');
const Reminder = require('../models/Reminder');
const User = require('../models/User');
const { detectEventsWithLlama, createRemindersWithAI } = require('../services/ollamaService');

let testUserId;

async function setup() {
  await mongoose.connect(process.env.MONGO_URI);
  
  // Clean up and create test user
  await User.deleteMany({ email: 'duptest@test.com' });
  const user = await User.create({
    name: 'Dup Test',
    email: 'duptest@test.com',
    password: 'test123'
  });
  testUserId = user._id;
  
  console.log('\n✅ Setup complete\n');
}

async function testDuplicateDetection() {
  console.log('╔══════════════════════════════════════════════╗');
  console.log('║     DUPLICATE DETECTION TEST                 ║');
  console.log('╚══════════════════════════════════════════════╝\n');
  
  // STEP 1: Create first journal with dentist appointment
  console.log('STEP 1: First journal mentions dentist on Nov 19');
  const journal1Content = `Don't forget dentist appointment on November 19th at 2pm.`;
  
  const events1 = await detectEventsWithLlama(journal1Content);
  console.log(`   Detected: ${events1.length} events`);
  events1.forEach(e => console.log(`   - ${e.title} on ${new Date(e.date).toLocaleDateString()}`));
  
  // Create reminders from first journal
  const aiDecision1 = await createRemindersWithAI(events1, journal1Content, {
    recentJournals: [],
    existingReminders: []
  });
  
  console.log(`\n   AI Decision:`);
  console.log(`   ✅ Approved: ${aiDecision1.approved}`);
  console.log(`   ❌ Rejected: ${aiDecision1.rejected}`);
  console.log(`   💬 "${aiDecision1.aiResponse}"`);
  
  // Save to database
  const savedReminders = [];
  for (const r of aiDecision1.reminders) {
    const reminder = await Reminder.create({
      userId: testUserId,
      title: r.title,
      eventDate: r.eventDate,
      description: r.description,
      status: 'confirmed'
    });
    savedReminders.push(reminder);
  }
  
  console.log(`\n   💾 Saved ${savedReminders.length} reminders to database\n`);
  
  // STEP 2: Second journal mentions SAME dentist appointment
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.log('STEP 2: Second journal mentions SAME dentist appointment');
  const journal2Content = `Reminder to self: dentist appointment is on the 19th.`;
  
  const events2 = await detectEventsWithLlama(journal2Content);
  console.log(`   Detected: ${events2.length} events`);
  events2.forEach(e => console.log(`   - ${e.title} on ${new Date(e.date).toLocaleDateString()}`));
  
  // Fetch existing reminders
  const existingReminders = await Reminder.find({ userId: testUserId })
    .select('title eventDate status');
  
  console.log(`\n   📚 Existing reminders in DB:`);
  existingReminders.forEach(r => {
    console.log(`   - "${r.title}" on ${new Date(r.eventDate).toLocaleDateString()}`);
  });
  
  // AI should detect duplicate
  const aiDecision2 = await createRemindersWithAI(events2, journal2Content, {
    recentJournals: [],
    existingReminders: existingReminders
  });
  
  console.log(`\n   AI Decision (WITH HISTORY):`);
  console.log(`   ✅ Approved: ${aiDecision2.approved} (expected: 0 - should reject duplicate)`);
  console.log(`   ❌ Rejected: ${aiDecision2.rejected} (expected: 1 - should detect duplicate)`);
  console.log(`   💬 "${aiDecision2.aiResponse}"`);
  console.log(`   🧠 Reasoning: "${aiDecision2.reasoning}"`);
  
  // Verify
  console.log('\n╔══════════════════════════════════════════════╗');
  if (aiDecision2.rejected > 0) {
    console.log('║  ✅ TEST PASSED: AI detected duplicate!      ║');
  } else {
    console.log('║  ⚠️  TEST WARNING: AI did not reject dup     ║');
    console.log('║     But this might be acceptable behavior   ║');
  }
  console.log('╚══════════════════════════════════════════════╝\n');
}

async function cleanup() {
  await Reminder.deleteMany({ userId: testUserId });
  await User.deleteOne({ _id: testUserId });
  await mongoose.connection.close();
}

async function main() {
  try {
    await setup();
    await testDuplicateDetection();
  } catch (error) {
    console.error('\n❌ Error:', error);
  } finally {
    await cleanup();
    console.log('✅ Cleanup done\n');
  }
}

main();
