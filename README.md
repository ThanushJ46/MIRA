# AI Meeting Assistant + Journaling Web App

A productivity web application that helps users manage daily journals, track streaks, and process meeting data with AI assistance.

## Features

- **User Authentication**: JWT-based secure signup/login system with localStorage token management
- **Daily Journaling**: Create, read, update, and delete journal entries with streak tracking
- **AI Journal Analysis**: Analyze journal entries to get:
  - Productivity scores
  - Productive vs unproductive activities
  - Personalized suggestions
  - Detected events from journal content
- **Smart Reminders**: Automatically create reminders from detected events in journals
- **Meeting Management**: Store meeting transcripts and metadata (backend ready)
- **Protected Routes**: Automatic redirect to login for unauthenticated users
- **Google Calendar Integration (Phase 2)**: Add detected meetings to your calendar

## Tech Stack

**Backend:**
- Node.js + Express.js
- MongoDB + Mongoose
- JWT Authentication
- bcryptjs for password hashing

**Frontend:**
- React 18 with Vite
- TailwindCSS for styling
- React Router for navigation
- Axios for API requests
- localStorage for JWT token management

**Future Integrations:**
- OpenAI API (GPT for summaries, Whisper for transcripts)
- Google Calendar API

## Project Structure

```
/MIRA
├── backend/
│   ├── config/
│   │   └── db.js                 # MongoDB connection
│   ├── models/
│   │   ├── User.js               # User schema
│   │   ├── Journal.js            # Journal schema
│   │   └── Meeting.js            # Meeting schema
│   ├── routes/
│   │   ├── authRoutes.js         # Auth endpoints
│   │   ├── journalRoutes.js      # Journal CRUD
│   │   └── meetingRoutes.js      # Meeting CRUD
│   ├── controllers/
│   │   ├── authController.js     # Auth logic
│   │   ├── journalController.js  # Journal logic
│   │   └── meetingController.js  # Meeting logic
│   ├── middleware/
│   │   └── authMiddleware.js     # JWT protection
│   ├── .env                      # Environment variables
│   ├── .env.example              # Example env file
│   ├── package.json              # Dependencies
│   └── server.js                 # Main Express server
│
└── frontend/
    ├── src/
    │   ├── components/
    │   │   └── ProtectedRoute.jsx  # Auth guard
    │   ├── pages/
    │   │   ├── Login.jsx            # Login page
    │   │   ├── JournalsList.jsx     # Journals list
    │   │   └── JournalView.jsx      # Create/view journal
    │   ├── services/
    │   │   └── api.js               # Axios API client
    │   ├── utils/
    │   │   └── auth.js              # Auth helpers
    │   ├── App.jsx                  # Main app with routes
    │   ├── main.jsx                 # Entry point
    │   └── index.css                # Tailwind styles
    ├── package.json                 # Dependencies
    ├── tailwind.config.js           # Tailwind config
    ├── postcss.config.js            # PostCSS config
    └── vite.config.js               # Vite config
```

## Setup Instructions

### Backend Setup

### 1. Install Dependencies

```powershell
cd backend
npm install
```

### 2. Configure Environment Variables

Create `backend/.env` file (copy from `.env.example`):

```env
PORT=5000
MONGO_URI=mongodb+srv://<username>:<password>@<cluster-url>/meeting-assistant?retryWrites=true&w=majority
JWT_SECRET=your_secure_jwt_secret_change_this_to_random_string
OPENAI_API_KEY=your_openai_api_key_here
```

**Replace placeholders with your actual credentials:**
- Get MongoDB Atlas URI from your [MongoDB Atlas dashboard](https://cloud.mongodb.com/)
- Generate a secure JWT_SECRET (use `openssl rand -base64 32`)
- Get OpenAI API key from [OpenAI Platform](https://platform.openai.com/api-keys)

### 3. Start MongoDB

Make sure MongoDB is running locally or use MongoDB Atlas.

### 4. Run the Backend Server

```powershell
# Development mode (with nodemon)
cd backend
npm run dev

# Production mode
npm start
```

Server will run on `http://localhost:5000`

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
- `POST /api/reminders/propose` - Propose a new reminder from event
- `POST /api/reminders/:id/confirm` - Confirm and activate a reminder
- `GET /api/reminders` - Get all user reminders

### Meetings
- `POST /api/meetings/create` - Create meeting
- `GET /api/meetings` - Get all user meetings
- `GET /api/meetings/:id` - Get specific meeting
- `PUT /api/meetings/:id` - Update meeting
- `DELETE /api/meetings/:id` - Delete meeting

### Health Check
- `GET /api/health` - Check backend status

## Frontend Routes

- `/login` - Login page (public)
- `/journals` - List all journals (protected)
- `/journal/new` - Create new journal (protected)
- `/journal/:id` - View/edit specific journal (protected)

## Authentication

All journal and meeting routes require JWT authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

## Testing with Postman

1. **Signup**: POST to `/api/auth/signup` with `{ name, email, password }`
2. **Login**: POST to `/api/auth/login` with `{ email, password }` → Get token
3. **Create Journal**: POST to `/api/journals/create` with token and `{ title, content }`
4. **Get Journals**: GET `/api/journals` with token

## Phase 2 Features (Coming Soon)

- AI-powered meeting summary generation (OpenAI GPT)
- Transcript processing (OpenAI Whisper)
- Automatic flashcard creation from meetings
- Future date detection from meeting content
- Google Calendar integration
- Frontend React application

## Development Notes

- All routes use modular controller pattern for easy maintenance
- JWT tokens expire in 30 days
- Passwords are hashed with bcrypt (10 salt rounds)
- MongoDB schemas include timestamps and validation
- Error handling middleware catches all server errors
- CORS enabled for frontend integration
- Frontend uses localStorage for JWT token persistence
- Protected routes automatically redirect to login if unauthenticated
- TailwindCSS provides responsive, utility-first styling

## Usage Guide

1. **Create an Account**:
   - Open http://localhost:5173
   - You'll be redirected to `/login`
   - Click "Sign Up" and create an account (or use API directly)

2. **Login**:
   - Enter email and password
   - Token is automatically saved to localStorage
   - Redirected to journals list

3. **Create a Journal**:
   - Click "New Journal" button
   - Add optional title and required content
   - Click "Save"

4. **Analyze Journal**:
   - Open any saved journal
   - Click "Analyze Journal" button
   - View productivity score, suggestions, and detected events

5. **Set Reminders**:
   - After analysis, detected events appear
   - Click "Set Reminder" on any event
   - Reminder is automatically created and confirmed

6. **Logout**:
   - Click "Logout" button in journals list
   - Token is removed from localStorage
Mindful Intelligent Reflective Assistant

endpoints
POST /api/auth/signup
POST /api/auth/login
GET /api/journals
POST /api/journals/create
GET /api/journals/:id
PUT /api/journals/:id
DELETE /api/journals/:id
