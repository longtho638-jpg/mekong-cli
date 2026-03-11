# Legal — Mekong CLI

**Status:** Pre-incorporation | **Updated:** March 2026

---

## Current Legal State

| Item | Status | Risk |
|------|--------|------|
| Incorporation | Not done | Medium — personal liability |
| IP ownership | Personal | Medium — must assign to company |
| MIT License | Active | Low — covers code distribution |
| Privacy policy | Not written | High — needed before user signups |
| Terms of service | Not written | High — needed before billing |
| CLA | Not written | Low — needed before accepting PRs |
| GDPR compliance | Not assessed | Medium — EU users likely |

---

## MIT License

Mekong CLI is MIT licensed. This means:
- Anyone can use, copy, modify, distribute, sublicense
- No warranty provided
- Copyright notice must be retained
- Commercial use permitted (including competitors)

**Implication for RaaS:** The CLI itself is MIT. The hosted service (credits, Polar.sh billing, mission execution) is proprietary. This is the standard OSS business model (MongoDB, Redis, Elastic pattern).

---

## Incorporation Checklist

### Recommended: Delaware C-Corp
- Standard for VC-backed startups
- Enables SAFE notes, stock options, 83(b) elections
- ~$500 via Stripe Atlas, ~$2K via Clerky

### Steps
- [ ] Choose: Stripe Atlas ($500) or Clerky ($2K) or lawyer ($5K+)
- [ ] File Delaware C-Corp
- [ ] Issue founder shares (8M common, 4yr vest, 1yr cliff)
- [ ] File 83(b) election within 30 days of stock issuance
- [ ] Assign IP: Mekong CLI, AlgoTrader, all related code → company
- [ ] Open Mercury bank account
- [ ] Register business name if different from legal name

---

## Privacy Policy Requirements

Needed before collecting ANY user data (email signups, Polar.sh accounts, telemetry).

**Minimum required sections:**
1. What data we collect (email, payment info, CLI telemetry if opted in)
2. How we use it (billing, product improvement)
3. Who we share with (Polar.sh, Supabase, error tracking)
4. User rights (delete account, export data)
5. Contact email for privacy requests

**Tool:** TermsFeed or GetTerms.io (~$50 one-time) or write manually using open source templates.

---

## Terms of Service Requirements

Needed before billing customers.

**Key clauses:**
- Service description and MCU credit model
- No warranty / limitation of liability
- Acceptable use (no illegal content generation)
- Refund policy (credits: non-refundable after use)
- Account termination conditions
- Governing law (Delaware)

---

## GDPR Considerations

EU users likely given OSS distribution. Minimum compliance:
- Privacy policy (above)
- Cookie notice if web dashboard added
- Data deletion on request (implement in Supabase)
- No unnecessary data collection
- Polar.sh handles payment data (they are PCI compliant)

**GDPR risk level:** Low for CLI-only tool. Higher if web dashboard added.

---

## Contributor License Agreement (CLA)

Before accepting external PRs, implement a lightweight CLA:
- Use CLA Assistant (free GitHub bot)
- Individual CLA: contributor grants IP license to company
- Corporate CLA: for contributors employed by companies
- Required before raising any money (investors check this)

---

## Open Source License Considerations

MIT is correct for growth phase. Revisit if:
- Competitor builds hosted service on our code → consider AGPL or BSL
- Enterprise customers need support SLA → dual license (MIT + commercial)
- Current: MIT is fine, focus on traction first

---

## Legal Budget

| Item | Cost | When |
|------|------|------|
| Incorporation (Stripe Atlas) | $500 | Before first dollar |
| Privacy policy + ToS | $50–$100 | Before launch |
| 83(b) filing | $0 (DIY) | Within 30 days of incorporation |
| First lawyer consult | $300–$500 | Before any investor meeting |
| **Total pre-launch legal** | **~$950** | April 2026 |
