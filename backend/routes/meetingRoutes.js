const express = require('express');
const router = express.Router();
const {
  createMeeting,
  getMeetings,
  getMeetingById,
  updateMeeting,
  deleteMeeting
} = require('../controllers/meetingController');
const { protect } = require('../middleware/authMiddleware');

// All meeting routes are protected
router.post('/create', protect, createMeeting);
router.get('/', protect, getMeetings);
router.get('/:id', protect, getMeetingById);
router.put('/:id', protect, updateMeeting);
router.delete('/:id', protect, deleteMeeting);

module.exports = router;
