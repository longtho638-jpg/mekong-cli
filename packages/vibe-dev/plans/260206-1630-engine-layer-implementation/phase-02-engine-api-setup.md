# Phase 2: Engine API Service

**Context**: [Plan Engine Layer Implementation](./plan.md)
**Goal**: Create the Node.js service that accepts tasks from the Gateway and adds them to the BullMQ queue.

## 1. Requirements
- **Directory**: `apps/engine`
- **Framework**: Fastify (high performance) or Express (simplicity). Let's use **Fastify**.
- **Dependencies**: `fastify`, `bullmq`, `ioredis`, `dotenv`, `zod` (validation).
- **Interface**: HTTP POST.

## 2. API Specification
- **Endpoint**: `POST /v1/chat/completions`
- **Headers**:
  - `Authorization`: `Bearer <SERVICE_TOKEN>`
  - `Content-Type`: `application/json`
- **Body**:
  ```json
  {
    "model": "gemini-1.5-pro",
    "messages": [
      { "role": "user", "content": "Analyze this..." }
    ]
  }
  ```
- **Response**:
  ```json
  {
    "id": "job_123",
    "object": "chat.completion.chunk",
    "created": 1234567890,
    "model": "gemini-1.5-pro",
    "status": "queued"
  }
  ```

## 3. Implementation Steps
1.  Initialize project: `mkdir -p apps/engine && cd apps/engine && npm init -y`.
2.  Install dependencies: `npm install fastify bullmq ioredis dotenv zod`.
3.  Create `src/index.js` (entry point).
4.  Create `src/queue.js` (BullMQ producer).
5.  Create `src/routes.js` (API endpoints).
6.  Configure `Dockerfile` for deployment.

## 4. Verification
- Start Redis (Phase 1).
- Start Engine: `node src/index.js`.
- Send curl request to localhost:3000.
- Verify job appears in Redis (using `bull-repl` or `redis-cli`).
