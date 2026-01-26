# Architecture & Technology Stack

> **Product**: Email Marketing Kit
> **Date**: 2026-01-26

## High-Level Architecture

The Email Marketing Kit follows a modular, monolithic architecture designed for ease of deployment (self-hosted) while maintaining high performance for I/O-bound tasks (sending emails).

```mermaid
graph TD
    Client[Client / API Consumer] --> LB[Load Balancer / Nginx]
    LB --> API[FastAPI App]

    subgraph "Core Application"
        API --> Auth[Auth Middleware]
        API --> Controller[Request Controllers]
        Controller --> Service[Service Layer]
        Service --> DB[(PostgreSQL)]

        Service --> TemplateEngine[Template Engine (MJML/Jinja2)]
        Service --> Queue[Redis Queue]
    end

    subgraph "Background Workers"
        Worker[Worker Process] --> Queue
        Worker --> ProviderAdapter[Provider Adapter]
        ProviderAdapter --> SMTP[SMTP / AWS SES / SendGrid]
    end

    subgraph "Analytics & feedback"
        Webhook[Webhook Endpoint] --> EventService[Event Service]
        EventService --> DB
    end
```

## Technology Stack Recommendations

### Backend Core
- **Language**: Python 3.11+
  - *Why*: Strong async support, excellent ecosystem (FastAPI, SQLAlchemy), easy to read.
- **Framework**: FastAPI
  - *Why*: High performance (Starlette), auto-generated OpenAPI docs, type safety (Pydantic).
- **ORM**: SQLAlchemy 2.0 (Async)
  - *Why*: Industry standard, robust migration support (Alembic), async support.
- **Data Validation**: Pydantic v2
  - *Why*: Fastest validation library in Python, strict typing.

### Data Storage
- **Primary Database**: PostgreSQL 15+
  - *Why*: Reliability, JSONB support (for flexible subscriber attributes), robust locking.
- **Queue/Cache**: Redis 7+
  - *Why*: Standard for job queues, fast temporary storage for rate limiting tokens.

### Email Rendering
- **Template Engine**: Jinja2
  - *Why*: Flexible variable substitution, sandboxed execution.
- **Responsive Framework**: MJML
  - *Why*: Solves the "email client hell" (Outlook, Gmail compatibility) by compiling high-level XML to table-based HTML.

### Background Processing
- **Task Queue**: `arq` (Async Redis Queue) or `Celery`
  - *Why*: `arq` is lightweight and built for `asyncio`. `Celery` is more robust but heavier. Recommendation: **arq** for this specific kit (simpler deployment).

### Deployment
- **Containerization**: Docker & Docker Compose
  - *Why*: "It just works" deployment for self-hosting.
- **Web Server**: Uvicorn (behind Nginx/Traefik)
  - *Why*: ASGI standard, fast.

## Design Decisions

### 1. The Provider Adapter Pattern
We abstract the email sending logic into an `EmailProvider` interface.
- **Benefit**: Users can switch from AWS SES to SendGrid by changing 2 env vars.
- **Benefit**: Easy to mock for testing.

### 2. Async-First
Email sending is 99% waiting for network I/O.
- **Decision**: Use `async`/`await` throughout the stack.
- **Benefit**: A single worker process can handle hundreds of concurrent connections compared to blocking I/O.

### 3. Webhook Normalization
Different providers send different JSON payloads for "Bounce" or "Spam Report".
- **Decision**: A normalization layer converts these into a standard internal `Event` model.
- **Benefit**: Analytics logic doesn't care which provider is used.

## Scalability Considerations
- **Database**: The heaviest write load is the `events` table (opens/clicks).
  - *Strategy*: Use partitioning by time (monthly) for the events table if volume gets huge.
- **Sending**: Horizontal scaling.
  - *Strategy*: Spin up more Worker containers. Redis handles the task distribution.
