# Phase 1: Foundation

**Status**: In Progress
**Goal**: Set up the project structure, Docker environment (FastAPI), and database schema.

## Steps

1. **Directory Structure**
   - Create `feature-flags-kit/` root.
   - Create `backend/` for FastAPI.
   - Create `dashboard/` for React Admin.
   - Create `sdk/` for the JavaScript/React SDK.
   - Create `docker-compose.yml`.

2. **Backend Setup (FastAPI)**
   - `pyproject.toml` (Poetry).
   - `app/main.py`.
   - `app/core/config.py`.
   - `app/db/session.py` (SQLAlchemy async).
   - `Dockerfile`.

3. **Database Schema (SQLAlchemy)**
   - `Environment`: dev, staging, prod.
   - `FeatureFlag`: key, description, default_value.
   - `FlagRule`: linked to feature flag (e.g., target specific users, percentage).
   - `FlagEnvironment`: state of a flag in an environment (enabled/disabled).

4. **Dashboard Setup (React)**
   - `vite` project.
   - Basic layout.

5. **SDK Setup**
   - Minimal npm package structure.

## Deliverables
- Working `docker-compose up` that spins up Backend (with DB) and Dashboard.
- Database tables created via Alembic or auto-create.
