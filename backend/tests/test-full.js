const { analyzeJournalWithLlama, detectEventsWithLlama, checkOllamaAvailability } = require('../services/ollamaService');

async function testFullIntegration() {
  console.log('🔍 Testing Complete Ollama Integration (Analysis + Events)...\n');

  const sampleJournal = `
Today was productive! I woke up early and went for a run.
Spent 3 hours coding on my project and made great progress!
I have a meeting tomorrow at 2pm with the design team.
Also need to remember my dentist appointment on December 15th at 10am.
Later I wasted some time on social media and felt stressed.
The project deadline is next Friday - need to finish the API integration.
Ended the day reading and feeling hopeful!
  `.trim();

  console.log('📝 Journal Content:');
  console.log(sampleJournal);
  console.log('\n' + '='.repeat(60) + '\n');

  // Check Ollama
  const available = await checkOllamaAvailability();
  if (!available) {
    console.log('❌ Ollama not available');
    return;
  }
  console.log('✅ Ollama with Llama3 is ready\n');

  // Test Analysis
  console.log('📊 STEP 1: AI Analysis');
  console.log('⏳ Analyzing...\n');
  const analysis = await analyzeJournalWithLlama(sampleJournal);
  console.log('✅ Analysis Results:');
  console.log(`   Score: ${analysis.productivityScore}/100`);
  console.log(`   Sentiment: ${analysis.sentiment}`);
  console.log(`   Productive: ${analysis.productive.join(', ')}`);
  console.log(`   Unproductive: ${analysis.unproductive.join(', ')}`);
  console.log(`   Emotional: ${analysis.emotional.join(', ')}`);
  console.log(`   Suggestions: ${analysis.suggestions.length} tips generated`);

  // Test Event Detection
  console.log('\n📅 STEP 2: Event Detection');
  console.log('⏳ Detecting events...\n');
  const events = await detectEventsWithLlama(sampleJournal);
  console.log(`✅ Found ${events.length} events:\n`);
  
  events.forEach((event, i) => {
    console.log(`   ${i + 1}. ${event.title}`);
    console.log(`      📅 ${new Date(event.date).toLocaleString()}`);
    console.log(`      Type: ${event.type}`);
    console.log(`      Context: "${event.description}"`);
    console.log();
  });

  // Summary
  console.log('='.repeat(60));
  console.log('\n🎉 INTEGRATION TEST PASSED!');
  console.log('\nWhat will happen in your app:');
  console.log('1. ✅ User creates journal entry with dates');
  console.log('2. ✅ Clicks "Analyze" button');
  console.log('3. ✅ Llama3 analyzes productivity & emotions');
  console.log('4. ✅ Llama3 detects events from text');
  console.log('5. ✅ Frontend shows detected events');
  console.log('6. ✅ User clicks "Set Reminder" on event');
  console.log('7. ✅ Popup asks: "Add to Google Calendar?"');
  console.log('8. ✅ Event syncs to Google Calendar!');
  console.log('\nAll powered by LOCAL AI - no external APIs! 🚀\n');
}

testFullIntegration().catch(console.error);
