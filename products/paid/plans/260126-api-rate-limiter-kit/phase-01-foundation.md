# Phase 1: Foundation

**Status**: In Progress
**Goal**: Set up the project structure, Docker environment (FastAPI + Redis), and basic repositories.

## Steps

1. **Directory Structure**
   - Create `api-rate-limiter-kit/` root.
   - Create `backend/` for FastAPI.
   - Create `dashboard/` for React Admin.
   - Create `docker-compose.yml` for orchestration.

2. **Backend Setup (FastAPI)**
   - `pyproject.toml` (Poetry/Pip).
   - `app/main.py` (Hello World).
   - `app/core/config.py` (Env vars).
   - `Dockerfile`.

3. **Database Setup (Redis)**
   - Configure Redis service in `docker-compose.yml`.
   - Ensure persistence is enabled.

4. **Dashboard Setup (React)**
   - `package.json`.
   - `vite.config.ts`.
   - `index.html`.
   - `src/App.tsx`.
   - `Dockerfile`.

## Deliverables
- working `docker-compose up` that spins up Backend, Redis, and Dashboard (dev mode).
