# Cloudflare Workers Setup Guide

## Configure Secrets

### 1. Cloudflare API Token

Tạo API token tại: https://dash.cloudflare.com/profile/api-tokens

**Permissions cần thiết:**
- `Cloudflare Pages: Edit`
- `Workers Scripts: Edit`

```bash
# Add to GitHub Secrets
gh secret set CLOUDFLARE_API_TOKEN --repo longtho638-jpg/mekong-cli
```

### 2. Worker Secrets (Deploy-time)

Sau khi deploy lần đầu, set secrets:

```bash
# Production
npx wrangler secret put DATABASE_URL
npx wrangler secret put EXCHANGE_API_KEY
npx wrangler secret put EXCHANGE_SECRET
npx wrangler secret put POLAR_WEBHOOK_SECRET

# Staging
npx wrangler secret put DATABASE_URL --env staging
npx wrangler secret put EXCHANGE_API_KEY --env staging
npx wrangler secret put EXCHANGE_SECRET --env staging
npx wrangler secret put POLAR_WEBHOOK_SECRET --env staging
```

### 3. GitHub Secrets Required

| Secret | Description |
|--------|-------------|
| `CLOUDFLARE_API_TOKEN` | Cloudflare API token với Workers/Pages permissions |

### 4. Deploy Commands

```bash
# Manual deploy to production
npx wrangler deploy

# Manual deploy to staging
npx wrangler deploy --env staging

# Check deployment status
npx wrangler status
```

## CI/CD Pipeline

Workflow: `.github/workflows/cloudflare-deploy.yml`

**Triggers:**
- Push to `main` → Deploy production
- Pull Request → Deploy staging

**Steps:**
1. Install dependencies (pnpm)
2. Type check
3. Run tests
4. Build worker
5. Deploy to Cloudflare

## Health Check

```bash
# After deployment, verify
curl -sI https://algo-trader-worker.<your-subdomain>.workers.dev/health

# Expected: HTTP 200 OK
```

## Troubleshooting

### pnpm Lockfile Mismatch

```bash
# Regenerate lockfile
pnpm install --no-frozen-lockfile
git add pnpm-lock.yaml
git commit -m "chore: update pnpm lockfile"
```

### Secret Not Found

```bash
# List all secrets
npx wrangler secret list

# Re-deploy after adding secrets
npx wrangler deploy --env staging
```
