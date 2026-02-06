# Phase 4: Integration & Verification

**Context**: [Plan Engine Layer Implementation](./plan.md)
**Goal**: Verify the end-to-end flow from Gateway to Worker.

## 1. Prerequisites
- Docker containers (Redis, Postgres) are running.
- `apps/engine` is running on port 3000.
- `apps/worker` is running.
- `apps/raas-gateway` is configured to point to `apps/engine`.

## 2. Integration Steps
1.  **Local Gateway Config**:
    - Update `apps/raas-gateway/wrangler.toml` (or `.dev.vars`) to set `OPENCLAW_URL=http://localhost:3000`.
    - Note: Cloudflare Worker (local `wrangler dev`) might need a tunnel to reach `localhost:3000` if running in remote mode, but local mode should work with specific bindings or just direct fetch if network allows. Better to use `cloudflared` or direct curl to Engine for first test.

2.  **Test 1: Direct Engine API**:
    ```bash
    curl -X POST http://localhost:3000/v1/chat/completions \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer dev-token" \
      -d '{ "model": "test", "messages": [{"role": "user", "content": "Hello"}] }'
    ```
    - **Expect**: JSON response with `status: queued`.
    - **Verify**: Worker logs show job processing.

3.  **Test 2: Gateway -> Engine**:
    - Start Gateway: `cd apps/raas-gateway && npm run dev`.
    - Send request to Gateway URL.
    - **Expect**: Gateway forwards to Engine, Engine queues job, Worker processes it.

## 3. Success Criteria
- [ ] Job flows from API -> Redis -> Worker.
- [ ] Worker executes job successfully.
- [ ] Logs are visible in Worker console.
