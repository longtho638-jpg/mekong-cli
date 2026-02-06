# 🎯 MASTER PRD: AgencyOS RaaS Ecosystem

**Version:** 2.0.0 (Consolidated)  
**Updated:** 2026-02-06  
**Status:** SINGLE SOURCE OF TRUTH

---

## 1. Executive Summary

**AgencyOS** transforms from SaaS → **RaaS (Results-as-a-Service)**.

> "We don't sell tools. We sell Deliverables."

**Architecture:** Hub-and-Spoke

- **Hub:** Backend AI Agent Orchestrator
- **Spoke 1 (Money):** Web Platform for paying clients (No-code)
- **Spoke 2 (Viral):** Open Source Dev Kit (Low-code/CLI)

---

## 2. System Architecture

### Zone A: Money Layer (Client Web App)

| Aspect        | Details                                |
| ------------- | -------------------------------------- |
| **User**      | Agency Owners (Non-tech)               |
| **Interface** | Next.js Web App                        |
| **Function**  | Credits → Service → Results            |
| **Stack**     | Next.js 14, Tailwind, Supabase, Stripe |

**Monetization:**

- Currency: `AgencyCoin` (1 Coin = $0.1)
- Lead Scraping: 2 Coins/lead
- SEO Article: 50 Coins/bài
- Competitor Report: 100 Coins/lần

### Zone B: Viral Layer (Developer Kit)

| Aspect        | Details                                    |
| ------------- | ------------------------------------------ |
| **User**      | Developers, Tech Marketers                 |
| **Interface** | CLI Tool & Antigravity IDE                 |
| **Function**  | Write Recipes → Test Local → Contribute    |
| **Stack**     | Python CLI, NixOS (.idx), Markdown Recipes |

**Viral Hook:** "Magic Button" Open in IDX → instant environment → Run Agent.

**Conversion Trap:**

- Community: Local/slow/single-threaded
- Upsell: "Want 100 threads? Try Cloud RaaS at agencyos.network"

### Zone C: Engine Layer (Infrastructure)

| Aspect        | Details                                                                  |
| ------------- | ------------------------------------------------------------------------ |
| **User**      | System Admin / AI Agents                                                 |
| **Interface** | API & Worker Process                                                     |
| **Function**  | Execute tasks, manage queues, security                                   |
| **Stack**     | GCP (Dockerized OpenClaw), Cloudflare Workers, Redis (BullMQ), Vertex AI |

---

## 3. Data Model: Recipe Standard

```json
{
  "id": "lead_gen_v1",
  "name": "CEO Hunter",
  "version": "1.0.0",
  "inputs": [{ "key": "domain", "type": "string", "label": "Target Website" }],
  "price_per_run": 10,
  "logic": {
    "engine": "openclaw",
    "workflow_file": "workflows/ceo_hunt.lb",
    "model": "gemini-1.5-pro"
  }
}
```

**Markdown Recipe Format:**

```markdown
# Recipe: [Name]

## Description

[What it does]

## Inputs

- [variable_name] (type)

## Steps

1. [Step instructions]
```

---

## 4. Implementation Specs

### Phase 1: Infrastructure (Engine) - Week 1

| Component | Details                                      |
| --------- | -------------------------------------------- |
| Job Queue | Redis + BullMQ, concurrency limits, 3x retry |
| Gateway   | Cloudflare Moltworker, Auth + Validation     |
| OpenClaw  | `POST /execute` wrapper API                  |

### Phase 2: Money Layer (Client) - Week 2

| Component      | Details                                |
| -------------- | -------------------------------------- |
| Wallet         | Credits schema, Stripe integration     |
| Job Dispatcher | Hold → Execute → Release/Refund        |
| Frontend       | Service marketplace, wizard, status UI |

### Phase 3: Viral Layer (Dev Kit) - Week 3

| Component     | Details                               |
| ------------- | ------------------------------------- |
| Recipe Parser | MD → JSON converter                   |
| CLI           | `agency list/run/contribute` commands |
| IDX Config    | `.idx/dev.nix` environment            |

---

## 5. Security & UX

**Security:**

- Credit Shield: Hold → Deduct (SUCCESS) or Release (FAILED)
- Sandbox Isolation: Stateless containers, auto-reset
- Rate Limiting + 30min Timeout → Auto-refund
- Input Validation: Prevent prompt injection

**UX - Fake Progress:**

- "AI đang đọc báo..." → "AI đang viết bài..." → "AI đang tìm ảnh..."
- Increases perceived value

---

## 6. Monorepo Structure

```
/apps/web           (Next.js 14): Client RaaS platform
/apps/worker        (Node.js): Backend BullMQ orchestrator
/apps/cli           (Python): Open-source CLI tool
/packages/recipes   (Shared): JSON/Markdown recipes
/packages/vibe-*    (SDK): vibe-dev, vibe-analytics
/infrastructure     (Terraform/Docker): OpenClaw + Redis
```

---

## 7. Related Documents

| Document                                         | Purpose              |
| ------------------------------------------------ | -------------------- |
| [MASTER_ROADMAP_1M.md](./MASTER_ROADMAP_1M.md)   | $1M Revenue Strategy |
| [PRD_AGENCY_GENESIS.md](./PRD_AGENCY_GENESIS.md) | Meta-Loop Automation |
| [PRD_MEKONG_GENESIS.md](./PRD_MEKONG_GENESIS.md) | CLI Blueprint        |

---

> **⚠️ CONSOLIDATION NOTE**  
> This document merges:
>
> - MASTER_PRD_AGENCYOS_RAAS.md (Architecture)
> - PRD_AGENCYOS_COMMUNITY_EDITION.md (Viral Layer)
> - PRD_AGENCYOS_RAAS_CLIENT.md (Money Layer)
