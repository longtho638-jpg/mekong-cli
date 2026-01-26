# ⚡️ Quick Start Guide

**Go from Zero to "Hello World" in 5 minutes.**

## Prerequisites

Ensure you have the following installed on your machine:
*   [Node.js](https://nodejs.org/) (v18 or higher)
*   [pnpm](https://pnpm.io/) (Recommended) or npm/yarn
*   [Docker](https://www.docker.com/) & Docker Compose (Optional, but recommended for DB/Redis)

---

## Step 1: Initialization

We provide a handy script to bootstrap the environment.

1.  Open your terminal in the bundle root.
2.  Run the initialization script:
    ```bash
    chmod +x init.sh
    ./init.sh
    ```
    *This script will:*
    *   *Check for required tools.*
    *   *Copy `.env.example` to `.env`.*
    *   *Install all dependencies via `pnpm`.*
    *   *(Optional) Start PostgreSQL and Redis via Docker.*
    *   *(Optional) Run initial database migrations.*

## Step 2: Configuration

Open the `.env` file in the root directory. This file acts as the source of truth for shared environment variables.

**Critical Variables to Update:**
1.  **Database**: `DATABASE_URL` (If you aren't using the Docker container provided).
2.  **Auth Secrets**: `NEXTAUTH_SECRET`, `JWT_SECRET`.
3.  **Stripe Keys** (for Payment Kit): `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`.

## Step 3: Run Development Server

Start all applications simultaneously using Turborepo:

```bash
pnpm dev
```

This will launch:
*   **Landing Page**: http://localhost:3000 (check console for exact port if 3000 is taken)
*   **Dashboard**: http://localhost:3001
*   **Auth App**: http://localhost:3002
*   **API**: http://localhost:3003

*Note: Ports are configured in each app's `package.json` scripts. If they conflict, Turborepo will output the actual ports assigned.*

## Step 4: Verify Installation

1.  Navigate to the **Landing Page** in your browser.
2.  Try to **Sign Up/Login** (This hits the Auth/API services).
3.  Once logged in, navigate to the **Dashboard**.

## Common Commands

| Command | Description |
| :--- | :--- |
| `pnpm dev` | Start all apps in development mode. |
| `pnpm build` | Build all apps for production. |
| `pnpm lint` | Run ESLint across the entire monorepo. |
| `pnpm clean` | Remove `node_modules` and build artifacts. |
| `docker-compose up -d` | Start infrastructure (DB, Redis). |
| `docker-compose down` | Stop infrastructure. |

## Next Steps

Now that you're running, it's time to connect the pieces deeper.
👉 **Read the [Integration Guide](./INTEGRATION_GUIDE.md).**
