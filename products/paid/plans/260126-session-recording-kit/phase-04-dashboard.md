# Phase 4: Dashboard & Player

**Status**: Planned
**Goal**: Build the admin dashboard to list and replay recorded sessions.

## Steps

1.  **Setup**
    *   Initialize Vite project in `frontend`.
    *   Install dependencies: `rrweb`, `rrweb-player`, `axios`, `react-router-dom`, `tailwindcss`, `lucide-react`, `date-fns`.

2.  **API Integration (`src/api.ts`)**
    *   `getProjects()`
    *   `getSessions(projectId)`
    *   `getSession(sessionId)`
    *   `getSessionEvents(sessionId)`: Need to fetch all chunks and merge them.

3.  **Components**
    *   `ProjectList`: Select a project to view sessions.
    *   `SessionList`: Table showing User ID, Duration, Started At.
    *   `SessionPlayer`: Wrapper around `rrweb-player` to replay the merged events.

4.  **UI Design**
    *   Simple, clean list view.
    *   Full-width player view.

## Deliverables
*   React app capable of replaying sessions stored in the backend.
