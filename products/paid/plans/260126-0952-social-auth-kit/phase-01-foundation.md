# Phase 1: Foundation & Setup

## 1. Overview
**Priority**: Critical
**Status**: Pending
**Goal**: Establish the project structure, development environment, and database connectivity.

## 2. Requirements
- **Language**: Python 3.12+
- **Framework**: FastAPI
- **Database**: PostgreSQL (AsyncPG) or SQLite (for dev)
- **Containerization**: Docker & Docker Compose

## 3. Implementation Steps

### Step 1: Project Structure
- Create standardized directory layout.
- Initialize Git repository.
- Create `.gitignore` (standard Python + strict env exclusion).

### Step 2: Dependency Management
- Setup `pyproject.toml` (Poetry or UV recommended, fallback to pip requirements.txt).
- Core deps: `fastapi`, `uvicorn`, `sqlalchemy`, `alembic`, `pydantic-settings`, `asyncpg`, `httpx`.

### Step 3: Configuration Management
- Implement `core/config.py` using `pydantic-settings`.
- Define environment variables structure (`.env.example`).
  - DB Credentials
  - Secret Keys (JWT)
  - OAuth Client IDs/Secrets

### Step 4: Database Setup
- Setup SQLAlchemy `AsyncSession` engine.
- Configure Alembic for async migrations.
- Create `Base` model class.

### Step 5: Docker Environment
- `Dockerfile` for backend.
- `docker-compose.yml` for DB and App.

## 4. Success Criteria
- [ ] Application starts (`uvicorn app.main:app`).
- [ ] DB connection verified.
- [ ] Alembic can generate migration.
- [ ] Docker compose up runs successfully.

## 5. Related Files
- `backend/pyproject.toml`
- `backend/app/core/config.py`
- `backend/app/db/base.py`
- `docker-compose.yml`
