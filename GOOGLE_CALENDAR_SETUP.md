# Google Calendar Integration Setup Guide

This guide will help you set up Google Calendar integration for the MIRA journaling app.

## Prerequisites
- Google account
- MIRA backend and frontend running

## Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click "Select a project" → "New Project"
3. Enter project name (e.g., "MIRA Journal App")
4. Click "Create"

## Step 2: Enable Google Calendar API

1. In the Google Cloud Console, select your project
2. Go to "APIs & Services" → "Library"
3. Search for "Google Calendar API"
4. Click on it and click "Enable"

## Step 3: Create OAuth 2.0 Credentials

1. Go to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "OAuth client ID"
3. If prompted, configure the OAuth consent screen:
   - User Type: External
   - App name: MIRA Journal
   - User support email: your email
   - Developer contact: your email
   - Click "Save and Continue"
   - Scopes: Skip for now
   - Test users: Add your email
   - Click "Save and Continue"

4. Now create the OAuth Client ID:
   - Application type: Web application
   - Name: MIRA Backend
   - Authorized redirect URIs: `http://localhost:5000/api/calendar/callback`
   - Click "Create"

5. **Copy the Client ID and Client Secret** - you'll need these!

## Step 4: Update Backend .env File

Open `backend/.env` and add:

```env
GOOGLE_CLIENT_ID=your_client_id_here
GOOGLE_CLIENT_SECRET=your_client_secret_here
GOOGLE_REDIRECT_URI=http://localhost:5000/api/calendar/callback
FRONTEND_URL=http://localhost:5173
```

Replace `your_client_id_here` and `your_client_secret_here` with the values from Step 3.

## Step 5: Restart Backend Server

```powershell
cd backend
npm run dev
```

## Step 6: Connect Your Google Calendar

### Method 1: Via API (Recommended for Testing)

1. Make sure you're logged into the app
2. Send a GET request to get the authorization URL:

```bash
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" http://localhost:5000/api/calendar/auth
```

3. Open the returned `authUrl` in your browser
4. Sign in with your Google account
5. Grant permissions to access your calendar
6. You'll be redirected back to the app with success message

### Method 2: Via Frontend (Coming Soon)

A frontend UI will be added to make this easier.

## Step 7: Test Event Creation

1. Create a journal entry with text like: "I have a meeting tomorrow at 3pm"
2. Click "Analyze Journal"
3. You should see the detected event in "Detected Events"
4. Click "Set Reminder" to create it in your local database
5. Then click "Sync to Google Calendar" (or use the API endpoint)

## API Endpoints Reference

### Get Authorization URL
```
GET /api/calendar/auth
Headers: Authorization: Bearer <token>
Response: { authUrl: "https://accounts.google.com/..." }
```

### Check Calendar Connection Status
```
GET /api/calendar/status
Headers: Authorization: Bearer <token>
Response: { connected: true/false }
```

### Sync Reminder to Calendar
```
POST /api/reminders/:reminderId/sync-to-calendar
Headers: Authorization: Bearer <token>
Response: { reminder: {...}, calendarEventLink: "https://..." }
```

### Disconnect Calendar
```
POST /api/calendar/disconnect
Headers: Authorization: Bearer <token>
```

## Event Detection Examples

The system can detect events from natural language in your journal:

- "I have a meeting tomorrow" → Creates event for tomorrow at 9 AM
- "I have a meeting tomorrow at 3pm" → Creates event for tomorrow at 3 PM
- "Dentist appointment next Monday" → Creates event for next Monday at 9 AM
- "Interview on December 25" → Creates event for Dec 25 at 9 AM
- "Call with Sarah in 3 days" → Creates event 3 days from now

## Troubleshooting

### Error: "redirect_uri_mismatch"
- Make sure the redirect URI in Google Cloud Console exactly matches `http://localhost:5000/api/calendar/callback`
- No trailing slash!

### Error: "Please connect your Google Calendar first"
- You need to complete the OAuth flow first (Step 6)

### Error: "Invalid credentials"
- Check that GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env are correct
- Make sure there are no extra spaces or quotes

### Events not detected
- Make sure to use future time indicators (tomorrow, next week, etc.)
- Include event keywords (meeting, appointment, call, etc.)

## Security Notes

- Never commit your `.env` file to git
- The Google refresh token is stored securely in the database
- Only the user who authorized can access their calendar
- Tokens are encrypted at rest in MongoDB

## Production Deployment

For production, you'll need to:

1. Update redirect URI to your production domain
2. Add production domain to authorized domains in Google Cloud Console
3. Submit your app for verification if using sensitive scopes
4. Use environment variables for all credentials

## Need Help?

If you encounter issues:
1. Check the backend logs for detailed error messages
2. Verify all credentials are correct
3. Make sure Google Calendar API is enabled
4. Check that you're using the correct Google account
