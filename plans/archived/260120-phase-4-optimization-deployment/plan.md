# Phase 4: Performance Optimization & Deployment Readiness

**Goal:** Ensure the software is installable, performant, and ready for deployment.

## 1. Packaging & Installation
- **Current State:** `setup.py` is missing. `requirements.txt` uses loose pinning.
- **Action:** Create `setup.py` to make `mekong-cli` installable via `pip`.
    - Define entry points for the CLI (`mekong = cli.entrypoint:main`).
    - Define package structure (`antigravity`, `cli`).

## 2. Performance Audit
- **Goal:** Detect blocking I/O in async code.
- **Action:** Scan for synchronous calls (`requests`, `time.sleep`) within `async def`.
- **Action:** Verify no circular imports causing slow startup (already checked in Phase 2, but double check).

## 3. Deployment (Docker)
- **Current State:** Single-stage Dockerfile for Backend API.
- **Action:**
    - Verify `backend/api/main.py` exists (referenced in Dockerfile).
    - If targeting CLI deployment, we might need a separate Dockerfile or entrypoint.
    - Optimization: Consider multi-stage build if image size is an issue (low priority for now).

## Execution Steps
1. Create `setup.py`.
2. Scan for blocking I/O.
3. Verify `backend/api/main.py` existence.
4. Final "Ship" of Phase 4.
