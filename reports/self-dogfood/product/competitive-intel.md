# Competitive Intelligence — Deep Analysis

**Date:** March 2026 | **Competitors:** Cursor, Devin, Factory, OpenHands, Mekong CLI

---

## Executive Summary

Five products compete for the "AI does my software work" spend. They occupy distinct positions: Cursor = editor enhancement, Devin = autonomous engineer, Factory = enterprise CI/CD, OpenHands = OSS framework, Mekong = business OS. Only partial overlaps — the market is not yet winner-take-all.

---

## Product 1: Cursor

**Category:** AI code editor
**Funding:** $60M Series A (Andreessen Horowitz, 2024)
**Users:** ~500K developers
**Price:** Free (limited) / $20/mo Pro / $40/mo Business

### What They're Good At
- Best-in-class autocomplete (Tab completion from context)
- Codebase-aware chat (`@codebase` references entire repo)
- Diff-based editing (see change before accepting)
- Multi-file refactoring that actually works
- Native VS Code fork — zero adoption friction

### What They Can't Do
- No execution layer (suggests code, doesn't run it)
- No business layer (can't write your OKRs or pitch deck)
- No deployment orchestration
- No autonomous operation — always requires human in loop
- Provider-locked to Anthropic/OpenAI

### Who Uses Them
- Individual developers replacing GitHub Copilot
- Teams wanting better AI autocomplete
- Non-autonomous use cases (pair programming)

### Mekong vs Cursor

| Dimension | Cursor | Mekong |
|-----------|--------|--------|
| Code suggestion | Best in class | Not a focus |
| Autonomous execution | No | Yes (PEV) |
| Business commands | 0 | 289 |
| Non-developer use | No | Yes (founder layer) |
| Local LLM | Partial | Full |
| Price | $20/mo | $49/mo |

**Verdict:** Not direct competitors. Cursor users who want autonomous execution graduate to Mekong.

---

## Product 2: Devin

**Category:** Autonomous software engineer
**Company:** Cognition AI
**Funding:** $175M Series A (2024, $2B valuation)
**Price:** $500/mo (limited seats)
**Status:** Invite-only, enterprise-focused

### What They're Good At
- Genuinely autonomous multi-hour engineering tasks
- Persistent memory across sessions
- Browses web, reads documentation, writes tests, files PRs
- Shows "thought process" in real-time sidebar
- Impressive benchmark performance on SWE-bench

### What They Can't Do
- Costs $500/mo — only viable for funded teams
- Engineering scope only — no business/strategy layer
- No local LLM option (proprietary cloud)
- Not open source — vendor lock-in
- No CLI — browser-only workflow

### Who Uses Them
- Well-funded startups needing autonomous engineering
- Enterprise engineering teams
- Companies who can justify $500/dev/mo

### Mekong vs Devin

| Dimension | Devin | Mekong |
|-----------|-------|--------|
| Engineering autonomy | Exceptional | Good |
| Business commands | 0 | 289 |
| Price | $500/mo | $49/mo |
| Open source | No | Yes |
| Local LLM | No | Yes |
| Non-tech users | No | Yes |

**Verdict:** Devin is the premium option. Mekong is the 10x cheaper OSS alternative that adds business scope. Target segment: developers who tried Devin's demo but can't justify $500/mo.

---

## Product 3: Factory

**Category:** Enterprise AI software delivery
**Company:** Factory AI
**Funding:** $5M seed (2024)
**Price:** Enterprise (custom)
**Status:** Early stage, enterprise-focused

### What They're Good At
- Deep GitHub/GitLab integration
- PR review automation ("Droids" that comment on PRs)
- Code generation from Jira/Linear tickets
- Enterprise SSO, audit logs, compliance

### What They Can't Do
- No CLI — entirely IDE/browser integrated
- No founder/business layer
- No local LLM support
- Very early product, narrow feature set
- Not open source

### Who Uses Them
- Engineering teams with existing ticket-based workflows
- Companies with compliance requirements (SOC2, HIPAA)
- Enterprises evaluating automated code review

### Mekong vs Factory

| Dimension | Factory | Mekong |
|-----------|---------|--------|
| PR review automation | Strong | Basic |
| Ticket-to-code | Yes | No |
| Business layer | No | Yes |
| Open source | No | Yes |
| CLI-first | No | Yes |

**Verdict:** Different buyers. Factory = enterprise engineering manager. Mekong = solo founder / agency. No direct competition yet.

---

## Product 4: OpenHands (formerly OpenDevin)

**Category:** Open-source autonomous agent framework
**Company:** All Hands AI
**Funding:** $30M Series A (2025)
**GitHub:** 30K+ stars
**Price:** Free (self-hosted) / Cloud coming

### What They're Good At
- Best OSS autonomous agent framework
- Strong community (30K GitHub stars)
- Multiple agent backends (CodeAct, SWE-agent, etc.)
- Docker-based local execution
- Active research community driving capability improvements

### What They Can't Do
- No encoded business workflows (framework, not product)
- Steep setup complexity vs `pip install mekong-cli`
- No business layer commands
- No billing/RaaS infrastructure
- Requires technical users to configure

### Who Uses Them
- ML researchers and AI engineers
- Developers who want to customize agent behavior
- OSS contributors building on top of the framework

### Mekong vs OpenHands

| Dimension | OpenHands | Mekong |
|-----------|-----------|--------|
| GitHub stars | 30K+ | 0 (new) |
| Business commands | 0 | 289 |
| Setup time | 30+ min | 2 min |
| Community | Large | None yet |
| Billing/RaaS | No | Yes |
| Framework vs Product | Framework | Product |

**Verdict:** Most direct competitor on OSS positioning. Key differentiator: Mekong is a *product* (opinionated, just works), OpenHands is a *framework* (flexible, requires configuration). Target: OpenHands users who want business-layer commands without building them themselves.

---

## Competitive Matrix

| | Mekong | Cursor | Devin | Factory | OpenHands |
|-|--------|--------|-------|---------|-----------|
| Price/mo | $49 | $20 | $500 | Custom | Free |
| Open source | Yes | No | No | No | Yes |
| Business layer | Yes | No | No | No | No |
| Autonomous exec | Yes | No | Yes | Partial | Yes |
| Local LLM | Yes | Partial | No | No | Yes |
| CLI-first | Yes | No | No | No | No |
| RaaS billing | Yes | No | No | No | No |
| Ease of use | High | High | High | Medium | Low |

---

## Strategic Recommendation

**Win against Cursor:** Highlight execution. "Cursor suggests, Mekong ships."
**Win against Devin:** Price + OSS. "Same autonomous execution, $451/mo cheaper, MIT license."
**Win against Factory:** Scope. "Factory automates PRs. Mekong automates the whole company."
**Win against OpenHands:** Usability + business layer. "OpenHands is a framework. Mekong is a product."

**Primary battle:** Devin's price creates the biggest opening. Post a head-to-head benchmark on SWE tasks showing Mekong (Claude Sonnet 4) achieves 70–80% of Devin's results at 10x lower cost.
