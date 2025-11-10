// Test that it DOES detect unproductive activities when mentioned
const { analyzeJournalWithLlama } = require('./services/ollamaService');

const journalContent = `I need to submit my record book day after tomorrow. 
I wasted 3 hours scrolling through Instagram and TikTok instead of working on it. 
I feel stressed now because I procrastinated.`;

console.log('Testing unproductive activity detection when ACTUALLY mentioned...\n');
console.log('Journal:', journalContent);
console.log('\n--- Running Analysis ---\n');

analyzeJournalWithLlama(journalContent)
  .then(analysis => {
    console.log('✓ Analysis complete!\n');
    
    console.log('✓ Productive Activities:');
    if (analysis.productive.length === 0) {
      console.log('  (none detected)');
    } else {
      analysis.productive.forEach(activity => console.log(`  - ${activity}`));
    }
    
    console.log('\n✗ Unproductive Activities:');
    if (analysis.unproductive.length === 0) {
      console.log('  ❌ ERROR - Should have detected social media waste');
    } else {
      console.log('  ✓ CORRECTLY DETECTED:');
      analysis.unproductive.forEach(activity => console.log(`  - ${activity}`));
    }
    
    console.log('\n😊 Emotional States:');
    analysis.emotional.forEach(state => console.log(`  - ${state}`));
    
    console.log('\nSentiment:', analysis.sentiment);
    
    // Validation
    console.log('\n--- VALIDATION ---');
    if (analysis.unproductive.length > 0) {
      console.log('✅ PASS: Correctly detected unproductive activities that were explicitly mentioned');
    } else {
      console.log('❌ FAIL: Failed to detect unproductive activities');
    }
  })
  .catch(error => {
    console.error('✗ Error:', error.message);
  });
