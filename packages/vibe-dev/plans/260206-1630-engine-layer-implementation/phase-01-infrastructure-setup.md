# Phase 1: Infrastructure Setup

**Context**: [Plan Engine Layer Implementation](./plan.md)
**Goal**: Establish the local runtime environment (Redis, Postgres) required for the Engine and Worker services.

## 1. Requirements
- **Directory**: `/Users/macbookprom1/mekong-cli/infrastructure`
- **Services**:
  - **Redis**: For BullMQ job queue. Version: `alpine`. Port: `6379`.
  - **PostgreSQL**: For persistent data (users, credits, logs). Version: `15-alpine`. Port: `5432`.
- **Network**: `agency-network` to allow internal communication.
- **Persistence**: Docker volumes for data persistence.

## 2. Implementation Steps
1.  Create directory: `../../infrastructure`
2.  Create `docker-compose.yml` in `../../infrastructure`.
3.  Create `.env.example` in `../../infrastructure` for configuration.
4.  Verify startup with `docker-compose up -d`.

## 3. Configuration
**Redis**:
- No password for local dev (or simple password).
- Persistence enabled.

**Postgres**:
- User: `postgres`
- Password: `password` (dev)
- DB: `agency_os`

## 4. Verification
- `docker ps` shows running containers.
- `nc -z localhost 6379` confirms Redis port.
- `nc -z localhost 5432` confirms Postgres port.
