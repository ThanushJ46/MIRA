# AI Meeting Assistant + Journaling Web App

A productivity web application that helps users manage daily journals, track streaks, and process meeting data with AI assistance.

## Features

- **User Authentication**: JWT-based secure signup/login system
- **Daily Journaling**: Create, read, update, and delete journal entries with streak tracking
- **Meeting Management**: Store meeting transcripts and metadata
- **AI Integration (Phase 2)**: Auto-generate meeting summaries, flashcards, and detect future dates
- **Google Calendar Integration (Phase 2)**: Add detected meetings to your calendar

## Tech Stack

**Backend:**
- Node.js + Express.js
- MongoDB + Mongoose
- JWT Authentication
- bcryptjs for password hashing

**Future Integrations:**
- OpenAI API (GPT for summaries, Whisper for transcripts)
- Google Calendar API

## Project Structure

```
/backend
├── server.js                 # Main Express server
├── package.json              # Dependencies
├── .env                      # Environment variables
├── config/
│   └── db.js                 # MongoDB connection
├── models/
│   ├── User.js               # User schema
│   ├── Journal.js            # Journal schema
│   └── Meeting.js            # Meeting schema
├── routes/
│   ├── authRoutes.js         # Auth endpoints
│   ├── journalRoutes.js      # Journal CRUD
│   └── meetingRoutes.js      # Meeting CRUD
├── controllers/
│   ├── authController.js     # Auth logic
│   ├── journalController.js  # Journal logic
│   └── meetingController.js  # Meeting logic
└── middleware/
    └── authMiddleware.js     # JWT protection
```

## Setup Instructions

### 1. Install Dependencies

```powershell
cd backend
npm install
```

### 2. Configure Environment Variables

Edit `backend/.env` file:

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/meeting-assistant
JWT_SECRET=your_secure_jwt_secret_here
```

For production, use MongoDB Atlas or your cloud database URI.

### 3. Start MongoDB

Make sure MongoDB is running locally or use MongoDB Atlas.

### 4. Run the Server

```powershell
# Development mode (with nodemon)
npm run dev

# Production mode
npm start
```

Server will run on `http://localhost:5000`

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

### Meetings
- `POST /api/meetings/create` - Create meeting
- `GET /api/meetings` - Get all user meetings
- `GET /api/meetings/:id` - Get specific meeting
- `PUT /api/meetings/:id` - Update meeting
- `DELETE /api/meetings/:id` - Delete meeting

### Health Check
- `GET /api/health` - Check backend status

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
Mindful Intelligent Reflective Assistant

endpoints
POST /api/auth/signup
POST /api/auth/login
GET /api/journals
POST /api/journals/create
GET /api/journals/:id
PUT /api/journals/:id
DELETE /api/journals/:id
