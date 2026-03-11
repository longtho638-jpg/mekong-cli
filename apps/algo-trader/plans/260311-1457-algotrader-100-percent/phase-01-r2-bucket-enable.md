# Phase 1: R2 Bucket Enable

**Created:** 2026-03-11
**Priority:** P0 (Blocking)
**Status:** Pending

---

## Context Links

- Parent Plan: [plan.md](./plan.md)
- Research: [reports/researcher-01-r2-kv-cloudflare.md](./reports/researcher-01-r2-kv-cloudflare.md)
- Script: `scripts/enable-r2-oneclick.sh`
- Docs: [docs/cloudflare-setup.md](../docs/cloudflare-setup.md)

---

## Overview

Enable R2 bucket creation via Cloudflare Dashboard (one-time requirement).

| Attribute | Value |
|-----------|-------|
| Date | 2026-03-11 |
| Priority | P0 (Blocking) |
| Status | Pending |
| Review | Pending |

---

## Key Insights

1. R2 requires one-time dashboard enable per account
2. After enable, CLI/API works normally
3. Takes ~30 seconds via dashboard

---

## Requirements

**Functional:**
- Enable R2 for account
- Create `algo-trader-artifacts` bucket
- Create `algo-trader-artifacts-staging` bucket

**Non-Functional:**
- Zero cost (free tier)
- No code changes needed

---

## Architecture

```
User → Cloudflare Dashboard → R2 Enable → CLI works
                            ↓
                Create buckets via script
```

---

## Implementation Steps

1. Open https://dash.cloudflare.com/?to=/:account/r2
2. Click "Create bucket"
3. Name: `algo-trader-artifacts`
4. Click "Create bucket"
5. Repeat for `algo-trader-artifacts-staging`
6. Run verification:
   ```bash
   pnpm exec wrangler r2 bucket list
   ```

**Alternative (One-Click Script):**
```bash
./scripts/enable-r2-oneclick.sh
```

---

## Todo List

- [ ] Open Cloudflare Dashboard
- [ ] Enable R2 (create first bucket)
- [ ] Create production bucket
- [ ] Create staging bucket
- [ ] Verify via CLI

---

## Success Criteria

```bash
# Must return both buckets
pnpm exec wrangler r2 bucket list

# Expected output:
# - algo-trader-artifacts
# - algo-trader-artifacts-staging
```

---

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| Dashboard login issue | Low | Use incognito, clear cache |
| Bucket name taken | Low | Add unique suffix |
| API rate limit | Low | Wait 1 minute, retry |

---

## Security Considerations

- None (R2 bucket names are account-scoped, not global)
- No secrets involved in this phase

---

## Next Steps

→ Proceed to [Phase 2: Secrets Setup](./phase-02-secrets-setup.md)
