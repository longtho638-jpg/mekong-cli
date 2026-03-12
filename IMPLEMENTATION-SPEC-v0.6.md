# MEKONG-CLI v0.6.0 IMPLEMENTATION SPEC
# ROIaaS DNA Phase 3: WEBHOOK (Thanh Toán)
# HIEN-PHAP-ROIAAS Điều 6, Phase 3
# Payment: Polar.sh Standard Webhooks (per payment-provider rule)

---

## 0. PREREQUISITE

v0.5.0 must pass:
```bash
pnpm build && pnpm test        # 540+ tests, 0 failures
mekong license-admin create --tier pro --owner test@test.com  # works
```

---

## 1. SCOPE

Automate payment → license activation flow via Polar.sh webhooks.
When customer pays → webhook fires → license auto-created/upgraded.

---

## 2. DIRECTORY STRUCTURE

```
src/
  payments/
  |   ├── types.ts              # WebhookEvent, PaymentStatus, SubscriptionState
  |   ├── webhook-handler.ts    # Verify + process Polar.sh webhook payloads
  |   ├── webhook-verifier.ts   # Signature verification (Polar Standard Webhooks)
  |   ├── subscription.ts       # SubscriptionManager: map payment → tier → license
  |   ├── receipt-store.ts      # Persist payment receipts (JSONL)
  |   └── polar-client.ts       # Polar.sh API client (check subscription status)

  cli/commands/
  |   └── billing.ts            # mekong billing (status/receipts/webhook-test)
```

---

## 3. IMPLEMENTATION PHASES (7 phases, max 500 lines each)

### Phase 1: Payment Types & Webhook Verifier
- `src/payments/types.ts` — WebhookEvent, PaymentStatus, SubscriptionState, PolarProduct
- `src/payments/webhook-verifier.ts` — verify Polar.sh webhook signatures (HMAC-SHA256)
- Tests: 8+

### Phase 2: Webhook Handler
- `src/payments/webhook-handler.ts` — process checkout.completed, subscription.updated, subscription.canceled
- Maps Polar product IDs → LicenseTier
- Tests: 10+

### Phase 3: Subscription Manager
- `src/payments/subscription.ts` — create/upgrade/downgrade/cancel license based on payment events
- Integrates with LicenseAdmin from v0.5
- Tests: 8+

### Phase 4: Receipt Store
- `src/payments/receipt-store.ts` — JSONL storage of payment events for audit
- Deduplication by event ID (idempotent processing)
- Tests: 6+

### Phase 5: Polar.sh API Client
- `src/payments/polar-client.ts` — native fetch, check subscription status, list products
- Retry with backoff, offline fallback
- Tests: 6+

### Phase 6: CLI Billing Commands
- `src/cli/commands/billing.ts` — status/receipts/webhook-test subcommands
- webhook-test: simulate a webhook payload for local dev
- Register in cli/index.ts
- Tests: 6+

### Phase 7: Integration & Wiring
- Wire webhook handler into engine
- Config: polar_webhook_secret, polar_api_key (from env)
- End-to-end: payment → webhook → license created → tier active
- Integration tests: 6+

---

## 4. SUCCESS CRITERIA

- [ ] `pnpm test` — 590+ tests, 0 failures
- [ ] Webhook signature verification works with Polar.sh format
- [ ] checkout.completed → auto-creates license key
- [ ] subscription.canceled → revokes license
- [ ] `mekong billing status` — shows subscription info
- [ ] `mekong billing receipts` — lists payment history
- [ ] Idempotent: duplicate webhook = no duplicate license
- [ ] No new runtime deps (native fetch + crypto)
