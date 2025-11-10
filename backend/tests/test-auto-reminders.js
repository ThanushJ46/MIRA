// Test automatic reminder creation and calendar sync
const { detectEventsWithLlama } = require('../services/ollamaService');

const testJournals = [
  {
    name: "Test 1: Multiple events",
    content: `Had a productive day! I need to submit my project report tomorrow at 2pm. 
    Also, I have a dentist appointment on December 15th at 10am.
    Meeting with my advisor next Monday at 3pm to discuss thesis progress.`
  },
  {
    name: "Test 2: Assignment deadlines",
    content: `Working on my assignments. The math homework is due on Friday.
    I also need to prepare for the presentation on December 20th.`
  },
  {
    name: "Test 3: Personal events",
    content: `Busy week ahead! Doctor's appointment tomorrow at 9am.
    Need to pick up groceries. Friend's birthday party on Saturday evening.`
  }
];

async function testAutoReminders() {
  console.log('='.repeat(80));
  console.log('🤖 AUTONOMOUS REMINDER CREATION TEST');
  console.log('='.repeat(80));
  console.log('\nThis test simulates what happens when the agent analyzes journals:');
  console.log('1. Detect events from natural language');
  console.log('2. Auto-create reminders (no user confirmation needed)');
  console.log('3. Auto-sync to Google Calendar (if connected)');
  console.log('\n' + '='.repeat(80) + '\n');

  for (const test of testJournals) {
    console.log(`\n📝 ${test.name}`);
    console.log('-'.repeat(80));
    console.log('Journal Content:');
    console.log(test.content);
    console.log('\n--- Event Detection ---\n');

    try {
      const events = await detectEventsWithLlama(test.content);
      
      if (events.length === 0) {
        console.log('❌ No events detected');
      } else {
        console.log(`✅ Detected ${events.length} event(s):\n`);
        
        events.forEach((event, idx) => {
          console.log(`${idx + 1}. 📅 ${event.title}`);
          console.log(`   Date: ${new Date(event.date).toLocaleString()}`);
          if (event.description) {
            console.log(`   Description: ${event.description}`);
          }
          console.log(`   Type: ${event.type}`);
          console.log(`   🤖 ACTION: Would auto-create reminder + sync to calendar`);
          console.log('');
        });
      }

      // Simulate what the agent would do
      if (events.length > 0) {
        console.log(`\n🤖 AGENT ACTIONS (Simulated):`);
        console.log(`   ✓ Created ${events.length} reminder(s) automatically`);
        console.log(`   ✓ Set status to 'confirmed' (skipped user approval)`);
        console.log(`   ✓ If Google Calendar connected: Synced all events`);
        console.log(`   ✓ User notification: "${events.length} reminder(s) created • ${events.length} synced to calendar"`);
      }

    } catch (error) {
      console.error('❌ Error:', error.message);
    }

    console.log('\n' + '-'.repeat(80));
    
    // Wait between tests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  console.log('\n' + '='.repeat(80));
  console.log('✅ AUTO-REMINDER TEST COMPLETE');
  console.log('='.repeat(80));
  console.log('\n📊 SUMMARY:');
  console.log('   • Events are detected automatically from journal text');
  console.log('   • Reminders are created WITHOUT user confirmation');
  console.log('   • Calendar sync happens AUTOMATICALLY if connected');
  console.log('   • This is TRUE AGENTIC behavior - the agent acts autonomously!');
  console.log('\n🎯 NEXT STEPS:');
  console.log('   1. Write a journal with events (e.g., "Meeting tomorrow at 3pm")');
  console.log('   2. Wait 5 seconds (auto-analysis triggers)');
  console.log('   3. Check your reminders - they should be auto-created!');
  console.log('   4. If Calendar connected - check Google Calendar too!');
  console.log('\n' + '='.repeat(80) + '\n');
}

// Run the test
testAutoReminders();
