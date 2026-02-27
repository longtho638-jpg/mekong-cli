---
title: "Mekong CLI AGI Go Live — Tích hợp Full Tôm Hùm AGI"
description: "Merge toàn bộ Tôm Hùm AGI stack vào mekong-cli platform, production-ready public launch"
status: completed
priority: P0
effort: 20h
branch: master
tags: [agi, go-live, cli, production, tom-hum, openclaw]
created: 2026-02-27
---

# Mekong CLI AGI Go Live — Tích hợp Full Tôm Hùm AGI

Merge toàn bộ Tôm Hùm AGI stack (70+ modules, L3-L5 AGI features) vào mekong-cli thành unified AGI CLI platform.

## Đánh giá hiện tại

| Layer | Readiness | Blockers |
|-------|-----------|----------|
| CLI Engine (Python PEV) | 75% | Gateway tests fail, .env.example thiếu |
| Tôm Hùm AGI (Node.js) | 85% | Port docs mâu thuẫn, health endpoint chưa integrate |
| Infrastructure | 70% | PayPal secrets, thiếu smoke test |
| Packages | 60% | Chưa publish npm/PyPI |
| Documentation | 50% | Thiếu AGI architecture docs public |

## Tôm Hùm AGI Components (to integrate)

| Component | Module | AGI Level | Status |
|-----------|--------|-----------|--------|
| Auto-CTO Pilot | auto-cto-pilot.js | L4 | ✅ Production |
| Post-Mission Gate | post-mission-gate.js | L3 | ✅ Production |
| Learning Engine | learning-engine.js | L5 | ✅ Production |
| Evolution Engine | evolution-engine.js | L5 | ✅ Production |
| Mission Journal | mission-journal.js | L3 | ✅ Production |
| Circuit Breaker | circuit-breaker.js | L3 | ✅ Production |
| Heartbeat Monitor | brain-heartbeat.js | L3 | ✅ Production |
| Health Server | brain-health-server.js | L3 | ✅ Production |
| AGI Score Calculator | agi-score-calculator.js | L5 | ✅ Production |
| Triple-Mix Routing | anthropic-adapter | L4 | ✅ Production |
| Safety Gate v2.0 | post-mission-gate.js | L3 | ✅ Production |
| Project Scanner | project-scanner.js | L4 | ✅ Production |

## Phases

| # | Phase | Effort | Status | File |
|---|-------|--------|--------|------|
| 1 | Fix Critical Blockers (P0) | 4h | completed | [phase-01](phase-01-fix-critical-blockers.md) |
| 2 | Tôm Hùm AGI Integration | 5h | completed | [phase-02](phase-02-tom-hum-agi-integration.md) |
| 3 | Package & Publish | 3h | completed | [phase-03](phase-03-package-publish.md) |
| 4 | CI/CD & Deployment Hardening | 3h | completed | [phase-04](phase-04-cicd-hardening.md) |
| 5 | Documentation & Public Launch | 3h | completed | [phase-05](phase-05-docs-public-launch.md) |
| 6 | Code Quality & Refactor (Post-launch) | 4h | deferred | [phase-06](phase-06-code-quality-refactor.md) |

## Dependencies

```
Phase 1 (blockers) ──→ Phase 2 (AGI integration)
                   ──→ Phase 3 (publish)  ──→ Phase 5 (launch)
                   ──→ Phase 4 (CI/CD)    ──→ Phase 5 (launch)
Phase 6 = POST-LAUNCH (deferred per Ngũ Nguy #4)
```

Phase 2, 3, 4 chạy song song sau Phase 1.

## Key Decisions

- **Scope:** Full Tôm Hùm AGI integration — không chỉ CLI publish
- **Port proxy:** 9191 (CC CLI, ĐIỀU 56) + 20128 (Tôm Hùm engine) — cả 2 đúng, khác mục đích
- **Payment:** Polar.sh only (xóa PayPal)
- **Package name:** `mekong-cli` (đổi từ `mekong-cli-lean`)
- **License:** MIT (confirmed README)
- **bin/oc:** Internal only — Tôm Hùm daemon shortcut
- **Refactor:** Deferred post-launch (Ngũ Nguy #4 — chống perfectionism)
- **Strategy:** 兵貴勝不貴久 — Ship first, polish later

## Validation Log

### Session 1 — 2026-02-27
**Trigger:** Initial plan creation + validation interview
**Questions asked:** 4 (batch)

#### Questions & Answers

1. **[Scope]** Scope go-live: Publish lên PyPI/npm cho public hay chỉ production-ready internal?
   - Options: Full public publish | Internal production-ready | CLI-only publish
   - **Answer:** Full public publish + **TÍCH HỢP FULL TÔM HÙM AGI**
   - **Custom input:** "TICH HOP FULL TOM HUM AGI VAO MEKONG-CLI"
   - **Rationale:** Mekong-cli cần toàn bộ AGI stack để thành platform thực sự, không chỉ CLI tool

2. **[Refactor]** Phase 2 Refactor trước hay sau go-live?
   - Options: Defer post-launch | Include in go-live | Partial gateway only
   - **Answer:** Defer to post-launch
   - **Rationale:** Ngũ Nguy #4 (Liêm Khiết) — perfectionism kills shipping. 3 files lớn không block functionality

3. **[Architecture]** bin/oc entry point — public hay internal?
   - Options: Internal only | Ship public | Remove entirely
   - **Answer:** Internal only
   - **Rationale:** Tôm Hùm là daemon nội bộ, public users dùng `mekong` CLI

4. **[Legal]** License cho open source release?
   - Options: MIT | Apache 2.0 | AGPL-3.0
   - **Answer:** MIT
   - **Rationale:** README đã confirm MIT, phổ biến nhất cho CLI tools

#### Confirmed Decisions
- Scope: **Full AGI integration** (Tôm Hùm L3-L5 + CLI engine)
- Refactor: **Deferred** post-launch
- bin/oc: **Internal** only
- License: **MIT**
- Ports: 9191 (CC CLI) + 20128 (Tôm Hùm) — cả 2 đúng

#### Action Items
- [x] Update plan scope → include Tôm Hùm AGI integration phase
- [x] Rename Phase 2 → "Tôm Hùm AGI Integration"
- [x] Move refactor → Phase 6 (deferred)
- [ ] Create phase-02-tom-hum-agi-integration.md
- [ ] Update phase-05 → include AGI architecture docs

#### Impact on Phases
- Phase 2: **REPLACED** — từ "Code Quality & Refactor" → "Tôm Hùm AGI Integration"
- Phase 5: Thêm AGI architecture documentation cho public
- Phase 6: **NEW** — deferred refactor post-launch
