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
    res.status(500).json({
      success: false,
      message: error.message,
      data: null
    });
  }
};

// @desc    Get all journals for logged-in user
// @route   GET /api/journals
// @access  Private
const getJournals = async (req, res) => {
  try {
    const journals = await Journal.find({ userId: req.userId }).sort({ date: -1 });
    res.json({
      success: true,
      message: 'Journals retrieved successfully',
      data: journals
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
      data: null
    });
  }
};

// @desc    Get single journal by ID
// @route   GET /api/journals/:id
// @access  Private
const getJournalById = async (req, res) => {
  try {
    const journal = await Journal.findById(req.params.id);

    if (!journal) {
      return res.status(404).json({
        success: false,
        message: 'Journal not found',
        data: null
      });
    }

    // Make sure user owns this journal
    if (journal.userId.toString() !== req.userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this journal',
        data: null
      });
    }

    res.json({
      success: true,
      message: 'Journal retrieved successfully',
      data: journal
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
      data: null
    });
  }
};

// @desc    Update journal
// @route   PUT /api/journals/:id
// @access  Private
const updateJournal = async (req, res) => {
  try {
    const journal = await Journal.findById(req.params.id);

    if (!journal) {
      return res.status(404).json({
        success: false,
        message: 'Journal not found',
        data: null
      });
    }

    // Make sure user owns this journal
    if (journal.userId.toString() !== req.userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this journal',
        data: null
      });
    }

    const { title, content, date, streakCount, summary, insights } = req.body;

    journal.title = title !== undefined ? title : journal.title;
    journal.content = content !== undefined ? content : journal.content;
    journal.date = date !== undefined ? date : journal.date;
    journal.streakCount = streakCount !== undefined ? streakCount : journal.streakCount;
    journal.summary = summary !== undefined ? summary : journal.summary;
    journal.insights = insights !== undefined ? insights : journal.insights;

    const updatedJournal = await journal.save();
    res.json({
      success: true,
      message: 'Journal updated successfully',
      data: updatedJournal
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
      data: null
    });
  }
};

// @desc    Delete journal
// @route   DELETE /api/journals/:id
// @access  Private
const deleteJournal = async (req, res) => {
  try {
    const journal = await Journal.findById(req.params.id);

    if (!journal) {
      return res.status(404).json({
        success: false,
        message: 'Journal not found',
        data: null
      });
    }

    // Make sure user owns this journal
    if (journal.userId.toString() !== req.userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this journal',
        data: null
      });
    }

    await journal.deleteOne();
    res.json({
      success: true,
      message: 'Journal deleted successfully',
      data: null
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
      data: null
    });
  }
};

module.exports = {
  createJournal,
  getJournals,
  getJournalById,
  updateJournal,
  deleteJournal
};
