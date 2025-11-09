const Journal = require('../models/Journal');
const { 
  analyzeJournalWithLlama, 
  detectEventsWithLlama, 
  checkOllamaAvailability 
} = require('../services/ollamaService');

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

    // Use Ollama for AI-powered analysis
    const aiAnalysis = await analyzeJournalWithLlama(content);
    
    // Detect events using Llama3
    const detectedEvents = await detectEventsWithLlama(content);

    // Combine analysis with detected events
    const analysis = {
      productivityScore: aiAnalysis.productivityScore,
      productive: aiAnalysis.productive,
      unproductive: aiAnalysis.unproductive,
      rest: aiAnalysis.rest,
      emotional: aiAnalysis.emotional,
      suggestions: aiAnalysis.suggestions,
      sentiment: aiAnalysis.sentiment,
      detectedEvents: detectedEvents
    };

    // Save analysis to journal
    journal.analysis = analysis;
    journal.analysisStatus = "ready";
    journal.analysisAt = Date.now();
    await journal.save();

    return res.json({ 
      success: true, 
      message: "Journal analyzed successfully with AI", 
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
