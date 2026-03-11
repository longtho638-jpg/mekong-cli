# Research Report: Secrets Management Security

**Date:** 2026-03-11
**Researcher:** Main agent
**Topic:** Cloudflare Workers secrets and security

---

## 1. wrangler secret put Best Practices

### Interactive vs Non-Interactive

**Interactive (Recommended for setup):**
```bash
pnpm exec wrangler secret put DATABASE_URL
# Prompts for value (hidden input)
```

**Non-Interactive (CI/CD):**
```bash
echo "$DATABASE_URL" | pnpm exec wrangler secret put DATABASE_URL
# Or use environment variable
```

**Security Note:** Never pipe secrets in shell history

### Token Permissions

**Required:** `Workers Scripts: Edit`
**Scope:** Account-level, not per-script

**Docs:** https://developers.cloudflare.com/workers/configuration/secrets/

---

## 2. Secret Rotation Strategies

### Rotation Frequency

| Secret Type | Recommended |
|-------------|-------------|
| Database | 90 days |
| API Keys | 30-90 days |
| Webhook Secrets | When compromised |

### Rotation Process

```bash
# 1. Set new secret (don't delete old yet)
pnpm exec wrangler secret put DATABASE_URL

# 2. Deploy with new secret
pnpm exec wrangler deploy

# 3. Verify Worker works

# 4. Update old secret in source system (DB, etc.)

# 5. Delete old secret (if using multiple)
```

### Versioned Secrets Pattern

```bash
# Support rolling back
DATABASE_URL_V1=...
DATABASE_URL_V2=...

# Worker reads from env var, switches on failure
```

---

## 3. Environment-Specific Secrets

### Production vs Staging

**Option A: Separate secrets (Recommended)**
```bash
# Production
pnpm exec wrangler secret put DATABASE_URL

# Staging (different values)
pnpm exec wrangler secret put DATABASE_URL --env staging
```

**Option B: Same secrets (Dev only)**
```bash
# Staging uses production secrets
# NOT recommended for production
```

### Best Practice

| Environment | Secret Source |
|-------------|---------------|
| Production | Dedicated credentials |
| Staging | Separate DB, read-only API keys |
| Dev | Mock/test credentials |

---

## 4. GitHub Secrets + CI/CD Injection

### Setup

**1. Add to GitHub Secrets:**
```
Settings → Secrets and variables → Actions
- CLOUDFLARE_API_TOKEN
- DATABASE_URL (prod)
- DATABASE_URL_STAGING
```

**2. GitHub Actions Workflow:**
```yaml
- name: Set secrets
  run: |
    echo "$DATABASE_URL" | npx wrangler secret put DATABASE_URL
  env:
    DATABASE_URL: ${{ secrets.DATABASE_URL }}
```

### Security Considerations

- GitHub encrypts secrets at rest
- Secrets masked in logs
- Not available to fork PRs

**Docs:** https://docs.github.com/en/actions/security-guides/encrypted-secrets

---

## 5. Avoiding Secret Exposure

### DON'T

```bash
# ❌ Secret in command history
wrangler secret put DB_URL "my-secret-value"

# ❌ Secret in logs
echo "Using secret: $SECRET" >> debug.log

# ❌ Secret in git
echo "SECRET=value" >> .env
git add .env
```

### DO

```bash
# ✅ Interactive prompt
wrangler secret put DB_URL

# ✅ Piped from secure source
vault get db-url | wrangler secret put DB_URL

# ✅ Environment variable (CI only)
echo "$VAULT_SECRET" | wrangler secret put DB_URL

# ✅ .gitignore
echo ".env" >> .gitignore
```

### Audit Trail

```bash
# List secrets (not values)
wrangler secret list

# Check who set (via Cloudflare dashboard)
Dashboard → Workers → Your Worker → Settings → Variables
```

---

## 6. Required Secrets for AlgoTrader

| Secret | Purpose | Rotation |
|--------|---------|----------|
| DATABASE_URL | PostgreSQL connection | 90 days |
| EXCHANGE_API_KEY | Exchange API access | 30 days |
| EXCHANGE_SECRET | Exchange signing | 30 days |
| POLAR_WEBHOOK_SECRET | Payment verification | On incident |

### Secret Format Validation

```bash
# DATABASE_URL: PostgreSQL URI
postgresql://user:pass@host:5432/dbname

# EXCHANGE_API_KEY: Alphanumeric, 32-64 chars
[a-zA-Z0-9]{32,64}

# EXCHANGE_SECRET: Base64 or hex, 64+ chars
[a-fA-F0-9]{64}

# POLAR_WEBHOOK_SECRET: whsec_ prefix
whsec_[a-zA-Z0-9]{32,}
```

---

## Key Insights

1. **Interactive setup:** Most secure for initial config
2. **CI/CD injection:** Use GitHub Secrets for deployments
3. **Rotation:** Plan for 30-90 day cycles
4. **Validation:** Check secret format before deploy
5. **Audit:** Dashboard shows metadata, not values

---

## Unresolved Questions

1. Should we implement secret rotation automation?
2. Is there a vault service to integrate (1Password, AWS Secrets Manager)?

---

**Sources:**
- https://developers.cloudflare.com/workers/configuration/secrets/
- https://docs.github.com/en/actions/security-guides/encrypted-secrets
- https://www.owasp.org/index.php/Secrets_Management
