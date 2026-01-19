---
description: Manual Vercel sync - escape hatch for stale deployments
---

# /vercel-sync - Force Vercel Deployment Sync

Escape hatch when GitHub→Vercel auto-deploy is stale.

## Usage

```bash
/vercel-sync              # Deploy docs to production
/vercel-sync --dashboard  # Deploy dashboard
/vercel-sync --reconnect  # Re-establish GitHub webhook
```

## Steps

### Step 1: Verify Link Status

// turbo

```bash
cd /Users/macbookprom1/mekong-cli
vercel whoami && vercel ls --limit 1
```

### Step 2: Deploy Docs (Default)

```bash
cd /Users/macbookprom1/mekong-cli/apps/docs
vercel deploy --prod --yes
```

### Step 3: Verify Live

// turbo

```bash
curl -s https://agencyos.network/commands | grep -o '<title>.*</title>' || echo "Checking..."
sleep 5
curl -s https://agencyos.network/commands | head -3
```

### Step 4: Reconnect GitHub (if --reconnect)

```bash
cd /Users/macbookprom1/mekong-cli
vercel git connect
```

## Troubleshooting

| Issue               | Fix                                             |
| ------------------- | ----------------------------------------------- |
| "Not linked"        | Run `vercel link --yes`                         |
| "Permission denied" | Run `vercel login`                              |
| "Build failed"      | Check `pnpm --filter mekong-docs build` locally |
| "Stale for days"    | Force deploy + `vercel git connect`             |

## Architecture Note

```
GitHub Push → GitHub Actions (CI) → Vercel Webhook → Production
                    ↓
            If CI fails → Vercel won't deploy
                    ↓
            Use /vercel-sync as escape hatch
```
