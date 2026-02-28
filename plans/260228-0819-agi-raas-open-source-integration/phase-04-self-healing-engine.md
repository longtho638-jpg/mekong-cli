# Phase 04: Self-Healing Engine — Aider Integration

## Context Links
- [Research Report](research/researcher-01-agi-frameworks.md) — Mang 3: Self-Improving Agents
- Existing: `apps/openclaw-worker/lib/auto-cto-pilot.js` (~400 lines, 3-phase scan→plan→verify)
- Existing: `apps/openclaw-worker/lib/self-healer.js` (health monitor, tmux recovery)
- Existing: `apps/openclaw-worker/lib/learning-engine.js` (mission outcome analysis)
- Existing: `apps/openclaw-worker/lib/evolution-engine.js` (strategy optimization)
- Existing: `apps/openclaw-worker/lib/post-mission-gate.js` (build verify after mission)
- Existing: `src/core/self_improve.py` (SelfImprover, recipe deprecation, 197 lines)

## Parallelization
- **SONG SONG** voi Phase 01, 02, 03, 05
- File ownership: `apps/openclaw-worker/lib/aider-bridge.js` (NEW), `apps/openclaw-worker/lib/auto-cto-pilot.js`
- KHONG cham: `src/core/` (Phase 01+02+03), `packages/` (Phase 01+03), `apps/agencyos-web/` (Phase 05)

## Overview
- **Priority:** P2
- **Status:** pending
- **Mo ta:** Tich hop Aider CLI vao Tom Hum auto-cto-pilot. Khi test fail hoac build fail → Aider auto-fix code → re-run tests → commit neu pass. Git-first workflow, route LLM qua Antigravity Proxy 9191.

## Key Insights
- Aider: CLI-native, Git-first, test→fix loop — phu hop CC CLI pattern
- Aider ho tro `--openai-api-base` → route qua Antigravity Proxy 9191
- auto-cto-pilot.js Phase 3 (VERIFY) hien tai chi detect loi → tao mission file
- Voi Aider bridge: detect loi → Aider auto-fix → re-verify → chi tao mission neu Aider fail
- Aider install: `pip install aider-chat` (hoac pipx)
- Aider chay nhu child_process tu Node.js (giong cach spawn CC CLI)

## Requirements

### Functional
- FR1: `aider-bridge.js` module wrap Aider CLI execution tu Node.js
- FR2: auto-cto-pilot.js goi Aider khi build/test fail (thay vi tao mission ngay)
- FR3: Aider route LLM calls qua Antigravity Proxy 9191
- FR4: Git auto-commit khi Aider fix thanh cong (Aider built-in)
- FR5: Fallback: Aider fail/unavailable → existing mission dispatch (khong break flow)
- FR6: Max 2 Aider attempts per failure → sau do tao mission cho CC CLI

### Non-functional
- NFR1: Aider execution timeout: 5 phut per fix attempt
- NFR2: Khong chay Aider neu M1 overheating (check m1-cooling-daemon)
- NFR3: Log Aider output vao tom_hum_cto.log

## Architecture

```
┌──────────────────────────────────────────────────────────┐
│           auto-cto-pilot.js (Phase 3: VERIFY)            │
│                                                           │
│  build/test FAIL detected                                 │
│       │                                                   │
│       ▼                                                   │
│  ┌─────────────────────────────┐                         │
│  │   aider-bridge.js (NEW)    │                          │
│  │                             │                          │
│  │  tryAiderFix(projectDir,   │                          │
│  │    errorLog, testCmd)       │                          │
│  │       │                     │                          │
│  │       ▼                     │                          │
│  │  spawn('aider',            │                          │
│  │    '--message', errorMsg,  │                          │
│  │    '--openai-api-base',    │                          │
│  │      'http://localhost:9191│',                         │
│  │    '--auto-commits',       │                          │
│  │    '--yes')                │                          │
│  │       │                     │                          │
│  │       ▼                     │                          │
│  │  result: { success, diff,  │                          │
│  │    commitHash, attempts }   │                          │
│  └─────────────┬───────────────┘                         │
│                │                                          │
│         success?                                          │
│        ╱       ╲                                          │
│     YES         NO                                        │
│      │           │                                        │
│      ▼           ▼                                        │
│  log success   create mission_*.txt                       │
│  + continue    (existing dispatch flow)                   │
└──────────────────────────────────────────────────────────┘
```

### Aider CLI Invocation
```bash
aider \
  --message "Fix: ${ERROR_SUMMARY}" \
  --openai-api-base http://localhost:9191 \
  --model gemini-3-flash-preview \
  --auto-commits \
  --yes \
  --no-browser \
  --file ${FAILED_FILES} \
  2>&1 | tee -a ~/tom_hum_cto.log
```

## Related Code Files

### Modify
| File | Changes |
|------|---------|
| `apps/openclaw-worker/lib/auto-cto-pilot.js` | Phase 3 verify: truoc khi tao mission, goi `tryAiderFix()` |

### Create
| File | Purpose |
|------|---------|
| `apps/openclaw-worker/lib/aider-bridge.js` | Aider CLI wrapper: spawn, parse output, handle timeout |

## Implementation Steps

1. **Install Aider** (prerequisite documentation)
   ```bash
   pipx install aider-chat
   # Hoac trong .claude/skills/.venv:
   .claude/skills/.venv/bin/pip3 install aider-chat
   ```

2. **Create `aider-bridge.js`** (~120 lines)
   ```javascript
   // Core function:
   async function tryAiderFix({ projectDir, errorLog, testCmd, maxAttempts = 2 }) {
     // 1. Check Aider available: which aider
     // 2. Check M1 thermal: isSafeToScan()
     // 3. Parse errorLog → extract affected files
     // 4. Spawn aider with args
     // 5. Wait for completion (timeout 5min)
     // 6. Run testCmd to verify fix
     // 7. Return { success, diff, commitHash, attempts, duration }
   }
   ```
   - Export: `tryAiderFix`, `isAiderAvailable`
   - Use `child_process.spawn()` (khong execSync — non-blocking)
   - Parse Aider output cho: files changed, commit hash
   - Timeout: `setTimeout` + `process.kill()`

3. **Helper: extractAffectedFiles(errorLog)** (~30 lines trong aider-bridge.js)
   - Regex extract file paths tu error output
   - Pattern: `src/...\.py`, `lib/...\.js`, `apps/...\.ts`
   - Limit: max 5 files per Aider invocation

4. **Update auto-cto-pilot.js Phase 3** (~40 lines change)
   - Trong existing verify flow, TRUOC khi `writeMissionFile()`:
   ```javascript
   const { tryAiderFix, isAiderAvailable } = require('./aider-bridge');

   // Trong verifyAndFix function:
   if (buildFailed && isAiderAvailable()) {
     const result = await tryAiderFix({
       projectDir: projectPath,
       errorLog: buildOutput,
       testCmd: 'npm run build',
     });
     if (result.success) {
       log(`[CTO] Aider auto-fixed: ${result.diff}`);
       return; // Skip mission creation
     }
     log(`[CTO] Aider failed after ${result.attempts} attempts, creating mission`);
   }
   // Existing: writeMissionFile(...)
   ```

5. **Aider config file** `apps/openclaw-worker/.aider.conf.yml`
   ```yaml
   openai-api-base: http://localhost:9191
   model: gemini-3-flash-preview
   auto-commits: true
   no-browser: true
   ```

## Todo List
- [ ] Document Aider install prerequisite
- [ ] Create `apps/openclaw-worker/lib/aider-bridge.js`
- [ ] Implement `tryAiderFix()` voi spawn + timeout
- [ ] Implement `extractAffectedFiles()` regex parser
- [ ] Implement `isAiderAvailable()` check
- [ ] Update `auto-cto-pilot.js` Phase 3 verify flow
- [ ] Create `.aider.conf.yml` config
- [ ] Test: Aider fix simple syntax error
- [ ] Test: Aider timeout triggers mission fallback
- [ ] Test: M1 overheating blocks Aider execution

## Success Criteria
- `aider --version` chay thanh cong tren M1
- Aider route qua proxy 9191: LLM call khong direct API
- Build fail → Aider fix → build pass → auto-commit (end-to-end)
- Aider fail → mission_*.txt created (fallback works)
- Timeout 5min → process killed, mission created
- M1 thermal check: overheating → skip Aider, create mission ngay
- Existing auto-cto-pilot behavior UNCHANGED khi Aider unavailable

## Conflict Prevention
- **KHONG cham** `src/core/` (Phase 01+02+03 owns)
- **KHONG cham** `packages/` (Phase 01+03 owns)
- **KHONG cham** `apps/agencyos-web/` (Phase 05 owns)
- **KHONG cham** `apps/openclaw-worker/lib/self-healer.js` (separate module)
- **KHONG cham** `apps/openclaw-worker/lib/learning-engine.js` (separate module)
- Chi modify `auto-cto-pilot.js` Phase 3 block — khong cham Phase 1/2

## Risk Assessment
| Risk | Mitigation |
|------|-----------|
| Aider modify file sai, break code | Aider auto-commits → git revert neu test fail |
| Aider + CC CLI conflict (both modify same file) | Sequential: Aider chi chay trong auto-cto verify (CC CLI idle) |
| Aider khong hieu Antigravity Proxy format | Test: `--openai-api-base` compatible voi Anthropic-style API |
| Aider chay lau, block mission queue | Hard timeout 5min + process.kill() |
| pipx/pip conflict voi existing Python env | Dung pipx isolated install (khong anh huong mekong-cli venv) |

## Security Considerations
- Aider khong co access to secrets (chay trong project dir only)
- Git commits by Aider: prefix `aider:` de distinguish tu human commits
- Aider output log: khong chua API keys (proxy handle auth)
- Rate limit: max 2 Aider attempts per failure → prevent token burn
