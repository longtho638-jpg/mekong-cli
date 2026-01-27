# 🏯 Binh Pháp Implementation Plan

> **"Mưu định nhi hậu chiến"** - Kế hoạch trước, hành động sau

## 📋 Overview

Triển khai đầy đủ hệ thống ánh xạ Binh Pháp 13 Chương vào AgencyOS:

- **BẢN ĐỒ** (Map): Ánh xạ strategic concepts → technical implementation
- **CÔNG CỤ** (Tools): CLI commands, workflows, agents
- **DOCUMENTATION**: User-facing guides, developer docs

## 🎯 Phase 1: Command Registration (P0 - 30 min)

### Task 1.1: Register /binh-phap Command

```yaml
command: /binh-phap
file: .agent/workflows/binh-phap.md
description: Full 13-chapter strategic analysis
```

### Task 1.2: Register Sub-Commands

| Command       | Chapter    | Purpose              |
| ------------- | ---------- | -------------------- |
| `/ke-hoach`   | Ch.1 始計  | Strategic planning   |
| `/tac-chien`  | Ch.2 作戰  | Resource management  |
| `/muu-cong`   | Ch.3 謀攻  | Win without fighting |
| `/hinh-the`   | Ch.4 形勢  | Positioning          |
| `/the-tran`   | Ch.5 勢    | Momentum building    |
| `/hu-thuc`    | Ch.6 虛實  | Strengths/Weaknesses |
| `/quan-tranh` | Ch.7 軍爭  | Speed execution      |
| `/cuu-bien`   | Ch.8 九變  | Adaptation           |
| `/hanh-quan`  | Ch.9 行軍  | Operations           |
| `/dia-hinh`   | Ch.10 地形 | Market terrain       |
| `/cuu-dia`    | Ch.11 九地 | Crisis management    |
| `/hoa-cong`   | Ch.12 火攻 | Disruption           |
| `/dung-gian`  | Ch.13 用間 | Intelligence         |

### Task 1.3: Create Workflow Files

```bash
.agent/workflows/binh-phap/
├── ke-hoach.md        # Chapter 1
├── tac-chien.md       # Chapter 2
├── muu-cong.md        # Chapter 3
├── hinh-the.md        # Chapter 4
├── the-tran.md        # Chapter 5
├── hu-thuc.md         # Chapter 6
├── quan-tranh.md      # Chapter 7
├── cuu-bien.md        # Chapter 8
├── hanh-quan.md       # Chapter 9
├── dia-hinh.md        # Chapter 10
├── cuu-dia.md         # Chapter 11
├── hoa-cong.md        # Chapter 12
└── dung-gian.md       # Chapter 13
```

---

## 🎯 Phase 2: IPO Task Mapping (P0 - Already Delegated)

Map IPO tasks to Binh Pháp chapters:

| IPO Task              | Binh Pháp Chapter              | Status       |
| --------------------- | ------------------------------ | ------------ |
| IPO-003-Security      | Ch.6 Hư Thực (Protection)      | ✅ Completed |
| IPO-005-Monitoring    | Ch.13 Dụng Gián (Intelligence) | ✅ Completed |
| IPO-010-Stripe        | Ch.2 Tác Chiến (Resources)     | ✅ Completed |
| IPO-012-API           | Ch.4 Hình Thế (Positioning)    | Running      |
| IPO-013-Affiliate     | Ch.3 Mưu Công (Alliances)      | Running      |
| IPO-014-Email         | Ch.12 Hỏa Công (Outreach)      | ✅ Completed |
| IPO-015-Analytics     | Ch.13 Dụng Gián (Intelligence) | Running      |
| IPO-017-Webhook       | Ch.9 Hành Quân (Operations)    | Running      |
| IPO-018-OAuth         | Ch.6 Hư Thực (Protection)      | ✅ Completed |
| IPO-019-Queue         | Ch.9 Hành Quân (Operations)    | ✅ Completed |
| IPO-020-CDN           | Ch.7 Quân Tranh (Speed)        | Running      |
| IPO-021-Audit         | Ch.13 Dụng Gián (Intelligence) | ✅ Completed |
| IPO-022-Landing       | Ch.12 Hỏa Công (Marketing)     | Running      |
| IPO-031-Notifications | Ch.12 Hỏa Công (Outreach)      | ✅ Completed |
| IPO-032-Search        | Ch.13 Dụng Gián (Discovery)    | ✅ Completed |
| IPO-033-Rate-Limiting | Ch.6 Hư Thực (Defense)         | ✅ Completed |
| IPO-034-Feature-Flags | Ch.8 Cửu Biến (Adaptation)     | ✅ Completed |
| IPO-035-Multi-Tenancy | Ch.11 Cửu Địa (Terrain)        | ✅ Completed |
| IPO-036-Caching       | Ch.7 Quân Tranh (Speed)        | ✅ Completed |
| IPO-037-GraphQL       | Ch.4 Hình Thế (Structure)      | ✅ Completed |
| IPO-038-Payments      | Ch.2 Tác Chiến (Revenue)       | ✅ Completed |
| IPO-039-Jobs          | Ch.9 Hành Quân (Operations)    | ✅ Completed |
| IPO-040-Logging       | Ch.13 Dụng Gián (Intel)        | ✅ Completed |
| IPO-041-Healthcheck   | Ch.10 Địa Hình (Terrain)       | ✅ Completed |
| IPO-042-CI-CD         | Ch.3 Mưu Công (Automation)     | ✅ Completed |

---

## 🎯 Phase 3: Constitution Integration (P1 - 15 min)

### Task 3.1: Add Binh Pháp Reference to Each ĐIỀU

Map Constitution rules to Binh Pháp chapters for consistency.

### Task 3.2: Create Quick Reference Card

```markdown
# Binh Pháp Quick Reference

| Chapter | Tên        | Principle     | AgencyOS Application           |
| ------- | ---------- | ------------- | ------------------------------ |
| 1       | Kế Hoạch   | Plan first    | /plan, Implementation plans    |
| 2       | Tác Chiến  | Resource mgmt | /runway, Budget tracking       |
| 3       | Mưu Công   | Automation    | CI/CD, No manual work          |
| 4       | Hình Thế   | Positioning   | Architecture decisions         |
| 5       | Thế Trận   | Momentum      | Growth metrics, KPIs           |
| 6       | Hư Thực    | Defense       | Security, Rate limiting        |
| 7       | Quân Tranh | Speed         | Caching, CDN, Fast deploys     |
| 8       | Cửu Biến   | Adaptation    | Feature flags, A/B tests       |
| 9       | Hành Quân  | Operations    | Jobs, Queues, Webhooks         |
| 10      | Địa Hình   | Terrain       | Multi-tenancy, Health checks   |
| 11      | Cửu Địa    | Crisis        | DR, Backup, Recovery           |
| 12      | Hỏa Công   | Marketing     | Notifications, Outreach        |
| 13      | Dụng Gián  | Intelligence  | Logging, Analytics, Monitoring |
```

---

## 🎯 Phase 4: UI Integration (P2 - Optional)

### Task 4.1: Binh Pháp Dashboard Component

- Visual representation of 13 chapters
- Status indicators for each area
- Quick command shortcuts

### Task 4.2: Interactive Strategy Map

- Click chapter → See related commands
- Drill down to specific tasks
- Progress tracking

---

## ✅ Verification Checklist

- [ ] All 13 workflow files created
- [ ] Commands registered in `.agent/workflows/`
- [ ] IPO tasks mapped to chapters
- [ ] Constitution references updated
- [ ] Quick reference card added to docs
- [ ] Dashboard component (optional)

---

## 🏯 Binh Pháp Alignment

> **"知彼知己，百戰不殆"**
> Know the enemy, know yourself, a hundred battles without danger.

The map IS the strategy. With clear mapping:

- Every action has strategic context
- Every feature serves a purpose
- Every decision aligns with principles

---

**Plan Created:** 2026-01-27 14:10
**Status:** Ready for Execution
