# Phase 1: Setup & Architecture

> **Priority**: Critical
> **Status**: Pending

## Objectives
Establish the foundational infrastructure for the Feedback Widget Kit, ensuring a robust development environment for both the React widget and FastAPI backend.

## Requirements

### Backend (FastAPI)
- [ ] Initialize Python project with Poetry
- [ ] Setup FastAPI application structure
- [ ] Configure PostgreSQL database
- [ ] Setup Alembic for migrations
- [ ] Implement basic health check endpoint
- [ ] Configure Docker environment

### Frontend (React Widget)
- [ ] Initialize React project with Vite
- [ ] Configure build for embeddable script (IIFE/UMD)
- [ ] Setup TailwindCSS (prefixed/scoped to avoid conflicts)
- [ ] Configure ESLint/Prettier

### Infrastructure
- [ ] Create monorepo structure
- [ ] Setup pre-commit hooks
- [ ] Configure GitHub Actions for CI

## Implementation Steps

1. **Project Initialization**
   - Create `backend` and `widget` directories
   - Initialize git repository
   - Setup `.gitignore`

2. **Backend Setup**
   - Install dependencies: `fastapi`, `uvicorn`, `sqlalchemy`, `alembic`, `pydantic-settings`
   - Create `app/core/config.py` for env vars
   - Create `app/main.py`
   - Setup `docker-compose.yml` for DB

3. **Frontend Setup**
   - `npm create vite@latest widget -- --template react-ts`
   - Configure `vite.config.ts` for library mode (build single JS file)
   - Setup Shadow DOM wrapper (optional, for style isolation)

4. **CI/CD**
   - Create `.github/workflows/test.yml`
   - Setup linting jobs

## Todo List
- [ ] Init Repo
- [ ] Backend Skeleton
- [ ] Database Connection
- [ ] Widget Build Config
- [ ] Docker Compose
- [ ] CI Pipeline

## Success Criteria
- Backend running locally on port 8000
- Database connected and migrations working
- Widget builds to a single `widget.js` file
- Tests pass in CI
