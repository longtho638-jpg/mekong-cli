# Phase 1: Foundation

**Status**: In Progress
**Goal**: Set up the project structure, Docker environment (FastAPI), and sample data.

## Steps

1. **Directory Structure**
   - Create `changelog-kit/` root.
   - Create `backend/` for FastAPI.
   - Create `frontend/` for React library (vite).
   - Create `data/` for storing markdown changelogs.
   - Create `docker-compose.yml`.

2. **Backend Setup (FastAPI)**
   - `pyproject.toml` (Poetry).
   - `app/main.py`.
   - `app/core/config.py`.
   - `Dockerfile`.

3. **Frontend Setup (React Library)**
   - We will set this up as a Vite project that exports components, but also runs a dev server to preview them.
   - `package.json`.
   - `vite.config.ts`.
   - `src/index.ts` (Barrel file for exports).

4. **Sample Data**
   - Create a few `.md` files in `data/` with frontmatter to test the parser later.

## Deliverables
- working `docker-compose up` that spins up Backend and Frontend (preview).
