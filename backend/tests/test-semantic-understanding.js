// Test semantic understanding with different phrasings
const { analyzeJournalWithLlama } = require('../services/ollamaService');

const testCases = [
  {
    name: "Test 1: Formal phrasing",
    content: "I need to submit my record book day after tomorrow afternoon. Also have to submit my notes on 15th of this month"
  },
  {
    name: "Test 2: Casual phrasing",
    content: "Gotta turn in my lab notebook in 2 days. Plus those class notes are due on the 15th"
  },
  {
    name: "Test 3: Different words, same meaning",
    content: "I have to hand over my practical journal by Tuesday afternoon. My lecture notes deadline is November 15th"
  },
  {
    name: "Test 4: Complex sentence structure",
    content: "By the end of this week, specifically on Tuesday afternoon, I'm required to provide my experimental documentation. Additionally, there's a requirement to deliver my course materials on the 15th"
  }
];

async function runTests() {
  for (const test of testCases) {
    console.log('\n' + '='.repeat(80));
    console.log(test.name);
    console.log('='.repeat(80));
    console.log('Journal:', test.content);
    console.log('\n--- Analysis ---\n');
    
    try {
      const analysis = await analyzeJournalWithLlama(test.content);
      
      console.log('✓ Productive Activities:');
      if (analysis.productive.length === 0) {
        console.log('  (none detected) ❌ FAILED - should detect tasks');
      } else {
        analysis.productive.forEach(activity => console.log(`  • ${activity}`));
      }
      
      console.log('\n✗ Unproductive Activities:');
      if (analysis.unproductive.length === 0) {
        console.log('  (none) ✓ Correct - nothing unproductive mentioned');
      } else {
        console.log('  ❌ HALLUCINATION:');
        analysis.unproductive.forEach(activity => console.log(`  • ${activity}`));
      }
      
      console.log('\nProductivity Score:', analysis.productivityScore);
      
    } catch (error) {
      console.error('❌ Error:', error.message);
    }
    
    // Wait a bit between requests
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  console.log('\n' + '='.repeat(80));
  console.log('SEMANTIC UNDERSTANDING TEST COMPLETE');
  console.log('='.repeat(80));
  console.log('\n✅ If all 4 tests extracted submission tasks (despite different wording),');
  console.log('   then the LLM is using SEMANTIC understanding, not keyword matching!');
}

runTests();
