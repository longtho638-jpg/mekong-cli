# PHASE 5: Production Deployment Configuration

**Date:** 2026-03-05 23:14
**Status:** ✅ CONFIGURATION READY

---

## Environment Variables

### Required (.env.production)

```bash
# Polar.sh Configuration
POLAR_API_KEY=sk_live_xxx
POLAR_WEBHOOK_SECRET=whsec_xxx
POLAR_PRO_BENEFIT_ID=ben_pro_monthly
POLAR_ENTERPRISE_BENEFIT_ID=ben_ent_monthly
POLAR_SUCCESS_URL=https://algo-trader.local/upgrade/success

# License Service
RAAS_LICENSE_SECRET=your-32-char-secret-key-here

# Server Configuration
NODE_ENV=production
API_PORT=3000
LOG_LEVEL=info
```

### Development (.env)

```bash
# Polar.sh Test Mode
POLAR_API_KEY=sk_test_xxx
POLAR_WEBHOOK_SECRET=whsec_test_xxx
POLAR_PRO_BENEFIT_ID=ben_pro_test
POLAR_ENTERPRISE_BENEFIT_ID=ben_ent_test
POLAR_SUCCESS_URL=http://localhost:3000/upgrade/success

# License Service
RAAS_LICENSE_SECRET=change-me-in-production-min-32-chars!

# Server
NODE_ENV=development
API_PORT=3000
LOG_LEVEL=debug
```

---

## Polar Dashboard Setup

### 1. Create Products

**PRO Tier:**
- Name: Algo Trader PRO
- Price: $49/month
- Benefits: ML Models, Premium Data, Advanced Optimization
- Product ID: `pro-monthly`

**ENTERPRISE Tier:**
- Name: Algo Trader Enterprise
- Price: $199/month
- Benefits: Everything in PRO + Priority Support, Custom Strategies
- Product ID: `enterprise-monthly`

### 2. Configure Webhooks

**Webhook URL:** `https://algo-trader.local/api/v1/billing/webhook`

**Events to subscribe:**
- ✅ `subscription.created`
- ✅ `subscription.active`
- ✅ `subscription.updated`
- ✅ `subscription.cancelled`
- ✅ `checkout.created`

**Webhook Secret:** Copy from Polar dashboard → Settings → Webhooks

### 3. Configure Checkout

**Success URL:** `https://algo-trader.local/upgrade/success`
**Cancel URL:** `https://algo-trader.local/upgrade/cancelled`

---

## Staging E2E Tests

### Test Flow

```bash
# 1. Start staging server
NODE_ENV=staging npm start

# 2. Run E2E tests
npm test -- subscription-e2e.test.ts polar-webhook.test.ts

# Expected: 13/13 tests passing
```

### Manual Testing Checklist

- [ ] Visit `/api/subscription/status` → Should return FREE tier
- [ ] POST `/api/subscription/checkout` with `{tier: 'pro'}` → Returns checkout URL
- [ ] Complete Polar checkout in test mode
- [ ] Verify webhook received → License upgraded to PRO
- [ ] Test ML model save/load → Should work with PRO
- [ ] Cancel subscription via Polar dashboard
- [ ] Verify webhook received → License downgraded to FREE

---

## Deployment Checklist

### Pre-Deployment
- [ ] Environment variables set
- [ ] Polar products configured
- [ ] Webhook URL registered in Polar
- [ ] SSL certificate valid
- [ ] Database migrations run

### Deployment
- [ ] Build: `npm run build`
- [ ] Tests: `npm test` (13/13 passing)
- [ ] Deploy: `git push origin main`
- [ ] Monitor CI/CD pipeline

### Post-Deployment
- [ ] Health check: `GET /health` → 200 OK
- [ ] Ready check: `GET /ready` → 200 OK
- [ ] Test webhook: Polar dashboard → Send test event
- [ ] Monitor logs for errors

---

## Monitoring

### Key Metrics

| Metric | Alert Threshold |
|--------|-----------------|
| Webhook failures | > 5/hour |
| License validation errors | > 10/hour |
| Checkout failures | > 3/hour |
| API latency (p95) | > 500ms |

### Log Patterns

```bash
# Success
[RAAS-AUDIT] {"event":"license_check","success":true,"tier":"pro"}
[Polar Webhook] Subscription created

# Errors (alert on these)
[Polar Webhook] Invalid signature
[Polar Webhook] Failed to parse event
[RAAS-AUDIT] {"event":"validation_failed","tier":"blocked"}
```

---

## Rollback Plan

If issues detected:

```bash
# 1. Revert to previous version
git revert HEAD
git push origin main

# 2. Or disable webhooks in Polar dashboard
# Settings → Webhooks → Disable

# 3. Or set maintenance mode
echo "MAINTENANCE=true" >> .env
pm2 restart algo-trader
```

---

**Next:** Execute deployment after configuration complete.
