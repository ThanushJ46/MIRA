const { analyzeJournalWithLlama, checkOllamaAvailability } = require('./services/ollamaService');

async function testOllama() {
  console.log('🔍 Testing Ollama Integration...\n');

  // Step 1: Check if Ollama is available
  console.log('Step 1: Checking Ollama availability...');
  const isAvailable = await checkOllamaAvailability();
  
  if (!isAvailable) {
    console.log('❌ Ollama is not available. Please start Ollama service.');
    return;
  }
  console.log('✅ Ollama is running with llama3 model!\n');

  // Step 2: Test with sample journal content
  console.log('Step 2: Analyzing sample journal entry...');
  const sampleJournal = `
Today was a productive day! I woke up at 7am and went for a morning run. 
After breakfast, I spent 3 hours coding on my new project. I'm really excited about it!
Then I had lunch with my team and we discussed the upcoming deadline.
In the afternoon, I attended a meeting at 2pm about the Q4 roadmap.
Later, I wasted some time scrolling through social media and felt a bit stressed about the workload.
I also have a dentist appointment tomorrow at 10am.
Ended the day by reading a book and going to bed early. Overall feeling hopeful about tomorrow!
  `.trim();

  console.log('📝 Journal Content:');
  console.log(sampleJournal);
  console.log('\n⏳ Analyzing with Llama3 (this may take 5-15 seconds)...\n');

  try {
    const startTime = Date.now();
    const analysis = await analyzeJournalWithLlama(sampleJournal);
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    console.log('✅ Analysis Complete! (took ' + duration + 's)\n');
    console.log('📊 Results:');
    console.log('━'.repeat(60));
    console.log(`Productivity Score: ${analysis.productivityScore}/100`);
    console.log(`Sentiment: ${analysis.sentiment}`);
    console.log(`\n✅ Productive Activities (${analysis.productive.length}):`);
    analysis.productive.forEach(item => console.log(`   • ${item}`));
    console.log(`\n❌ Unproductive Activities (${analysis.unproductive.length}):`);
    analysis.unproductive.forEach(item => console.log(`   • ${item}`));
    console.log(`\n😌 Rest Activities (${analysis.rest.length}):`);
    analysis.rest.forEach(item => console.log(`   • ${item}`));
    console.log(`\n💭 Emotional State (${analysis.emotional.length}):`);
    analysis.emotional.forEach(item => console.log(`   • ${item}`));
    console.log(`\n💡 AI Suggestions (${analysis.suggestions.length}):`);
    analysis.suggestions.forEach((sug, i) => console.log(`   ${i + 1}. ${sug}`));
    console.log('━'.repeat(60));
    console.log('\n🎉 Ollama integration is working perfectly!');

  } catch (error) {
    console.error('❌ Error during analysis:', error.message);
    console.error('Full error:', error);
  }
}

testOllama();
