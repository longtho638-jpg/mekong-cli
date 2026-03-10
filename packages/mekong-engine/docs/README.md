# Mekong Engine — Cloudflare Worker RaaS API

Serverless PEV (Plan-Execute-Verify) engine on Cloudflare Workers with multi-tenant credit billing and BYOK (Bring Your Own Key) LLM support.

## Stack

| Component | Tech |
|-----------|------|
| Runtime | Cloudflare Workers (TypeScript) |
| Framework | Hono.js |
| Database | Cloudflare D1 (SQLite) |
| Cache | Cloudflare KV |
| LLM | Workers AI (Llama 3.1 8B) + BYOK (OpenAI/Google/Anthropic) |

**Production:** `https://mekong-engine.agencyos-openclaw.workers.dev`

## Quick Start

```bash
cd packages/mekong-engine

# Install deps
pnpm install

# Local dev (auto-creates local D1)
pnpm exec wrangler dev

# Deploy
pnpm exec wrangler deploy

# Health check
curl https://mekong-engine.agencyos-openclaw.workers.dev/health
```

## API Endpoints

### Public

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/health` | Health check + auto-migrate |
| POST | `/cmd` | PEV pipeline (optional auth for BYOK) |
| GET | `/ai/test` | Workers AI test |

### Authenticated (`Authorization: Bearer <API_KEY>`)

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/v1/tasks` | Create mission (deducts credits) |
| GET | `/v1/tasks` | List missions |
| GET | `/v1/tasks/:id` | Get mission status |
| GET | `/v1/tasks/:id/stream` | SSE stream |
| POST | `/v1/tasks/:id/cancel` | Cancel + refund |
| GET | `/v1/agents` | List agents |
| POST | `/v1/agents/:name/run` | Run agent |
| POST | `/v1/settings/llm` | Save LLM config (BYOK) |
| GET | `/v1/settings/llm` | Get LLM config (masked key) |
| DELETE | `/v1/settings/llm` | Remove custom LLM → fallback Workers AI |

### Billing (no auth for tenant creation)

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/billing/tenants` | Create tenant → returns API key |
| POST | `/billing/webhook` | Polar.sh payment webhook |
| GET | `/billing/credits` | Credit balance (auth required) |
| GET | `/billing/credits/history` | Credit history (auth required) |

## Database Schema

**tenants:** `id`, `name`, `api_key_hash`, `tier`, `created_at`

**credits:** `id`, `tenant_id`, `amount`, `reason`, `created_at`

**missions:** `id`, `tenant_id`, `goal`, `status`, `credits_used`, `total_steps`, `completed_steps`, `result`, `created_at`, `completed_at`

**tenant_settings:** `tenant_id`, `llm_provider`, `llm_api_key_encrypted`, `llm_base_url`, `llm_model`, `updated_at`

## BYOK (Bring Your Own Key)

Tenants can use their own LLM API keys for stronger models.

### LLM Fallback Chain
```
tenant BYOK key → global LLM_API_KEY → Workers AI (free Llama 3.1)
```

### Provider Presets

| Provider | Default Base URL | Default Model |
|----------|-----------------|---------------|
| `openai` | `https://api.openai.com/v1` | `gpt-4o-mini` |
| `google` | `https://generativelanguage.googleapis.com/v1beta/openai` | `gemini-2.0-flash` |
| `anthropic` | `https://api.anthropic.com/v1` | `claude-sonnet-4-20250514` |
| `custom` | (required) | (required) |

### Usage Example

```bash
# 1. Create tenant
curl -X POST .../billing/tenants \
  -H "Content-Type: application/json" \
  -d '{"name":"my-company"}'
# → {"tenant_id":"...","api_key":"mk_xxx","tier":"free"}

# 2. Save OpenAI key (only provider + api_key needed)
curl -X POST .../v1/settings/llm \
  -H "Authorization: Bearer mk_xxx" \
  -H "Content-Type: application/json" \
  -d '{"provider":"openai","api_key":"sk-proj-..."}'

# 3. Check settings (key is masked)
curl .../v1/settings/llm -H "Authorization: Bearer mk_xxx"
# → {"provider":"openai","api_key":"sk-***...","base_url":"https://api.openai.com/v1","model":"gpt-4o-mini"}

# 4. Use /cmd with your key automatically
curl -X POST .../cmd \
  -H "Authorization: Bearer mk_xxx" \
  -H "Content-Type: application/json" \
  -d '{"goal":"analyze this data"}'

# 5. Remove custom key (fallback to Workers AI)
curl -X DELETE .../v1/settings/llm -H "Authorization: Bearer mk_xxx"
```

### Security
- API keys encrypted at rest (AES-256-GCM via Web Crypto)
- Encryption key = `SERVICE_TOKEN` (Cloudflare secret)
- Keys never returned in plaintext (masked: `sk-***abc`)
- Only tenant owner can CRUD their settings

## Authentication

Bearer token → SHA-256 hash → lookup `tenants.api_key_hash` → tenant isolation enforced.

## Environment Variables

| Variable | Purpose | Required |
|----------|---------|----------|
| `SERVICE_TOKEN` | Encryption key for BYOK + admin auth | Yes (for BYOK) |
| `POLAR_WEBHOOK_SECRET` | Webhook signature validation | Yes (for payments) |
| `LLM_API_KEY` | Global fallback LLM key | Optional |
| `LLM_BASE_URL` | Global fallback LLM endpoint | Optional |
| `DEFAULT_LLM_MODEL` | Default model name | Optional |
| `ENVIRONMENT` | `production` or `development` | Optional |

## Bindings (wrangler.toml)

```toml
[[d1_databases]]
binding = "DB"
database_name = "mekong-db"

[[kv_namespaces]]
binding = "RATE_LIMIT_KV"

[ai]
binding = "AI"
```

## Development SOPs

### Adding a New Route

1. Create `src/routes/<name>.ts` with Hono router
2. Add auth middleware if needed: `routes.use('*', authMiddleware)`
3. Register in `src/index.ts`: `app.route('/v1/<path>', newRoutes)`
4. Update this README API table
5. Build check: `pnpm exec wrangler deploy --dry-run --outdir=dist`

### Adding a D1 Migration

1. Create `migrations/000N_description.sql`
2. Test locally: `pnpm exec wrangler d1 migrations apply mekong-db --local`
3. Apply remote: `pnpm exec wrangler d1 migrations apply mekong-db --remote`
4. If API token lacks D1 permission → use auto-migrate pattern in health endpoint or Cloudflare Dashboard SQL console

### Adding a New RaaS Module

1. Create `src/raas/<module-name>.ts` — CRUD functions (D1 queries)
2. Add Zod schema in `src/types/raas.ts`
3. Create route in `src/routes/`
4. Register route in `src/index.ts`
5. Build + deploy + test

### Secrets Management

```bash
# Set secret
pnpm exec wrangler secret put SERVICE_TOKEN

# List secrets
pnpm exec wrangler secret list

# Local dev: create .dev.vars
echo 'SERVICE_TOKEN=local-dev-token' > .dev.vars
```

### Deployment Checklist

```bash
# 1. Build check
pnpm exec wrangler deploy --dry-run --outdir=dist

# 2. Deploy
pnpm exec wrangler deploy

# 3. Health check
curl -s https://mekong-engine.agencyos-openclaw.workers.dev/health

# 4. Smoke test (create tenant + test endpoint)
curl -X POST .../billing/tenants -H "Content-Type: application/json" -d '{"name":"test"}'
```

### Testing

```bash
pnpm test            # Unit tests (vitest)
pnpm run typecheck   # TypeScript check
```

### Local DB Reset

```bash
rm -rf .wrangler/state && pnpm exec wrangler dev
```

## Architecture

```
src/
├── index.ts              # Entry: Hono app, bindings, route registration
├── core/
│   ├── recipe-orchestrator.ts  # PEV pipeline coordinator
│   ├── recipe-planner.ts       # LLM-powered task decomposition
│   ├── executor.ts             # Multi-mode task runner
│   ├── recipe-verifier.ts      # Result validation
│   └── llm-client.ts           # OpenAI-compatible client
├── raas/
│   ├── tenant.ts               # Tenant CRUD + API key hashing
│   ├── tenant-settings.ts      # BYOK settings + AES-GCM encryption
│   ├── auth-middleware.ts       # Bearer token → tenant resolution
│   ├── credit-metering-middleware.ts  # Credit deduction guard
│   ├── credits.ts              # Credit ledger operations
│   ├── missions.ts             # Mission CRUD
│   └── sse.ts                  # Server-Sent Events helper
├── routes/
│   ├── tasks.ts                # /v1/tasks — mission management
│   ├── agents.ts               # /v1/agents — agent execution
│   ├── settings.ts             # /v1/settings — BYOK LLM config
│   └── billing.ts              # /billing — tenants, credits, webhooks
└── types/
    ├── raas.ts                 # Zod schemas + TypeScript types
    ├── recipe.ts               # Recipe/step types
    └── execution.ts            # Execution result types
```

## Performance

- Cold start: ~50ms
- Health check: ~5ms (cached after first auto-migrate)
- Plan time: ~2s (LLM dependent)
- D1 queries: <10ms
- KV lookups: <5ms (global edge)

---

**Version:** 3.1.0 | **Repo:** [mekong-cli/packages/mekong-engine](https://github.com/longtho638-jpg/mekong-cli)
