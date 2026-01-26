# Phase 4: Dashboard

**Status**: Planned
**Goal**: Build the frontend dashboard to view errors.

## Steps

1.  **Setup**
    *   Initialize Vite project in `frontend`.
    *   Install dependencies (Tailwind, React Router, Axios, Lucide).

2.  **API Integration**
    *   `getProjects()`
    *   `createProject(name)`
    *   `getIssues(projectId)`
    *   `getIssue(issueId)`
    *   `getEvents(issueId)`

3.  **Components**
    *   `ProjectCard`: Show name and API Key (DSN).
    *   `IssueList`: Table of issues with status, count, last seen.
    *   `IssueDetail`: Header with title/fingerprint.
    *   `StackTraceView`: Visual representation of the stack frames.
    *   `EventNavigation`: Previous/Next event.

4.  **UI Design**
    *   Clean, Sentry-like interface.
    *   Code block styling for stack traces.

## Deliverables
*   React SPA connecting to backend API.
