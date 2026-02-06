# 🎯 MASTER ROADMAP: $1M AgencyOS

**Single Source of Truth** - Consolidates all PRDs and Revenue Plans

Updated: 2026-02-06 | Status: EXECUTION

---

## 💰 REVENUE TARGET: $1,000,000/year

| Stream             | Target | Margin  | Priority   |
| ------------------ | ------ | ------- | ---------- |
| 💳 RaaS Credits    | $300k  | >80%    | 🔴 Phase 1 |
| 🏢 Agency-in-a-Box | $500k  | >70%    | 🟡 Phase 2 |
| 🛒 Marketplace     | $200k  | 30% cut | 🟢 Phase 3 |

---

## 🏗️ ARCHITECTURE (Hub-and-Spoke)

```
        ┌──────────────────────────┐
        │      MONEY LAYER         │  ← $300k RaaS Credits
        │   Next.js + Stripe       │
        └───────────┬──────────────┘
                    │
        ┌───────────▼──────────────┐
        │      ENGINE LAYER        │  ← Core Infrastructure
        │  OpenClaw + BullMQ       │
        └───────────┬──────────────┘
                    │
        ┌───────────▼──────────────┐
        │      VIRAL LAYER         │  ← $200k Marketplace
        │   Mekong CLI + Recipes   │
        └──────────────────────────┘
```

---

## 📅 EXECUTION PHASES

### Phase 1: PMF ($0 → $50k) - Week 1-4

**Goal:** Validate với 10 paying customers

| Task               | Owner                 | Status      |
| ------------------ | --------------------- | ----------- |
| ✅ Mekong CLI Core | genesis.py            | DONE        |
| ✅ ClaudeKit DNA   | 52 skills             | DONE        |
| ✅ vibe-analytics  | CC CLI                | DONE        |
| ✅ Landing Page    | apps/agencyos-landing | DONE        |
| ✅ Stripe Checkout | Pre-order $99         | DONE        |

**Target Audience:** CEO/Shop Owner Lead Gen VN

---

### Phase 2: Scale ($50k → $300k) - Month 2-6

| Task               | Description            |
| ------------------ | ---------------------- |
| ProductHunt Launch | English version        |
| AppSumo LTD        | Bootstrap capital      |
| Enterprise Pilot   | 5 agencies @ $2k/month |

---

### Phase 3: Domination ($300k → $1M) - Month 6-12

| Task            | Description            |
| --------------- | ---------------------- |
| Agency-in-a-Box | $10k setup + $2k/month |
| Marketplace     | 30% cut từ recipes     |
| Franchise Model | White-label license    |

---

## ✅ COMPLETED ITEMS

- [x] MASTER_PRD_AGENCYOS_RAAS.md - Architecture
- [x] PRD_AGENCY_GENESIS.md - Automation Loop
- [x] PRD_MEKONG_GENESIS.md - CLI Blueprint
- [x] ROADMAP_1M.md - Revenue Breakdown
- [x] Mekong CLI Core (agent_base, parser, main.py)
- [x] ClaudeKit DNA extracted (52 skills)
- [x] Proxy Health (Claude + Gemini hybrid)
- [x] CC CLI vibe-analytics bootstrap (researcher 166+ tools)
- [x] AgencyOS Landing Page (Next.js + Tailwind v4)
- [x] Stripe Checkout Integration (Pre-order $99)
- [x] Engine Layer Setup (OpenClaw + BullMQ) - Code Complete
- [x] Engine Layer Database Integration (PostgreSQL + Prisma)
- [x] Mekong CLI Recipe System Integration - Executor & Parser implemented
- [x] Agency-in-a-Box Setup Automation
- [x] Marketplace Foundation - Recipe Registry
- [x] Autonomous Genesis Protocol - LeadHunter, ContentWriter, RecipeCrawler
- [x] Mekong CLI Interactive UI - Module Selector
- [x] Phase 8: Production Hardening - SQLite Integration, Retry Logic, Zombie Job Cleanup

---

## 🔄 IN PROGRESS

- [x] Engine Layer Deployment (Docker/GCP) - Dockerfiles & Makefile ready
- [x] Deployment Preparation (Vercel) - vercel.json & Guide ready

---
---

## 📊 KPIs TO TRACK

| Metric        | Target   | Current   |
| ------------- | -------- | --------- |
| Pre-orders    | 100      | 0         |
| MRR           | $10k     | $0        |
| CLI Downloads | 1,000    | 0         |
| Metric        | Target   | Current   |
| --------      | -------- | --------- |
| Pre-orders    | 100      | 0         |
| MRR           | $10k     | $0        |
| CLI Downloads | 1,000    | 0         |
| GitHub Stars  | 500      | 0         |

---

## 🔄 VERTICAL SYNC (No-Conflict Guard)

All sub-projects MUST align with this master roadmap:

| Vertical                   | Revenue Path         | Status                  |
| -------------------------- | -------------------- | ----------------------- |
| **Apex-OS** (Fintech)      | Agency-in-a-Box $25k | Archived Nov 2025 plans |
| **Sophia** (Video Factory) | $1,200/mo tier       | Active                  |
| **Cơm Ánh Dương** (F&B)    | Turnkey POS          | Active                  |
| **Well** (Ecommerce)       | PayOS VN             | Active                  |

**Rules:**

1. All specialized agents → packaged as Mekong CLI "Recipes"
2. Single credit pool → all RaaS services
3. Data parity → AgencyOS Pulse analytics

---

## 📂 ARCHIVED PLANS (Historical Reference)

These plans are now DEPRECATED - information merged into this master:

| File                                  | Date     | Notes                                       |
| ------------------------------------- | -------- | ------------------------------------------- |
| `docs/archive/OPTIMAL_STRATEGY_1M.md` | Nov 2025 | Apex-OS Blitzkrieg (7 Binh Pháp principles) |
| `docs/archive/MASTER_PLAN_1M.md`      | Nov 2025 | Apex-OS Agentic Teams                       |
| KI `roadmap_1m_master.md`             | Feb 2026 | Phase-gated execution                       |

---

## 🗂️ RELATED DOCUMENTS

| Document                                      | Purpose                |
| --------------------------------------------- | ---------------------- |
| [MASTER_PRD](./MASTER_PRD.md)   | Technical Architecture |
| [PRD_AGENCY_GENESIS](./PRD_AGENCY_GENESIS.md) | Automation Loop        |
| [PRD_MEKONG_GENESIS](./PRD_MEKONG_GENESIS.md) | CLI Blueprint          |

---

> **⚠️ SINGLE SOURCE OF TRUTH**
>
> This is the ONLY active $1M roadmap. All other files are ARCHIVED.
> Update THIS file when priorities change.
