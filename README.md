# MIRA - Mindful Intelligent Reflective Assistant

A modern productivity web application that helps users manage daily journals, track habits, and automatically sync events to Google Calendar with AI-powered insights.

## Features

- **User Authentication**: JWT-based secure signup/login system with localStorage token management
- **Daily Journaling**: Create, read, update, and delete journal entries with streak tracking
- **AI Journal Analysis**: Analyze journal entries using OpenAI GPT to get:
  - Productivity scores (0-100)
  - Productive vs unproductive activities breakdown
  - Personalized improvement suggestions
  - Automatic event detection from natural language
- **Smart Event Detection**: Automatically detects events from journal text like:
  - "I have a meeting tomorrow at 3pm"
  - "Meeting on 12 of December at 3pm"
  - "Appointment next Monday at 10am"
  - "Dentist appointment in 5 days"
- **Google Calendar Integration**: 
  - OAuth 2.0 secure authentication
  - One-click calendar connection
  - Automatic event sync to Google Calendar
  - Visual connection status indicator
- **Smart Reminders**: Propose and confirm reminders from detected events
- **Modern UI**: Beautiful, responsive design with TailwindCSS
- **Protected Routes**: Automatic redirect to login for unauthenticated users

## Tech Stack

**Backend:**
- Node.js + Express.js
- MongoDB + Mongoose (Cloud: MongoDB Atlas)
- JWT Authentication
- bcryptjs for password hashing
- OpenAI API (GPT-4 for journal analysis)
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
│   │   ├── Journal.js            # Journal schema
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
│   │   ├── journalController.js  # Journal + AI analysis + event detection
│   │   ├── reminderController.js # Reminder CRUD + Google sync
│   │   ├── calendarController.js # OAuth flow + Calendar API
│   │   └── meetingController.js  # Meeting logic
│   ├── middleware/
│   │   └── authMiddleware.js     # JWT protection
│   ├── .env                      # Environment variables (NOT in git)
│   ├── .gitignore                # Ignore node_modules, .env
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
    │   │   ├── JournalView.jsx        # Create/view journal + AI analysis
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
    ├── postcss.config.js              # PostCSS config
    └── vite.config.js                 # Vite config
```

## Setup Instructions

### Backend Setup

### 1. Install Dependencies

```powershell
cd backend
npm install
```

### 2. Configure Environment Variables

Create `backend/.env` file:

```env
PORT=5000

# MongoDB Atlas Connection
MONGO_URI=mongodb+srv://<username>:<password>@<cluster-url>/meeting-assistant?retryWrites=true&w=majority

# JWT Secret (generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
JWT_SECRET=your_secure_jwt_secret_here_min_32_characters

# OpenAI API Key (get from https://platform.openai.com/api-keys)
OPENAI_API_KEY=sk-proj-your_openai_api_key_here

# Google Calendar OAuth 2.0 (get from https://console.cloud.google.com/)
GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=http://localhost:5000/api/calendar/callback
```

**How to get Google Calendar credentials:**
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable "Google Calendar API"
4. Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client ID"
5. Application type: Web application
6. Authorized redirect URIs: `http://localhost:5000/api/calendar/callback`
7. Copy Client ID and Client Secret to `.env`

### 3. Start MongoDB

MongoDB Atlas is configured - no local MongoDB installation needed!

### 4. Run the Backend Server

```powershell
cd backend
npm run dev
```

Server will run on `http://localhost:5000`

**Backend Dependencies:**
- express, mongoose, bcryptjs, jsonwebtoken, dotenv, cors
- openai (for AI analysis)
- googleapis (for Google Calendar integration)

### Frontend Setup

### 1. Install Dependencies

```powershell
cd frontend
npm install
```

### 2. Run the Frontend

```powershell
cd frontend
npm run dev
```

Frontend will run on `http://localhost:5173`

**Frontend Dependencies:**
- react, react-dom, react-router-dom
- axios (API client)
- tailwindcss, postcss, autoprefixer
- lucide-react (icons)

### 3. Access the Application

1. Open browser to `http://localhost:5173`
2. You'll be redirected to `/login`
3. Create an account or login
4. Start creating journals and analyzing them!

## API Endpoints

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
- `POST /api/journals/:id/analyze` - Analyze journal for productivity insights

### Reminders
- `POST /api/reminders/propose` - Propose a new reminder from detected event
- `POST /api/reminders/:id/confirm` - Confirm and activate a reminder
- `POST /api/reminders/:id/sync` - Sync reminder to Google Calendar
- `GET /api/reminders` - Get all user reminders
- `DELETE /api/reminders/:id` - Delete reminder

### Google Calendar
- `GET /api/calendar/auth-url` - Get Google OAuth authorization URL
- `GET /api/calendar/callback` - OAuth callback handler
- `GET /api/calendar/status` - Check if user has connected Google Calendar
- `POST /api/calendar/disconnect` - Disconnect Google Calendar

### Meetings
- `POST /api/meetings/create` - Create meeting
- `GET /api/meetings` - Get all user meetings
- `GET /api/meetings/:id` - Get specific meeting
- `PUT /api/meetings/:id` - Update meeting
- `DELETE /api/meetings/:id` - Delete meeting

### Health Check
- `GET /api/health` - Check backend status

## Frontend Routes

- `/login` - Login/Signup page (public)
- `/journals` - List all journals with streak tracking (protected)
- `/journal/new` - Create new journal entry (protected)
- `/journal/:id` - View/edit specific journal with AI analysis (protected)
- `/calendar-connected` - Google Calendar OAuth callback (protected)

## Authentication

All journal and meeting routes require JWT authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

## Testing with Postman/API Client

### 1. Signup
```
POST http://localhost:5000/api/auth/signup
Body: { "name": "John Doe", "email": "john@example.com", "password": "password123" }
```

### 2. Login
```
POST http://localhost:5000/api/auth/login
Body: { "email": "john@example.com", "password": "password123" }
Response: { "token": "eyJhbGc..." }
```

### 3. Create Journal (with token)
```
POST http://localhost:5000/api/journals/create
Headers: { "Authorization": "Bearer <your_token>" }
Body: { "title": "My Day", "content": "I have a meeting tomorrow at 3pm with the team" }
```

### 4. Analyze Journal
```
POST http://localhost:5000/api/journals/:id/analyze
Headers: { "Authorization": "Bearer <your_token>" }
Response: { productivity score, activities, suggestions, detected events }
```

### 5. Get Google Calendar Auth URL
```
GET http://localhost:5000/api/calendar/auth-url
Headers: { "Authorization": "Bearer <your_token>" }
Response: { "authUrl": "https://accounts.google.com/o/oauth2/v2/auth?..." }
```

---

## License

MIT License - Feel free to use this project for learning and development.

## Contributing

Pull requests are welcome! For major changes, please open an issue first to discuss what you would like to change.

## Author

Built with ❤️ using React, Node.js, MongoDB, OpenAI, and Google Calendar API

---

**MIRA** - *Mindful Intelligent Reflective Assistant*

## Development Notes

- All routes use modular controller pattern for easy maintenance
- JWT tokens expire in 30 days (configurable)
- Passwords are hashed with bcrypt (10 salt rounds)
- MongoDB schemas include timestamps and validation
- Error handling middleware catches all server errors
- CORS enabled for frontend integration at localhost:5173
- Frontend uses localStorage for JWT token persistence
- Protected routes automatically redirect to login if unauthenticated
- TailwindCSS provides responsive, utility-first styling
- Google Calendar uses OAuth 2.0 refresh tokens for persistent access
- OpenAI GPT-4 analyzes journal entries for productivity insights
- Event detection uses regex patterns for natural language parsing
- Supports multiple date formats: relative and absolute

## Security Features

- **JWT Authentication**: Secure token-based auth with httpOnly cookies option
- **Password Hashing**: bcrypt with salt rounds for secure password storage
- **Google OAuth 2.0**: Industry-standard OAuth flow for calendar access
- **Environment Variables**: Sensitive keys stored in .env (not in git)
- **Protected Routes**: Backend middleware + frontend route guards
- **Token Refresh**: Google refresh tokens stored securely in MongoDB

## Future Enhancements

- Email notifications for upcoming events
- Recurring event support
- Multiple calendar support (Google, Outlook, Apple)
- Voice-to-text journal entries
- Mobile app (React Native)
- Export journals to PDF
- Share journals with others
- Advanced analytics dashboard
- Integration with task management tools
- Meeting transcription and AI summaries

## Usage Guide

### 1. Create an Account
- Open http://localhost:5173
- You'll be redirected to `/login`
- Click "Sign Up" and create an account with name, email, and password

### 2. Login
- Enter email and password
- Token is automatically saved to localStorage
- Redirected to journals list

### 3. Create a Journal
- Click "New Entry" button
- Add optional title and required content
- Write naturally: "I have a meeting tomorrow at 3pm with the team"
- Click "Save Journal"

### 4. Analyze Journal with AI
- Open any saved journal
- Click "Analyze with AI" button
- View:
  - **Productivity Score** (0-100)
  - **Productive Activities** breakdown
  - **Unproductive Activities** breakdown
  - **Personalized Suggestions** for improvement
  - **Detected Events** from your journal text

### 5. Connect Google Calendar
- In the journal view, click "Connect Google Calendar" button
- Authorize MIRA to access your Google Calendar (OAuth 2.0)
- You'll see a green checkmark when connected

### 6. Sync Events to Google Calendar
- After analyzing a journal, detected events appear as cards
- Click "Sync to Google Calendar" on any event
- Event is automatically added to your Google Calendar
- Get a confirmation message

### 7. Supported Date Formats
The AI can detect events in natural language:
- **Relative dates**: "tomorrow", "next Monday", "in 5 days"
- **Absolute dates**: "December 12", "12 of December", "Jan 15th"
- **With time**: "at 3pm", "at 10:30am"
- **Examples**:
  - "Meeting tomorrow at 3pm"
  - "Dentist appointment on 12 of December at 10am"
  - "Team standup next Monday at 9:30am"
  - "Conference in 10 days"

### 8. View Journal Streak
- Your current streak is displayed in the journals list
- Maintain daily journaling to increase your streak!

### 9. Logout
- Click "Logout" button in journals list
- Token is removed from localStorage
- Redirected to login page
