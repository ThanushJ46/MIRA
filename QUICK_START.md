# Quick Start Guide - Google Calendar Integration

## 🚀 Get Your Google Calendar Credentials (5 minutes)

### Step 1: Open Google Cloud Console
1. Go to: https://console.cloud.google.com/
2. Sign in with your Google account

### Step 2: Create Project
1. Click the project dropdown (top left, next to "Google Cloud")
2. Click "NEW PROJECT"
3. Name it: `MIRA Journal App`
4. Click "CREATE"
5. Wait for it to finish, then select the project

### Step 3: Enable Google Calendar API
1. In the search bar at top, type: **Google Calendar API**
2. Click on "Google Calendar API" result
3. Click the blue **ENABLE** button
4. Wait for it to enable

### Step 4: Configure OAuth Consent Screen
1. Go to: https://console.cloud.google.com/apis/credentials/consent
2. Select **External** user type
3. Click **CREATE**
4. Fill in required fields:
   - App name: `MIRA Journal`
   - User support email: YOUR EMAIL
   - Developer contact: YOUR EMAIL
5. Click **SAVE AND CONTINUE**
6. Click **SAVE AND CONTINUE** again (skip scopes)
7. Add test users: Click **+ ADD USERS** and enter YOUR EMAIL
8. Click **SAVE AND CONTINUE**
9. Click **BACK TO DASHBOARD**

### Step 5: Create OAuth Client ID
1. Go to: https://console.cloud.google.com/apis/credentials
2. Click **+ CREATE CREDENTIALS** (top)
3. Select **OAuth client ID**
4. Application type: **Web application**
5. Name: `MIRA Backend`
6. Under "Authorized redirect URIs":
   - Click **+ ADD URI**
   - Enter: `http://localhost:5000/api/calendar/callback`
   - ⚠️ **IMPORTANT**: No trailing slash!
7. Click **CREATE**

### Step 6: Copy Your Credentials
You'll see a popup with:
- **Client ID**: Starts with something like `123456789-...apps.googleusercontent.com`
- **Client secret**: Random string like `GOCSPX-...`

**📋 COPY BOTH OF THESE!** You'll need them next.

### Step 7: Update Your .env File
Open `backend/.env` in a text editor and update these lines:

```env
GOOGLE_CLIENT_ID=PASTE_YOUR_CLIENT_ID_HERE
GOOGLE_CLIENT_SECRET=PASTE_YOUR_CLIENT_SECRET_HERE
GOOGLE_REDIRECT_URI=http://localhost:5000/api/calendar/callback
FRONTEND_URL=http://localhost:5173
```

Replace the placeholder text with your actual values from Step 6.

### Step 8: Restart Backend
```powershell
# Stop the backend if running (Ctrl+C)
cd backend
npm run dev
```

## ✅ Test It Out!

### Test 1: Connect Calendar
1. Open http://localhost:5173 in your browser
2. Log in to MIRA
3. Open any journal or create a new one
4. Look for the **"📅 Connect Google Calendar"** button (top right)
5. Click it
6. A new window opens → Sign in with Google
7. Click **Continue** and **Allow** permissions
8. You should see "Google Calendar Connected!" ✓

### Test 2: Create Event from Journal
1. Create a journal entry with text like:
   ```
   Today was productive! I worked on my project.
   I have a meeting tomorrow at 3pm with the team.
   ```
2. Click **"Analyze Journal"**
3. Wait for analysis to complete
4. Look for **"Detected Events"** section
5. You should see: "Meeting with the team" for tomorrow at 3pm
6. Click **"Set Reminder"**
7. Popup asks: "Add to Google Calendar?" → Click **OK**
8. Success! Event is in your calendar ✓

### Test 3: Verify in Google Calendar
1. Open https://calendar.google.com
2. Navigate to tomorrow's date
3. You should see your "Meeting with the team" event at 3pm!

## 🎯 More Test Examples

Try these in your journal to test event detection:

```
I have a dentist appointment next Monday.
```
→ Should detect "Dentist" event next Monday at 9am

```
Call with Sarah tomorrow at 2:30pm.
```
→ Should detect "Call with Sarah" tomorrow at 2:30pm

```
Final exam on December 20th.
```
→ Should detect "Final exam" on Dec 20 at 9am

```
Coffee with Mark in 3 days.
```
→ Should detect "Coffee with Mark" 3 days from now

## 🔧 Troubleshooting

### "redirect_uri_mismatch" Error
- Check that your redirect URI in Google Cloud Console exactly matches:
  ```
  http://localhost:5000/api/calendar/callback
  ```
- No `https://`, no trailing `/`
- Copy-paste to be sure!

### "Please connect your Google Calendar first"
- Make sure you completed "Test 1: Connect Calendar" above
- Check that calendar status shows green checkmark in UI

### Events not detected
- Use event keywords: meeting, appointment, call, exam, etc.
- Use time indicators: tomorrow, next week, at 3pm, etc.
- Example: "I have a **meeting** **tomorrow**" ✓
- Not: "I might do something later" ✗

### "Access blocked: This app's request is invalid"
- Make sure you added your email as a test user (Step 4, substep 7)
- Make sure OAuth consent screen is configured

## 📱 Production Deployment (Later)

When you're ready to deploy:

1. Update redirect URI to your production domain
2. Add production domain to authorized domains in Google Console
3. Update `.env` with production URLs
4. Submit app for Google verification if needed

## 🎉 You're All Set!

The Google Calendar integration is now live. Every time you mention an event in your journal, MIRA can:
1. Detect it automatically
2. Ask if you want to add it to your calendar
3. Create the event in Google Calendar
4. Keep you organized! 📅✨

## 💬 Need Help?

If you run into issues:
1. Check backend logs for detailed error messages
2. Verify all credentials are correct in `.env`
3. Make sure Google Calendar API is enabled
4. Confirm you're using the correct Google account

Happy journaling! 🎊
