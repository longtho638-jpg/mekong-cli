# Phase 4: Admin Dashboard

**Status**: Planned
**Goal**: Build a React-based admin dashboard to manage feature flags.

## Steps

1.  **Project Setup**
    *   Initialize Vite project in `frontend/admin`.
    *   Install dependencies (Tailwind, React Router, Axios, etc.).

2.  **API Integration (`src/api.ts`)**
    *   `getFlags()`
    *   `createFlag(data)`
    *   `updateFlag(key, data)`
    *   `deleteFlag(key)`

3.  **Components**
    *   `FlagList`: Table showing all flags, status (active/inactive), and key.
    *   `FlagEditor`: Modal or page to edit flag details and **Targeting Rules**.
    *   `RuleBuilder`: UI to add/remove rules (User ID, Percentage).

4.  **UI Implementation**
    *   Use Tailwind for styling.
    *   Simple, clean interface.

## Deliverables
*   A standalone React app that connects to the backend to manage flags.
