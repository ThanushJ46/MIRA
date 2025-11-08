const Meeting = require('../models/Meeting');

// @desc    Create new meeting
// @route   POST /api/meetings/create
// @access  Private
const createMeeting = async (req, res) => {
  try {
    const { title, transcriptText, summary, detectedDate } = req.body;

    if (!title || !transcriptText) {
      return res.status(400).json({
        success: false,
        message: 'Please provide title and transcript text',
        data: null
      });
    }

    const meeting = await Meeting.create({
      userId: req.userId,
      title,
      transcriptText,
      summary: summary || null,
      detectedDate: detectedDate || null
    });

    // Phase 2: Process transcript with AI to generate summary and flashcards
    // Phase 2: Detect future meeting dates from transcript
    // Phase 2: Add to Google Calendar if requested

    res.status(201).json({
      success: true,
      message: 'Meeting created successfully',
      data: meeting
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
      data: null
    });
  }
};

// @desc    Get all meetings for logged-in user
// @route   GET /api/meetings
// @access  Private
const getMeetings = async (req, res) => {
  try {
    const meetings = await Meeting.find({ userId: req.userId }).sort({ createdAt: -1 });
    res.json({
      success: true,
      message: 'Meetings retrieved successfully',
      data: meetings
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
      data: null
    });
  }
};

// @desc    Get single meeting by ID
// @route   GET /api/meetings/:id
// @access  Private
const getMeetingById = async (req, res) => {
  try {
    const meeting = await Meeting.findById(req.params.id);

    if (!meeting) {
      return res.status(404).json({
        success: false,
        message: 'Meeting not found',
        data: null
      });
    }

    // Make sure user owns this meeting
    if (meeting.userId.toString() !== req.userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this meeting',
        data: null
      });
    }

    res.json({
      success: true,
      message: 'Meeting retrieved successfully',
      data: meeting
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
      data: null
    });
  }
};

// @desc    Update meeting
// @route   PUT /api/meetings/:id
// @access  Private
const updateMeeting = async (req, res) => {
  try {
    const meeting = await Meeting.findById(req.params.id);

    if (!meeting) {
      return res.status(404).json({
        success: false,
        message: 'Meeting not found',
        data: null
      });
    }

    // Make sure user owns this meeting
    if (meeting.userId.toString() !== req.userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this meeting',
        data: null
      });
    }

    const { title, transcriptText, summary, detectedDate } = req.body;

    meeting.title = title !== undefined ? title : meeting.title;
    meeting.transcriptText = transcriptText !== undefined ? transcriptText : meeting.transcriptText;
    meeting.summary = summary !== undefined ? summary : meeting.summary;
    meeting.detectedDate = detectedDate !== undefined ? detectedDate : meeting.detectedDate;

    const updatedMeeting = await meeting.save();
    res.json({
      success: true,
      message: 'Meeting updated successfully',
      data: updatedMeeting
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
      data: null
    });
  }
};

// @desc    Delete meeting
// @route   DELETE /api/meetings/:id
// @access  Private
const deleteMeeting = async (req, res) => {
  try {
    const meeting = await Meeting.findById(req.params.id);

    if (!meeting) {
      return res.status(404).json({
        success: false,
        message: 'Meeting not found',
        data: null
      });
    }

    // Make sure user owns this meeting
    if (meeting.userId.toString() !== req.userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this meeting',
        data: null
      });
    }

    await meeting.deleteOne();
    res.json({
      success: true,
      message: 'Meeting deleted successfully',
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
  createMeeting,
  getMeetings,
  getMeetingById,
  updateMeeting,
  deleteMeeting
};
