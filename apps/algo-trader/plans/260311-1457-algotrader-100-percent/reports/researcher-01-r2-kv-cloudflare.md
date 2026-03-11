# Research Report: Cloudflare R2 + KV Setup

**Date:** 2026-03-11
**Researcher:** Main agent
**Topic:** R2 bucket creation and KV configuration

---

## 1. R2 Bucket Creation Requirements

### Why Dashboard Enable Required

**Error:** `Please enable R2 through the Cloudflare Dashboard [code: 10042]`

**Root Cause:**
- Cloudflare requires one-time R2 activation per account
- Security measure to prevent accidental bucket creation
- API token permissions alone not sufficient

**Docs:** https://developers.cloudflare.com/r2/get-started/

### Solution

**Option A: Dashboard (One-time, 30 seconds)**
```
1. https://dash.cloudflare.com/?to=/:account/r2
2. Click "Create bucket" (any name)
3. R2 enabled for account
4. Delete test bucket (optional)
5. CLI/API now works
```

**Option B: Direct API with proper token**
- Requires `R2 Storage Write` permission
- Token must include `account:r2:write` scope

---

## 2. KV Namespace Configuration

### Creation

```bash
# Create via CLI (no dashboard needed)
pnpm exec wrangler kv namespace create "BUILD_CACHE"

# Output: id = "95df9f174767429ea6e4d2e8c63c982a"
```

### wrangler.toml Binding

```toml
[[kv_namespaces]]
binding = "BUILD_CACHE"
id = "95df9f174767429ea6e4d2e8c63c982a"

[env.staging]
[[env.staging.kv_namespaces]]
binding = "BUILD_CACHE"
id = "95df9f174767429ea6e4d2e8c63c982a"  # Same or different
```

**Docs:** https://developers.cloudflare.com/workers/runtime-apis/kv/

---

## 3. R2 + KV Best Practices

### wrangler.toml Structure

```toml
name = "algo-trader-worker"
main = "dist/worker/api/gateway.js"
compatibility_date = "2024-09-23"  # Required for node:crypto

# Production bindings
[[kv_namespaces]]
binding = "BUILD_CACHE"
id = "..."

[[r2_buckets]]
binding = "ARTIFACTS"
bucket_name = "algo-trader-artifacts"

# Staging (separate resources or shared)
[env.staging]
name = "algo-trader-staging"

[[env.staging.r2_buckets]]
binding = "ARTIFACTS"
bucket_name = "algo-trader-artifacts-staging"  # Separate
```

### Pricing

| Resource | Free Tier | Paid |
|----------|-----------|------|
| KV | 100K reads/day, 1K writes/day | $0.50/GB-month |
| R2 | 10GB storage, 10M reads/month | $0.015/GB-month |
| Workers | 100K requests/day | $0.30/million |

**Source:** https://developers.cloudflare.com/workers/platform/pricing/

---

## 4. Alternative Approaches

### If R2 Not Available

**Option 1: KV-only storage**
- Store small artifacts in KV (max 25MB per key)
- Good for: build cache, small configs
- Limitation: Not for large files

**Option 2: External storage**
- AWS S3, GCP Cloud Storage
- Add to wrangler.toml via secrets:
```toml
[vars]
STORAGE_ENDPOINT = "https://s3.amazonaws.com"

# Secrets (set via CLI)
# AWS_ACCESS_KEY_ID
# AWS_SECRET_ACCESS_KEY
# S3_BUCKET_NAME
```

**Option 3: Local/dev mode**
- For development only
- Use `wrangler dev` with local bindings

---

## 5. Verification Commands

```bash
# List R2 buckets
pnpm exec wrangler r2 bucket list

# List KV namespaces
pnpm exec wrangler kv namespace list

# Test Worker with bindings
pnpm exec wrangler dev --local
```

---

## Key Insights

1. **R2 Dashboard Enable:** One-time requirement, not per-bucket
2. **KV No Dashboard Needed:** CLI works immediately
3. **Separate Staging:** Use different bucket names, can share KV
4. **Compatibility Date:** 2024-09-23+ required for node:crypto

---

## Unresolved Questions

1. Should staging use separate KV namespace for isolation?
2. What's the expected R2 storage size for artifacts?

---

**Sources:**
- https://developers.cloudflare.com/r2/get-started/
- https://developers.cloudflare.com/workers/runtime-apis/kv/
- https://developers.cloudflare.com/workers/platform/pricing/
