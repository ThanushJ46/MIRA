// Test professional extraction with complex journal
const { analyzeJournalWithLlama } = require('./services/ollamaService');

const journalContent = `Today I completed my mathematics assignment on quadratic equations. 
I also started working on the research paper about climate change for my environmental science class.
In the evening, I went for a 30-minute jog and did some yoga to relax.
I wasted about an hour scrolling through Instagram when I should have been studying.
Feeling a bit stressed about the upcoming physics exam next week.`;

console.log('Testing professional activity extraction...\n');
console.log('Journal:', journalContent);
console.log('\n--- Running Analysis ---\n');

analyzeJournalWithLlama(journalContent)
  .then(analysis => {
    console.log('✓ Analysis complete!\n');
    console.log('Productivity Score:', analysis.productivityScore, '/100\n');
    
    console.log('✓ Productive Activities:');
    analysis.productive.forEach(activity => console.log(`  • ${activity}`));
    
    console.log('\n✗ Unproductive Activities:');
    if (analysis.unproductive.length === 0) {
      console.log('  (none)');
    } else {
      analysis.unproductive.forEach(activity => console.log(`  • ${activity}`));
    }
    
    console.log('\n😴 Restful Activities:');
    if (analysis.rest.length === 0) {
      console.log('  (none)');
    } else {
      analysis.rest.forEach(activity => console.log(`  • ${activity}`));
    }
    
    console.log('\n😊 Emotional States:');
    if (analysis.emotional.length === 0) {
      console.log('  (none)');
    } else {
      analysis.emotional.forEach(state => console.log(`  • ${state}`));
    }
    
    console.log('\n💡 Suggestions:');
    analysis.suggestions.forEach((suggestion, i) => {
      console.log(`  ${i + 1}. ${suggestion}`);
    });
    
    console.log('\nOverall Sentiment:', analysis.sentiment);
  })
  .catch(error => {
    console.error('✗ Error:', error.message);
  });
