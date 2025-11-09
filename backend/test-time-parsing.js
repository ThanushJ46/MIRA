// Test time parsing for dentist appointment
const { detectEventsWithLlama } = require('./services/ollamaService');

const journalContent = `I also have a dentist appointment tomorrow at 10am.`;

console.log('Testing event detection with time parsing...\n');
console.log('Journal:', journalContent);
console.log('\n--- Running Analysis ---\n');

detectEventsWithLlama(journalContent)
  .then(events => {
    console.log('✓ Events detected:', events.length);
    events.forEach((event, i) => {
      console.log(`\nEvent ${i + 1}:`);
      console.log(`  Title: ${event.title}`);
      console.log(`  Date: ${event.date}`);
      const eventDate = new Date(event.date);
      console.log(`  Parsed Time: ${eventDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}`);
      console.log(`  Full DateTime: ${eventDate.toLocaleString('en-US')}`);
      console.log(`  Type: ${event.type}`);
      console.log(`  Context: ${event.sentence}`);
    });
  })
  .catch(error => {
    console.error('✗ Error:', error.message);
  });
