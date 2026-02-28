# Code Review — AGI Master Revenue CTO Integration

**Date:** 2026-02-28
**Reviewer:** code-reviewer agent
**Report:** `plans/reports/code-reviewer-260228-0731-agi-master-revenue-cto.md`

---

## Scope

- Files: 6 changed/created
- LOC: ~250 net new lines
- Focus: correctness, security, integration, edge cases
- Scout findings: reviewed gateway security logic, async loop isolation, hardcoded metrics, prompt injection surface

---

## Overall Assessment

Changes are solid and purposeful. The async test fix is correct. The revenue scanner is well-structured with good cooldown logic and atomic state writes. Two medium bugs found (hardcoded metric, logic flaw in SQL check) plus minor issues. No critical security vulnerabilities introduced.

---

## Critical Issues

None.

---

## High Priority

### H1 — `checkGateway()`: SQL injection check logic is inverted / fragile

**File:** `/Users/macbookprom1/mekong-cli/apps/openclaw-worker/lib/revenue-health-scanner.js` line 91

```js
if (!content.includes('sql') && !content.includes('injection')) {
  issues.push({ severity: 'medium', module: 'gateway', message: 'Thiếu SQL injection protection' });
}
```

**Problem:** The condition uses `&&` — it only fires an issue when BOTH `'sql'` AND `'injection'` are absent. The current gateway has `"SQL injection"` as a comment, which means `content.includes('injection')` is `true`, so the check passes. But the check uses lowercase `'sql'` while the file has `'SQL'` — verified via runtime test: `content.includes('sql')` returns **false**, but the gate still passes because `injection` is true.

This means the check is accidentally correct today but is semantically wrong and brittle. Any future refactor that removes `injection` from comments would silently miss the real protection.

**Fix:**

```js
// Check for SQL injection protection pattern
const hasSqlProtection = /sql.{0,10}injection/i.test(content) || content.includes('parameterized') || content.includes('sanitize');
if (!hasSqlProtection) {
  issues.push({ severity: 'medium', module: 'gateway', message: 'Thiếu SQL injection protection' });
}
```

---

### H2 — `raasModuleCount` hardcoded to 12, actual check scans only 8 modules

**File:** `/Users/macbookprom1/mekong-cli/apps/openclaw-worker/lib/revenue-health-scanner.js` line 143

```js
raasModuleCount: 12,  // hardcoded — always shows 12 regardless of actual state
```

`checkRaaSModules()` checks exactly 8 required modules (`auth.py`, `billing.py`, `credits.py`, `missions.py`, `tenant.py`, `dashboard.py`, `registry.py`, `sse.py`). The metric `raasModuleCount: 12` is a constant that never reflects reality. This makes the dashboard metric misleading.

**Fix:**

```js
const metrics = {
  raasModuleCount: requiredModules.length - issues.filter(i => i.module !== 'gateway' && i.module !== 'dashboard').length,
  // or simply count present modules:
  raasModuleCount: fs.existsSync(raasDir)
    ? fs.readdirSync(raasDir).filter(f => f.endsWith('.py')).length
    : 0,
  ...
};
```

Since `checkRaaSModules` is a separate function, the cleanest fix is to return a count from it and use it in `scanRevenueHealth()`.

---

## Medium Priority

### M1 — `test_tick_with_due_job`: callback lambda logic is broken (pre-existing, not introduced by this PR)

**File:** `/Users/macbookprom1/mekong-cli/tests/test_gateway.py` line 1298

```python
self.scheduler.set_run_callback(
    lambda goal: {"status": "success", "goal": goal} or callback_called.append(goal)
)
```

The `or` expression short-circuits: `{"status": "success"}` is always truthy, so `callback_called.append(goal)` is never called. `callback_called` is defined but never asserted on (the assertion only checks `results[0]["status"]`). This is a pre-existing bug but the PR is a good opportunity to note it — either remove `callback_called` or fix the lambda.

**Fix:**

```python
def callback(goal):
    callback_called.append(goal)
    return {"status": "success", "goal": goal}
self.scheduler.set_run_callback(callback)
```

---

### M2 — `generateRevenueMission`: no sanitization on `issue.message` / `issue.module` in mission prompt

**File:** `/Users/macbookprom1/mekong-cli/apps/openclaw-worker/lib/revenue-health-scanner.js` line 181

```js
const prompt = `/cook "Trả lời bằng TIẾNG VIỆT. Fix revenue pipeline: ${issue.message} trong module ${issue.module}..."`;
```

`issue.message` and `issue.module` are currently only generated internally by `checkRaaSModules()`, `checkGateway()`, `checkDashboard()` — all hardcoded strings. No external input reaches this path today. However, if the scanner is ever extended to read file content or external data sources to populate issues, these fields would flow directly into a shell command string written to disk.

**Recommendation:** Add a sanitization step as a defensive habit:

```js
function sanitizeMissionField(str) {
  return String(str).replace(/["'\\\n\r]/g, ' ').slice(0, 200);
}
const prompt = `/cook "... Fix revenue pipeline: ${sanitizeMissionField(issue.message)} ..."`;
```

---

### M3 — New event loop per test: no `asyncio.set_event_loop()` call

**File:** `/Users/macbookprom1/mekong-cli/tests/test_gateway.py` lines 1283–1287

```python
loop = asyncio.new_event_loop()
try:
    results = loop.run_until_complete(self.scheduler.tick())
finally:
    loop.close()
```

`asyncio.new_event_loop()` creates a loop but does NOT set it as the current running loop for the thread. If `scheduler.tick()` or any coroutine it calls internally uses `asyncio.get_event_loop()` (deprecated in 3.10+, raises DeprecationWarning in 3.12, errors in 3.14), there could be a mismatch. Since `tick()` in `scheduler.py` only uses `get_event_bus()` and no internal `asyncio.get_event_loop()` calls, it works today. But the correct pattern is:

```python
loop = asyncio.new_event_loop()
asyncio.set_event_loop(loop)
try:
    results = loop.run_until_complete(self.scheduler.tick())
finally:
    loop.close()
    asyncio.set_event_loop(None)  # clean up thread-local reference
```

Or, simpler: use `asyncio.run()` which creates, runs, and closes in one call (Python 3.7+):

```python
results = asyncio.run(self.scheduler.tick())
```

`asyncio.run()` is the preferred pattern from Python 3.7+. The current `new_event_loop()` approach works but is more verbose.

---

### M4 — `REVENUE_STATE_FILE` path construction: mixing `config.MEKONG_DIR` and hardcoded relative path

**File:** `/Users/macbookprom1/mekong-cli/apps/openclaw-worker/lib/revenue-health-scanner.js` lines 22–25

```js
const REVENUE_STATE_FILE = path.join(
  config.MEKONG_DIR,
  'apps/openclaw-worker/data/revenue-health.json'
);
```

This works but is an anti-pattern — the module is inside `apps/openclaw-worker/` and hardcodes its own relative path from the root. If the module is ever moved or `MEKONG_DIR` is overridden, the file path follows `MEKONG_DIR`, not `__dirname`.

**Better approach** (consistent with other data files in the module):

```js
const REVENUE_STATE_FILE = path.join(__dirname, '..', 'data', 'revenue-health.json');
```

This is relative to the file itself, not dependent on the env-var-based root.

---

## Low Priority

### L1 — `package.json` test script change is correct but leaves no room for future tests

**Files:**
- `/Users/macbookprom1/mekong-cli/apps/raas-gateway/package.json`
- `/Users/macbookprom1/mekong-cli/apps/antigravity-cli/package.json`

Changed from `exit 1` to `exit 0`. This is correct — CI will no longer fail on placeholder test scripts. No action required but add a TODO comment or a placeholder `vitest` config when tests are added.

### L2 — `docs/raas-revenue-architecture.md`: `raasModuleCount: 12` in example JSON matches the hardcoded bug

**File:** `/Users/macbookprom1/mekong-cli/docs/raas-revenue-architecture.md` line 156

The doc example shows `"raasModuleCount": 12` which will become stale once H2 is fixed. Update after fixing the scanner.

### L3 — Silent catch in `loadRevenueState()`

**File:** `/Users/macbookprom1/mekong-cli/apps/openclaw-worker/lib/revenue-health-scanner.js` line 35

```js
} catch (e) { /* ignore */ }
```

A corrupted JSON file silently resets to default state. At minimum, log the parse error:

```js
} catch (e) {
  log(`[REVENUE] loadRevenueState parse error: ${e.message} — resetting`);
}
```

---

## Edge Cases Found by Scout

1. **Revenue scan fires only when project is GREEN** — if ALL projects in the rotation have build errors, revenue scan never runs. The 60-min cooldown is based on wall time, not project-scan-completion time, so this is recoverable but the `lastScan` can go stale for days in a broken-build scenario. Consider adding a "force scan after N project cycles" fallback.

2. **Race condition: `fs.writeFileSync` on mission file vs queue watcher** — `handleScan` writes the mission file synchronously inside the async function. The task queue watcher may pick it up before `advanceProject()` is called. If watcher fires fast and re-enters `handleScan` before state is written, the same revenue issue could be dispatched twice. The existing `isMissionDuplicate` dedup in `handleFix` does NOT apply here since revenue missions bypass that path. Adding the mission key to `_dispatchedMissions` from `handleScan` would close this gap.

3. **`asyncio.new_event_loop()` in parallel test runs** — if pytest runs tests in parallel (e.g. with `pytest-xdist`), multiple threads each calling `new_event_loop()` without `set_event_loop()` is safe (each thread has its own), but the global `EventBus` used in `test_tick_emits_events` (via `get_event_bus()`) may not be thread-safe. Pre-existing risk, not introduced here.

---

## Positive Observations

- `saveState()` in `auto-cto-pilot.js` uses atomic write (tmp + rename) — good pattern. The new `saveRevenueState()` uses direct `writeFileSync` without atomic write; this is acceptable for a metrics file but worth noting.
- 60-minute cooldown on revenue scan is appropriate — prevents log spam.
- Revenue scanner correctly returns `null` (not an empty result) on cooldown — callers check this explicitly in `handleScan`. Clean contract.
- `brain-process-manager.js` facade re-export is working: `log` is correctly available to revenue-health-scanner via the re-export chain.
- All 5 async tests pass with the new `new_event_loop()` pattern (verified: 5 passed, 0.42s).
- `checkGateway()` correctly reports separate issues for Telegram vs SQL patterns.

---

## Recommended Actions

1. **[HIGH]** Fix `checkGateway()` SQL check to use case-insensitive regex (H1)
2. **[HIGH]** Fix `raasModuleCount` to reflect actual module count, not hardcoded 12 (H2)
3. **[MEDIUM]** Replace `asyncio.new_event_loop()` pattern with `asyncio.run()` in all 5 tests (M3)
4. **[MEDIUM]** Fix `REVENUE_STATE_FILE` to use `__dirname`-relative path (M4)
5. **[MEDIUM]** Add input sanitization in `generateRevenueMission()` as defensive habit (M2)
6. **[LOW]** Add log in `loadRevenueState` catch block (L3)
7. **[LOW]** Update doc example JSON once H2 is fixed (L2)

---

## Metrics

- Type Coverage: N/A (JavaScript, no TypeScript)
- Test Coverage: 5/5 scheduler tick tests passing
- Linting Issues: 0 syntax errors (both JS modules load cleanly)
- New module size: 187 lines — within 200-line limit (compliant)

---

## Unresolved Questions

1. Why does `raasModuleCount: 12` exist — is there a different set of 12 modules expected (e.g. including gateway routes, agent files)? Needs clarification before fixing H2.
2. Should revenue scan also trigger when a project is in RED state (has build errors) but the revenue pipeline itself is critical? Current design only scans on GREEN.
3. The `tests/test_raas_integration.py` referenced in `generateRevenueMission` prompt — does this file exist? If not, every revenue fix mission will fail verification. Checked in git status: not in tracked files.
