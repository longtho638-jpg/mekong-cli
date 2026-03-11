# Q2 2026 OKRs — Mekong CLI

**Period:** April 1 – June 30, 2026 | **Review cadence:** Weekly

---

## OKR Philosophy

Focus over breadth. Q2 is the "prove it works" quarter. Three objectives only. No distractions.

---

## O1: Ship Production-Grade RaaS

*The system must be trustworthy before we sell it.*

| Key Result | Target | Current | Status |
|-----------|--------|---------|--------|
| KR1.1 API p95 latency | < 200ms | ~450ms est. | In progress |
| KR1.2 RaaS billing end-to-end | Polar.sh → credit ledger → mission execution working | Implemented | Verify |
| KR1.3 Uptime | 99.5% over 30 days | Not measured yet | Start monitoring |
| KR1.4 Zero critical bugs in billing | 0 P0 bugs in credit deduction logic | Untested at scale | Audit needed |
| KR1.5 CLI published to PyPI | `pip install mekong-cli` works globally | Local only | Publish |

**Why this objective:** Revenue requires production quality. Cannot sell a product that loses credits or mischarges.

**Owner:** Engineering (CTO/OpenClaw)
**Success criteria:** A stranger can install Mekong, pay $49, submit 5 missions, and get correct credit deduction with no errors.

---

## O2: First Paying Customer

*One real customer paying real money validates the entire thesis.*

| Key Result | Target | Current | Status |
|-----------|--------|---------|--------|
| KR2.1 GitHub stars | 50 | 0 | Launch |
| KR2.2 Landing page live | agencyos.network converting | In dev | Ship |
| KR2.3 Trial users | 10 accounts running missions | 0 | Outreach |
| KR2.4 First paid subscription | $1 revenue | $0 | — |
| KR2.5 Hacker News Show HN | Posted and received 10+ upvotes | Not done | Ship first |

**Why this objective:** Zero customers = zero feedback = building in the dark. Even one paying customer reveals pricing, onboarding, and value prop gaps.

**Owner:** Founder (GTM)
**Success criteria:** At least one account on Starter tier, auto-renewing for 2 months.

---

## O3: 10 GitHub Forks

*Forks signal developer trust and open-source adoption momentum.*

| Key Result | Target | Current | Status |
|-----------|--------|---------|--------|
| KR3.1 README quality score | Top 10% in category (by star/fork ratio) | Draft quality | Polish |
| KR3.2 CONTRIBUTING.md | Clear first-issue workflow | Not done | Write |
| KR3.3 Community commands | 2 community-contributed commands merged | 0 | Open good-first-issues |
| KR3.4 Forks | 10 | 0 | — |
| KR3.5 Demo video | 5-minute screencast of 5-layer cascade | Not done | Record |

**Why this objective:** Forks are a leading indicator of ecosystem health. 10 forks means 10 developers studying the code. Plugin marketplace cannot happen without OSS community.

**Owner:** Developer relations (Founder)
**Success criteria:** 10 forks, 2 community PRs merged, active GitHub Discussions thread.

---

## Q2 Anti-Goals

Things explicitly NOT in scope for Q2:
- VS Code extension (Q3)
- White-label API (Q3)
- SOC2 audit (Q4)
- Mobile app (never)
- More commands (we have 289 — focus on quality, not quantity)

---

## Weekly Rhythm

| Day | Activity |
|-----|---------|
| Monday | Review KR metrics, update tracking table |
| Wednesday | Ship one thing (feature, blog post, demo) |
| Friday | Dog-food: run `mekong` on a real task, document result |

---

## Q2 Risk Register

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|-----------|
| PyPI publish blocked (name conflict) | Low | High | Pre-check name: `pip install mekong-cli` available? |
| Polar.sh webhook integration bug in prod | Medium | High | Load test billing before launch |
| No Hacker News traction | Medium | Medium | Have 3 backup distribution channels (Reddit, X, Discord) |
| 0 paying customers by end Q2 | Medium | High | Pivot to agency outreach in week 8 if consumer not working |

---

## Scoring Guide

| Score | Meaning |
|-------|---------|
| 0.0–0.3 | Failed — rethink approach |
| 0.4–0.6 | Partial — learned something |
| 0.7–0.9 | Good — expected outcome |
| 1.0 | Moonshot hit |

**Expected Q2 outcome:** O1: 0.8, O2: 0.5, O3: 0.6 — that's a good quarter for a pre-revenue OSS project.
