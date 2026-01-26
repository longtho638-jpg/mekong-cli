# 🚀 Deployment Guide

This guide covers how to deploy the Antigravity SaaS Starter Kit Bundle to production. Since this is a monorepo containing multiple applications, you have flexibility in how you deploy.

## Strategy A: Vercel (Recommended for Frontends)

Vercel has first-class support for Next.js and Monorepos (Turborepo).

### 1. Deploying Apps
You will create **3 separate projects** in Vercel, one for each frontend app, all connected to the same Git repository.

**Project 1: Landing Page**
*   **Root Directory**: `apps/landing`
*   **Framework Preset**: Next.js
*   **Build Command**: `cd ../.. && pnpm build --filter=landing` (or rely on Vercel's auto-detection)
*   **Env Vars**: Copy from `.env.example` (Public vars only)

**Project 2: Dashboard**
*   **Root Directory**: `apps/dashboard`
*   **Framework Preset**: Next.js
*   **Env Vars**: Needs `NEXT_PUBLIC_API_URL`, `NEXTAUTH_URL`, `NEXTAUTH_SECRET`, etc.

**Project 3: Auth**
*   **Root Directory**: `apps/auth`
*   **Framework Preset**: Next.js
*   **Env Vars**: DB connection string, Auth secrets.

### 2. Vercel Configuration
Add a `vercel.json` in each app directory if you need specific headers or redirects.

## Strategy B: Docker (Recommended for API/Backend)

For the API (`apps/api`), database, and Redis, a containerized approach is often best. You can use AWS ECS, Google Cloud Run, or a VPS (DigitalOcean/Railway/Render).

### 1. Build the Image
From the root of the monorepo:

```bash
docker build -f apps/api/Dockerfile -t my-saas-api .
```

*Note: You might need to adjust the Dockerfile to copy the root `lockfile` and workspace packages if the API depends on them.*

### 2. Run with Environment Variables
```bash
docker run -p 3001:3001 \
  -e DATABASE_URL=... \
  -e REDIS_URL=... \
  my-saas-api
```

## Strategy C: Railway / Render (Full Stack)

Platforms like Railway and Render detect Monorepos automatically.

1.  Connect your GitHub Repo.
2.  Create a Service for **API**.
    *   Root: `apps/api`
    *   Build Command: `pnpm install && pnpm build`
    *   Start Command: `pnpm start`
3.  Create a Service for **Dashboard**.
    *   Root: `apps/dashboard`
    *   ...
4.  Provision a **PostgreSQL** and **Redis** service within the same project.
5.  Link the variables (`DATABASE_URL`, `REDIS_URL`) automatically.

## Database Migrations in Production

**NEVER** run migrations automatically on app startup in serverless environments (like Vercel) as it can cause timeouts or race conditions.

**Recommended Workflow:**
1.  **CI/CD Pipeline**: Run migrations as a step in your GitHub Actions pipeline before deployment.
    ```yaml
    - name: Run Migrations
      run: pnpm prisma migrate deploy
      env:
        DATABASE_URL: ${{ secrets.DATABASE_URL }}
    ```
2.  **Manual**: Connect to your prod DB from your local machine and run `prisma migrate deploy`.

## Domain Setup (DNS)

For a professional look, structure your domains like this:

*   **Landing**: `www.acme.com` (or root `acme.com`)
*   **Dashboard**: `app.acme.com`
*   **Auth**: `auth.acme.com`
*   **API**: `api.acme.com`

Ensure your cookies in `apps/auth` are set with `domain: '.acme.com'` so they are readable by `app.acme.com`.

## SSL / HTTPS

*   **Vercel/Railway/Render**: SSL is automatic.
*   **VPS/Docker**: Use a reverse proxy like **Nginx** or **Traefik** to handle Let's Encrypt certificates.

## Checklist Before Going Live

- [ ] **Secrets**: All `.env` example values replaced with real, secure secrets.
- [ ] **Database**: Production database provisioned (e.g., AWS RDS, Supabase, Neon).
- [ ] **Redis**: Production Redis instance ready (e.g., Upstash, AWS ElastiCache).
- [ ] **Stripe**: Switched keys from `sk_test_` to `sk_live_`.
- [ ] **Auth**: Updated OAuth callback URLs in Google/GitHub developer consoles to match production domains.
- [ ] **Build**: Verified `pnpm build` passes locally without errors.
