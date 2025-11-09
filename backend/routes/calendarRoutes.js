const express = require('express');
const router = express.Router();
const {
  getAuthUrl,
  handleCallback,
  getCalendarStatus,
  disconnectCalendar
} = require('../controllers/calendarController');
const { protect } = require('../middleware/authMiddleware');

// Get OAuth URL (protected)
router.get('/auth', protect, getAuthUrl);

// Handle OAuth callback (public - Google redirects here)
router.get('/callback', handleCallback);

// Check connection status
router.get('/status', protect, getCalendarStatus);

// Disconnect calendar
router.post('/disconnect', protect, disconnectCalendar);

module.exports = router;
