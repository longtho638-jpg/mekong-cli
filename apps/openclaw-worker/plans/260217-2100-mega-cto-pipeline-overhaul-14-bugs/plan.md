---
title: "MEGA CTO PIPELINE OVERHAUL — Fix ALL 14 Bugs"
description: "Fix tất cả 14 bugs trong OpenClaw Worker pipeline trong 1 shot"
status: completed
priority: P0
effort: 2h
branch: master
tags: [bug-fix, performance, cto-pipeline, critical]
created: 2026-02-17
---

# MEGA CTO PIPELINE OVERHAUL — Fix ALL 14 Bugs

## Overview

Fix tất cả 14 bugs được xác định trong OpenClaw Worker pipeline để tăng tốc độ phản xạ CTO từ minutes xuống seconds.

## Context

- **Working Dir**: `/Users/macbookprom1/mekong-cli/apps/openclaw-worker`
- **Refs**: `BINH_PHAP_MASTER.md`, `AGI_ROADMAP.md`
- **Current Status**: Pipeline có 14 bugs ảnh hưởng performance và reliability
- **Target**: Sub-5s CTO response time, zero duplicate dispatch

## Bug Categories

### A. task-watcher.js (3 bugs)
1. Scan interval quá chậm — giảm xuống 5s MAX
2. DUPLICATE DISPATCH — task file KHÔNG bị move sau dispatch
3. Task priority: CRITICAL > HIGH > MEDIUM

### B. lib/brain-tmux.js (6 bugs)
4. Poll sleep(5000) → 2000ms
5. Initial sleep(5000) → 2000ms
6. Question sleep(3000) → 1000ms
7. QUESTION NOT ANSWERED — CC CLI hỏi USER DECISION/Options
8. Verify Escape+C-u trước pasteText
9. Verify model override disabled

### C. lib/mission-dispatcher.js (3 bugs)
10. Verify line 62 bypass xóa
11. Verify đa luồng mandatePrefix mọi prompt
12. Verify HÀN BĂNG >= 25

### D. lib/m1-cooling-daemon.js (1 bug)
13. Verify OVERHEAT=30, SAFE=20, VELOCITY=5.0

### E. config.js (1 bug)
14. Verify POLL_INTERVAL_MS <= 100

## Implementation Phases

- [Phase 1: Analysis & Verification](phase-01-analysis-verification.md) — Phân tích code hiện tại, xác nhận bugs
- [Phase 2: Fix Group A - Task Watcher](phase-02-fix-task-watcher.md) — Fix 3 bugs trong task-watcher.js
- [Phase 3: Fix Group B - Brain Tmux](phase-03-fix-brain-tmux.md) — Fix 6 bugs trong brain-tmux.js
- [Phase 4: Fix Group C - Mission Dispatcher](phase-04-fix-mission-dispatcher.md) — Fix 3 bugs trong mission-dispatcher.js
- [Phase 5: Fix Group D & E - Config](phase-05-fix-config.md) — Fix 2 bugs trong config files
- [Phase 6: Integration Testing](phase-06-integration-testing.md) — Verify all fixes, commit+push

## Success Criteria

- ✅ All 14 bugs fixed
- ✅ `node -e "require('./config')"` passes
- ✅ `node -e "require('./task-watcher')"` passes
- ✅ git diff shows only intended changes
- ✅ Commit + push successful
- ✅ Zero duplicate dispatch in production
- ✅ CTO response time < 5s

## Risk Assessment

**Low Risk** — All bugs are well-defined with clear fixes. No architectural changes.

**Mitigation**:
- Verify each fix independently before moving to next
- Keep original values in comments for easy rollback
- Test require() after each phase

## Next Steps

1. Review plan với user
2. Execute Phase 1 — Analysis
3. Sequential fix từng group
4. Integration test cuối cùng
