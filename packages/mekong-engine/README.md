# Mekong Engine

Serverless PEV (Plan-Execute-Verify) engine on Cloudflare Workers with multi-tenant billing and BYOK LLM support.

## Quick Start

```bash
# 1. Install
pnpm install

# 2. Setup Cloudflare resources
#    - Create D1: pnpm exec wrangler d1 create mekong-db
#    - Create KV: pnpm exec wrangler kv namespace create RATE_LIMIT_KV
#    - Update wrangler.toml with your IDs

# 3. Local env vars
cp .dev.vars.example .dev.vars

# 4. Run migrations
pnpm run db:migrate

# 5. Dev server
pnpm run dev

# 6. Test
pnpm test
```

## Deploy

```bash
# Set secrets
pnpm exec wrangler secret put SERVICE_TOKEN

# Deploy
pnpm run deploy
```

## Docs

- **[API Reference & Dev SOPs](docs/README.md)**
- **[Founder Operations Guide](docs/founder-sops.md)**
