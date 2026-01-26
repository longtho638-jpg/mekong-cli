# Deployment Guide

This guide covers deploying the Webhook Manager Kit to a production environment.

## Architecture Overview

The kit consists of three main components:
1.  **API Server (FastAPI)**: Handles incoming webhooks and dashboard API requests.
2.  **Worker (arq)**: Processes the event queue and delivers webhooks to targets.
3.  **Redis**: Stores the job queue.
4.  **Database (PostgreSQL recommended)**: Stores event logs, endpoint configurations, and delivery history.

## Prerequisites

-   Docker & Docker Compose (recommended for easiest deployment)
-   OR
-   Python 3.9+ environment
-   Redis server
-   PostgreSQL server

## Docker Compose Deployment

1.  Create a `docker-compose.yml` file:

    ```yaml
    version: '3.8'

    services:
      db:
        image: postgres:15
        environment:
          POSTGRES_USER: user
          POSTGRES_PASSWORD: password
          POSTGRES_DB: webhook_db
        volumes:
          - postgres_data:/var/lib/postgresql/data

      redis:
        image: redis:7
        ports:
          - "6379:6379"

      api:
        build: ./backend
        command: uvicorn app.main:app --host 0.0.0.0 --port 8000
        ports:
          - "8000:8000"
        environment:
          - DATABASE_URL=postgresql://user:password@db/webhook_db
          - REDIS_URL=redis://redis:6379/0
          - STRIPE_WEBHOOK_SECRET=...
        depends_on:
          - db
          - redis

      worker:
        build: ./backend
        command: arq app.worker.WorkerSettings
        environment:
          - DATABASE_URL=postgresql://user:password@db/webhook_db
          - REDIS_URL=redis://redis:6379/0
        depends_on:
          - db
          - redis

      frontend:
        build: ./frontend
        ports:
          - "3000:3000"

    volumes:
      postgres_data:
    ```

2.  Run `docker-compose up -d`.

## Manual Deployment

### 1. Database Setup

Install PostgreSQL and create a database. Update your `.env` file with the connection string:

```env
DATABASE_URL=postgresql://user:password@localhost:5432/webhook_db
```

Run migrations (or init script) to create tables:
```bash
cd backend
python -m app.db.init_db
```

### 2. Redis Setup

Install and start Redis. Update `.env`:
```env
REDIS_URL=redis://localhost:6379/0
```

### 3. API Server

Install dependencies and run with Gunicorn/Uvicorn:

```bash
pip install gunicorn uvicorn
gunicorn app.main:app -w 4 -k uvicorn.workers.UvicornWorker -b 0.0.0.0:8000
```

### 4. Worker

Run the worker process (using `arq`):

```bash
arq app.worker.WorkerSettings
```

It is recommended to run this via a process manager like `supervisor` or `systemd`.

### 5. Frontend

Build the React app:

```bash
cd frontend
npm install
npm run build
```

Serve the `dist` folder using Nginx or any static file server.

## Production Checklist

-   [ ] **Change Secret Keys**: Ensure `SECRET_KEY` and all webhook secrets are set securely.
-   [ ] **HTTPS**: Configure SSL/TLS termination (e.g., via Nginx or Cloudflare). Webhook providers often require HTTPS.
-   [ ] **Database Backup**: Configure automated backups for PostgreSQL.
-   [ ] **Monitoring**: Set up monitoring for the API and Worker processes.
-   [ ] **Rate Limiting**: Consider adding rate limiting (e.g., using Nginx) to prevent DoS attacks on receiver endpoints.
