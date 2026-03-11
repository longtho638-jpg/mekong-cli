# Investor Update — March 2026

**To:** Angels / Advisors / Interested parties
**From:** Mekong CLI / Binh Phap Venture Studio
**Period:** January–March 2026 (Q1)

---

## TL;DR

Shipped v5.0 with 289 commands and full RaaS billing stack. Pre-revenue but product is production-grade. Starting paid acquisition in Q2.

---

## What We Shipped

### v5.0 — Full Business OS

The biggest release in the project's history. Three months of heads-down engineering.

**Commands:** 289 total across 5 layers (Founder → Business → Product → Engineer → Ops)
**Skills:** 245 reusable skill modules
**Contracts:** 176 machine-readable JSON execution blueprints
**Workflows:** 241 documented business workflows covering every major business function

**New in v5.0 vs v4.x:**
- Complete RaaS billing engine (Polar.sh webhooks → credit ledger → quota enforcement)
- PEV orchestrator with DAG scheduling and auto-rollback
- Tôm Hùm autonomous daemon for 24h headless operation
- Universal LLM adapter (any OpenAI-compatible endpoint via 3 env vars)
- Multi-tenant isolation (SQLite per-tenant, JWT auth, rate limiting)

### Billing Stack (Production-Ready)

The `src/raas/` module shipped with:
- `billing_engine.py` — credit deduction with idempotency
- `billing_idempotency.py` — prevents double-charge on retry
- `mission_lifecycle.py` — submit/execute/verify/complete state machine
- `webhook_dispatcher.py` — Polar.sh payment → credit allocation
- `credit_rate_limiter.py` — fair-use enforcement for Enterprise tier
- `usage_analytics.py` — per-tenant usage reporting

This is not prototype code. It handles concurrent missions, retries, and edge cases.

---

## Key Metrics

| Metric | Q1 Actual | Q1 Target | Delta |
|--------|-----------|-----------|-------|
| Commands shipped | 289 | 200 | +44% |
| GitHub stars | 0 | 10 | -10 |
| Paying customers | 0 | 0 | On track |
| Burn rate | ~$70/mo | <$100/mo | On track |
| RaaS billing shipped | Yes | Q1 goal | Met |

**Star count is 0** — we haven't posted publicly yet. This is intentional: ship the product first, then distribute.

---

## What's Working

**Engineering velocity:** Self-dogfooding with Mekong on Mekong's own development accelerates shipping. Using `mekong cook` to write `mekong cook` is not circular — it's the most honest product test.

**Architecture decision:** Universal LLM abstraction is proving correct. Tested against Claude Sonnet 4, DeepSeek V3, Qwen2.5-coder, and local Ollama. All work. No vendor dependency.

**Cost structure:** At $70/mo burn, we can run 24+ months on minimal funding while building OSS traction. No pressure to premature monetize.

---

## What's Not Working (Honest)

**Distribution = zero.** 289 commands exist and zero people know about them. This is the Q2 problem. We chose to build product-first and distribute second — a deliberate bet that a complete product is more credible than an MVP demo.

**Documentation gaps.** The command count is high but not every command has a worked example. New users face a learning curve. QUICKSTART.md helps but not enough.

**No community yet.** GitHub Discussions, Discord, contributor pipeline — all need to be built in Q2.

---

## Q2 Preview

**April:** PyPI publish + Show HN post + landing page live
**May:** First paying customer target + 10 agency cold emails
**June:** VS Code extension prototype + 50 GitHub stars milestone

**North star metric for Q2:** 1 paying customer, $49 MRR.

---

## Ask

Not raising right now. When we are:
- $200K SAFE at $2M cap
- Want an angel with dev-tool distribution experience (HN credibility, Discord communities, agency relationships)

If you know someone building on Ollama + local LLMs who would benefit from Mekong, a warm introduction is the most valuable thing you can do today.

---

## Numbers

| | |
|-|-|
| Monthly burn | ~$70 |
| Runway (current) | 24+ months (bootstrap) |
| Gross margin (modeled) | 87–95% |
| Revenue | $0 |
| Next update | April 30, 2026 |

---

Thanks for following along. The hard part (product) is done. Q2 is about putting it in front of people.
