# System Architecture: AgencyOS RaaS

## 1. High-Level Overview (Hub-and-Spoke)

The AgencyOS Robot-as-a-Service (RaaS) platform follows a Hub-and-Spoke architecture designed for high scalability, separation of concerns, and asynchronous processing.

```mermaid
graph TD
    User[User / Client] -->|HTTP POST /v1/chat/completions| Gateway[RaaS Gateway (Cloudflare Workers)]
    Gateway -->|Auth & Rate Limit| Engine[Engine API (Node.js/Fastify)]

    subgraph "Engine Layer (Dockerized)"
        Engine -->|1. Persist Job (QUEUED)| DB[(PostgreSQL)]
        Engine -->|2. Enqueue Job| Queue[(Redis BullMQ)]

        Worker[Worker Service (Node.js)] -->|3. Poll Job| Queue
        Worker -->|4. Update Status (PROCESSING)| DB
        Worker -->|5. Execute Task| LLM[LLM Provider (Gemini/Claude)]
        Worker -->|6. Update Status (COMPLETED/FAILED)| DB
    end

    User -->|HTTP GET /v1/jobs/:id| Gateway
    Gateway -->|Fetch Status| Engine
    Engine -->|Query| DB
```

## 2. Core Components

### 2.1. RaaS Gateway (Cloudflare Workers)
- **Role**: Entry point for all API traffic.
- **Responsibilities**:
  - Authentication (API Keys).
  - Rate Limiting.
  - Request Routing.
  - CORS handling.

### 2.2. Engine API (apps/engine)
- **Technology**: Node.js, Fastify, Docker.
- **Role**: The "Hub" that manages job ingestion and persistence.
- **Responsibilities**:
  - Validates request payloads (Zod).
  - Persists job records to PostgreSQL.
  - Pushes jobs to the Redis Queue.
  - Provides endpoints to check job status.

### 2.3. Worker Service (apps/worker)
- **Technology**: Node.js, BullMQ, Docker.
- **Role**: The "Spoke" that executes tasks asynchronously.
- **Responsibilities**:
  - Consumes jobs from Redis.
  - Updates job status in PostgreSQL (PROCESSING -> COMPLETED/FAILED).
  - Executes the actual business logic (e.g., calling LLMs).
  - Handles retries and failure reporting.

### 2.4. Infrastructure
- **Redis (BullMQ)**:
  - Used for job queuing and pub/sub.
  - ephemeral storage for active jobs.
- **PostgreSQL (Prisma)**:
  - Long-term persistence for job history, users, and credits.
  - Source of truth for job status.

## 3. Data Model (Prisma Schema)

### Job
| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Unique identifier |
| `type` | String | Task type (e.g., `chat.completion`) |
| `status` | Enum | `QUEUED`, `PROCESSING`, `COMPLETED`, `FAILED` |
| `input` | JSON | Request payload (model, messages) |
| `output` | JSON | Result payload |
| `error` | String | Error message if failed |
| `userId` | String | Foreign Key to User |

### User
| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Unique identifier |
| `email` | String | User email |
| `credits` | Int | Remaining credits |

## 4. Deployment Strategy
- **Containerization**: Docker & Docker Compose.
- **Orchestration**:
  - **Dev**: `docker-compose up` (All-in-one).
  - **Prod**: Google Cloud Run (Serverless Containers) or VM.
- **CI/CD**: GitHub Actions for build and test.

## 5. Security
- **Service Token**: Internal authentication between Gateway and Engine.
- **Environment Variables**: All secrets (DB URLs, Keys) managed via `.env`.
- **Network Isolation**: Redis and Postgres are not exposed publicly in production; only accessible by Engine/Worker via private network.
