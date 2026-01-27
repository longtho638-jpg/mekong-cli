# System Architecture 🏗️

The Antigravity Starter Bundle is designed as a modular suite of micro-services and libraries that can be used independently or composed into a cohesive monolithic application.

## High-Level Overview

```mermaid
graph TD
    User[User/Client] --> LB[Load Balancer / Gateway]
    LB --> FE[Frontend (AgencyOS Workspace)]

    subgraph "Core Services"
        FE --> Auth[Social Auth Kit]
        FE --> Prefs[User Preferences Kit]
        FE --> Webhook[Webhook Manager]
    end

    subgraph "Infrastructure"
        Auth --> DB[(Postgres)]
        Prefs --> DB
        Webhook --> Redis[(Redis)]
        Webhook --> DB

        API[Your API] --> RL[Rate Limiter]
        RL --> Redis
    end

    subgraph "Background"
        Email[Email Marketing Kit] --> DB
        Email --> SMTP[SMTP Provider]
        Migration[DB Migration Kit] --> DB
    end
```

## Integration Patterns

### 1. Monorepo Integration
You can copy the `products/*` folders into your existing `packages/` directory if you are using a workspace (npm/yarn/pnpm/turborepo).
*   **Pros:** Shared dependencies, easier refactoring.
*   **Cons:** Tighter coupling.

### 2. Microservices
Run each kit as a standalone Docker container. Use `docker-compose.yml` to orchestrate them.
*   **Pros:** Independent scaling, technology agnostic.
*   **Cons:** Network overhead, deployment complexity.

### 3. Library Import
For kits like `api-rate-limiter-kit` (coming soon), you can import them directly into your Express/FastAPI code as middleware.

## Data Flow

1.  **Authentication:** User logs in via **Social Auth Kit**. A JWT or Session is created.
2.  **Preferences:** Frontend requests user settings from **User Preferences Kit** using the Auth Token.
3.  **Actions:** User performs an action (e.g., updates profile).
    *   If valid, data is saved.
    *   If configured, **Webhook Manager** triggers an event to external systems.
    *   **Rate Limiter** ensures the user doesn't flood the API.

## Database Schema

While each kit manages its own tables, they share a `user_id` concept.

*   `users` (Managed by Auth Kit)
*   `user_preferences` (Managed by Prefs Kit, foreign key to `users.id`)
*   `webhooks` (Managed by Webhook Kit, owned by `users.id`)

We recommend using the **Database Migration Kit** (coming soon) to manage these schemas centrally.
