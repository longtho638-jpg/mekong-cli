# Sprint Plan — RaaS Checkout + Credit Billing

**Sprint:** Sprint 1, Q2 2026 | **Duration:** April 1–14 (2 weeks)
**Goal:** A stranger can discover Mekong, pay $49, and run their first mission with correct credit deduction.

---

## Sprint Goal

End state: agencyos.network is live, Polar.sh checkout works, first MCU deducted on first mission, dashboard shows credit balance.

This is the "first dollar" sprint. Everything else is secondary.

---

## Pre-Sprint Checklist

- [x] Polar.sh account created
- [x] `webhook_dispatcher.py` implemented
- [x] `billing_engine.py` implemented
- [x] `credit_rate_limiter.py` implemented
- [ ] Polar.sh products created (Starter / Pro / Enterprise)
- [ ] Polar.sh webhook secret configured in production env
- [ ] Fly.io production deploy verified
- [ ] PyPI package published

---

## Stories

### Story 1: Polar.sh Products Setup
**Points:** 2 | **Owner:** Founder | **Priority:** P0

**Acceptance criteria:**
- Three products created in Polar.sh dashboard: Starter $49, Pro $149, Enterprise $499
- Each product has correct MCU limits in metadata: `{"mcu_limit": 200}` / `{"mcu_limit": 1000}` / `{"mcu_limit": -1}`
- Monthly recurring billing enabled
- Test purchase in sandbox completes without error

**Tasks:**
- [ ] Create Starter product in Polar.sh
- [ ] Create Pro product in Polar.sh
- [ ] Create Enterprise product in Polar.sh
- [ ] Configure webhook endpoint: `https://api.agencyos.network/webhooks/polar`
- [ ] Add `POLAR_WEBHOOK_SECRET` to Fly.io secrets
- [ ] Test sandbox purchase → webhook fires → credit allocated

---

### Story 2: Landing Page Pricing Section
**Points:** 3 | **Owner:** Frontend | **Priority:** P0

**Acceptance criteria:**
- agencyos.network shows pricing table with three tiers
- Each tier has Polar.sh checkout link
- Checkout opens in new tab (not embedded iframe)
- Mobile-responsive

**Tasks:**
- [ ] Build pricing component in Next.js
- [ ] Wire Polar.sh checkout URLs to each tier button
- [ ] Add feature comparison table (Starter vs Pro vs Enterprise)
- [ ] Deploy to Vercel
- [ ] Test on mobile (iPhone Safari, Android Chrome)

---

### Story 3: Post-Payment Onboarding Flow
**Points:** 3 | **Owner:** Backend + Frontend | **Priority:** P0

**Acceptance criteria:**
- After Polar.sh payment, user receives email with API key
- Email contains: API key, quick start command, link to docs
- Tenant record created in SQLite with correct MCU balance
- `/api/v1/me` endpoint returns `{tenant_id, mcu_balance, plan}`

**Tasks:**
- [ ] Implement `POST /webhooks/polar` handler (already in `webhook_dispatcher.py` — verify)
- [ ] Add email send on `subscription.created` event (use Resend or Postmark)
- [ ] Generate API key on tenant creation (`auth.py`)
- [ ] Implement `GET /api/v1/me` endpoint
- [ ] Test full flow: Polar sandbox → webhook → email → API key works

---

### Story 4: First Mission with Credit Deduction
**Points:** 3 | **Owner:** Backend | **Priority:** P0

**Acceptance criteria:**
- `mekong cook "hello world"` with valid API key runs successfully
- MCU balance decreases by correct amount (1 MCU for simple, 3 for standard)
- `GET /api/v1/me` shows updated balance
- Mission appears in mission history
- If balance = 0, API returns HTTP 402 with `{"error": "insufficient_credits"}`

**Tasks:**
- [ ] Verify `credit_metering_middleware.py` deducts on mission completion (not start)
- [ ] Add idempotency check: same mission_id cannot deduct twice
- [ ] Test HTTP 402 on zero balance
- [ ] Verify `GET /api/v1/missions` returns mission history
- [ ] Load test: 10 concurrent missions, verify no double-deduction

---

### Story 5: CLI API Key Configuration
**Points:** 1 | **Owner:** CLI | **Priority:** P0

**Acceptance criteria:**
- `mekong config set api-key <key>` stores key in `~/.mekong/config.json`
- All CLI commands automatically use stored key for API calls
- `mekong config show` displays current config (masked key)

**Tasks:**
- [ ] Implement `mekong config` subcommand
- [ ] Store config in `~/.mekong/config.json`
- [ ] Load API key from config in all HTTP calls
- [ ] Fallback to `MEKONG_API_KEY` env var

---

### Story 6: PyPI Publish
**Points:** 2 | **Owner:** Engineering | **Priority:** P1

**Acceptance criteria:**
- `pip install mekong-cli` installs successfully on Python 3.9+
- `mekong cook "test"` runs after install
- Version `5.0.0` published
- README on PyPI matches GitHub README

**Tasks:**
- [ ] Verify `pyproject.toml` metadata complete
- [ ] `make build` produces clean dist/
- [ ] `twine check dist/*` passes
- [ ] Publish to TestPyPI first, verify install
- [ ] Publish to PyPI
- [ ] Add PyPI badge to README

---

## Sprint Metrics

| Metric | Target | Measure |
|--------|--------|---------|
| Stories completed | 5/6 (P0 all) | Story count |
| Checkout works | Yes | Manual test |
| First mission billed | Yes | Log verification |
| Zero billing bugs | 0 P0 | Bug count |
| PyPI installs | >0 | PyPI stats |

---

## Definition of Done (Sprint)

Sprint is DONE when:
1. A fresh laptop can `pip install mekong-cli`
2. User visits agencyos.network, pays $49
3. Receives email with API key
4. Runs `mekong config set api-key <key>`
5. Runs `mekong cook "create a hello world script"`
6. Mission completes, MCU balance drops from 200 to 197
7. `mekong status` shows 197 MCU remaining

**If this chain works end-to-end: sprint is a success.**

---

## Blockers / Risks

| Blocker | Owner | ETA |
|---------|-------|-----|
| Polar.sh webhook HTTPS cert on Fly.io | Engineering | Day 1 |
| Email provider selection (Resend vs Postmark) | Founder | Day 2 |
| PyPI name `mekong-cli` availability | Engineering | Day 1 check |
