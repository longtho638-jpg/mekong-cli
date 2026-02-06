---
title: "Phase 1: Scaffold FastAPI Service"
description: "Setup FastAPI, Poetry, Docker, Alembic, and Basic Health Check."
status: pending
priority: P1
effort: 1d
branch: feat/money-layer
tags: [python, fastapi, docker, setup]
created: 2026-02-06
---

# Phase 1: Scaffold FastAPI Service

## Context
We are creating the `apps/api` service from scratch. It needs to be a production-ready Python FastAPI application using modern tooling (Poetry, Pydantic v2, SQLAlchemy 2.0).

## Requirements
-   **Directory:** `apps/api`
-   **Package Manager:** Poetry
-   **Framework:** FastAPI
-   **DB Driver:** `asyncpg` (Async PostgreSQL)
-   **Config:** `pydantic-settings` (read from `.env`)

## Implementation Steps

1.  **Initialize Project Structure**
    -   Create `apps/api` directory.
    -   `poetry init` with dependencies: `fastapi`, `uvicorn[standard]`, `sqlalchemy`, `alembic`, `asyncpg`, `pydantic-settings`, `stripe`.
    -   Dev dependencies: `pytest`, `pytest-asyncio`, `black`, `isort`, `mypy`.

2.  **Application Factory Pattern**
    -   Create `app/main.py`: Entry point using `lifespan` for startup/shutdown.
    -   Create `app/core/config.py`: Settings class using `BaseSettings`.
    -   Create `app/api/v1/router.py`: Main router aggregator.
    -   Implement `GET /health` endpoint returning `{"status": "ok", "version": "..."}`.

3.  **Database Setup**
    -   Create `app/core/database.py`: Async engine and session factory (`AsyncSession`).
    -   Create `app/models/base.py`: `DeclarativeBase` for SQLAlchemy models.
    -   Initialize Alembic: `alembic init alembic`.
    -   Configure `alembic.ini` and `alembic/env.py` to use async engine and import models.

4.  **Dockerization**
    -   Create `Dockerfile`: Multi-stage build (builder vs runner) to keep image small.
    -   Create `docker-compose.yml` (or add to project root) for local development (API + Postgres).

5.  **Pre-commit Setup**
    -   Configure `pyproject.toml` for Black, Isort, and Mypy.

## Success Criteria
-   [ ] `poetry run uvicorn app.main:app --reload` starts without errors.
-   [ ] `curl http://localhost:8000/health` returns 200 OK.
-   [ ] Alembic can generate an empty revision (`alembic revision --autogenerate`).
-   [ ] Docker container builds and runs successfully.

## Todo List
-   [ ] Create project directory and init Poetry
-   [ ] Setup `config.py` with Pydantic Settings
-   [ ] Implement `main.py` and Health Check
-   [ ] Configure Async SQLAlchemy and Alembic
-   [ ] Write Dockerfile and docker-compose
-   [ ] Verify local startup
