# Pitch Deck Outline — Mekong CLI

**Audience:** Angel investors, dev-tool VCs, accelerator programs
**Ask:** $200K pre-seed SAFE at $2M cap | **Stage:** Pre-revenue, post-product

---

## Slide 1: Title

**Mekong CLI**
*The AI that runs your company.*

`mekong cook "Build a SaaS in 60 minutes"` → ships working code, landing page, payment, CI/CD.

One command. Five business layers. Any LLM.

---

## Slide 2: Problem

**Three problems, one root cause.**

| Who | Problem | Cost |
|-----|---------|------|
| Solo founder | Can't afford CTO, designer, ops team | $0 execution = slow death |
| Dev team lead | Context-switching between code + strategy + ops | 40% time wasted |
| Agency owner | Repeating the same client deliverables manually | $150/hr for template work |

**Root cause:** AI tools automate single tasks (Copilot = autocomplete). Nobody automates the entire workflow — from strategy to shipped product.

---

## Slide 3: Solution

**Mekong CLI = AI-operated business OS.**

```
mekong annual       →  Full 2026 business plan
mekong cook "..."   →  Code written, tested, deployed
mekong deploy       →  CI/CD configured and live
mekong audit        →  Infrastructure security report
```

289 commands. 5 layers. Every LLM. One CLI.

**Not a copilot. An operator.**

---

## Slide 4: Product Demo

**"Build a SaaS" in 3 commands:**

```bash
mekong plan "Subscription app for freelancers"
# → PRD.md + architecture.md + task breakdown

mekong cook "Implement auth + billing + dashboard"
# → Working code, Stripe integration, CI/CD pipeline

mekong deploy
# → Live on Vercel + Cloudflare in 4 minutes
```

*[Live demo or 90-second screencast]*

**Key differentiation:** PEV loop — Plan, Execute, Verify with auto-rollback. Not fire-and-forget.

---

## Slide 5: Market

**Three converging markets:**

| Market | Size (2025) | Growth |
|--------|-------------|--------|
| AI coding tools | $1.4B | 42% YoY |
| Business automation | $8.4B | 23% YoY |
| Autonomous agents | $0.9B (emerging) | 120% YoY |

**Target beachhead:** 8M CLI-comfortable developers globally.
**SOM (3 years):** $5.4M ARR with 3,000 paying users.

---

## Slide 6: Business Model

**RaaS — Revenue as a Service.**

| Tier | Credits/mo | Price | Margin |
|------|-----------|-------|--------|
| Starter | 200 MCU | $49 | ~95% |
| Pro | 1,000 MCU | $149 | ~94% |
| Enterprise | Unlimited | $499 | ~70% |

1 MCU = 1 mission delivered. Charged only on success.
LLM cost per mission: $0.011–$0.109. Revenue per MCU: $0.149–$0.245.

**Open source core → paid cloud execution.** Same model as GitLab, Supabase, n8n.

---

## Slide 7: Traction

**Shipped March 2026:**
- v5.0: 289 commands, 245 skills, 176 machine contracts
- PEV engine with DAG scheduling + auto-rollback
- Full RaaS billing stack (Polar.sh webhooks, credit ledger, tenant isolation)
- 5-layer cascade (Founder → Ops) — unique in market

**Moat:** Universal LLM (any provider via 3 env vars) + 5-layer architecture no competitor can replicate without brand confusion.

---

## Slide 8: Competition

| | Mekong | Cursor | Devin | OpenHands |
|-|--------|--------|-------|-----------|
| Price | $49–499 | $20 | $500 | Free (DIY) |
| Scope | 5-layer business OS | Code editor | Engineering | Framework |
| Local LLM | Yes | No | No | Partial |
| Open source | Yes (MIT) | No | No | Yes |
| Business commands | 289 | 0 | 0 | 0 |

**Position:** 10x cheaper than Devin. 10x broader than Cursor.

---

## Slide 9: Team

**OpenClaw (CEO/CTO)**
- Built Mekong CLI v1–v5 end-to-end
- Binh Phap Venture Studio — AI systems since 2023
- Self-dogfoods: Mekong runs its own development workflow

**Advisors needed:** GTM advisor with dev-tool distribution experience.

---

## Slide 10: The Ask

**Raising:** $200K pre-seed SAFE, $2M cap, 20% discount

**Use of funds (18 months):**

| Allocation | Amount | Purpose |
|-----------|--------|---------|
| LLM API costs (scale) | $30K | Run paid customer missions |
| Engineering (contract) | $80K | VS Code extension + plugin marketplace |
| GTM / content | $40K | Demo videos, conference presence, SEO |
| Infrastructure | $20K | Fly.io scale + monitoring |
| Buffer | $30K | Runway extension |

**Milestone:** $10K MRR by December 2026.
**Then:** Series A conversation with a story: "AI OS for business — 3,000 customers, 95% gross margins."

---

## Appendix: Why Now

1. LLM quality crossed the autonomous execution threshold in 2024
2. Devin proved developers pay $500/mo for autonomous engineering
3. Local LLMs (Ollama + Qwen) made zero-cost operation viable
4. No product covers Founder → Ops in one CLI — window is 18 months before a funded competitor ships it
