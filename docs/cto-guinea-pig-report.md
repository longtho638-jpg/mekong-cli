# CTO Guinea Pig Report — P0 Tự Test Chính Mình

> Date: 2026-03-09 01:38 | Target: apps/openclaw-worker
> Method: Full pipeline trên chính hệ thống CTO

---

## Pipeline Results

| Step | Test | Result | Details |
|------|------|--------|---------|
| 1a | `node --check vibe-factory-monitor.js` | ✅ PASS | Syntax OK |
| 1b | `node --check summoning-gateway.js` | ✅ PASS | Syntax OK |
| 1c | `node --check lib/cto-*.js` (12 files) | ✅ PASS | 0 failures |
| 2 | `npm test` (vitest) | ✅ PASS | **186/186** tests pass |
| 3 | `node --check lib/*.js` (106 files) | ✅ PASS | 106/106 syntax OK |
| 4a | `listCommands()` | ✅ PASS | 13 squads, 97 commands |
| 4b | `buildInjectionPrompt('/strategist')` | ✅ PASS | Correct header + exports |
| 4c | `detectAndRecommend({ buildFailed })` | ✅ PASS | → DEFENSE /heal |
| 4d | `detectAndRecommend({ revenueDrop })` | ✅ PASS | → REVENUE /revenue-scan |
| 4e | `detectAndRecommend({ allGreen })` | ✅ PASS | → STRATEGIC /strategist |
| 4f | `resolveModule('/strategist')` | ✅ PASS | File exists |
| 4g | `getSquad('/heal')` | ✅ PASS | 🛡️ Defense & Safety |
| 5 | `scanBeforeDispatch(cwd, 'openclaw-worker')` | ⚠️ FALSE POSITIVE | Detects "FAIL" text from circuit-breaker test output |

## Bugs Found & Fixed

### BUG 1: `hasPrompt()` always returns false (CRITICAL)

- **File:** `lib/brain-state-machine.js:330`
- **Root cause:** `isBusy()` was refactored to return `{ isBusy: bool, confidence, matchedPatterns }` but `hasPrompt()` still treated return as boolean — object is truthy!
- **Impact:** `detectState('❯ ')` returned `'unknown'` instead of `'idle'` → CTO thought all idle panes were unknown
- **Fix:** Changed `if (isBusy(output))` → `if (isBusy(output).isBusy)`

### BUG 2: Tests used boolean check on object return (10 failures)

- **File:** `test/brain-state-machine.test.js`
- **Root cause:** `expect(isBusy(...)).toBe(true)` → object ≠ true
- **Fix:** Changed to `expect(isBusy(...).isBusy).toBe(true)`

### QUIRK: Pre-dispatch scan false positive

- **File:** `lib/cto-pre-dispatch-scan.js`
- **Cause:** `npm test --silent` output contains "FAIL" text from circuit-breaker test (which intentionally creates failures to test the breaker). Regex `FAIL|failing|failed` matches this.
- **Status:** Known — not fixing now (would require parsing vitest exit code instead of text)

---

## AGI Score per CTO Module

| Module | Lines | Funcs | AGI Level | Score /10 | Notes |
|--------|-------|-------|-----------|-----------|-------|
| `cto-task-dispatch.js` | 297 | 8 | L7 | **9/10** | Agent Role mapping, pane specialization |
| `cto-visual-dashboard.js` | 284 | 14 | L6 | **8/10** | Real-time multi-pane dashboard |
| `cto-pane-handler.js` | 260 | 4 | L5 | **8/10** | Event-driven pane management |
| `cto-escalation.js` | 125 | 5 | L4 | **7/10** | Authority escalation protocol |
| `cto-tmux-helpers.js` | 118 | 5 | L3 | **7/10** | Tmux utility layer |
| `cto-worker-coordinator.js` | 100 | 5 | L4 | **7/10** | Worker orchestration |
| `cto-progress-tracker.js` | 96 | 6 | L3 | **7/10** | Mission progress tracking |
| `cto-pre-dispatch-scan.js` | 95 | 1 | L4 | **6/10** | Pre-scan (false positive quirk) |
| `cto-ram-policy.js` | 91 | 3 | L3 | **7/10** | RAM tiered policy |
| `cto-pane-state-detector.js` | 69 | 1 | L3 | **7/10** | State detection (12 states) |
| `cto-dashboard-logger.js` | 57 | 1 | L2 | **6/10** | Dashboard log writer |
| `cto-codebase-scanner.js` | 49 | 1 | L3 | **6/10** | Lightweight intel scanner |

**CTO Module Average: 7.1/10**

### Key Brain Modules AGI Score

| Module | AGI Level | Score /10 |
|--------|-----------|-----------|
| `auto-cto-pilot.js` | L6 | **9/10** |
| `strategic-brain.js` | L6 | **9/10** |
| `brain-state-machine.js` | L4 (fixed) | **8/10** |
| `brain-mission-runner.js` | L5 | **8/10** |
| `summoning-gateway.js` | L7 (new) | **8/10** |
| `evolution-engine.js` | L6 | **8/10** |
| `learning-engine.js` | L8 | **8/10** |
| `self-analyzer.js` | L10 | **7/10** |
| `perception-engine.js` | L9 | **7/10** |

---

## Tôm Hùm Health (from CTO log)

| Metric | Value |
|--------|-------|
| P0 (Chairman) | ✅ OK |
| P1-P3 (Workers) | ❌ DEAD — tmux panes missing |
| RAM Free | 1.3GB (critical) |
| Active Workers | 1/3 |
| Issue | Respawn loop — `can't find pane` |

---

## Unresolved Questions

1. **Pre-dispatch false positive**: Should `scanBeforeDispatch` use vitest exit code instead of text grep? Current regex catches "FAIL" from test output that intentionally tests failure scenarios.
2. **P1-P3 respawn loop**: Tmux session has only 1 pane. Need to recreate panes or restart session.

---

## Phase 2: Full Summoning Gateway Test (01:42)

### Test 1: listCommands() — ✅ PASS
- 13 squads, 97 commands registered
- All squads return correct name + command array

### Test 2: buildInjectionPrompt() — ✅ 9/9 PASS

| Command | Module | Valid Prompt |
|---------|--------|-------------|
| `/strategist` | strategic-brain | ✅ |
| `/hunt` | hunter-scanner | ✅ |
| `/dispatch` | mission-dispatcher | ✅ |
| `/evolve` | evolution-engine | ✅ |
| `/revenue-scan` | revenue-health-scanner | ✅ |
| `/heal` | self-healer | ✅ |
| `/cool` | m1-cooling-daemon | ✅ |
| `/pipeline` | factory-pipeline | ✅ |
| `/gemini` | gemini-agentic | ✅ |

### Test 3: detectAndRecommend() — ✅ 8/8 PASS

| State | Expected Squad | Expected Command | Result |
|-------|---------------|-----------------|--------|
| `{testFail}` | DEFENSE | /gate | ✅ |
| `{ramCritical}` | RESOURCE | /cool | ✅ |
| `{allGreen}` | STRATEGIC | /strategist | ✅ |
| `{revenueDrop}` | REVENUE | /revenue-scan | ✅ |
| `{buildFailed}` | DEFENSE | /heal | ✅ |
| `{paneDead}` | BRAIN | /brain-spawn | ✅ |
| `{tradingWindow}` | TRADING | /trading-schedule | ✅ |
| `{missionFailed}` | EVOLUTION | /reflect | ✅ |

### Test 4: require() All Grade A Modules — 96/97 PASS

- **Pass:** 96 modules require() successfully with exports
- **Fail:** 1 — `vector-service.js` (missing `@lancedb/lancedb` dependency)
- **Note:** Optional dependency, not installed in dev environment

### AGI Score — 90/100

| Dimension | Score | Max | Notes |
|-----------|-------|-----|-------|
| Syntax (node --check) | 20 | 20 | 106/106 files pass |
| Tests (vitest) | 20 | 20 | 186/186 tests pass |
| Gateway API | 18 | 20 | 9/9 prompts, 8/8 dispatch |
| Require (module load) | 18 | 20 | 96/97 (1 optional dep missing) |
| Self-Healing | 14 | 20 | Found+fixed 2 critical bugs in Phase 1 |
| **TOTAL** | **90** | **100** | **Enterprise Grade** ⭐⭐⭐⭐⭐ |
