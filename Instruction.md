# MIRA Project Setup & Deployment Guide

A step-by-step, end-to-end guide so anyone (your friends, classmates, collaborators) can clone, configure, and run the full MIRA application (Backend + Frontend + Local LLM + Google Calendar integration) successfully.

---
## 1. Overview
MIRA consists of:
- Backend (Node.js + Express + MongoDB + JWT + Ollama local LLM + Google APIs)
- Frontend (React + Vite)
- Optional Google Calendar integration
- Local LLM analysis via Ollama (llama3 model)

You will run backend and frontend separately. Backend listens on port 5000 (default). Frontend listens on port 5173 (default Vite).

---
## 2. Prerequisites (Install These First)
Make sure each machine has:
1. Node.js (>= 18.x recommended) – verify:
   ```bash
   node -v
   npm -v
   ```
2. Git – verify:
   ```bash
   git --version
   ```
3. MongoDB:
   - Option A: Local installation (MongoDB Community Server) running on `mongodb://127.0.0.1:27017`
   - Option B: A MongoDB Atlas cluster (copy the connection string)
4. Ollama (for local LLM):
   - Install from: https://ollama.com/download
   - After install, pull the model:
     ```bash
     ollama pull llama3
     ollama list
     ```
5. (Optional) Google Cloud Project (for Calendar API):
   - Enable Google Calendar API in Google Cloud Console
   - Create OAuth 2.0 Client (Web Application)
   - Set an authorized redirect URI (e.g. `http://localhost:5000/api/calendar/oauth2callback`)

---
## 3. Clone the Repository
```bash
# Choose a folder to work in
cd ~/workspace

git clone https://github.com/Shishir422/MIRA.git
cd MIRA
```

If you have SSH access configured:
```bash
git clone git@github.com:Shishir422/MIRA.git
```

---
## 4. Directory Structure (Important Folders)
```
MIRA/
  backend/            # Express API + MongoDB + LLM integration
    config/db.js
    server.js
    services/ollamaService.js
    routes/*.js
    controllers/*.js
    tests/            # Moved test scripts
  frontend/           # React + Vite client
    src/
  Instruction.md      # This guide
  README.md
```

---
## 5. Environment Variables (.env Setup)
Create a file `backend/.env` (NOT committed) with the following keys:
```
MONGO_URI=YOUR_MONGODB_CONNECTION_STRING
JWT_SECRET=YOUR_RANDOM_SECURE_SECRET_STRING
PORT=5000
# Google OAuth (optional for calendar integration)
GOOGLE_CLIENT_ID=YOUR_GOOGLE_OAUTH_CLIENT_ID
GOOGLE_CLIENT_SECRET=YOUR_GOOGLE_OAUTH_CLIENT_SECRET
GOOGLE_REDIRECT_URI=http://localhost:5000/api/calendar/oauth2callback
FRONTEND_URL=http://localhost:5173
```

### Notes:
- `MONGO_URI` examples:
  - Local: `mongodb://127.0.0.1:27017/mira`
  - Atlas: `mongodb+srv://<user>:<password>@cluster0.xxxxx.mongodb.net/mira?retryWrites=true&w=majority&appName=Cluster0`
- `JWT_SECRET`: generate one (e.g. using an online random string generator or `openssl rand -hex 32`).
- If you are NOT using Google Calendar, you can omit the GOOGLE_* variables; calendar endpoints will return appropriate errors but core app still works.

---
## 6. Install Dependencies
### Backend
```bash
cd backend
npm install
```

### Frontend
```bash
cd ../frontend
npm install
```

---
## 7. Verify Ollama & Model Availability
Ensure Ollama service is running (it usually auto-starts after installation). Test in terminal:
```bash
ollama list
ollama run llama3 "Hello"
```
If this returns output, llama3 is ready.

The backend checks availability via `checkOllamaAvailability()` before analysis.

---
## 8. Starting the Backend
In `backend/`:
```bash
npm run dev
```
OR (without auto-reload):
```bash
npm start
```
Expected console output:
- `MongoDB Connected: <host>`
- `Server running on port 5000`

Health check:
Open or curl:
```bash
curl http://localhost:5000/api/health
```
Should return JSON: `{ success: true, message: 'Backend running', ... }`

---
## 9. Starting the Frontend
Open a new terminal window (keep backend running):
```bash
cd frontend
npm run dev
```
Vite will display a local URL, usually: `http://localhost:5173/`

Open in browser. The frontend expects backend at `http://localhost:5000` and uses localStorage for JWT tokens.

---
## 10. Initial Application Flow
1. Sign up (creates user via `/api/auth/signup`).
2. Login (stores JWT in localStorage).
3. Create a journal entry (New Journal → fill content → Create Journal).
4. Journal auto-save (after initial creation) will trigger after 2 seconds of inactivity.
5. Click Analyze Journal to run LLM insights (requires Ollama with llama3 model).
6. Detected events can be converted into reminders; optionally sync to Google Calendar if OAuth connected.

---
## 11. Google Calendar Integration (Optional)
Steps if you want calendar syncing:
1. Obtain `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, set redirect URI:
   - `http://localhost:5000/api/calendar/oauth2callback`
2. Add values to `backend/.env`.
3. Restart backend.
4. In frontend UI, click "Connect Google Calendar".
5. Complete OAuth in new window.
6. Create a journal → analyze → detected events → Set Reminder → confirm → choose to sync.

Troubleshooting:
- If redirect fails, confirm `FRONTEND_URL` is set and matches React dev server.
- Ensure Calendar API is enabled in Google Cloud Console.

---
## 12. Common Issues & Fixes
| Issue | Cause | Fix |
|-------|-------|-----|
| `MongoDB Connected` never appears | Wrong `MONGO_URI` | Test connection string using `mongosh` or Atlas quick connect. |
| 401 Unauthorized on protected routes | Missing/expired JWT | Re-login; clear localStorage manually. |
| LLM analysis returns service unavailable | Ollama not running or model missing | Run `ollama pull llama3`; ensure service starts. |
| Google OAuth failure | Bad credentials or redirect URI mismatch | Re-check Google Console settings. |
| CORS errors in browser | Backend CORS misconfiguration | `app.use(cors())` is already enabled; clear browser cache if lingering. |
| Auto-save not working | Editing a new unsaved journal | Must create journal first, then auto-save activates. |
| Event time wrong | LLM returned ambiguous format | Time parsing now supports `10am`, `10:00am`, `14:30`. |

---
## 13. Running Backend Test Scripts (Optional)
All test scripts are in `backend/tests/` now.
```bash
cd backend/tests
node test-semantic-understanding.js
node run-all-tests.js   # Run entire suite
```
These require Ollama and (optionally) a MongoDB connection if they hit DB-dependent logic.

---
## 14. Recommended Developer Tools
- VS Code
- REST client (Insomnia / Postman)
- MongoDB Compass (if using local mongodb)

---
## 15. Updating Configuration Later
If you change ports or frontend URL:
- Update `FRONTEND_URL` in `.env`.
- Restart backend.
- Ensure frontend points to backend base URL in `frontend/src/services/api.js` (currently hardcoded to `http://localhost:5000/api`).

If deploying:
- Use production MongoDB URI
- Set secure, long `JWT_SECRET`
- Consider reverse proxy (NGINX) and HTTPS
- Run `npm run build` in frontend and serve `dist/` via a static host

---
## 16. Clean Shutdown
Press `Ctrl + C` in each terminal (backend & frontend). MongoDB local service keeps running unless manually stopped.

---
## 17. Quick Start Cheat Sheet
```bash
# Clone
git clone https://github.com/Shishir422/MIRA.git
cd MIRA

# Backend setup
cd backend
cp .env.example .env   # (If you create an example file; otherwise create manually)
# Edit .env with MONGO_URI, JWT_SECRET, GOOGLE_*, FRONTEND_URL
npm install
ollama pull llama3
npm run dev

# Frontend setup (new terminal)
cd ../frontend
npm install
npm run dev
```
Open: http://localhost:5173

---
## 18. Final Verification Checklist
- [ ] Backend running without errors
- [ ] MongoDB connected
- [ ] Frontend loads
- [ ] Signup/Login succeed
- [ ] Create + auto-save journal works
- [ ] Analyze Journal returns AI data
- [ ] Events detected (if present) and reminders work
- [ ] (Optional) Google Calendar connected and events sync

If all checked: MIRA is running correctly.

---
## 19. Need Help?
If something breaks:
1. Re-check `.env` spelling
2. Re-run `npm install` in both folders
3. Confirm Ollama model pulled
4. Look at backend console logs
5. Use `curl http://localhost:5000/api/health`

Happy journaling and productivity boosting!
