# Phase 3: Worker Service Setup

**Context**: [Plan Engine Layer Implementation](./plan.md)
**Goal**: Create the background worker service that consumes jobs from the BullMQ queue and executes them.

## 1. Requirements
- **Directory**: `apps/worker`
- **Framework**: Node.js (Standalone process).
- **Dependencies**: `bullmq`, `ioredis`, `dotenv`, `openai` (or other AI SDKs for execution).
- **Queue**: Consumes from `openclaw-queue`.

## 2. Architecture
- **Consumer**: Listens for jobs.
- **Sandboxing**: (Future) Execute jobs in isolated environments. For now, execute in-process or via shell.
- **Job Types**:
  - `chat.completion`: Standard LLM request.
  - `recipe.execute`: Complex workflow execution (OpenClaw).

## 3. Implementation Steps
1.  Initialize project: `mkdir -p apps/worker && cd apps/worker && npm init -y`.
2.  Install dependencies: `npm install bullmq ioredis dotenv`.
3.  Create `src/index.js` (Worker entry point).
4.  Create `src/worker.js` (BullMQ consumer logic).
5.  Create `src/executor.js` (Task execution logic).
    - Implement a mock executor that logs to console.
    - Implement a basic "echo" or "LLM" executor.

## 4. Verification
- Start Redis (Phase 1).
- Start Worker: `node src/index.js`.
- Send a job via Engine API (Phase 2).
- Verify Worker logs "Processing job..." and "Job completed".
