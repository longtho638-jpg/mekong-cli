# Phase 1: Foundation

**Status**: Planned
**Goal**: Set up backend structure and database.

## Steps

1.  **Directory Structure**
    *   `backend/`: FastAPI app.
    *   `sdk/`: Recording script.
    *   `frontend/`: Dashboard.

2.  **Dependencies**
    *   `fastapi`, `uvicorn`, `sqlalchemy`, `aiosqlite`, `pydantic`.

3.  **Database Schema**
    *   `Session`: `id` (UUID), `project_id`, `user_id`, `user_agent`, `duration`, `started_at`.
    *   `SessionEvent`: `id`, `session_id`, `events_blob` (JSON/Text - stored chunks), `sequence_index`.

4.  **API Shell**
    *   `main.py`.
    *   DB connection.

## Deliverables
*   Working backend with tables created.
