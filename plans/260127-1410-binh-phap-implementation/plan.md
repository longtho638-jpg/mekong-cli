# 🏯 Binh Pháp Implementation Plan

> **"Mưu định nhi hậu chiến"** - Kế hoạch trước, hành động sau

## 📋 Overview

Triển khai đầy đủ hệ thống ánh xạ Binh Pháp 13 Chương vào AgencyOS:

- **BẢN ĐỒ** (Map): Ánh xạ strategic concepts → technical implementation
- **CÔNG CỤ** (Tools): CLI commands, workflows, agents
- **DOCUMENTATION**: User-facing guides, developer docs

## 🎯 Phase 1: Command Registration (P0 - 30 min)

### Task 1.1: Register /binh-phap Command
- [x] Command registered in `.claude/commands/binh-phap.md`

### Task 1.2: Register Sub-Commands
- [x] Created 13 sub-commands in `.claude/commands/binh-phap/`
- [x] Verified mapping to workflows

### Task 1.3: Create Workflow Files
- [x] Verified 13 workflow files in `.agent/workflows/binh-phap/`

---

## 🎯 Phase 2: IPO Task Mapping (P0 - Already Delegated)

Map IPO tasks to Binh Pháp chapters:

| IPO Task              | Binh Pháp Chapter              | Status       |
| --------------------- | ------------------------------ | ------------ |
| IPO-003-Security      | Ch.6 Hư Thực (Protection)      | ✅ Completed |
| IPO-005-Monitoring    | Ch.13 Dụng Gián (Intelligence) | ✅ Completed |
| IPO-010-Stripe        | Ch.2 Tác Chiến (Resources)     | ✅ Completed |
| IPO-012-API           | Ch.4 Hình Thế (Positioning)    | ✅ Completed |
| IPO-013-Affiliate     | Ch.3 Mưu Công (Alliances)      | Running      |
| IPO-014-Email         | Ch.12 Hỏa Công (Outreach)      | ✅ Completed |
| IPO-015-Analytics     | Ch.13 Dụng Gián (Intelligence) | ✅ Completed |
| IPO-017-Webhook       | Ch.9 Hành Quân (Operations)    | ✅ Completed |
| IPO-018-OAuth         | Ch.6 Hư Thực (Protection)      | ✅ Completed |
| IPO-019-Queue         | Ch.9 Hành Quân (Operations)    | ✅ Completed |
| IPO-020-CDN           | Ch.7 Quân Tranh (Speed)        | ✅ Completed |
| IPO-021-Audit         | Ch.13 Dụng Gián (Intelligence) | ✅ Completed |
| IPO-022-Landing       | Ch.12 Hỏa Công (Marketing)     | ✅ Completed |
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
- [x] Updated `.claude/memory/constitution.md` with explicit mapping

### Task 3.2: Create Quick Reference Card
- [x] Created `docs/binh-phap-reference.md`

---

## 🎯 Phase 4: UI Integration (P2 - Optional)

### Task 4.1: Binh Pháp Dashboard Component
- [x] Visual representation of 13 chapters (`scripts/binh_phap_dashboard.py`)
- [x] Status indicators for each area (via API `/api/v1/binh-phap/status`)
- [x] Quick command shortcuts (Added to CLI dashboard)

### Task 4.2: Interactive Strategy Map
- [x] Click chapter → See related commands (CLI `show_detail_view`)
- [x] Drill down to specific tasks (CLI detail view)
- [x] Progress tracking (CLI visual progress bar)

---

## ✅ Verification Checklist

- [x] All 13 workflow files created
- [x] Commands registered in `.agent/workflows/`
- [x] IPO tasks mapped to chapters
- [x] Constitution references updated
- [x] Quick reference card added to docs
- [x] Dashboard component (optional)

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
