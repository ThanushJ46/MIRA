const { detectEventsWithLlama } = require('./services/ollamaService');

async function testEventDetection() {
  console.log('🔍 Testing Event Detection with Ollama...\n');

  const sampleJournal = `
Today was busy! I finished the project report and submitted it.
I have a meeting tomorrow at 2pm with the design team.
Also need to remember my dentist appointment on December 15th at 10am.
The project deadline is next Friday.
  `.trim();

  console.log('📝 Journal Content:');
  console.log(sampleJournal);
  console.log('\n⏳ Detecting events with Llama3...\n');

  try {
    const events = await detectEventsWithLlama(sampleJournal);
    
    console.log(`✅ Found ${events.length} events:\n`);
    console.log('━'.repeat(60));
    
    events.forEach((event, i) => {
      console.log(`\nEvent ${i + 1}:`);
      console.log(`  Title: ${event.title}`);
      console.log(`  Date: ${event.date}`);
      console.log(`  Type: ${event.type}`);
      console.log(`  Context: ${event.description || event.sentence}`);
    });
    
    console.log('\n' + '━'.repeat(60));
    
    if (events.length > 0) {
      console.log('\n✅ Event detection working! These will trigger Google Calendar popup.');
    } else {
      console.log('\n⚠️ No events detected. Check Llama3 response.');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

testEventDetection();
