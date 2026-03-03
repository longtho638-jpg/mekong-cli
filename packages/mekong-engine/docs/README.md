# Mekong Engine — Cloudflare Worker RaaS API

Serverless PEV (Plan-Execute-Verify) engine on Cloudflare Workers with multi-tenant credit billing.

## Stack

| Component | Tech |
|-----------|------|
| Runtime | Cloudflare Workers (TypeScript) |
| Framework | Hono.js |
| Database | Cloudflare D1 (SQLite) |
| Cache | Cloudflare KV |
| LLM | Workers AI (Llama 3.1 8B) + OpenAI-compatible fallback |

**Production:** `https://mekong-engine.agencyos-openclaw.workers.dev`

## Quick Start

```bash
# Local dev
cd packages/mekong-engine && wrangler dev

# Deploy
wrangler deploy
```

## API Endpoints

All `/v1/*` endpoints require `Authorization: Bearer <API_KEY>`.

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/health` | Health check |
| POST | `/cmd` | PEV pipeline (no auth) |
| POST | `/v1/tasks` | Create mission |
| GET | `/v1/tasks/:id` | Get status |
| GET | `/v1/tasks/:id/stream` | SSE stream |
| POST | `/v1/tasks/:id/cancel` | Cancel mission |
| GET | `/v1/agents` | List agents |
| POST | `/v1/agents/:name/run` | Run agent |
| GET | `/billing/plans` | List plans |
| POST | `/billing/webhook/polar` | Payment webhook |

## Database Schema

**tenants:** `id`, `name`, `api_key_hash`, `tier` (free|pro|enterprise), `created_at`

**credits:** `id`, `tenant_id`, `amount`, `reason`, `created_at`

**missions:** `id`, `tenant_id`, `goal`, `status`, `credits_used`, `total_steps`, `completed_steps`, `result`, `created_at`, `completed_at`

## Authentication

Extract Bearer token → SHA-256 hash → Lookup `tenants.api_key_hash` → Tenant isolation enforced.

## Rate Limiting

Per-tenant via Cloudflare KV:
- **Free:** 100 MCU/month
- **Pro:** Unlimited
- **Enterprise:** Custom

Response headers: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`

## Bindings

```toml
[[d1_databases]]
binding = "DB"
database_name = "mekong-engine"

[[kv_namespaces]]
binding = "RATE_LIMIT_KV"
id = "abc123..."

[[ai_bindings]]
binding = "AI"
```

## Environment

| Variable | Purpose |
|----------|---------|
| `SERVICE_TOKEN` | Admin token |
| `POLAR_WEBHOOK_SECRET` | Webhook key |
| `LLM_API_KEY` | Fallback API key |

## Deployment

- [ ] D1 created: `wrangler d1 create mekong-engine`
- [ ] KV created: `wrangler kv namespace create RATE_LIMIT_KV`
- [ ] Migrations: `wrangler d1 execute mekong-engine < migrations/*.sql`
- [ ] Secrets: `.dev.vars` or Wrangler secrets
- [ ] Deploy: `wrangler deploy`
- [ ] Health: `curl /health` → 200 OK
- [ ] Polar webhook registered

## Development

```bash
# Tests
npm test

# Local DB reset
rm -rf .wrangler/state && wrangler dev

# Debug logs
DEBUG=mekong:* wrangler dev
```

## Performance

- Cold start: ~50ms
- Plan time: ~2s (LLM)
- Execute: Variable
- D1 caching: Reduces latency
- KV checks: Global + fast

---

**Repo:** [mekong-cli/packages/mekong-engine](https://github.com/longtho638-jpg/mekong-cli/tree/main/packages/mekong-engine)

**Version:** 1.0.0
