# Phase 1: Foundation

**Status**: Planned
**Goal**: Set up the backend project structure and database models.

## Steps

1.  **Directory Structure**
    *   `backend/`: FastAPI app.
    *   `sdk/`: JS/TS Client.
    *   `frontend/`: React Dashboard.

2.  **Dependencies (`backend/requirements.txt`)**
    *   `fastapi`, `uvicorn`, `sqlalchemy`, `pydantic`.

3.  **Database Schema**
    *   `Project`: `id`, `name`, `api_key` (DSN).
    *   `Issue`: `id`, `project_id`, `title`, `fingerprint`, `status` (active, resolved), `first_seen`, `last_seen`, `count`.
    *   `Event`: `id`, `issue_id`, `message`, `stack_trace` (JSON), `context` (JSON), `timestamp`.

4.  **API Shell**
    *   `main.py` with health check.
    *   Database connection setup.

## Deliverables
*   Working FastAPI app with database migration capabilities (or auto-create).
