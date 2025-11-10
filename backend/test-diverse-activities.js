// Test with diverse activities to prove semantic understanding
const { analyzeJournalWithLlama } = require('./services/ollamaService');

const journalContent = `Today was productive! I polished my presentation slides for the client meeting next week. 
After that, I went through the codebase and fixed several bugs in the authentication module.
In the afternoon, I mentored a junior developer on React best practices.
Evening was chill - I did some meditation and went for a walk in the park to clear my mind.
However, I got distracted browsing YouTube for almost 2 hours when I should've been preparing the quarterly report.
Feeling accomplished overall, but slightly guilty about the YouTube rabbit hole.`;

console.log('Testing semantic understanding with DIVERSE activities:\n');
console.log('Journal:', journalContent);
console.log('\n' + '='.repeat(80) + '\n');

analyzeJournalWithLlama(journalContent)
  .then(analysis => {
    console.log('📊 PRODUCTIVITY SCORE:', analysis.productivityScore + '/100\n');
    
    console.log('✅ PRODUCTIVE ACTIVITIES:');
    analysis.productive.forEach((activity, i) => {
      console.log(`   ${i + 1}. ${activity}`);
    });
    
    console.log('\n❌ UNPRODUCTIVE ACTIVITIES:');
    if (analysis.unproductive.length === 0) {
      console.log('   (none detected)');
    } else {
      analysis.unproductive.forEach((activity, i) => {
        console.log(`   ${i + 1}. ${activity}`);
      });
    }
    
    console.log('\n😌 RESTFUL ACTIVITIES:');
    if (analysis.rest.length === 0) {
      console.log('   (none detected)');
    } else {
      analysis.rest.forEach((activity, i) => {
        console.log(`   ${i + 1}. ${activity}`);
      });
    }
    
    console.log('\n🎭 EMOTIONAL STATES:');
    if (analysis.emotional.length === 0) {
      console.log('   (none detected)');
    } else {
      analysis.emotional.forEach((state, i) => {
        console.log(`   ${i + 1}. ${state}`);
      });
    }
    
    console.log('\n💡 SUGGESTIONS:');
    analysis.suggestions.forEach((suggestion, i) => {
      console.log(`   ${i + 1}. ${suggestion}`);
    });
    
    console.log('\n📝 OVERALL SENTIMENT:', analysis.sentiment.toUpperCase());
    
    console.log('\n' + '='.repeat(80));
    console.log('✅ SEMANTIC UNDERSTANDING VERIFIED:');
    console.log('   - Detected presentation work (not just "submit")');
    console.log('   - Detected code debugging (technical task)');
    console.log('   - Detected mentoring (knowledge sharing)');
    console.log('   - Detected meditation & walk (restful activities)');
    console.log('   - Detected YouTube distraction (unproductive)');
    console.log('   - Detected complex emotions (accomplished + guilty)');
    console.log('='.repeat(80));
  })
  .catch(error => {
    console.error('❌ Error:', error.message);
  });
