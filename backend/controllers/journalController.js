const Journal = require('../models/Journal');
const Reminder = require('../models/Reminder');
const User = require('../models/User');
const { google } = require('googleapis');
const { 
  analyzeJournalWithLlama, 
  detectEventsWithLlama, 
  checkOllamaAvailability,
  createRemindersWithAI  // NEW: AI-powered reminder creation
} = require('../services/ollamaService');

// Helper function to sync AI-created reminders to Google Calendar
const syncRemindersToCalendar = async (userId, aiReminders) => {
  try {
    const syncResults = [];
    
    // Get user to check if they have Google Calendar connected
    const user = await User.findById(userId);
    const hasCalendar = !!user.googleRefreshToken;

    if (!hasCalendar) {
      console.log('ℹ️ No Google Calendar connected, skipping sync');
      return syncResults;
    }

    // Create OAuth2 client
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );

    oauth2Client.setCredentials({
      refresh_token: user.googleRefreshToken
    });

    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    for (const reminderData of aiReminders) {
      try {
        // Create calendar event
        const calendarEvent = {
          summary: reminderData.title,
          description: reminderData.description || reminderData.aiMetadata?.preparationNotes || 'From MIRA Journal',
          start: {
            dateTime: reminderData.eventDate.toISOString(),
            timeZone: 'UTC',
          },
          end: {
            dateTime: new Date(reminderData.eventDate.getTime() + 60 * 60 * 1000).toISOString(), // 1 hour duration
            timeZone: 'UTC',
          },
          reminders: {
            useDefault: false,
            overrides: [
              { method: 'popup', minutes: 30 },
              { method: 'email', minutes: 60 },
            ],
          },
        };

        const response = await calendar.events.insert({
          calendarId: 'primary',
          resource: calendarEvent,
        });

        syncResults.push({
          title: reminderData.title,
          synced: true,
          calendarEventId: response.data.id,
          calendarLink: response.data.htmlLink
        });

        console.log(`✅ AI reminder synced to calendar: ${reminderData.title}`);
      } catch (syncError) {
        console.error(`Failed to sync "${reminderData.title}" to calendar:`, syncError.message);
        syncResults.push({
          title: reminderData.title,
          synced: false,
          error: syncError.message
        });
      }
    }

    return syncResults;
  } catch (error) {
    console.error('Calendar sync error:', error);
    return [];
  }
};

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

// @desc    Analyze journal using Ollama (Llama3)
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

    // Check if Ollama is available
    const ollamaAvailable = await checkOllamaAvailability();
    
    if (!ollamaAvailable) {
      return res.status(503).json({ 
        success: false, 
        message: "Ollama service not available. Please ensure Ollama is running and llama3 model is installed.",
        data: null 
      });
    }

    // ⚡ SPEED OPTIMIZATION: Run both Ollama calls in parallel instead of sequential
    // This cuts analysis time almost in half!
    const [aiAnalysis, detectedEvents] = await Promise.all([
      analyzeJournalWithLlama(content),
      detectEventsWithLlama(content)
    ]);

    // 🤖 AGENTIC AI: Let AI intelligently decide which reminders to create
    let createdReminders = [];
    let syncResults = [];
    
    if (detectedEvents && detectedEvents.length > 0) {
      console.log(`🤖 AI Agent: Detected ${detectedEvents.length} potential events`);
      
      // NEW: AI makes intelligent decisions about reminder creation
      const aiReminders = await createRemindersWithAI(detectedEvents, content);
      console.log(`🤖 AI Agent: Approved ${aiReminders.length} reminders for creation`);
      
      if (aiReminders.length > 0) {
        // Save AI-approved reminders to database
        for (const reminderData of aiReminders) {
          try {
            const reminder = await Reminder.create({
              userId: req.userId,
              journalId: req.params.id,
              title: reminderData.title,
              description: reminderData.description,
              eventDate: reminderData.eventDate,
              originalSentence: reminderData.originalSentence || reminderData.aiMetadata?.reasoning || '',
              status: 'confirmed' // AI auto-confirms
            });
            
            createdReminders.push(reminder);
            console.log(`✅ AI-created reminder: ${reminder.title}`);
          } catch (dbError) {
            console.error(`Failed to save AI reminder "${reminderData.title}":`, dbError.message);
          }
        }
        
        // Sync AI-created reminders to Google Calendar
        syncResults = await syncRemindersToCalendar(req.userId, aiReminders);
        
        // Update reminder status for successfully synced items
        for (const syncResult of syncResults) {
          if (syncResult.synced && syncResult.calendarEventId) {
            const reminder = createdReminders.find(r => r.title === syncResult.title);
            if (reminder) {
              reminder.googleCalendarEventId = syncResult.calendarEventId;
              reminder.status = 'synced';
              await reminder.save();
            }
          }
        }
      }
    }

    // Combine analysis with detected events
    const analysis = {
      productive: aiAnalysis.productive,
      unproductive: aiAnalysis.unproductive,
      rest: aiAnalysis.rest,
      emotional: aiAnalysis.emotional,
      suggestions: aiAnalysis.suggestions,
      sentiment: aiAnalysis.sentiment,
      detectedEvents: detectedEvents,
      aiRemindersCreated: createdReminders.length, // AI-approved and created
      autoSyncedToCalendar: syncResults.filter(r => r.synced).length, // Count synced
      aiDecisionMaking: true // Flag indicating AI made autonomous decisions
    };

    // Save analysis to journal
    journal.analysis = analysis;
    journal.analysisStatus = "ready";
    journal.analysisAt = Date.now();
    await journal.save();

    // Enhanced success message
    let message = "Journal analyzed successfully with AI";
    if (createdReminders.length > 0) {
      const syncedCount = syncResults.filter(r => r.synced).length;
      if (syncedCount > 0) {
        message += ` • AI created ${createdReminders.length} reminder(s) • ${syncedCount} synced to Google Calendar`;
      } else {
        message += ` • AI created ${createdReminders.length} reminder(s)`;
      }
    }

    return res.json({ 
      success: true, 
      message: message, 
      data: analysis 
    });

  } catch (error) {
    console.error('Analysis error:', error);
    return res.status(500).json({ 
      success: false, 
      message: `Analysis failed: ${error.message}`, 
      data: null 
    });
  }
};

module.exports = {
  createJournal,
  getJournals,
  getJournalById,
  updateJournal,
  deleteJournal,
  analyzeJournal
};
