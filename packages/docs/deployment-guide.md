# Deployment Guide: AgencyOS RaaS

## 1. Landing Page (Vercel)

**Project**: `apps/agencyos-landing`
**Platform**: Vercel

### Configuration
The project includes a `vercel.json` configuration file that sets important security headers:
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy`: Restricts camera, microphone, and geolocation.

### Setup Instructions
1.  **Import to Vercel**:
    -   Connect your GitHub repository.
    -   Select the root directory: `apps/agencyos-landing`.
    -   Framework Preset: `Next.js`.

2.  **Environment Variables**:
    Configure these in Vercel Project Settings:
    -   `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`: From Stripe Dashboard (Public).
    -   `STRIPE_SECRET_KEY`: From Stripe Dashboard (Secret).

3.  **Deploy**:
    -   Push to `main` to trigger a production deployment.

---

## 2. RaaS Gateway (Cloudflare Workers)

**Project**: `apps/raas-gateway`
**Platform**: Cloudflare Workers

### Setup
1.  Install Wrangler: `npm install -g wrangler`
2.  Login: `wrangler login`
3.  Deploy:
    ```bash
    cd apps/raas-gateway
    wrangler deploy
    ```
4.  Secrets:
    ```bash
    wrangler secret put OPENCLAW_URL
    wrangler secret put SERVICE_TOKEN
    ```

---

## 3. Engine Layer (Docker / Cloud Run)

**Projects**: `apps/engine`, `apps/worker`
**Infrastructure**: Redis, PostgreSQL

Both services use multi-stage Dockerfiles optimized for production (based on `node:20-alpine`), keeping image sizes small and secure (running as non-root `nodejs` user).

### Option A: Local / VPS Deployment (Docker Compose)

Use the provided `Makefile` in the `infrastructure/` directory for easy management.

1.  **Navigate to Infrastructure**:
    ```bash
    cd infrastructure
    ```

2.  **Start Services**:
    ```bash
    make deploy-local
    ```
    This builds the images locally and starts Redis, Postgres, Engine, and Worker services defined in `docker-compose.yml`.

3.  **Stop Services**:
    ```bash
    make down
    ```

### Option B: Local Development (SQLite - Zero Dependency)

For rapid iteration without Docker, you can run the Engine and Worker using SQLite and a local Redis instance (or mocked).

1.  **Configure Environment**:
    Ensure `.env` in `apps/engine` and `apps/worker` has:
    ```env
    DATABASE_URL="file:./dev.db"
    ```

2.  **Run Services**:
    ```bash
    # From root
    npm run dev
    ```
    This starts the API and Frontend concurrently.

### Option C: Production Deployment (Cloud Run / Kubernetes)

1.  **Build and Push Images**:
    You can use the Makefile to build and push images to your container registry (e.g., Google Container Registry or Docker Hub).

    ```bash
    cd infrastructure

    # Set your registry URL
    export REGISTRY=gcr.io/your-project-id

    # Build images
    make build-all

    # Push images
    make push-all
    ```

2.  **Deploy to Cloud Run (Example)**:

    **Engine Service**:
    -   Image: `gcr.io/your-project-id/agency-engine:latest`
    -   Port: 3000
    -   Env Vars:
        -   `REDIS_HOST`: (Redis IP/Host)
        -   `REDIS_PORT`: 6379
        -   `DATABASE_URL`: postgresql://user:pass@host:5432/db
        -   `SERVICE_TOKEN`: (Your secure internal token)

    **Worker Service**:
    -   Image: `gcr.io/your-project-id/agency-worker:latest`
    -   Env Vars:
        -   `REDIS_HOST`: (Redis IP/Host)
        -   `REDIS_PORT`: 6379
        -   `DATABASE_URL`: postgresql://user:pass@host:5432/db

### Database Migrations (Production)

Since the Docker images include `prisma generate` but do not auto-run migrations on start (for safety), you should run migrations as part of your deployment pipeline or via a bastion host.

```bash
# Example: Running migrations against production DB
DATABASE_URL="postgresql://prod-db-url..." npx prisma migrate deploy
```
