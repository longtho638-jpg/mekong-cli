# Session Recording Kit

A self-hosted, lightweight session replay system (like Hotjar or LogRocket) that you can own. Record user interactions, replay sessions, and understand user behavior without sharing data with third parties.

## Features

- **DOM Recording**: Captures DOM mutations, mouse movements, and inputs using `rrweb`.
- **Session Replay**: Pixel-perfect replay of user sessions.
- **Self-Hosted Backend**: Python FastAPI backend with SQLite (easy to swap for PostgreSQL).
- **Lightweight SDK**: Zero-dependency (except `rrweb`) TypeScript SDK (< 15KB gzipped).
- **Admin Dashboard**: React-based dashboard to view and replay sessions.
- **Privacy Focused**: No third-party tracking; you own the data.

## Structure

- `backend/`: FastAPI application for ingestion and API.
- `frontend/`: React admin dashboard for viewing recordings.
- `sdk/`: TypeScript SDK for recording sessions on your site.

## Quick Start

### 1. Backend Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate  # or venv\Scripts\activate on Windows
pip install -r requirements.txt
python -m app.main
```

The API will run at `http://localhost:8000`.

### 2. Frontend Dashboard Setup

```bash
cd frontend
npm install
npm run dev
```

The dashboard will run at `http://localhost:5173`.

### 3. Integrate SDK

1. Build the SDK:
   ```bash
   cd sdk
   npm install
   npm run build
   ```

2. Include `dist/session-recorder.js` in your website or install via package manager if you publish it.

3. Initialize:
   ```javascript
   import { SessionRecorder } from './session-recorder';

   const recorder = new SessionRecorder({
     endpoint: 'http://localhost:8000/api/v1',
     projectId: 1, // Get this from your Dashboard
     sampleRate: 1.0, // Record 100% of sessions
   });

   recorder.start();
   ```

## API Documentation

- `POST /api/v1/sessions/`: Start a new session.
- `POST /api/v1/sessions/{id}/events`: Append event chunks.
- `GET /api/v1/projects/{id}/sessions`: List sessions.
- `GET /api/v1/sessions/{id}`: Get session metadata.
- `GET /api/v1/sessions/{id}/events`: Get full session recording.

## License

Commercial License. You can use this in your own commercial projects or for your clients. You cannot resell the source code as a standalone product.
