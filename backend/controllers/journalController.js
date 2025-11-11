const Journal = require('../models/Journal');
const Reminder = require('../models/Reminder');
const User = require('../models/User');
const { google } = require('googleapis');
const { 
  analyzeJournalWithLlama, 
  detectEventsWithLlama, 
  checkOllamaAvailability 
} = require('../services/ollamaService');

// Helper function to automatically create reminders and sync to calendar
const autoCreateAndSyncReminders = async (userId, journalId, detectedEvents) => {
  try {
    const createdReminders = [];
    
    // Get user to check if they have Google Calendar connected
    const user = await User.findById(userId);
    const hasCalendar = !!user.googleRefreshToken;

    for (const event of detectedEvents) {
      try {
        // Step 1: Create and confirm reminder automatically
        const reminder = await Reminder.create({
          userId: userId,
          journalId: journalId,
          title: event.title,
          description: event.description || event.sentence || '',
          eventDate: new Date(event.date),
          originalSentence: event.sentence || event.description || '',
          status: 'confirmed' // Auto-confirm instead of 'proposed'
        });

        // Step 2: If user has Google Calendar, auto-sync
        if (hasCalendar) {
          try {
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

            // Create calendar event
            const calendarEvent = {
              summary: reminder.title,
              description: reminder.description || `From MIRA Journal\n${reminder.originalSentence}`,
              start: {
                dateTime: reminder.eventDate.toISOString(),
                timeZone: 'UTC',
              },
              end: {
                dateTime: new Date(reminder.eventDate.getTime() + 60 * 60 * 1000).toISOString(), // 1 hour duration
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

            // Update reminder with Google Calendar event ID
            reminder.googleCalendarEventId = response.data.id;
            reminder.status = 'synced';
            await reminder.save();

            createdReminders.push({
              reminder,
              synced: true,
              calendarLink: response.data.htmlLink
            });

            console.log(`✅ Auto-synced to calendar: ${event.title}`);
          } catch (syncError) {
            console.error(`Failed to sync "${event.title}" to calendar:`, syncError.message);
            // Still add to reminders even if calendar sync fails
            createdReminders.push({
              reminder,
              synced: false,
              error: syncError.message
            });
          }
        } else {
          // No calendar connected, just create reminder
          createdReminders.push({
            reminder,
            synced: false,
            reason: 'No Google Calendar connected'
          });
        }
      } catch (reminderError) {
        console.error(`Failed to create reminder for "${event.title}":`, reminderError.message);
      }
    }

    return createdReminders;
  } catch (error) {
    console.error('Auto-create reminders error:', error);
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

    // 🤖 AUTONOMOUS AGENT: Auto-create reminders and sync to calendar
    let autoCreatedReminders = [];
    if (detectedEvents && detectedEvents.length > 0) {
      console.log(`🤖 Agent detected ${detectedEvents.length} events, auto-creating reminders...`);
      autoCreatedReminders = await autoCreateAndSyncReminders(req.userId, req.params.id, detectedEvents);
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
      autoCreatedReminders: autoCreatedReminders.length, // Count of reminders created
      autoSyncedToCalendar: autoCreatedReminders.filter(r => r.synced).length // Count synced
    };

    // Save analysis to journal
    journal.analysis = analysis;
    journal.analysisStatus = "ready";
    journal.analysisAt = Date.now();
    await journal.save();

    // Enhanced success message
    let message = "Journal analyzed successfully with AI";
    if (autoCreatedReminders.length > 0) {
      const syncedCount = autoCreatedReminders.filter(r => r.synced).length;
      if (syncedCount > 0) {
        message += ` • ${autoCreatedReminders.length} reminder(s) created • ${syncedCount} synced to Google Calendar`;
      } else {
        message += ` • ${autoCreatedReminders.length} reminder(s) created`;
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
