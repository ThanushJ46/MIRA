# MIRA - Mindful Intelligent Reflective Assistant

**An AI-Powered Personal Journaling Application**

MIRA is a personal journaling web application that uses a local AI model (Llama3) to automatically analyze your journal entries, extract insights, detect future events, and create calendar reminders autonomously.

## 🤖 AI Features (What Actually Works)

- **Auto-Save**: Automatically saves journals 2 seconds after you stop typing
- **Auto-Analysis**: Automatically analyzes journals 5 seconds after you stop typing using local Llama3 LLM
- **Semantic Event Detection**: AI detects future events from natural language (meetings, appointments, deadlines)
- **Autonomous Reminder Creation**: AI automatically creates reminders from detected events—no manual confirmation needed
- **Automatic Calendar Sync**: If Google Calendar is connected, reminders auto-sync without asking
- **Semantic Understanding**: Uses Llama3 for deep semantic analysis, not keyword matching

## ✨ Core Features

- **User Authentication**: JWT-based secure signup/login system with bcrypt password hashing
- **Daily Journaling**: Create, read, update, and delete journal entries with streak tracking
- **AI Journal Analysis** (via Ollama + Llama3 8B):
  - Productive, unproductive, and restful activities categorization
  - Emotional state detection
  - Personalized suggestions (3-5 actionable recommendations)
  - Overall sentiment analysis (positive/neutral/negative)
- **Smart Event Detection**: Detects events from natural language:
  - "I have a meeting tomorrow at 3pm" ✓
  - "Dentist appointment on December 12 at 10am" ✓
  - "Submit report by Friday at 5pm" ✓
  - Ignores vague mentions without dates
- **Google Calendar Integration** (Optional): 
  - OAuth 2.0 secure authentication (tokens stored per-user in MongoDB)
  - Automatic event sync to Google Calendar
  - Connection status indicator
  - Each developer needs their own Google Cloud credentials
- **Vanilla JavaScript Frontend**: Pure HTML/CSS/JavaScript with hash-based routing, no build tools needed
- **Protected Routes**: Automatic redirect to login for unauthenticated users

## 🛠 Tech Stack

**Backend:**
- Node.js + Express.js
- MongoDB Atlas + Mongoose ODM
- JWT Authentication (30-day expiration)
- bcryptjs for password hashing
- **Ollama + Llama3 8B** (local LLM for AI analysis)
- Google Calendar API v3 (OAuth 2.0 + googleapis)

**Frontend (Active - In Production):**
- **frontend-vanilla/** - Pure HTML5, CSS3, Vanilla JavaScript (ES6+)
- Hash-based SPA routing (#/login, #/journals, #/journal/:id)
- Native Fetch API for HTTP requests
- Zero dependencies, no build tools required
- Served directly by Express at http://localhost:5000

**Frontend (Archived - Not Used):**
- **frontend/** - React 18 + Vite + TailwindCSS
- Status: Completely disconnected, not served by backend
- Can be deleted or archived

## 📂 Project Structure

```
/MIRA
├── backend/
│   ├── config/
│   │   └── db.js                 # MongoDB Atlas connection
│   ├── models/
│   │   ├── User.js               # User schema (email, password, Google OAuth tokens)
│   │   ├── Journal.js            # Journal schema (title, content, AI analysis results)
│   │   ├── Reminder.js           # Reminder schema (event details, calendar sync status)
│   │   └── Meeting.js            # Meeting schema (BACKEND ONLY - no UI yet)
│   ├── routes/
│   │   ├── authRoutes.js         # Auth endpoints
│   │   ├── journalRoutes.js      # Journal CRUD + AI analysis
│   │   ├── reminderRoutes.js     # Reminder management
│   │   ├── calendarRoutes.js     # Google Calendar OAuth & sync
│   │   └── meetingRoutes.js      # Meeting CRUD (API only - no frontend)
│   ├── controllers/
│   │   ├── authController.js     # Signup, login, getMe
│   │   ├── journalController.js  # Journal CRUD + AI analysis + auto-reminders
│   │   ├── reminderController.js # Reminder CRUD + calendar sync
│   │   ├── calendarController.js # OAuth flow + Calendar API integration
│   │   └── meetingController.js  # Meeting CRUD (no AI processing yet)
│   ├── services/
│   │   └── ollamaService.js      # Llama3 AI integration (analysis + event detection)
│   ├── middleware/
│   │   └── authMiddleware.js     # JWT protection middleware
│   ├── .env                      # Environment variables (NOT in git)
│   ├── .env.example              # Template for environment setup
│   ├── package.json              # Backend dependencies
│   └── server.js                 # Express server (serves vanilla frontend)
│
├── frontend-vanilla/             # ACTIVE FRONTEND (in production)
│   ├── js/
│   │   ├── pages/
│   │   │   ├── landing.js        # Landing page
│   │   │   ├── login.js          # Login/signup page
│   │   │   ├── journals.js       # Journal list with streak tracking
│   │   │   ├── journal-view.js   # Journal editor + auto-save + auto-analyze
│   │   │   └── calendar-connected.js # OAuth success page
│   │   ├── api.js                # Fetch API client with JWT auth
│   │   ├── auth.js               # Auth utilities
│   │   ├── router.js             # Hash-based SPA routing
│   │   └── app.js                # Main application
│   ├── home/
│   │   ├── home.html             # Homepage
│   │   ├── home.css              # Homepage styles
│   │   └── home.js               # Homepage logic
│   ├── index.html                # Main HTML entry point
│   └── styles.css                # Global styles
│
└── frontend/                     # ARCHIVED - NOT IN USE
    ├── src/                      # React app (completely disconnected)
    ├── package.json              # React dependencies (unused)
    └── ...                       # Can be deleted or archived
```

## 📋 Setup Instructions

### Prerequisites

**Required:**
- Node.js (v18 or higher)
- MongoDB Atlas account (free tier works fine)
- **Ollama installed locally** with Llama3 model
- Google Cloud Console account (for Calendar API - optional but recommended)

**Install Ollama and Llama3:**
1. Download Ollama from [https://ollama.ai](https://ollama.ai)
2. Install and run Ollama
3. Pull Llama3 model:
   ```powershell
   ollama pull llama3
   ```
4. Verify it's running:
   ```powershell
   ollama list
   ```

### Backend Setup

**1. Install Dependencies**

```powershell
cd backend
npm install
```

**2. Configure Environment Variables**

Create `backend/.env` file (see `backend/.env.example` for template):

```env
PORT=5000

# MongoDB Atlas Connection
MONGO_URI=mongodb+srv://<username>:<password>@<cluster-url>/mira?retryWrites=true&w=majority

# JWT Secret (generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
JWT_SECRET=your_secure_jwt_secret_here_min_32_characters

# Google Calendar OAuth 2.0 (EACH DEVELOPER NEEDS THEIR OWN)
GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=http://localhost:5000/api/calendar/callback
```

**Important Security Note:**
- OAuth tokens are stored **per-user** in MongoDB (User.googleRefreshToken, User.googleAccessToken)
- Credentials are **NOT hardcoded** in the source code
- Each developer must create their own Google Cloud project credentials
- Each user connects their own Google Calendar account

**Get Google Calendar Credentials:**
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project (e.g., "MIRA-Dev")
3. Enable "Google Calendar API"
4. Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client ID"
5. Application type: Web application
6. Authorized redirect URIs: `http://localhost:5000/api/calendar/callback`
7. Copy Client ID and Client Secret to `.env`

**3. Run Backend Server**

```powershell
cd backend
npm run dev
```

Server runs on `http://localhost:5000` and serves the frontend at the same URL.

### Frontend Setup

**The vanilla frontend requires NO setup** - it's served directly by the backend.

Just open your browser to `http://localhost:5000` after starting the backend.

**No npm install, no build step, no separate dev server needed!**

## 🔌 API Endpoints

### Authentication (Public)
- `POST /api/auth/signup` - Register new user (name, email, password)
- `POST /api/auth/login` - Login and get JWT token (30-day expiration)

### Authentication (Protected)
- `GET /api/auth/me` - Get current user info

### Journals (All Protected)
- `POST /api/journals/create` - Create journal entry
- `GET /api/journals` - Get all user journals (sorted by date, descending)
- `GET /api/journals/:id` - Get specific journal
- `PUT /api/journals/:id` - Update journal
- `DELETE /api/journals/:id` - Delete journal
- `POST /api/journals/:id/analyze` - **AI analysis + auto-create reminders + auto-sync to calendar**

### Reminders (All Protected)
- `POST /api/reminders/propose` - Create reminder manually
- `POST /api/reminders/:id/confirm` - Confirm proposed reminder
- `GET /api/reminders` - Get all user reminders (sorted by event date)
- `DELETE /api/reminders/:id` - Delete reminder
- `POST /api/reminders/:id/sync-to-calendar` - Manually sync reminder to Google Calendar

### Google Calendar (Protected + Public Callback)
- `GET /api/calendar/auth` - Get Google OAuth authorization URL
- `GET /api/calendar/callback` - OAuth callback handler (public - Google redirects here)
- `GET /api/calendar/status` - Check calendar connection status
- `POST /api/calendar/disconnect` - Disconnect Google Calendar (removes tokens)

### Meetings (All Protected - No Frontend UI Yet)
- `POST /api/meetings/create` - Create meeting with transcript
- `GET /api/meetings` - Get all user meetings
- `GET /api/meetings/:id` - Get specific meeting
- `PUT /api/meetings/:id` - Update meeting
- `DELETE /api/meetings/:id` - Delete meeting

### Health Check (Public)
- `GET /api/health` - Check backend status

## 🌐 Frontend Routes (Hash-Based Routing)

- `#/` - Landing page (unauthenticated) or redirects to `#/journals` (authenticated)
- `#/login` - Login/Signup page (public)
- `#/journals` - List all journals with streak tracking (protected)
- `#/journal/new` - Create new journal entry (protected)
- `#/journal/:id` - View/edit journal with AI analysis (protected)
- `#/calendar-connected` - Google Calendar OAuth callback success page (protected)

All routes automatically redirect to `#/login` if user is not authenticated.

## 🚀 How It Works (AI Workflow)

### The Autonomous Workflow:

1. **User writes journal** (e.g., "I have a team meeting tomorrow at 3pm to discuss the final year project")
2. **Auto-save triggers** after 2 seconds of inactivity → saves to MongoDB
3. **Auto-analyze triggers** after 5 seconds of inactivity:
   - Two parallel AI calls to Llama3 (50% faster than sequential):
     - Call 1: Analyze activities, emotions, sentiment
     - Call 2: Detect future events with specific dates
4. **AI Agent autonomously**:
   - Creates reminders in database (auto-confirmed)
   - If Google Calendar connected → syncs events to calendar
   - Returns complete analysis results
5. **User sees results** displayed below journal editor—no button clicking needed

### Example Analysis Output:

**User writes:**
```
Had a productive day today. Completed the machine learning assignment 
and attended the AI seminar. Spent 2 hours scrolling Instagram which 
was a waste of time. Did a 30-minute jog in the morning. Feeling 
energized but stressed about the upcoming deadline. Team standup 
meeting is scheduled for tomorrow at 10am to discuss sprint progress.
```

**AI Returns:**
```json
{
  "productive": [
    "Completed the machine learning assignment",
    "Attended the AI seminar"
  ],
  "unproductive": [
    "Spent 2 hours scrolling Instagram"
  ],
  "rest": [
    "30-minute jog in the morning"
  ],
  "emotional": [
    "Energized",
    "Stressed"
  ],
  "suggestions": [
    "Consider time-blocking to reduce social media usage during work hours",
    "Maintain exercise routine for stress management",
    "Break down the upcoming deadline into smaller tasks to reduce anxiety"
  ],
  "sentiment": "positive",
  "detectedEvents": [
    {
      "title": "Team standup meeting",
      "date": "2025-11-12T10:00:00Z",
      "description": "Discuss sprint progress",
      "type": "meeting"
    }
  ],
  "autoCreatedReminders": 1,
  "autoSyncedToCalendar": 1
}
```

## 📖 Usage Guide

### 1. First Time Setup
- Navigate to `http://localhost:5000`
- Sign up with name, email, and password
- Login to access journals

### 2. Connecting Google Calendar (Optional - One-time)
- Click "Connect Google Calendar" button
- Authorize MIRA in Google OAuth screen
- Once connected, future events auto-sync without asking

### 3. Writing a Journal
- Click "New Entry" or navigate to `#/journal/new`
- Write naturally: "Had a productive day. Completed the coding assignment. Team standup tomorrow at 10am."
- **Auto-save**: Wait 2 seconds → Journal saves automatically (you'll see "Saved" indicator)
- **Auto-analyze**: Wait 5 more seconds → AI analyzes content (you'll see loading spinner)

### 4. Viewing AI Analysis
- Scroll down below the editor to see:
  - **Productive activities** - Work, study, exercise, goal-oriented tasks
  - **Unproductive activities** - Time-wasting (only if you mention it negatively)
  - **Restful activities** - Sleep, breaks, intentional relaxation
  - **Emotional states** - Feelings detected from your writing
  - **Personalized suggestions** - 3-5 actionable recommendations
  - **Detected events** - Future events with dates automatically found
- **No button clicking needed** - everything happens automatically

### 5. Managing Reminders
- View all reminders on the journals page
- Reminders show event date, title, and sync status
- Delete reminders if no longer needed
- If calendar connected, events already synced automatically

### 6. Supported Natural Language Formats
The AI understands various date/time expressions:
- **Relative dates**: "tomorrow", "next Monday", "in 5 days", "this Friday"
- **Absolute dates**: "December 12", "Nov 15th", "12 of December", "on Friday"
- **With time**: "at 3pm", "at 10:30am", "2:00 PM"
- **Complete sentences**: "I have a dentist appointment on Friday at 2pm"
- **Deadlines**: "Assignment due next Tuesday", "Submit report by Friday at 5pm"

**What AI Ignores:**
- Vague mentions: "I have a test" (no specific date)
- Past events: "I went to the doctor" (already happened)
- Non-events: "I should study" (not a scheduled event)

## 🔒 Security Features

- **JWT Authentication**: Secure token-based auth with 30-day expiration
- **Password Hashing**: bcryptjs with salt rounds (10 rounds)
- **Google OAuth 2.0**: Industry-standard OAuth flow
- **Per-User Token Storage**: OAuth tokens stored in MongoDB per user (NOT hardcoded)
- **Environment Variables**: Sensitive keys in `.env` (excluded from git via `.gitignore`)
- **Protected Routes**: Backend JWT middleware + frontend route guards
- **Refresh Tokens**: Google refresh tokens stored securely, used to get new access tokens
- **Each Developer**: Must create their own Google Cloud credentials
- **Each User**: Connects their own Google Calendar account independently

## ⚡ Performance Details

**AI Analysis Speed (with GPU - RTX 4050):**
- Journal semantic analysis: ~3-5 seconds
- Event detection: ~2-3 seconds
- **Parallel execution**: Both run simultaneously → total ~5 seconds (not 8 seconds)
- Temperature: 0.15 for precise extraction

**Without Ollama Running:**
- Returns 503 error: "Ollama service not available. Please ensure Ollama is running and llama3 model is installed."
- App still works for writing/saving journals
- AI analysis just won't be available until Ollama is started

**Auto-Save/Auto-Analyze Timers:**
- Auto-save debounce: 2 seconds
- Auto-analyze debounce: 5 seconds
- Skips initial load (prevents unnecessary API calls)

## 🏗 Architecture Highlights

- **Modular MVC Pattern**: Controllers, routes, models cleanly separated
- **Auto-save/Auto-analyze**: Debounced timers prevent excessive API calls
- **Parallel AI Calls**: Promise.all() runs both Llama3 analyses simultaneously (50% faster)
- **Llama3 Integration**: Local LLM via Ollama for complete privacy—no data sent to external APIs
- **Semantic NLP**: Deep language understanding, not regex or keyword matching
- **Event Detection**: AI-powered date/time parsing with relative date conversion
- **Google Calendar**: Persistent access via OAuth 2.0 refresh tokens (stored per-user)
- **Error Handling**: Try-catch blocks with user-friendly error messages
- **CORS Enabled**: Secure frontend-backend communication (configured for localhost)
- **Hash Routing**: SPA-style routing without page reloads
- **Static File Serving**: Express serves vanilla frontend directly (no separate server needed)

## ✅ What Works (Features Actually Implemented)

- ✅ User signup and login with JWT authentication
- ✅ Create, read, update, delete journal entries
- ✅ Streak tracking for consecutive journaling days
- ✅ Auto-save (2 seconds after typing stops)
- ✅ Auto-analyze (5 seconds after typing stops)
- ✅ AI semantic analysis of journal content (Llama3)
- ✅ Productive/unproductive/restful activity extraction
- ✅ Emotional state detection
- ✅ Personalized suggestions (3-5 recommendations)
- ✅ Overall sentiment analysis
- ✅ Future event detection from natural language
- ✅ Autonomous reminder creation (auto-confirmed)
- ✅ Google Calendar OAuth 2.0 connection
- ✅ Automatic calendar sync for detected events
- ✅ Manual reminder deletion
- ✅ Calendar connection status indicator
- ✅ Calendar disconnect functionality
- ✅ Protected routes with authentication
- ✅ Vanilla JavaScript frontend (no build tools)
- ✅ Hash-based SPA routing
- ✅ Meeting CRUD backend API


## 📊 Database Schema

**User Model:**
- `name`: String (required)
- `email`: String (required, unique, validated)
- `password`: String (required, hashed with bcrypt)
- `googleRefreshToken`: String (optional, null if not connected)
- `googleAccessToken`: String (optional, null if not connected)
- `timestamps`: createdAt, updatedAt

**Journal Model:**
- `userId`: ObjectId (reference to User)
- `title`: String (optional)
- `content`: String (required)
- `date`: Date (defaults to current date)
- `streakCount`: Number (defaults to 0)
- `summary`: String (optional, AI-generated)
- `insights`: String (optional, AI-generated)
- `timestamps`: createdAt, updatedAt

**Reminder Model:**
- `userId`: ObjectId (reference to User)
- `journalId`: ObjectId (reference to Journal, optional)
- `title`: String (required)
- `description`: String (optional)
- `eventDate`: Date (required)
- `status`: String (enum: 'proposed', 'confirmed', 'synced', 'cancelled')
- `googleCalendarEventId`: String (optional, null if not synced)
- `originalSentence`: String (optional, extracted from journal)
- `timestamps`: createdAt, updatedAt

**Meeting Model:**
- `userId`: ObjectId (reference to User)
- `title`: String (required)
- `transcriptText`: String (required)
- `summary`: String (optional, null - Phase 2)
- `detectedDate`: Date (optional, null - Phase 2)
- `timestamps`: createdAt, updatedAt

## 🐛 Troubleshooting

**Issue: "Ollama service not available" error**
- Solution: Start Ollama service (`ollama serve`)
- Verify Llama3 is installed: `ollama list`
- If not installed: `ollama pull llama3`

**Issue: Frontend shows 404 error**
- Solution: Ensure `backend/server.js` serves `frontend-vanilla/` directory
- Check that backend is running on port 5000
- Verify you're accessing `http://localhost:5000` (not 5173)

**Issue: Google Calendar connection fails**
- Solution: Check `.env` has correct GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET
- Verify redirect URI in Google Cloud Console matches: `http://localhost:5000/api/calendar/callback`
- Ensure Google Calendar API is enabled in Google Cloud Console

**Issue: Auto-save/Auto-analyze not triggering**
- Solution: Wait full 2 seconds (save) or 5 seconds (analyze) without typing
- Check browser console for errors
- Verify Ollama is running for auto-analyze

**Issue: JWT token expired**
- Solution: Logout and login again (tokens expire after 30 days)

## 🤝 Contributing

This is an academic AI project demonstrating autonomous agent capabilities. Contributions welcome for:
- Improving AI prompt engineering for better semantic analysis
- Adding more calendar providers (Outlook, Apple Calendar)
- Enhanced natural language event detection
- Meeting transcript AI processing (Phase 2)
- UI/UX improvements
- Mobile responsive design
- Export/import features

## 📄 License

MIT License - Free to use for learning and development

## 👨‍💻 Built With

**AI & Machine Learning:**
- Ollama (local LLM runtime)
- Llama3 8B (Meta's language model)

**Backend:**
- Node.js + Express.js
- MongoDB Atlas + Mongoose ODM
- Google Calendar API v3

**Frontend:**
- Vanilla JavaScript (ES6+)
- HTML5 + CSS3
- Native Fetch API

**Authentication & Security:**
- JSON Web Tokens (JWT)
- bcryptjs
- Google OAuth 2.0

---

**MIRA** - *Mindful Intelligent Reflective Assistant*  
*An AI-powered journaling app with autonomous event detection and calendar integration*
