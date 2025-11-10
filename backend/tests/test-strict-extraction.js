// Test strict extraction - should NOT hallucinate activities
const { analyzeJournalWithLlama } = require('../services/ollamaService');

const journalContent = `I need to submit my record book day after tomorrow afternoon. Also have to submit my notes on 15th of this month`;

console.log('Testing strict activity extraction...\n');
console.log('Journal:', journalContent);
console.log('\n--- Running Analysis ---\n');

analyzeJournalWithLlama(journalContent)
  .then(analysis => {
    console.log('✓ Analysis complete!\n');
    console.log('Productivity Score:', analysis.productivityScore);
    console.log('\n✓ Productive Activities:');
    if (analysis.productive.length === 0) {
      console.log('  (none detected)');
    } else {
      analysis.productive.forEach(activity => console.log(`  - ${activity}`));
    }
    
    console.log('\n✗ Unproductive Activities:');
    if (analysis.unproductive.length === 0) {
      console.log('  (none detected) ✓ CORRECT - nothing mentioned in journal');
    } else {
      console.log('  ⚠️ ERROR - These should NOT be here (hallucination):');
      analysis.unproductive.forEach(activity => console.log(`  - ${activity}`));
    }
    
    console.log('\n😴 Restful Activities:');
    if (analysis.rest.length === 0) {
      console.log('  (none detected)');
    } else {
      analysis.rest.forEach(activity => console.log(`  - ${activity}`));
    }
    
    console.log('\n😊 Emotional States:');
    if (analysis.emotional.length === 0) {
      console.log('  (none detected)');
    } else {
      analysis.emotional.forEach(state => console.log(`  - ${state}`));
    }
    
    console.log('\n💡 Suggestions:');
    analysis.suggestions.forEach((suggestion, i) => {
      console.log(`  ${i + 1}. ${suggestion}`);
    });
    
    console.log('\nSentiment:', analysis.sentiment);
    
    // Validation check
    console.log('\n--- VALIDATION ---');
    if (analysis.unproductive.length === 0) {
      console.log('✅ PASS: No hallucinated unproductive activities');
    } else {
      console.log('❌ FAIL: LLM hallucinated unproductive activities that were not mentioned');
    }
  })
  .catch(error => {
    console.error('✗ Error:', error.message);
  });
