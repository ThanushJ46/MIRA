const { detectEventsWithLlama } = require('../services/ollamaService');

async function testStudentJournal() {
  console.log('🔍 Testing Student Journal Event Detection...\n');

  const studentJournal = `Dear Diary,

Today was a good day! I worked on my project.
I have a meeting on 12 of December at 3pm with the team to discuss progress.

Today was... a day. History class was a total drag. Mr. Harrison spent the *entire* period talking about the economic factors of the revolution. I swear I almost fell asleep. I just don't get why we have to know this. I passed a note to Sarah asking if she'd finished the-math homework and Mrs. Evans saw me. Didn't get in trouble, but she gave me "the look." So embarrassing.

Lunch was the best part, as usual. We all sat at our regular table, and Leo was telling everyone about the disastrous date he went on. I laughed so hard I almost spit out my milk. It's crazy how we can all be failing math but still have fun.

Speaking of math, I am SO behind. The test is on Friday and I still don't get quadratics. Every time I think I have it, the next problem proves I don't. I *have* to study tonight. No excuses.

After school, I had soccer practice. Coach made us run drills until I thought my legs would fall off. I finally scored a decent goal during the scrimmage, which felt good. Maya said my form looked better.

Now I'm just sitting at my desk, staring at this blank math textbook. I'm overwhelmed. I have the test on Friday, that history essay due Monday, and I'm pretty sure I forgot to do the English reading. Sometimes I just wish I could fast-forward to graduation.`;

  console.log('📝 Journal Content (Student diary)');
  console.log('⏳ Detecting events with improved AI...\n');

  const events = await detectEventsWithLlama(studentJournal);
  
  console.log(`✅ Detected ${events.length} events:\n`);
  console.log('━'.repeat(60));
  
  if (events.length === 0) {
    console.log('\n✓ PERFECT! No vague events detected.');
    console.log('✓ Only events with specific future dates should be detected.\n');
  }
  
  events.forEach((event, i) => {
    console.log(`\nEvent ${i + 1}:`);
    console.log(`  Title: ${event.title}`);
    console.log(`  Date: ${new Date(event.date).toLocaleString()}`);
    console.log(`  Type: ${event.type}`);
    console.log(`  Context: "${event.description}"`);
  });
  
  console.log('\n' + '━'.repeat(60));
  
  console.log('\nEXPECTED RESULTS:');
  console.log('✓ Should detect: "meeting on 12 of December at 3pm"');
  console.log('✗ Should NOT detect: "test is on Friday" (no specific date)');
  console.log('✗ Should NOT detect: "history essay due Monday" (vague)');
  console.log('✗ Should NOT detect: past activities\n');
}

testStudentJournal().catch(console.error);
