# TAM / SAM / SOM — Mekong CLI Market Sizing

**Date:** March 2026 | **Model:** RaaS (Revenue as a Service)

---

## Market Definition

Mekong CLI sits at the intersection of three markets:
1. **AI coding assistants** (Cursor, GitHub Copilot, Devin)
2. **Business automation platforms** (Zapier, Make, n8n)
3. **Autonomous agent frameworks** (OpenHands, AutoGPT, CrewAI)

The correct framing is **AI-operated business tooling** — a new category where AI doesn't assist but executes end-to-end workflows.

---

## Total Addressable Market (TAM)

### Global Developer + Founder Population

| Segment | Count | Source |
|---------|-------|--------|
| Professional developers worldwide | 28.7M | Stack Overflow 2024 |
| Solo founders / indie hackers | ~2M | Indiehackers, ProductHunt estimates |
| Digital agency owners (SMB) | ~500K | Global freelance market data |
| **Total addressable population** | **~31M** | |

### Willingness to Pay for AI Automation

- 15% of developers already pay for AI tools (Copilot, Cursor) = ~4.3M payers
- ARPU of existing AI dev tools: $20–100/mo
- TAM at $50 ARPU average: **$2.6B ARR**

### Business Software Layer

- Global business automation software market: $8.4B (2025), growing 23% YoY
- AI-native share: estimated 12% = $1B
- Combined TAM (dev + business automation AI): **$3.6B**

---

## Serviceable Addressable Market (SAM)

### Constraints Applied
- English + Vietnamese language support (primary markets)
- CLI-comfortable users (not GUI-only)
- Willing to self-host or use cloud API

| Segment | SAM Count | ARPU | SAM Revenue |
|---------|-----------|------|-------------|
| CLI-comfortable developers | 8M (28% of total) | $49/mo | $4.7B ARR |
| Solo founders with LLM budget | 400K | $99/mo | $475M ARR |
| SMB agencies | 100K | $299/mo | $360M ARR |
| **SAM Total** | **~8.5M users** | | **~$5.5B ARR** |

Realistic SAM given Mekong's actual feature set (command + workflow depth):
- Reduce by 80% for early stage, niche CLI market
- **Realistic SAM: ~$1.1B ARR**

---

## Serviceable Obtainable Market (SOM)

### 3-Year Horizon (2026–2028)

| Year | Users | ARPU | ARR | Notes |
|------|-------|------|-----|-------|
| 2026 | 50 | $99 | $60K | Beta users, word of mouth |
| 2027 | 500 | $120 | $720K | OSS traction + agency channel |
| 2028 | 3,000 | $149 | $5.4M | Plugin marketplace effect |

**2026 SOM (12-month):** $60K ARR
**2027 SOM:** $720K ARR
**2028 SOM:** $5.4M ARR

### How We Capture SOM

| Channel | Users/Year | CAC | LTV |
|---------|-----------|-----|-----|
| GitHub/OSS | 200 | $0 | $588 (12mo Starter) |
| Hacker News posts | 100 | $0 | $588 |
| Agency partnerships | 50 | $200 | $3,588 (12mo Pro) |
| Content/SEO | 150 | $30 | $588 |

---

## Market Timing Assessment

**Why now:**
- LLM quality crossed threshold for autonomous execution in 2024
- Ollama made local LLMs viable (free, private, fast)
- Devin proved developers will pay $500/mo for autonomous engineering
- No product currently covers Founder → Ops in one CLI

**Window:** 18-month first-mover advantage before a well-funded competitor ships similar scope.

---

## Unit Economics at Scale

| Tier | Price | Gross Margin (est.) | Notes |
|------|-------|---------------------|-------|
| Starter 200 MCU | $49 | 60–70% | Heavy users may exceed margin |
| Pro 1,000 MCU | $149 | 65–75% | Mix of light/heavy |
| Enterprise unlimited | $499 | 40–55% | Rate limiting required |

LLM cost per MCU (Claude Sonnet 4, ~2K tokens avg per mission): ~$0.006
Revenue per MCU: $49/200 = $0.245 (Starter), $149/1000 = $0.149 (Pro)

**Gross margin on credits: 94–98%** (LLM costs are tiny vs. subscription price)
Main cost is compute (Fly.io) and support, not LLM API.

---

## Conclusion

TAM is $3.6B but Mekong competes in a sub-segment. Realistic 3-year SOM is $5.4M ARR — achievable with 3,000 paying users at $149/mo average. The market exists. The product works. The question is distribution speed.
