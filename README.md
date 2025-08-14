# Devhub Collaborative Code Editor

A modern, light-theme collaborative code editor with chat and session management.

- Frontend: React + Vite + TypeScript + Monaco Editor + Socket.IO client + Axios + Zustand
- Backend: FastAPI + SQLAlchemy + PyMySQL + JWT Auth + Socket.IO (ASGI) + dotenv
- Database: MySQL

## Features
- User registration and login (JWT-based)
- Create and join sessions by code
- Monaco code editor with realtime collaborative updates
- Realtime chat per session (messages persist in MySQL)
- Files per session (create, switch, save)
- Simple dashboard listing your sessions

## Prerequisites
- Node.js 18+ and npm
- Python 3.10+
- MySQL server reachable with credentials

## Backend configuration
Set environment variables in `server/.env`:

```
DB_HOST=test.schooldesk.org
DB_USER=ANSK
DB_PASSWORD=Nick8956
DB_NAME=devhub
JWT_SECRET=change-me
JWT_ALG=HS256
CORS_ORIGINS=http://localhost:5173
SOCKET_CORS_ORIGIN=http://localhost:5173
```

On startup, the backend tries to create `DB_NAME` if it doesn't exist.

## Install and run (one click)
Preferred: use the Python runner which starts both servers.

```
python3 dev.py
```

Alternative bash script:

```
./dev.sh
```

- Backend: http://localhost:8000
- Frontend: http://localhost:5173 (Vite may use 5174/5175 if ports busy)

## Manual install
- Backend
  - Create venv and install deps using `server/requirements.txt`
  - Run: `uvicorn server.app.main:get_app --reload --factory`
- Frontend
  - `cd client && npm i`
  - `npm run dev`

## Project structure

```
server/
  app/
    main.py          # FastAPI app and ASGI Socket.IO mount
    config.py        # Settings (env)
    database.py      # SQLAlchemy engine/session and get_db
    models.py        # ORM models (User, Session, Document, ChatMessage)
    schemas.py       # Pydantic schemas
    auth.py          # Password hashing, JWT token, current user
    deps.py          # FastAPI deps wrappers
    utils/db_init.py # Create database if missing
    routers/
      users.py       # /api/users/register, /api/users/login
      sessions.py    # /api/sessions/* (create, by-code, mine, docs CRUD, messages)
      ai.py          # stub endpoint for AI assistant
    realtime/
      socket.py      # Socket.IO events: join_session, editor_change, chat_message
client/
  src/
    pages/
      HomePage.tsx     # Dashboard: create/join session, list "Your sessions"
      LoginPage.tsx    # Sign in form
      RegisterPage.tsx # Sign up form
      EditorPage.tsx   # Monaco editor + files sidebar + chat
    store/
      session.ts       # Zustand store: token and email
    components/
      Toast.tsx        # Simple inline notifications
    App.tsx            # Router and session bootstrap
    main.tsx           # React entry
    index.css          # Global styles
  vite.config.ts       # Dev proxy for /api and /socket.io
  index.html           # Root HTML
```

## Usage flow
1. Register (`/register`) with email/password
2. Login (`/login`); JWT is stored in localStorage
3. Create session on dashboard → receives code
4. Share code; others can join from dashboard by entering code
5. Editor: type code to see realtime updates; use sidebar to create/switch files
6. Chat panel shows participants messages with email and timestamps

## API overview (selected)
- `POST /api/users/register` { email, password }
- `POST /api/users/login` form-data username, password → { access_token }
- Authenticated:
  - `POST /api/sessions/create` { name }
  - `GET /api/sessions/by-code/{code}`
  - `GET /api/sessions/mine`
  - `GET /api/sessions/{session_id}/documents`
  - `POST /api/sessions/{session_id}/documents` { title, language }
  - `PATCH /api/sessions/documents/{document_id}` { title?, content?, language? }
  - `GET /api/sessions/{session_id}/messages`

## Realtime events
- Client emits `join_session` { code, token }
- Editor emits `editor_change` { document_id, content, ts }
- Chat emits `chat_message` { content }

## Troubleshooting
- Tailwind is not used to avoid PostCSS issues; styles are inline and minimal.
- Socket.IO issues:
  - Ensure frontend connects to `http://localhost:8000` with path `/socket.io`
- MySQL connection errors:
  - Verify `server/.env` DB settings and that the host is reachable
- Ports busy:
  - Vite will switch ports automatically; check terminal output for actual port

## Security notes
- Change `JWT_SECRET` for production
- Use HTTPS and proper CORS in production
- Add rate limiting on auth endpoints if exposed publicly

## Roadmap
- AI assistant panel with code actions
- Presence indicators and cursors for collaborators
- Rich file tree with folders, rename, delete
- Invite/role management per session
