# Phase 2: Secrets Setup

**Created:** 2026-03-11
**Priority:** P0 (Blocking)
**Status:** Pending

---

## Context Links

- Parent Plan: [plan.md](./plan.md)
- Research: [reports/researcher-02-secrets-security.md](./reports/researcher-02-secrets-security.md)
- Script: `scripts/setup-secrets.sh`
- Docs: https://developers.cloudflare.com/workers/configuration/secrets/

---

## Overview

Set required secrets for Cloudflare Workers deployment.

| Attribute | Value |
|-----------|-------|
| Date | 2026-03-11 |
| Priority | P0 (Blocking) |
| Status | Pending |
| Review | Pending |

---

## Key Insights

1. Secrets must be set via interactive CLI (security)
2. Script includes validation + confirmation
3. Staging can use same or different values

---

## Requirements

**Functional:**
- Set 4 production secrets
- Set 4 staging secrets (optional, can reuse prod)

**Non-Functional:**
- Secure input (hidden, confirmed)
- Validation (min 8 chars)
- Exit on critical failure

---

## Architecture

```
User → setup-secrets.sh → wrangler secret put → Cloudflare
        ↓
   Validates input
   Confirms critical secrets
   Handles errors
```

---

## Related Code Files

- `scripts/setup-secrets.sh` — Interactive secret setup
- `wrangler.toml` — Secret bindings (already configured)

---

## Implementation Steps

1. Run script:
   ```bash
   ./scripts/setup-secrets.sh
   ```

2. Enter secrets when prompted:
   - `DATABASE_URL`: PostgreSQL connection string
   - `EXCHANGE_API_KEY`: Exchange API key
   - `EXCHANGE_SECRET`: Exchange secret
   - `POLAR_WEBHOOK_SECRET`: Polar.sh webhook secret

3. Optionally set staging secrets (can skip if same as prod)

4. Verify:
   ```bash
   pnpm exec wrangler secret list
   ```

---

## Todo List

- [ ] Run `./scripts/setup-secrets.sh`
- [ ] Enter DATABASE_URL
- [ ] Enter EXCHANGE_API_KEY
- [ ] Enter EXCHANGE_SECRET
- [ ] Enter POLAR_WEBHOOK_SECRET
- [ ] Optionally set staging secrets
- [ ] Verify via `wrangler secret list`

---

## Success Criteria

```bash
# Must return 4 secrets
pnpm exec wrangler secret list

# Expected (names only, not values):
# - DATABASE_URL
# - EXCHANGE_API_KEY
# - EXCHANGE_SECRET
# - POLAR_WEBHOOK_SECRET
```

---

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| Wrong secret format | Medium | Script validates length |
| Typo in secret | Medium | Confirmation prompt |
| Staging uses prod secrets | Low | Acceptable for initial setup |

---

## Security Considerations

- ✅ Secrets entered via hidden prompt (not echoed)
- ✅ Confirmation for critical secrets
- ✅ Not stored in shell history
- ✅ Not committed to git
- ⚠️ Avoid logging secret values

---

## Secret Format Reference

| Secret | Format | Example |
|--------|--------|---------|
| DATABASE_URL | PostgreSQL URI | `postgresql://user:pass@host:5432/db` |
| EXCHANGE_API_KEY | Alphanumeric 32-64 | `abc123...` |
| EXCHANGE_SECRET | Hex/Base64 64+ | `a1b2c3...` |
| POLAR_WEBHOOK_SECRET | `whsec_` prefix | `whsec_abc123...` |

---

## Next Steps

→ Proceed to [Phase 3: Final Deploy](./phase-03-final-deploy.md)
