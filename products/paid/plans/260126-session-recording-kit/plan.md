# Session Recording Kit Plan

**Goal**: Build a self-hosted session replay system (like LogRocket or Hotjar) using `rrweb`.
**Price**: $67
**Status**: In Progress

## Architecture

*   **Frontend SDK**: `rrweb` wrapper to record DOM events.
*   **Backend**: FastAPI to receive and store event chunks.
*   **Database**: SQLite (SQLAlchemy) for session metadata; events stored as compressed JSON blobs (or separate table).
*   **Dashboard**: React + `rrweb-player` to view sessions.

## Phases

1.  **Phase 1: Foundation**
    *   Project structure.
    *   Database schema (`Session`, `SessionEvent`).
    *   API setup.

2.  **Phase 2: Ingestion Engine**
    *   `POST /api/v1/sessions`: Start recording.
    *   `POST /api/v1/sessions/{id}/events`: Append events (chunked).
    *   Compression handling (gzip/brotli if possible).

3.  **Phase 3: JavaScript SDK**
    *   Lightweight wrapper around `rrweb`.
    *   Auto-start on load.
    *   Batch sending events to reduce network traffic.

4.  **Phase 4: Dashboard & Player**
    *   Session List (User ID, Duration, Started At).
    *   Session Player (using `rrweb-player`).

5.  **Phase 5: Packaging**
    *   Docs, License, Zip.

## Deliverables
*   Self-hosted backend.
*   NPM package / Script tag for recording.
*   Admin dashboard for replay.
