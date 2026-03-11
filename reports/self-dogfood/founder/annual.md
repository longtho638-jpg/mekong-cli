# Mekong CLI — 2026 Annual Plan

**Period:** Jan–Dec 2026 | **Version:** v5.0 | **Model:** RaaS (Revenue as a Service)

---

## Thesis

Mekong CLI is the first AI-operated business OS where the AI doesn't just write code — it runs the company. 289 commands spanning Founder → Ops. Every workflow encoded as a machine contract. Every LLM switchable via 3 env vars.

The bet: developers and solo founders will pay for autonomous execution, not just copilot suggestions.

---

## 2026 Objectives (3 pillars)

| Pillar | Goal | Target |
|--------|------|--------|
| Distribution | Open-source traction | 500 GitHub stars, 50 forks |
| Revenue | First paying customers | $10K MRR by Q4 |
| Product | Production-grade RaaS | <200ms API p95, 99.9% uptime |

---

## Quarterly Milestones

### Q1 (Jan–Mar) — Foundation
- [x] Ship v5.0 with 289 commands, 5-layer cascade
- [x] RaaS billing engine (Polar.sh webhooks, credit ledger)
- [x] PEV orchestrator with DAG scheduling
- [ ] Landing page live at agencyos.network
- [ ] First 10 GitHub stars from cold outreach

**Key metric:** Working end-to-end demo where `mekong cook "build a REST API"` ships deployable code.

### Q2 (Apr–Jun) — Traction
- [ ] First paying customer (Starter $49/mo)
- [ ] 100 GitHub stars
- [ ] Plugin marketplace v0 (10 community commands)
- [ ] CLI published to PyPI with install docs
- [ ] Integration with Claude, GPT-4o, Gemini, Qwen, DeepSeek all tested

**Key metric:** 5 active trial users running missions weekly.

### Q3 (Jul–Sep) — Scale
- [ ] $3K MRR (60 Starter customers or mix)
- [ ] White-label API for agencies (custom domain, branding)
- [ ] Tôm Hùm daemon stable (autonomous 24h operation)
- [ ] VS Code extension (basic mission submission)
- [ ] 10 agency partners running client work through Mekong

**Key metric:** 3 agencies using Mekong for billable client work.

### Q4 (Oct–Dec) — Revenue
- [ ] $10K MRR target
- [ ] Enterprise tier live ($499/mo unlimited)
- [ ] SOC2 Type I audit started
- [ ] Conference demo at a major dev event
- [ ] 500 stars, 50 forks

---

## Go-to-Market Strategy

**Primary channel:** Developer communities (X/Twitter, Hacker News, Reddit r/MachineLearning, r/LocalLLaMA)
**Hook:** "Replace your CTO with 3 env vars" — works with any LLM, including free Ollama
**Content flywheel:** Ship real-world demos (build a SaaS in 1 hour with Mekong)
**Comparison play:** Head-to-head vs Devin/Factory on cost-per-task benchmarks

---

## Resource Plan

| Resource | Cost/mo | Notes |
|----------|---------|-------|
| LLM API (Claude Sonnet for own ops) | ~$50 | Self-dogfooding |
| Fly.io backend | $20 | Single machine, scale on demand |
| Cloudflare (Pages + Workers) | $0 | Free tier sufficient |
| Vercel (dashboard) | $0 | Hobby plan |
| Polar.sh payments | 5% + $0.50 | Pay-as-you-go |
| Total burn | ~$70/mo | Pre-revenue |

---

## Risk Register

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|-----------|
| OpenAI/Anthropic ships competing product | High | High | Universal LLM = model-agnostic, not tied to one vendor |
| LLM costs spike | Medium | Medium | Local Ollama fallback, cost-per-MCU pricing absorbs variance |
| No paid customers by Q3 | Medium | High | Pivot to agency white-label if consumer traction slow |
| Competitor (Devin) undercuts price | Low | Medium | Open-source core = cannot be undercut |

---

## Success Definition

**End of 2026:** Mekong CLI is the go-to autonomous execution layer for solo founders and small agencies. Not the biggest, but the most opinionated and complete workflow system in the OSS space.
