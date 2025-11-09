const Journal = require('../models/Journal');

// @desc    Create new journal entry
// @route   POST /api/journals/create
// @access  Private
const createJournal = async (req, res) => {
  try {
    const { title, content, date, streakCount } = req.body;

    if (!content) {
      return res.status(400).json({
        success: false,
        message: 'Please provide content',
        data: null
      });
    }

    const journal = await Journal.create({
      userId: req.userId,
      title: title || '',
      content,
      date: date || Date.now(),
      streakCount: streakCount || 0
    });

    res.status(201).json({
      success: true,
      message: 'Journal created successfully',
      data: journal
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message, data: null });
  }
};

// @desc    Get all journals
// @route   GET /api/journals
// @access  Private
const getJournals = async (req, res) => {
  try {
    const journals = await Journal.find({ userId: req.userId }).sort({ date: -1 });
    res.json({ success: true, message: 'Journals retrieved successfully', data: journals });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message, data: null });
  }
};

// @desc    Get one journal
// @route   GET /api/journals/:id
// @access  Private
const getJournalById = async (req, res) => {
  try {
    const journal = await Journal.findById(req.params.id);
    if (!journal) return res.status(404).json({ success: false, message: 'Journal not found', data: null });

    if (journal.userId.toString() !== req.userId.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized', data: null });
    }

    res.json({ success: true, message: 'Journal retrieved', data: journal });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message, data: null });
  }
};

// @desc    Update journal
// @route   PUT /api/journals/:id
// @access  Private
const updateJournal = async (req, res) => {
  try {
    const journal = await Journal.findById(req.params.id);
    if (!journal) return res.status(404).json({ success: false, message: 'Journal not found', data: null });

    if (journal.userId.toString() !== req.userId.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized', data: null });
    }

    const { title, content, date, streakCount, summary, insights } = req.body;

    journal.title = title ?? journal.title;
    journal.content = content ?? journal.content;
    journal.date = date ?? journal.date;
    journal.streakCount = streakCount ?? journal.streakCount;
    journal.summary = summary ?? journal.summary;
    journal.insights = insights ?? journal.insights;

    const updatedJournal = await journal.save();
    res.json({ success: true, message: 'Journal updated successfully', data: updatedJournal });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message, data: null });
  }
};

// @desc    Delete journal
// @route   DELETE /api/journals/:id
// @access  Private
const deleteJournal = async (req, res) => {
  try {
    const journal = await Journal.findById(req.params.id);
    if (!journal) return res.status(404).json({ success: false, message: 'Journal not found', data: null });

    if (journal.userId.toString() !== req.userId.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized', data: null });
    }

    await journal.deleteOne();
    res.json({ success: true, message: 'Journal deleted', data: null });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message, data: null });
  }
};

// @desc    Analyze journal (FINAL VERSION WITH EVENT DETECTION)
// @route   POST /api/journals/:id/analyze
// @access  Private
const analyzeJournal = async (req, res) => {
  try {
    const journal = await Journal.findById(req.params.id);
    if (!journal) return res.status(404).json({ success: false, message: "Journal not found", data: null });

    if (journal.userId.toString() !== req.userId.toString()) {
      return res.status(403).json({ success: false, message: "Not authorized", data: null });
    }

    const content = journal.content;
    const contentLower = content.toLowerCase();

    // ✅ DETECT EVENTS WITH DATES
    const detectedEvents = detectEventsFromText(content);

    // ✅ Split cleanly & remove filler words
    const parts = contentLower
      .split(/[\.\?\!]/)
      .map(s => s.trim())
      .map(s => s.replace(/^(and|but|then|so|also|well|anyway|though|however)\s+/g, ""))
      .map(s => s.replace(/^(i|me|my|we|us)\s+/g, ""))
      .filter(s => s.length > 3);

    // ✅ Pattern sets
    const productivePatterns = [
      /\bwoke up early\b/, /\bworked on\b/, /\bresearch paper\b/, /\bfound sources\b/,
      /\bwent to the library\b/, /\bsolid block of time\b/, /\bcompleted\b/, /\bfinished\b/,
      /\bstudied\b/, /\brevised\b/, /\bcleaned\b/, /\borganized\b/, /\btook notes\b/,
      /\bprepared for\b/, /\bexercise|workout|yoga|treadmill|run|jog\b/
    ];

    const unproductivePatterns = [
      /\bscrolled\b/, /\bdoom(-)?scroll\b/, /\bgroup chat\b/, /\bgossip\b/, /\bphone blew up\b/,
      /\bwasted (time|an hour|two hours|the day)\b/, /\bplayed\b.*(bgmi|pubg|valorant|apex|fortnite|csgo)/,
      /\bjust laid in bed\b/, /\bprocrastinat(e|ing|ed)\b/, /\bno motivation\b/
    ];

    const restPatterns = [
      /\brecharge\b/, /\brest(ed)?\b/, /\bslow day\b/, /\bchill(ed)?\b/,
      /\bwalk(ed)? in the park\b/, /\bcoffee on the balcony\b/, /\bbrain feels quiet\b/
    ];

    const emotionalPatterns = [
      /\boverwhelmed\b/, /\banxiety\b/, /\bheavy\b/, /\bfelt pointless\b/,
      /\bjust want to disappear\b/, /\blonely\b/, /\bshut down\b/
    ];

    const productive = [], unproductive = [], rest = [], emotional = [];

    parts.forEach(p => {
      if (productivePatterns.some(r => r.test(p))) productive.push(p);
      else if (unproductivePatterns.some(r => r.test(p))) unproductive.push(p);
      else if (restPatterns.some(r => r.test(p))) rest.push(p);
      else if (emotionalPatterns.some(r => r.test(p))) emotional.push(p);
    });

    // Clean up the activity descriptions - extract just the key activities
    const cleanProductiveActivities = [];
    productive.forEach(p => {
      if (/woke up early/.test(p)) cleanProductiveActivities.push('Woke up early');
      if (/worked on/.test(p) || /working on/.test(p)) {
        const match = p.match(/working on (my |the )?([^—,\.]+)/);
        cleanProductiveActivities.push(match ? `Worked on ${match[2].trim()}` : 'Worked on project');
      }
      if (/research paper/.test(p)) cleanProductiveActivities.push('Research paper work');
      if (/found sources|found.*sources/.test(p)) cleanProductiveActivities.push('Found research sources');
      if (/went to the library/.test(p)) cleanProductiveActivities.push('Library visit');
      if (/solid block of time/.test(p)) cleanProductiveActivities.push('Focused work session');
      if (/completed/.test(p)) cleanProductiveActivities.push('Completed tasks');
      if (/finished/.test(p)) cleanProductiveActivities.push('Finished work');
      if (/studied/.test(p)) cleanProductiveActivities.push('Studied');
      if (/revised/.test(p)) cleanProductiveActivities.push('Revised material');
      if (/cleaned/.test(p)) cleanProductiveActivities.push('Cleaned up');
      if (/organized/.test(p)) cleanProductiveActivities.push('Organized tasks');
      if (/took notes/.test(p)) cleanProductiveActivities.push('Took notes');
      if (/prepared for/.test(p)) cleanProductiveActivities.push('Prepared for tasks');
      if (/exercise|workout|yoga|treadmill|run|jog/.test(p)) cleanProductiveActivities.push('Exercise/Physical activity');
    });

    const cleanUnproductiveActivities = [];
    unproductive.forEach(p => {
      if (/scrolled|doom(-)?scroll/.test(p)) cleanUnproductiveActivities.push('Social media scrolling');
      if (/group chat/.test(p)) cleanUnproductiveActivities.push('Group chat distraction');
      if (/gossip/.test(p)) cleanUnproductiveActivities.push('Gossip/drama');
      if (/phone blew up/.test(p)) cleanUnproductiveActivities.push('Phone notifications');
      if (/wasted (time|an hour|two hours|the day)/.test(p)) {
        const match = p.match(/wasted (an hour|two hours|the day|time)/);
        cleanUnproductiveActivities.push(match ? `Wasted ${match[1]}` : 'Wasted time');
      }
      if (/played\b.*(bgmi|pubg|valorant|apex|fortnite|csgo)/.test(p)) cleanUnproductiveActivities.push('Gaming');
      if (/just laid in bed/.test(p)) cleanUnproductiveActivities.push('Laid in bed');
      if (/procrastinat/.test(p)) cleanUnproductiveActivities.push('Procrastination');
      if (/no motivation/.test(p)) cleanUnproductiveActivities.push('Lack of motivation');
    });

    const cleanRestActivities = [];
    rest.forEach(p => {
      if (/recharge/.test(p)) cleanRestActivities.push('Recharging');
      if (/rest(ed)?/.test(p)) cleanRestActivities.push('Rested');
      if (/slow day/.test(p)) cleanRestActivities.push('Slow day');
      if (/chill(ed)?/.test(p)) cleanRestActivities.push('Relaxed/Chilled');
      if (/walk(ed)? in the park/.test(p)) cleanRestActivities.push('Walk in the park');
      if (/coffee on the balcony/.test(p)) cleanRestActivities.push('Coffee break');
      if (/brain feels quiet/.test(p)) cleanRestActivities.push('Mental calm');
    });

    const cleanEmotionalStates = [];
    emotional.forEach(p => {
      if (/overwhelmed/.test(p)) cleanEmotionalStates.push('Feeling overwhelmed');
      if (/anxiety/.test(p)) cleanEmotionalStates.push('Anxiety');
      if (/heavy/.test(p)) cleanEmotionalStates.push('Feeling heavy');
      if (/felt pointless/.test(p)) cleanEmotionalStates.push('Feeling pointless');
      if (/just want to disappear/.test(p)) cleanEmotionalStates.push('Wanting to disappear');
      if (/lonely/.test(p)) cleanEmotionalStates.push('Loneliness');
      if (/shut down/.test(p)) cleanEmotionalStates.push('Shutting down');
    });

    // Remove duplicates
    const uniqueProductive = [...new Set(cleanProductiveActivities)];
    const uniqueUnproductive = [...new Set(cleanUnproductiveActivities)];
    const uniqueRest = [...new Set(cleanRestActivities)];
    const uniqueEmotional = [...new Set(cleanEmotionalStates)];

    // ✅ Scoring logic
    let score = Math.round(50 + uniqueProductive.length * 10 - uniqueUnproductive.length * 7 - uniqueEmotional.length * 4);
    score = Math.max(0, Math.min(score, 100));

    // ✅ Generate suggestions based on analysis
    const suggestions = generateSuggestions(uniqueProductive, uniqueUnproductive, uniqueEmotional, score);

    const analysis = { 
      productivityScore: score,
      productive: uniqueProductive, 
      unproductive: uniqueUnproductive, 
      rest: uniqueRest, 
      emotional: uniqueEmotional,
      suggestions: suggestions,
      detectedEvents: detectedEvents
    };

    journal.analysis = analysis;
    journal.analysisStatus = "ready";
    journal.analysisAt = Date.now();
    await journal.save();

    return res.json({ success: true, message: "Journal analyzed successfully", data: analysis });

  } catch (error) {
    return res.status(500).json({ success: false, message: error.message, data: null });
  }
};

// Helper function to detect events from text
function detectEventsFromText(text) {
  const events = [];
  const sentences = text.split(/[.!?]+/).map(s => s.trim()).filter(s => s.length > 5);
  
  // Event keywords
  const eventKeywords = [
    'meeting', 'appointment', 'call', 'interview', 'presentation', 'deadline',
    'exam', 'test', 'class', 'lecture', 'workshop', 'seminar', 'conference',
    'party', 'dinner', 'lunch', 'breakfast', 'coffee', 'hangout', 'date',
    'flight', 'trip', 'travel', 'vacation', 'visit', 'doctor', 'dentist'
  ];

  sentences.forEach(sentence => {
    const lowerSentence = sentence.toLowerCase();
    
    // Check if sentence contains event keywords
    const hasEventKeyword = eventKeywords.some(keyword => lowerSentence.includes(keyword));
    
    if (hasEventKeyword) {
      const eventDate = extractDateFromSentence(sentence);
      
      if (eventDate) {
        // Extract event title
        let title = extractEventTitle(sentence, eventKeywords);
        
        events.push({
          title: title,
          date: eventDate.toISOString(),
          description: sentence,
          sentence: sentence
        });
      }
    }
  });

  return events;
}

// Helper function to extract date from sentence
function extractDateFromSentence(sentence) {
  const now = new Date();
  const lowerSentence = sentence.toLowerCase();

  // Handle "tomorrow"
  if (/\btomorrow\b/.test(lowerSentence)) {
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(9, 0, 0, 0); // Default to 9 AM
    return tomorrow;
  }

  // Handle "today"
  if (/\btoday\b/.test(lowerSentence)) {
    const today = new Date(now);
    today.setHours(9, 0, 0, 0); // Default to 9 AM
    return today;
  }

  // Handle "next week"
  if (/\bnext week\b/.test(lowerSentence)) {
    const nextWeek = new Date(now);
    nextWeek.setDate(nextWeek.getDate() + 7);
    nextWeek.setHours(9, 0, 0, 0);
    return nextWeek;
  }

  // Handle "next monday", "next tuesday", etc.
  const dayMatch = lowerSentence.match(/\bnext (monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/);
  if (dayMatch) {
    const targetDay = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'].indexOf(dayMatch[1]);
    const currentDay = now.getDay();
    let daysUntilTarget = targetDay - currentDay;
    if (daysUntilTarget <= 0) daysUntilTarget += 7;
    const targetDate = new Date(now);
    targetDate.setDate(targetDate.getDate() + daysUntilTarget);
    targetDate.setHours(9, 0, 0, 0);
    return targetDate;
  }

  // Handle "in X days"
  const inDaysMatch = lowerSentence.match(/\bin (\d+) days?\b/);
  if (inDaysMatch) {
    const days = parseInt(inDaysMatch[1]);
    const futureDate = new Date(now);
    futureDate.setDate(futureDate.getDate() + days);
    futureDate.setHours(9, 0, 0, 0);
    return futureDate;
  }

  // Handle "12 of December", "15 of Jan", etc.
  const dayOfMonthMatch = sentence.match(/(\d{1,2})(?:st|nd|rd|th)?\s+of\s+(Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)(?:,?\s+(\d{4}))?/i);
  if (dayOfMonthMatch) {
    const monthNames = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];
    const shortMonthNames = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
    
    const day = parseInt(dayOfMonthMatch[1]);
    const monthStr = dayOfMonthMatch[2].toLowerCase();
    let month = monthNames.findIndex(m => m.startsWith(monthStr));
    if (month === -1) month = shortMonthNames.findIndex(m => m === monthStr.substring(0, 3));
    
    const year = dayOfMonthMatch[3] ? parseInt(dayOfMonthMatch[3]) : now.getFullYear();
    
    const eventDate = new Date(year, month, day, 9, 0, 0, 0);
    
    // Extract time if mentioned
    const timeMatch = sentence.match(/\bat (\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i);
    if (timeMatch) {
      let hours = parseInt(timeMatch[1]);
      const minutes = timeMatch[2] ? parseInt(timeMatch[2]) : 0;
      const ampm = timeMatch[3] ? timeMatch[3].toLowerCase() : null;
      
      if (ampm === 'pm' && hours < 12) hours += 12;
      if (ampm === 'am' && hours === 12) hours = 0;
      
      eventDate.setHours(hours, minutes, 0, 0);
    }
    
    return eventDate;
  }

  // Handle specific dates like "December 25", "Jan 15", etc.
  const dateMatch = sentence.match(/(Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+(\d{1,2})(?:st|nd|rd|th)?(?:,?\s+(\d{4}))?/i);
  if (dateMatch) {
    const monthNames = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];
    const shortMonthNames = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
    
    const monthStr = dateMatch[1].toLowerCase();
    let month = monthNames.findIndex(m => m.startsWith(monthStr));
    if (month === -1) month = shortMonthNames.findIndex(m => m === monthStr.substring(0, 3));
    
    const day = parseInt(dateMatch[2]);
    const year = dateMatch[3] ? parseInt(dateMatch[3]) : now.getFullYear();
    
    const eventDate = new Date(year, month, day, 9, 0, 0, 0);
    
    // Extract time if mentioned
    const timeMatch = sentence.match(/\bat (\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i);
    if (timeMatch) {
      let hours = parseInt(timeMatch[1]);
      const minutes = timeMatch[2] ? parseInt(timeMatch[2]) : 0;
      const ampm = timeMatch[3] ? timeMatch[3].toLowerCase() : null;
      
      if (ampm === 'pm' && hours < 12) hours += 12;
      if (ampm === 'am' && hours === 12) hours = 0;
      
      eventDate.setHours(hours, minutes, 0, 0);
    }
    
    return eventDate;
  }

  // Handle "on the 12th", "on the 15th" (when month is implied from context or current month)
  const onTheMatch = lowerSentence.match(/\bon the (\d{1,2})(?:st|nd|rd|th)\b/);
  if (onTheMatch) {
    const day = parseInt(onTheMatch[1]);
    // Assume current month or next month if day has passed
    let month = now.getMonth();
    let year = now.getFullYear();
    
    if (day < now.getDate()) {
      // Day has passed this month, assume next month
      month += 1;
      if (month > 11) {
        month = 0;
        year += 1;
      }
    }
    
    const eventDate = new Date(year, month, day, 9, 0, 0, 0);
    
    // Extract time if mentioned
    const timeMatch = sentence.match(/\bat (\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i);
    if (timeMatch) {
      let hours = parseInt(timeMatch[1]);
      const minutes = timeMatch[2] ? parseInt(timeMatch[2]) : 0;
      const ampm = timeMatch[3] ? timeMatch[3].toLowerCase() : null;
      
      if (ampm === 'pm' && hours < 12) hours += 12;
      if (ampm === 'am' && hours === 12) hours = 0;
      
      eventDate.setHours(hours, minutes, 0, 0);
    }
    
    return eventDate;
  }

  // Handle time mentions like "at 3pm", "at 14:00"
  const timeMatch = sentence.match(/\bat (\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i);
  if (timeMatch && (/\btomorrow\b/.test(lowerSentence) || /\btoday\b/.test(lowerSentence))) {
    let hours = parseInt(timeMatch[1]);
    const minutes = timeMatch[2] ? parseInt(timeMatch[2]) : 0;
    const ampm = timeMatch[3] ? timeMatch[3].toLowerCase() : null;
    
    if (ampm === 'pm' && hours < 12) hours += 12;
    if (ampm === 'am' && hours === 12) hours = 0;
    
    const baseDate = /\btomorrow\b/.test(lowerSentence) 
      ? new Date(now.getTime() + 24 * 60 * 60 * 1000)
      : new Date(now);
    
    baseDate.setHours(hours, minutes, 0, 0);
    return baseDate;
  }

  return null;
}

// Helper function to extract event title
function extractEventTitle(sentence, eventKeywords) {
  const lowerSentence = sentence.toLowerCase();
  
  // Find which keyword is present
  const keyword = eventKeywords.find(kw => lowerSentence.includes(kw));
  
  if (!keyword) return sentence.substring(0, 50);

  // Try to extract a meaningful title
  // Pattern: "I have a [event] with [person/details]"
  const patterns = [
    new RegExp(`(have|got|scheduled)\\s+(?:a\\s+)?${keyword}\\s+with\\s+([^.,!?]+)`, 'i'),
    new RegExp(`${keyword}\\s+with\\s+([^.,!?]+)`, 'i'),
    new RegExp(`(have|got|scheduled)\\s+(?:a\\s+)?${keyword}(?:\\s+([^.,!?]+))?`, 'i'),
    new RegExp(`${keyword}(?:\\s+([^.,!?]+))?`, 'i')
  ];

  for (const pattern of patterns) {
    const match = sentence.match(pattern);
    if (match) {
      const detail = match[2] || match[1];
      if (detail && detail.length > 2) {
        return `${keyword.charAt(0).toUpperCase() + keyword.slice(1)} ${detail.trim()}`;
      }
    }
  }

  // Fallback: capitalize keyword
  return keyword.charAt(0).toUpperCase() + keyword.slice(1);
}

// Helper function to generate suggestions
function generateSuggestions(productive, unproductive, emotional, score) {
  const suggestions = [];

  if (score < 40) {
    suggestions.push('Consider setting specific goals for tomorrow to improve productivity');
    suggestions.push('Try the Pomodoro Technique: 25 minutes of focused work, 5-minute breaks');
  }

  if (unproductive.length > productive.length) {
    suggestions.push('Identify your biggest distractions and create barriers to them');
    suggestions.push('Schedule "focus blocks" in your calendar for deep work');
  }

  if (emotional.length > 2) {
    suggestions.push('Consider talking to someone you trust about how you\'re feeling');
    suggestions.push('Practice self-care: adequate sleep, exercise, and breaks are important');
  }

  if (productive.length > 3 && score > 70) {
    suggestions.push('Great productivity! Remember to take breaks to avoid burnout');
    suggestions.push('Celebrate your accomplishments, no matter how small');
  }

  if (suggestions.length === 0) {
    suggestions.push('Keep up the good work! Maintain your current balance');
    suggestions.push('Reflect on what worked well today and repeat it tomorrow');
  }

  return suggestions;
}

module.exports = {
  createJournal,
  getJournals,
  getJournalById,
  updateJournal,
  deleteJournal,
  analyzeJournal
};
