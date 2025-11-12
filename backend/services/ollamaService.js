// Ollama LLM Service for Local AI Analysis
const ollama = require('ollama').default;

/**
 * Analyze journal content using Ollama (Llama3)
 * @param {string} content - Journal text content
 * @returns {Promise<Object>} - Analysis results with productive/unproductive activities, score, suggestions
 */
async function analyzeJournalWithLlama(content) {
  try {
    const prompt = `You are an expert journal analyzer. Analyze this journal entry and extract meaningful insights.

JOURNAL ENTRY:
${content}

Extract and categorize activities with SEMANTIC UNDERSTANDING, not keyword matching.

Respond with this exact JSON structure:
{
  "productiveActivities": ["clear description of productive task"],
  "unproductiveActivities": ["clear description of time-wasting activity"],
  "restfulActivities": ["clear description of rest/relaxation"],
  "emotionalStates": ["emotion or feeling"],
  "suggestions": ["actionable suggestion"],
  "overallSentiment": "positive/neutral/negative"
}

EXTRACTION GUIDELINES:

1. PRODUCTIVE ACTIVITIES - Understand the MEANING and CONTEXT:
   - Tasks with deadlines, assignments, work obligations
   - Learning, studying, skill development
   - Exercise, health activities, self-improvement
   - Creative work, projects, problem-solving
   - ANY activity that moves toward a goal
   → Extract the COMPLETE task description naturally as mentioned
   → Include what they're doing AND what it's about/for
   → Use their own words and phrasing when possible

2. UNPRODUCTIVE ACTIVITIES - Identify time-wasting patterns:
   - Activities described as "wasting time", "procrastinating"
   - Excessive entertainment consumption mentioned negatively
   - Social media/gaming mentioned as distraction
   - ONLY if clearly framed as unproductive by the user
   → Don't assume - they must indicate it was time poorly spent

3. RESTFUL ACTIVITIES - Recognize intentional rest:
   - Sleep, naps, relaxation
   - Breaks, leisure time framed positively
   - Recreation for mental/physical recovery
   → Only count if framed as deliberate rest, not procrastination

4. EMOTIONAL STATES - Detect feelings from context:
   - Explicit emotion words (happy, stressed, anxious, motivated)
   - Implied emotions from tone and word choice
   - Current mental/emotional state

5. SUGGESTIONS - Provide contextual, personalized advice:
   - Based on their specific situation
   - Actionable and practical
   - Address challenges or optimize their workflow
   - 3-5 specific recommendations

CRITICAL RULES:
- Use SEMANTIC understanding, not keyword matching
- Extract ONLY what's explicitly present in the text
- Make descriptions complete and professional
- Empty array [] if nothing found in a category
- Don't invent or assume activities not mentioned

Respond with ONLY valid JSON, no explanations.`;

    const response = await ollama.chat({
      model: 'llama3',
      messages: [{ role: 'user', content: prompt }],
      stream: false,
      format: 'json',
      options: {
        temperature: 0.15, // Slightly higher for better semantic understanding
      }
    });

    const messageContent = response.message.content.trim();
    
    // Extract JSON from response (handle markdown code blocks if present)
    let jsonString = messageContent;
    if (messageContent.includes('```json')) {
      const match = messageContent.match(/```json\s*([\s\S]*?)\s*```/);
      if (match) jsonString = match[1];
    } else if (messageContent.includes('```')) {
      const match = messageContent.match(/```\s*([\s\S]*?)\s*```/);
      if (match) jsonString = match[1];
    }

    const analysis = JSON.parse(jsonString);

    // Validate and normalize
    return {
      productive: Array.isArray(analysis.productiveActivities) ? analysis.productiveActivities : [],
      unproductive: Array.isArray(analysis.unproductiveActivities) ? analysis.unproductiveActivities : [],
      rest: Array.isArray(analysis.restfulActivities) ? analysis.restfulActivities : [],
      emotional: Array.isArray(analysis.emotionalStates) ? analysis.emotionalStates : [],
      suggestions: Array.isArray(analysis.suggestions) ? analysis.suggestions : [],
      sentiment: analysis.overallSentiment || 'neutral'
    };

  } catch (error) {
    console.error('Ollama analysis error:', error);
    throw new Error(`AI analysis failed: ${error.message}`);
  }
}

/**
 * Detect events and tasks from journal using Llama3
 * @param {string} content - Journal text
 * @returns {Promise<Array>} - Detected events with dates
 */
async function detectEventsWithLlama(content) {
  try {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    
    const prompt = `You are a calendar event detector. Extract ONLY future events with specific dates/times from this journal.

TODAY'S DATE: ${todayStr}

STRICT RULES:
1. ONLY extract events that have a SPECIFIC future date mentioned (like "tomorrow", "December 12", "next Monday", "on Friday")
2. IGNORE vague mentions like "I have a test" without a specific date
3. IGNORE past events (things already happened like "I went to", "I had", "I attended")
4. ONLY extract: meetings, appointments, deadlines, scheduled events
5. Must have either a specific date OR a clear time indicator (tomorrow, next week, etc.)

JOURNAL:
${content}

Examples to INCLUDE:
- "I have a meeting on December 12 at 3pm" ✓
- "dentist appointment tomorrow at 10am" ✓
- "deadline next Friday" ✓
- "presentation on Monday" ✓

Examples to EXCLUDE:
- "I have a test" (no specific date) ✗
- "the test is on Friday" (too vague, which Friday?) ✗
- "I went to the doctor" (past tense) ✗
- "I should study" (not an event) ✗

Respond with ONLY a JSON array:
[
  {
    "title": "Event name",
    "date": "YYYY-MM-DD or 'tomorrow' or 'next Monday'",
    "time": "10:00am" or "14:30" or "10am" or null (extract exact time mentioned),
    "type": "meeting/appointment/deadline",
    "context": "Exact sentence from journal"
  }
]

Return [] if NO future events with specific dates found.`;

    const response = await ollama.chat({
      model: 'llama3',
      messages: [{ role: 'user', content: prompt }],
      stream: false,
      format: 'json',
      options: {
        temperature: 0.1, // Lower temperature for more precise extraction
      }
    });

    const messageContent = response.message.content.trim();
    
    // Extract JSON
    let jsonString = messageContent;
    if (messageContent.includes('```json')) {
      const match = messageContent.match(/```json\s*([\s\S]*?)\s*```/);
      if (match) jsonString = match[1];
    } else if (messageContent.includes('```')) {
      const match = messageContent.match(/```\s*([\s\S]*?)\s*```/);
      if (match) jsonString = match[1];
    }

    let events = JSON.parse(jsonString);
    
    // Handle if response is wrapped in an object with "events" key
    if (!Array.isArray(events) && events.events && Array.isArray(events.events)) {
      events = events.events;
    }
    
    if (!Array.isArray(events)) return [];

    // Convert relative dates to ISO format for Google Calendar integration
    const now = new Date();
    events = events.map(event => {
      let eventDate = null;

      if (event.date) {
        const dateLower = event.date.toLowerCase();
        
        // Handle relative dates
        if (dateLower === 'tomorrow') {
          eventDate = new Date(now);
          eventDate.setDate(eventDate.getDate() + 1);
        } else if (dateLower === 'today') {
          eventDate = new Date(now);
        } else if (dateLower.includes('next week')) {
          eventDate = new Date(now);
          eventDate.setDate(eventDate.getDate() + 7);
        } else if (dateLower.includes('next friday')) {
          eventDate = new Date(now);
          const currentDay = eventDate.getDay();
          const daysUntilFriday = (5 - currentDay + 7) % 7 || 7; // 5 = Friday
          eventDate.setDate(eventDate.getDate() + daysUntilFriday);
        } else if (dateLower.includes('next monday')) {
          eventDate = new Date(now);
          const currentDay = eventDate.getDay();
          const daysUntilMonday = (1 - currentDay + 7) % 7 || 7;
          eventDate.setDate(eventDate.getDate() + daysUntilMonday);
        } else {
          // Try parsing as ISO date
          const parsed = new Date(event.date);
          if (!isNaN(parsed.getTime())) {
            eventDate = parsed;
            // If year is in past (like 2023), update to current/next year
            if (eventDate.getFullYear() < now.getFullYear()) {
              eventDate.setFullYear(now.getFullYear());
              // If date has passed this year, use next year
              if (eventDate < now) {
                eventDate.setFullYear(now.getFullYear() + 1);
              }
            }
          }
        }
      }

      // Set time if provided
      if (eventDate && event.time) {
        let hours = 9;
        let minutes = 0;
        
        const timeStr = event.time.toLowerCase().trim();
        
        // Handle various time formats: "10am", "10:00am", "10:30", "14:00"
        const timeMatch = timeStr.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i);
        
        if (timeMatch) {
          hours = parseInt(timeMatch[1], 10);
          minutes = timeMatch[2] ? parseInt(timeMatch[2], 10) : 0;
          const meridiem = timeMatch[3];
          
          // Convert to 24-hour format if AM/PM is specified
          if (meridiem) {
            if (meridiem.toLowerCase() === 'pm' && hours < 12) {
              hours += 12;
            } else if (meridiem.toLowerCase() === 'am' && hours === 12) {
              hours = 0;
            }
          }
          
          if (!isNaN(hours) && !isNaN(minutes) && hours >= 0 && hours < 24 && minutes >= 0 && minutes < 60) {
            eventDate.setHours(hours, minutes, 0, 0);
          } else {
            eventDate.setHours(9, 0, 0, 0); // Default fallback
          }
        } else {
          eventDate.setHours(9, 0, 0, 0); // Default fallback
        }
      } else if (eventDate) {
        // Default to 9 AM if no time specified
        eventDate.setHours(9, 0, 0, 0);
      }

      return {
        title: event.title || 'Untitled Event',
        date: eventDate ? eventDate.toISOString() : null,
        description: event.context || '',
        sentence: event.context || '',
        type: event.type || 'task'
      };
    })
    .filter(event => event.date !== null) // Only return events with valid dates
    .filter(event => {
      // Additional filter: Only keep FUTURE events
      const eventDateTime = new Date(event.date);
      return eventDateTime > now; // Must be in the future
    });

    return events;

  } catch (error) {
    console.error('Event detection error:', error);
    return []; // Return empty array on failure, don't break the flow
  }
}

/**
 * Generate personalized suggestions using Llama3
 * @param {Object} analysis - Current analysis data
 * @param {string} journalContent - Original journal content
 * @returns {Promise<Array>} - Personalized suggestions
 */
async function generateSuggestionsWithLlama(analysis, journalContent) {
  try {
    const prompt = `Provide 3-5 actionable suggestions for this journal. Respond with ONLY a JSON array.

ANALYSIS:
- Score: ${analysis.productivityScore}/100
- Productive: ${analysis.productive.join(', ')}
- Unproductive: ${analysis.unproductive.join(', ')}
- Emotions: ${analysis.emotional.join(', ')}

Format: ["Suggestion 1", "Suggestion 2", "Suggestion 3"]

Make them specific, empathetic, actionable. No explanations.`;

    const response = await ollama.chat({
      model: 'llama3',
      messages: [{ role: 'user', content: prompt }],
      stream: false,
      format: 'json',
      options: {
        temperature: 0.4,
      }
    });

    const messageContent = response.message.content.trim();
    
    // Extract JSON
    let jsonString = messageContent;
    if (messageContent.includes('```json')) {
      const match = messageContent.match(/```json\s*([\s\S]*?)\s*```/);
      if (match) jsonString = match[1];
    } else if (messageContent.includes('```')) {
      const match = messageContent.match(/```\s*([\s\S]*?)\s*```/);
      if (match) jsonString = match[1];
    }

    const suggestions = JSON.parse(jsonString);
    return Array.isArray(suggestions) ? suggestions : [];

  } catch (error) {
    console.error('Suggestion generation error:', error);
    return [
      'Focus on one task at a time to improve concentration',
      'Consider setting specific time blocks for deep work',
      'Take regular breaks to maintain energy levels'
    ];
  }
}

/**
 * Check if Ollama is running and Llama3 model is available
 * @returns {Promise<boolean>}
 */
async function checkOllamaAvailability() {
  try {
    const response = await ollama.list();
    const hasLlama3 = response.models.some(model => 
      model.name.toLowerCase().includes('llama3')
    );
    return hasLlama3;
  } catch (error) {
    console.error('Ollama check failed:', error.message);
    return false;
  }
}

/**
 * AI Agent: Intelligently decide which reminders to create and how to structure them
 * This is TRUE AGENTIC AI - the AI makes autonomous decisions about reminder creation
 * @param {Array} detectedEvents - Events detected from journal
 * @param {string} journalContent - Original journal content for context
 * @returns {Promise<Array>} - AI-generated reminder objects ready for database
 */
async function createRemindersWithAI(detectedEvents, journalContent) {
  try {
    if (!detectedEvents || detectedEvents.length === 0) {
      console.log('ℹ️ No events to analyze for reminder creation');
      return [];
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🤖 AGENTIC AI REMINDER CREATION STARTED');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`📥 Input: ${detectedEvents.length} detected events`);
    console.log('📋 Events to analyze:', JSON.stringify(detectedEvents.map(e => ({
      title: e.title,
      date: e.date,
      type: e.type
    })), null, 2));
    console.log('🧠 Sending to Llama3 AI for intelligent decision-making...');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    const prompt = `You are an intelligent reminder creation agent. Analyze these detected events and decide which ones should become reminders.

DETECTED EVENTS:
${JSON.stringify(detectedEvents, null, 2)}

JOURNAL CONTEXT:
${journalContent.substring(0, 500)}

YOUR TASK:
Analyze each event and decide if it needs a reminder. For approved events, create enhanced reminder objects.

DECISION RULES:
✓ CREATE if: Appointment, deadline, meeting, important commitment
✗ SKIP if: Casual mention, vague idea, already passed, uncertain ("maybe", "might")

OUTPUT FORMAT (MUST BE VALID JSON ARRAY):
[
  {
    "title": "Event name",
    "description": "Context from journal + preparation notes",
    "eventDate": "YYYY-MM-DDTHH:mm:ss.sssZ",
    "shouldCreate": true,
    "priority": "high",
    "aiReasoning": "Why this needs a reminder",
    "preparationNotes": "What to prepare"
  }
]

CRITICAL RULES:
1. Return ONLY valid JSON array (no markdown, no explanations)
2. Only include events where shouldCreate is true
3. Use exact ISO date from detected event
4. Be selective - quality over quantity
5. Empty array [] if no events deserve reminders

Respond with JSON array only:`;

    console.log('⏳ Waiting for Llama3 AI response...');
    
    const response = await ollama.chat({
      model: 'llama3',
      messages: [{ role: 'user', content: prompt }],
      stream: false,
      format: 'json',
      options: {
        temperature: 0.2, // Lower temperature for more consistent output
        num_predict: 1000, // Limit response length
      }
    });

    const messageContent = response.message.content.trim();
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🤖 AI RESPONSE RECEIVED');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📤 Raw AI output (first 500 chars):', messageContent.substring(0, 500));
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    // Extract JSON - handle markdown code blocks
    let jsonString = messageContent;
    if (messageContent.includes('```json')) {
      const match = messageContent.match(/```json\s*([\s\S]*?)\s*```/);
      if (match) jsonString = match[1].trim();
    } else if (messageContent.includes('```')) {
      const match = messageContent.match(/```\s*([\s\S]*?)\s*```/);
      if (match) jsonString = match[1].trim();
    }

    // Try to parse JSON
    let aiReminders;
    try {
      aiReminders = JSON.parse(jsonString);
    } catch (parseError) {
      console.error('❌ JSON parse error:', parseError.message);
      console.error('Failed JSON string:', jsonString.substring(0, 300));
      
      // Fallback: Create basic reminders from all detected events
      console.log('⚠️ Falling back to basic reminder creation');
      return detectedEvents.map(event => ({
        title: event.title,
        description: event.description || event.sentence || 'Event from journal',
        eventDate: new Date(event.date),
        originalSentence: event.sentence || ''
      }));
    }
    
    // Validate response is an array
    if (!Array.isArray(aiReminders)) {
      console.error('❌ AI returned non-array response:', typeof aiReminders);
      console.error('Response structure:', JSON.stringify(aiReminders).substring(0, 200));
      
      // Check if it's wrapped in an object with a key
      if (aiReminders && typeof aiReminders === 'object') {
        // Try common wrapper keys
        const possibleKeys = ['reminders', 'events', 'items', 'data', 'results'];
        for (const key of possibleKeys) {
          if (Array.isArray(aiReminders[key])) {
            console.log(`✅ Found array under key "${key}"`);
            aiReminders = aiReminders[key];
            break;
          }
        }
      }
      
      // If still not an array, fallback
      if (!Array.isArray(aiReminders)) {
        console.log('⚠️ Falling back to basic reminder creation');
        return detectedEvents.map(event => ({
          title: event.title,
          description: event.description || event.sentence || 'Event from journal',
          eventDate: new Date(event.date),
          originalSentence: event.sentence || ''
        }));
      }
    }

    // Filter: Only keep reminders where AI decided shouldCreate is true
    const approvedReminders = aiReminders.filter(reminder => reminder.shouldCreate === true);

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🤖 AI DECISION COMPLETE');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`📊 AI analyzed: ${detectedEvents.length} events`);
    console.log(`✅ AI approved: ${approvedReminders.length} reminders`);
    console.log(`❌ AI rejected: ${detectedEvents.length - approvedReminders.length} events`);
    
    if (approvedReminders.length > 0) {
      console.log('\n📝 AI-APPROVED REMINDERS:');
      approvedReminders.forEach((reminder, index) => {
        console.log(`\n${index + 1}. "${reminder.title}"`);
        console.log(`   📅 Date: ${reminder.eventDate}`);
        console.log(`   🎯 Priority: ${reminder.priority}`);
        console.log(`   💭 AI Reasoning: ${reminder.aiReasoning}`);
      });
    }

    if (approvedReminders.length === 0) {
      console.log('ℹ️ AI decided NO events need reminders (all were casual mentions or uncertain)');
    }
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✨ This was 100% AI decision-making, not backend code!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // Transform AI response into database-ready format
    return approvedReminders.map(reminder => ({
      title: reminder.title,
      description: reminder.description || reminder.preparationNotes || '',
      eventDate: new Date(reminder.eventDate),
      originalSentence: reminder.aiReasoning || '',
      aiMetadata: {
        priority: reminder.priority || 'medium',
        reasoning: reminder.aiReasoning,
        preparationNotes: reminder.preparationNotes
      }
    }));

  } catch (error) {
    console.error('❌ AI reminder creation error:', error);
    console.error('Error stack:', error.stack);
    
    // Fallback: Create basic reminders from detected events
    console.log('⚠️ Error fallback: Creating basic reminders from all detected events');
    return detectedEvents.map(event => ({
      title: event.title,
      description: event.description || event.sentence || '',
      eventDate: new Date(event.date),
      originalSentence: event.sentence || ''
    }));
  }
}

module.exports = {
  analyzeJournalWithLlama,
  detectEventsWithLlama,
  generateSuggestionsWithLlama,
  checkOllamaAvailability,
  createRemindersWithAI  // NEW: AI-powered reminder creation
};
