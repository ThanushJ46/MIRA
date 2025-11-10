# MIRA - Mindful Intelligent Reflective Assistant

**An Agentic AI-Powered Journal Application**

MIRA is a productivity web application that combines daily journaling with autonomous AI capabilities. The AI agent automatically analyzes your journals, detects events, creates reminders, and syncs them to Google Calendar—all without asking for permission.

## 🤖 Agentic AI Features

- **Autonomous Auto-Save**: Automatically saves journals after 2 seconds of inactivity
- **Autonomous AI Analysis**: Automatically analyzes journals after 5 seconds using local Llama3 LLM
- **Autonomous Event Detection**: AI detects events from natural language (meetings, appointments, deadlines)
- **Autonomous Reminder Creation**: AI creates reminders automatically—no confirmation needed
- **Autonomous Calendar Sync**: AI syncs events to Google Calendar without asking
- **Semantic Understanding**: Uses Llama3 for deep semantic analysis, not just keyword matching

## ✨ Core Features

- **User Authentication**: JWT-based secure signup/login system
- **Daily Journaling**: Create, read, update, and delete journal entries with streak tracking
- **AI Journal Analysis** (via Ollama Llama3):
  - Productive, unproductive, and restful activities categorization
  - Emotional state detection
  - Personalized suggestions
  - Overall sentiment analysis
- **Smart Event Detection**: Detects events from natural language:
  - "I have a meeting tomorrow at 3pm"
  - "Dentist appointment on December 12 at 10am"
  - "Submit report by Friday at 5pm"
- **Google Calendar Integration**: 
  - OAuth 2.0 secure authentication
  - Automatic event sync to Google Calendar
  - Connection status indicator
- **Modern UI**: Beautiful, responsive design with TailwindCSS
- **Protected Routes**: Automatic redirect to login for unauthenticated users

## 🛠 Tech Stack

**Backend:**
- Node.js + Express.js
- MongoDB + Mongoose (Cloud: MongoDB Atlas)
- JWT Authentication
- bcryptjs for password hashing
- **Ollama + Llama3** (local LLM for AI analysis)
- Google Calendar API (OAuth 2.0 + googleapis)

**Frontend:**
- React 18 with Vite
- TailwindCSS for modern UI styling
- React Router for navigation
- Axios for API requests
- localStorage for JWT token management
- Lucide React for icons

## Project Structure

```
/MIRA
├── backend/
│   ├── config/
│   │   └── db.js                 # MongoDB connection
│   ├── models/
│   │   ├── User.js               # User schema with Google tokens
│   │   ├── Journal.js            # Journal schema with analysis
│   │   ├── Reminder.js           # Reminder schema with Calendar sync
│   │   └── Meeting.js            # Meeting schema
│   ├── routes/
│   │   ├── authRoutes.js         # Auth endpoints
│   │   ├── journalRoutes.js      # Journal CRUD + AI analysis
│   │   ├── reminderRoutes.js     # Reminder management
│   │   ├── calendarRoutes.js     # Google Calendar OAuth & sync
│   │   └── meetingRoutes.js      # Meeting CRUD
│   ├── controllers/
│   │   ├── authController.js     # Auth logic
│   │   ├── journalController.js  # Journal + AI analysis + auto-reminders
│   │   ├── reminderController.js # Reminder CRUD
│   │   ├── calendarController.js # OAuth flow + Calendar API
│   │   └── meetingController.js  # Meeting logic
│   ├── services/
│   │   └── ollamaService.js      # Llama3 AI integration
│   ├── middleware/
│   │   └── authMiddleware.js     # JWT protection
│   ├── .env                      # Environment variables (NOT in git)
│   ├── package.json              # Dependencies
│   └── server.js                 # Main Express server
│
└── frontend/
    ├── src/
    │   ├── components/
    │   │   └── ProtectedRoute.jsx    # Auth guard
    │   ├── pages/
    │   │   ├── Login.jsx              # Login/Signup page
    │   │   ├── JournalsList.jsx       # Journals list with streak
    │   │   ├── JournalView.jsx        # Journal editor + AI analysis
    │   │   └── CalendarConnected.jsx  # OAuth callback page
    │   ├── services/
    │   │   └── api.js                 # Axios API client with auth
    │   ├── utils/
    │   │   └── auth.js                # Auth helpers
    │   ├── App.jsx                    # Main app with routes
    │   ├── main.jsx                   # Entry point
    │   └── index.css                  # Tailwind styles
    ├── package.json                   # Dependencies
    ├── tailwind.config.js             # Tailwind config
    └── vite.config.js                 # Vite config
```

## 📋 Setup Instructions

### Prerequisites

**Required:**
- Node.js (v18 or higher)
- MongoDB Atlas account (free tier)
- **Ollama installed locally** with Llama3 model
- Google Cloud Console account (for Calendar API)

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

Create `backend/.env` file:

```env
PORT=5000

# MongoDB Atlas Connection
MONGO_URI=mongodb+srv://<username>:<password>@<cluster-url>/mira?retryWrites=true&w=majority

# JWT Secret (generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
JWT_SECRET=your_secure_jwt_secret_here_min_32_characters

# Google Calendar OAuth 2.0
GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=http://localhost:5000/api/calendar/callback
```

**Get Google Calendar Credentials:**
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project
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

Server runs on `http://localhost:5000`

### Frontend Setup

**1. Install Dependencies**

```powershell
cd frontend
npm install
```

**2. Run Frontend**

```powershell
cd frontend
npm run dev
```

Frontend runs on `http://localhost:5173`

**3. Access Application**

Open browser to `http://localhost:5173`

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/signup` - Register new user
- `POST /api/auth/login` - Login and get JWT token
- `GET /api/auth/me` - Get current user (protected)

### Journals
- `POST /api/journals/create` - Create journal entry
- `GET /api/journals` - Get all user journals
- `GET /api/journals/:id` - Get specific journal
- `PUT /api/journals/:id` - Update journal
- `DELETE /api/journals/:id` - Delete journal
- `POST /api/journals/:id/analyze` - Analyze journal with AI (triggers autonomous features)

### Reminders
- `GET /api/reminders` - Get all user reminders
- `DELETE /api/reminders/:id` - Delete reminder

### Google Calendar
- `GET /api/calendar/auth-url` - Get Google OAuth authorization URL
- `GET /api/calendar/callback` - OAuth callback handler
- `GET /api/calendar/status` - Check calendar connection status
- `POST /api/calendar/disconnect` - Disconnect Google Calendar

### Meetings
- `POST /api/meetings/create` - Create meeting
- `GET /api/meetings` - Get all user meetings
- `GET /api/meetings/:id` - Get specific meeting
- `PUT /api/meetings/:id` - Update meeting
- `DELETE /api/meetings/:id` - Delete meeting

### Health Check
- `GET /api/health` - Check backend status

## 🌐 Frontend Routes

- `/login` - Login/Signup page (public)
- `/journals` - List all journals with streak tracking (protected)
- `/journal/new` - Create new journal entry (protected)
- `/journal/:id` - View/edit journal with AI analysis (protected)
- `/calendar-connected` - Google Calendar OAuth callback (protected)

## 🚀 How It Works (Agentic AI in Action)

### The Autonomous Workflow:

1. **User writes journal** (e.g., "I have a team meeting tomorrow at 3pm")
2. **Auto-save triggers** after 2 seconds of inactivity
3. **Auto-analysis triggers** after 5 seconds:
   - Llama3 analyzes semantic meaning
   - Categorizes activities (productive/unproductive/restful)
   - Detects emotional states
   - Extracts events from natural language
4. **AI Agent autonomously**:
   - Creates reminders in database
   - Syncs events to Google Calendar
   - Returns analysis results
5. **User sees results** without clicking anything

### Example Analysis Output:

```json
{
  "productive": ["Worked on ML assignment", "Attended AI seminar"],
  "unproductive": ["Scrolled social media for 2 hours"],
  "rest": ["30-minute morning jog", "Light reading"],
  "emotional": ["Energized", "Stressed", "Proud"],
  "suggestions": [
    "Consider time-blocking to reduce social media usage",
    "Maintain exercise routine for stress management"
  ],
  "sentiment": "positive",
  "detectedEvents": [
    {
      "title": "Team meeting",
      "date": "2025-11-11T15:00:00Z",
      "description": "Discuss final year project"
    }
  ],
  "autoCreatedReminders": 1,
  "autoSyncedToCalendar": 1
}
```

## 📖 Usage Guide

### 1. First Time Setup
- Navigate to `http://localhost:5173`
- Sign up with name, email, and password
- Login to access journals

### 2. Writing a Journal
- Click "New Entry"
- Write naturally: "Had a productive day. Completed the coding assignment. Team standup tomorrow at 10am."
- **Wait 2 seconds** → Journal auto-saves
- **Wait 5 more seconds** → AI auto-analyzes

### 3. Viewing AI Analysis
- Scroll down to see:
  - Productive activities
  - Unproductive activities  
  - Restful activities
  - Emotional states
  - Personalized suggestions
  - Detected events
- **No button clicking needed** - agent did everything automatically

### 4. Connecting Google Calendar (One-time)
- Click "Connect Google Calendar"
- Authorize MIRA in Google OAuth screen
- Future events auto-sync without asking

### 5. Supported Natural Language Formats
The AI understands:
- **Relative dates**: "tomorrow", "next Monday", "in 5 days"
- **Absolute dates**: "December 12", "Nov 15th", "12 of December"
- **With time**: "at 3pm", "at 10:30am"
- **Complete sentences**: "I have a dentist appointment on Friday at 2pm"

## 🔒 Security Features

- **JWT Authentication**: Secure token-based auth
- **Password Hashing**: bcrypt with salt rounds
- **Google OAuth 2.0**: Industry-standard OAuth flow
- **Environment Variables**: Sensitive keys in .env (not in git)
- **Protected Routes**: Backend middleware + frontend route guards
- **Refresh Tokens**: Google tokens stored securely in MongoDB

## 🏗 Architecture Highlights

- **Modular MVC Pattern**: Controllers, routes, models separated
- **Auto-save/Auto-analyze**: Debounced timers (2s save, 5s analyze)
- **Llama3 Integration**: Local LLM via Ollama for semantic understanding
- **Event Detection**: AI-powered semantic NLP (not just regex)
- **Google Calendar**: Persistent access via OAuth 2.0 refresh tokens
- **Error Handling**: Centralized error middleware
- **CORS Enabled**: Secure frontend-backend communication

## 📝 Sample Journals

Check **`sample-journals.md`** for three human-written example journals that demonstrate:
- Autonomous event detection and reminder creation
- Productive/unproductive/restful activity categorization
- Emotional state detection
- Natural language date/time parsing
- Calendar sync automation

## 🤝 Contributing

This is an academic Agentic AI project. Contributions welcome for:
- Improving AI prompt engineering for better analysis
- Adding more calendar providers (Outlook, Apple Calendar)
- Enhanced natural language event detection
- UI/UX improvements

## 📄 License

MIT License - Free to use for learning and development

## 👨‍💻 Author

Built with ❤️ using:
- **AI**: Ollama + Llama3 (local LLM)
- **Backend**: Node.js, Express, MongoDB
- **Frontend**: React, Vite, TailwindCSS
- **Integrations**: Google Calendar API

---

**MIRA** - *Mindful Intelligent Reflective Assistant*  
*An Agentic AI system that autonomously manages your productivity*
