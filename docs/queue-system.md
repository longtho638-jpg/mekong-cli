# IPO-019 Job Queue & Background Worker System

> **"投之亡地然後存"** - Master all terrains through adaptable workers.

## Overview
The AgencyOS Job Queue system is a robust, Redis-backed asynchronous processing engine designed for scalability and reliability. It handles heavy background tasks (emails, reports, data exports) without blocking the main API, ensuring a snappy user experience.

## Architecture

### Components
1.  **Queue Service (`backend.services.queue_service`)**:
    -   Manages Redis queues (`high`, `normal`, `low`, `dlq`).
    -   Handles enqueueing, scheduling, and status updates.
    -   Provides metrics for monitoring.

2.  **Workers (`backend.workers`)**:
    -   **BaseWorker**: Core logic for polling, execution, retries, and graceful shutdown.
    -   **Specialized Workers**: `email`, `report`, `export`, `webhook`.
    -   Multi-process scalable architecture.

3.  **Scheduler (`backend.services.scheduler_service`)**:
    -   Cron-like scheduling for recurring tasks (backups, cleanup).
    -   Handles delayed job execution (run_at).

4.  **API (`backend.api.routers.jobs`)**:
    -   Endpoints to enqueue jobs, check status, and view metrics.
    -   Protected by RBAC.

### Queues & Priorities
-   **High**: Critical tasks (Transactional emails, Password resets).
-   **Normal**: Standard tasks (Webhooks, Report generation).
-   **Low**: Background maintenance (Data export, Cleanup).
-   **DLQ**: Dead Letter Queue for permanently failed jobs (after max retries).

## Usage

### Enqueueing a Job
```python
from backend.services.queue_service import QueueService

queue_service = QueueService()
job_id = queue_service.enqueue_job(
    job_type="send_email",
    payload={
        "to": "user@example.com",
        "subject": "Welcome!"
    },
    priority="high"
)
```

### Scheduling a Delayed Job
```python
from datetime import datetime, timedelta

run_at = datetime.utcnow() + timedelta(hours=1)
queue_service.enqueue_job(
    job_type="send_email",
    payload={...},
    run_at=run_at
)
```

### Starting Workers
Use the provided script to start workers in production:
```bash
# Start all workers
./scripts/workers/start-workers.sh

# Start specific worker type
./scripts/workers/start-workers.sh email
```

## Configuration
Configuration is located in `config/queue-config.yaml` and `backend/api/config/settings.py`.

## Monitoring
-   **Dashboard**: Access the Job Queue Dashboard at `/dashboard/jobs`.
-   **Metrics API**: `GET /api/jobs/metrics/overview`
-   **Workers API**: `GET /api/jobs/workers`

## Resilience
-   **Retries**: Exponential backoff (default: 1m, 5m, 15m).
-   **Heartbeats**: Workers report status every 30s.
-   **Graceful Shutdown**: Workers finish current job before stopping (SIGINT/SIGTERM).

## Database Schema
The system uses Redis for active queue management and Postgres (`jobs`, `job_results` tables) for long-term history and auditing (migration `20260127_004_job_queue.sql`).

---
**Status**: IPO Ready ✅
