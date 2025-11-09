const { google } = require('googleapis');
const User = require('../models/User');

// Initialize OAuth2 client
const getOAuth2Client = () => {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );
};

// @desc    Get Google OAuth URL for calendar access
// @route   GET /api/calendar/auth
// @access  Private
const getAuthUrl = async (req, res) => {
  try {
    const oauth2Client = getOAuth2Client();

    const scopes = [
      'https://www.googleapis.com/auth/calendar.events',
      'https://www.googleapis.com/auth/calendar'
    ];

    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      prompt: 'consent',
      state: req.userId // Pass user ID in state to identify user after redirect
    });

    res.json({
      success: true,
      message: 'Authorization URL generated',
      data: {
        authUrl,
        instructions: 'Open this URL in your browser to authorize Google Calendar access'
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
      data: null
    });
  }
};

// @desc    Handle Google OAuth callback
// @route   GET /api/calendar/callback
// @access  Public (but requires valid state parameter)
const handleCallback = async (req, res) => {
  try {
    const { code, state } = req.query;

    if (!code || !state) {
      return res.status(400).json({
        success: false,
        message: 'Missing authorization code or state',
        data: null
      });
    }

    const oauth2Client = getOAuth2Client();

    // Exchange code for tokens
    const { tokens } = await oauth2Client.getToken(code);
    
    // Store refresh token in user's account
    const user = await User.findById(state);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
        data: null
      });
    }

    user.googleRefreshToken = tokens.refresh_token;
    user.googleAccessToken = tokens.access_token;
    await user.save();

    // Redirect to frontend success page
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/calendar-connected?success=true`);
  } catch (error) {
    console.error('OAuth callback error:', error);
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/calendar-connected?success=false&error=${encodeURIComponent(error.message)}`);
  }
};

// @desc    Check if user has connected Google Calendar
// @route   GET /api/calendar/status
// @access  Private
const getCalendarStatus = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('googleRefreshToken');

    res.json({
      success: true,
      message: 'Calendar status retrieved',
      data: {
        connected: !!user.googleRefreshToken,
        hasAccess: !!user.googleRefreshToken
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
      data: null
    });
  }
};

// @desc    Disconnect Google Calendar
// @route   POST /api/calendar/disconnect
// @access  Private
const disconnectCalendar = async (req, res) => {
  try {
    const user = await User.findById(req.userId);

    user.googleRefreshToken = null;
    user.googleAccessToken = null;
    await user.save();

    res.json({
      success: true,
      message: 'Google Calendar disconnected successfully',
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
  getAuthUrl,
  handleCallback,
  getCalendarStatus,
  disconnectCalendar
};
