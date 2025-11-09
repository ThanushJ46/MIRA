// Ollama LLM Service for Local AI Analysis
const ollama = require('ollama').default;

/**
 * Analyze journal content using Ollama (Llama3)
 * @param {string} content - Journal text content
 * @returns {Promise<Object>} - Analysis results with productive/unproductive activities, score, suggestions
 */
async function analyzeJournalWithLlama(content) {
  try {
    const prompt = `Analyze this journal entry and respond with ONLY a JSON object, nothing else.

JOURNAL ENTRY:
${content}

Respond with this exact JSON structure:
{
  "productivityScore": <number 0-100>,
  "productiveActivities": ["activity1", "activity2"],
  "unproductiveActivities": ["activity1"],
  "restfulActivities": ["activity1"],
  "emotionalStates": ["state1", "state2"],
  "suggestions": ["suggestion1", "suggestion2", "suggestion3"],
  "overallSentiment": "positive"
}

Rules:
- productiveActivities: work, study, exercise, learning, creating
- unproductiveActivities: excessive social media, procrastination
- restfulActivities: intentional rest, sleep, relaxation
- emotionalStates: current feelings/moods mentioned
- suggestions: 3-5 actionable tips
- overallSentiment: positive/neutral/negative
- Respond with JSON only, no explanations`;

    const response = await ollama.chat({
      model: 'llama3',
      messages: [{ role: 'user', content: prompt }],
      stream: false,
      format: 'json',
      options: {
        temperature: 0.2,
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
      productivityScore: Math.max(0, Math.min(100, analysis.productivityScore || 50)),
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
    
    const prompt = `You are a calendar event detector. Extract events with specific dates/times from this journal.

TODAY'S DATE: ${todayStr}

STRICT RULES:
1. ONLY extract events with SPECIFIC dates: "**today**", "tomorrow", "December 12", "next Monday", "Friday at 5pm"
2. IGNORE vague mentions like "I have a test" without a specific date
3. IGNORE completed past activities ("I went to doctor yesterday", "I already submitted", "I finished the report")
4. INCLUDE missed/incomplete deadlines with dates ("I **had to** submit today", "missed meeting today at 5pm")
   - "had to" + date = UNFINISHED task with deadline = INCLUDE IT
5. ONLY extract: meetings, appointments, deadlines, submissions, scheduled events
6. **"today" or "tomorrow" or specific day names = SPECIFIC date**

JOURNAL:
${content}

Examples to INCLUDE:
- "meeting on December 12 at 3pm" ✓
- "dentist appointment tomorrow at 10am" ✓
- "deadline next Friday" ✓
- "I had to submit the record today afternoon" ✓ (deadline today - "today" is a SPECIFIC date)
- "call tomorrow at 5pm" ✓
- "submit today" ✓ ("today" is specific)

Examples to EXCLUDE:
- "I have a test" (no specific date) ✗
- "I need a vacation" (not a scheduled event) ✗
- "I went for a run" (past activity, no future relevance) ✗
- "I attended meeting yesterday" (completed past event) ✗

Respond with ONLY a JSON array:
[
  {
    "title": "Event name",
    "date": "YYYY-MM-DD or 'tomorrow' or 'next Monday'",
    "time": "HH:MM or null",
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
        const [hours, minutes] = event.time.split(':').map(Number);
        if (!isNaN(hours) && !isNaN(minutes)) {
          eventDate.setHours(hours, minutes, 0, 0);
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
      // Keep events from today onwards (don't filter out "today" events even if time passed)
      const eventDateTime = new Date(event.date);
      const todayStart = new Date(now);
      todayStart.setHours(0, 0, 0, 0); // Start of today
      
      return eventDateTime >= todayStart; // Must be today or future
    });

    return events;

  } catch (error) {
    console.error('Event detection error:', error);
    return []; // Return empty array on failure, don't break the flow
  }
}

/**
 * Detect potential events that need user clarification (no specific date/time)
 * @param {string} content - Journal text
 * @returns {Promise<Array>} - Unclear events needing date/time
 */
async function detectUnclearEventsWithLlama(content) {
  try {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    
    const prompt = `Extract ACTIONABLE tasks/deadlines that DON'T have specific dates but need to be scheduled.

TODAY: ${todayStr}

JOURNAL:
${content}

VERY STRICT RULES:
1. ONLY extract ACTIONABLE tasks with clear deadlines/actions: "submit", "call", "complete", "finish", "send"
2. IGNORE wishes/desires: "I need a vacation", "I want", "I wish"
3. IGNORE past events: "I missed", "I forgot", "yesterday", "last week"
4. IGNORE tasks with ANY date/time mentioned: "today", "tomorrow", "next week", "Monday", "5pm", specific dates
5. Task MUST be something specific to DO without ANY date context

Examples to INCLUDE:
- "I have to submit my record book" ✓ (actionable task, no date)
- "need to call the dentist" ✓ (specific action, no date)
- "must finish the report" ✓ (actionable with deadline)

Examples to EXCLUDE:
- "I need a vacation" ✗ (vague wish, not actionable task)
- "I want to rest" ✗ (desire, not a task)
- "call tomorrow at 5pm" ✗ (has "tomorrow" - specific date)
- "submit today" ✗ (has "today" - specific date)
- "I forgot to call on 12th feb" ✗ (past event)
- "I should study more" ✗ (vague, not specific task)
- "meeting next week" ✗ (has "next week" - date mentioned)

Respond ONLY with JSON array:
[
  {
    "title": "Task name",
    "context": "Exact sentence",
    "urgency": "high/medium/low"
  }
]

Return [] if nothing found.`;

    const response = await ollama.chat({
      model: 'llama3',
      messages: [{ role: 'user', content: prompt }],
      stream: false,
      format: 'json',
      options: {
        temperature: 0.1, // Very low for strict filtering
      }
    });

    const messageContent = response.message.content.trim();
    let jsonString = messageContent;
    
    if (messageContent.includes('```json')) {
      const match = messageContent.match(/```json\s*([\s\S]*?)\s*```/);
      if (match) jsonString = match[1];
    } else if (messageContent.includes('```')) {
      const match = messageContent.match(/```\s*([\s\S]*?)\s*```/);
      if (match) jsonString = match[1];
    }

    let tasks = JSON.parse(jsonString);
    
    if (!Array.isArray(tasks) && tasks.tasks) {
      tasks = tasks.tasks;
    }
    
    if (!Array.isArray(tasks)) return [];

    // Filter out any task that mentions past indicators OR is not actionable OR has date mentions
    const pastIndicators = ['missed', 'forgot', 'last time', 'last week', 'yesterday', 'this year', 'back in', 'ago'];
    const dateWords = ['today', 'tomorrow', 'tonight', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday', 'next week', 'this week', 'january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];
    const actionWords = ['submit', 'call', 'send', 'complete', 'finish', 'prepare', 'book', 'schedule', 'meet', 'attend', 'register', 'apply', 'pay', 'buy', 'order', 'contact', 'email', 'write'];
    const wishWords = ['need a', 'want a', 'wish', 'hope', 'should be', 'would like'];
    
    return tasks
      .filter(task => {
        const titleLower = (task.title || '').toLowerCase();
        const contextLower = (task.context || '').toLowerCase();
        
        // Reject if contains past indicators
        if (pastIndicators.some(indicator => contextLower.includes(indicator))) return false;
        
        // Reject if contains date words (those should be in clear events)
        if (dateWords.some(date => contextLower.includes(date))) return false;
        
        // Reject vague wishes (like "need a vacation")
        if (wishWords.some(wish => contextLower.includes(wish))) return false;
        
        // Must contain at least one action word
        const hasActionWord = actionWords.some(action => titleLower.includes(action) || contextLower.includes(action));
        
        return hasActionWord;
      })
      .map(task => ({
        title: task.title || 'Untitled Task',
        description: task.context || '',
        sentence: task.context || '',
        urgency: task.urgency || 'medium',
        needsDate: true,
        type: 'unclear-event'
      }));

  } catch (error) {
    console.error('Unclear event detection error:', error);
    return [];
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

module.exports = {
  analyzeJournalWithLlama,
  detectEventsWithLlama,
  detectUnclearEventsWithLlama,
  generateSuggestionsWithLlama,
  checkOllamaAvailability
};
