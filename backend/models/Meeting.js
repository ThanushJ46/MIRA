const mongoose = require('mongoose');

const meetingSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: [true, 'Meeting title is required'],
    trim: true
  },
  transcriptText: {
    type: String,
    required: [true, 'Transcript text is required']
  },
  summary: {
    type: String,
    default: null  // AI generated later
  },
  detectedDate: {
    type: Date,
    default: null  // AI extracted later
  }
  // Phase 2: Add fields for flashcards, action items, Google Calendar eventId, etc.
}, {
  timestamps: true  // Automatically adds createdAt and updatedAt
});

module.exports = mongoose.model('Meeting', meetingSchema);
