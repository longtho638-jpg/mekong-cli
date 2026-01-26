# Error Tracking Kit Plan

**Goal**: Build a self-hosted, Sentry-lite error tracking system.
**Price**: $57
**Status**: In Progress

## Architecture

*   **Backend**: FastAPI
*   **Database**: SQLite (SQLAlchemy/SQLModel)
*   **Frontend**: React + Tailwind + Vite
*   **SDK**: TypeScript (Universal JS client)

## Phases

1.  **Phase 1: Foundation**
    *   Project structure.
    *   Database schema (`Project`, `Issue`, `Event`).
    *   Basic API setup.

2.  **Phase 2: Ingestion Engine**
    *   `POST /api/v1/envelope`: Endpoint to receive error reports.
    *   Event Processing: Grouping logic (Fingerprinting).
    *   Source map support (stretch goal, maybe simple stack parsing first).

3.  **Phase 3: JavaScript SDK**
    *   `init({ dsn })`.
    *   Global error handlers (`window.onerror`, `unhandledrejection`).
    *   `captureException(error)`.
    *   Context (user, tags).

4.  **Phase 4: Dashboard**
    *   Project List.
    *   Issue Stream (grouped errors).
    *   Issue Detail (Stack trace view, occurrence graph).

5.  **Phase 5: Packaging**
    *   Docs, License, Zip.

## Deliverables
*   A deployable docker container (optional) or source code.
*   A drop-in `<script>` or npm package for frontend.
