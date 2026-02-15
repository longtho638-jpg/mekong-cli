# Autonomous Task Engine - Technical Deep Dive & Binh Phap Mapping
**Date:** 2026-02-15
**System:** OpenClaw Worker (Tom Hum) v2026.2.14
**Analyst:** Antigravity (Via Claude Code)
**Status:** Verified via Static Code Analysis

## 1. Executive Summary

The OpenClaw Worker ("Tom Hum") functions as a **Cybernetic Organism** designed according to *The Art of War (Binh Phap)*. Code analysis confirms that these are not just documentation metaphors but are implemented as hard-coded logic gates, state machines, and autonomous daemons.

The system exhibits:
- **Homeostasis:** M1 Cooling Daemon (`lib/m1-cooling-daemon.js`)
- **Autonomy:** Auto-CTO Pilot (`lib/auto-cto-pilot.js`)
- **Self-Preservation:** Safety Guard & Post-Mission Gates (`lib/safety-guard.js`, `lib/post-mission-gate.js`)
- **Resilience:** Nuclear Respawn & WAL (`lib/brain-tmux.js`)
- **Discipline:** Martial Law Enforcer (`lib/quan-luat-enforcer.js`)

## 2. Strategic Implementation Mapping

### 2.1. 第九篇 行軍 (On the March) — Resource & Terrain Management
**Principle:** "Seek high ground (resources) and reliable routes."
**Code Verification:** `lib/m1-cooling-daemon.js`
- **Mechanism:** Active polling of `vm.loadavg` (sysctl) and `vm_stat` (RAM).
- **Hard Gates:**
  - `OVERHEAT_LOAD = 10`: Triggers active intervention (sleeping, killing processes).
  - `OVERHEAT_RAM_MB = 20`: Triggers dispatch pause.
- **Active Defense:** `killResourceHogs()` actively hunts and kills `pyrefly`, `pyright`, `eslint_d`, and `prettierd` when thresholds are exceeded.

### 2.2. 第四篇 軍形 (Disposition) — Invincibility & Safety
**Principle:** "First make yourself invincible, then wait for the enemy to reveal vulnerabilities."
**Code Verification:** `lib/post-mission-gate.js` & `lib/safety-guard.js`
- **Pre-Flight (Invincibility):** `lib/safety-guard.js` calls `gemini-1.5-flash` to check prompt against a "Constitution" (No mass delete, no exfiltration).
  - **Risk:** Implements a **Fail-Open** policy (`return { safe: true }` on error) to prioritize availability.
- **Post-Mission (Blast Radius):** `lib/post-mission-gate.js` enforces strict limits:
  - `MAX_FILES_CHANGED = 15`: Prevents massive accidental refactors.
  - `MAX_DELETIONS = 500`: Prevents code deletion disasters.
  - `FORBIDDEN_FILES`: Arrays of protected files (`package.json`, `.env`, `next.config.js`) that trigger immediate rejection if modified.

### 2.3. 第五篇 兵勢 (Energy) — Force Multipliers & Momentum
**Principle:** "The potential of troops is like a crossbow fully drawn."
**Code Verification:** `lib/mission-complexity-classifier.js`
- **Phong Lâm Hỏa Sơn (Elements of War):**
  - **🌪️ GIÓ (Wind/Simple):** Detects simple keywords -> adds `--fast --no-test`.
  - **🌲 RỪNG (Forest/Medium):** Default -> adds `--auto`.
  - **🔥 LỬA (Fire/Complex):** Detects complex keywords -> adds `Agent Team` instructions + switches to Opus model (`config.OPUS_MODEL`).

### 2.4. 第十三篇 用間 (Spies/Intelligence) — Information & Feedback
**Principle:** "Foreknowledge cannot be gotten from ghosts and spirits."
**Code Verification:** `lib/brain-tmux.js`
- **State Machine:** Deterministic regex-based state detection.
  - **BUSY:** `BUSY_PATTERNS` (e.g., "Photosynthesizing", "Crunching", "Vibing").
  - **STUCK:** `STUCK_PATTERNS` (e.g., "Interrupted", "Rewind", "Model not found").
  - **DONE:** `COMPLETION_PATTERNS` (e.g., "Cooked for Xm Ys").
- **Nuclear Respawn:** If `stuckRetryCount >= 5` or `NUCLEAR_PATTERNS` match:
  - Sends `C-c C-c`, then `/exit`.
  - Clears tmux history.
  - Respawns the CLI process entirely.

### 2.5. 虛實 (Weaknesses & Strengths) — Constant Improvement
**Principle:** "Strike at the void (weakness)."
**Code Verification:** `lib/auto-cto-pilot.js`
- **Void Detection:** Monitors queue emptiness.
- **Attack Weakness:** Generates maintenance tasks when idle (`console_cleanup`, `type_safety`, `i18n_sync`).
- **Infinite Loop:** Uses a `completedTasks` state file to cycle through projects and tasks indefinitely, ensuring the system never sleeps.

### 2.6. 第一篇 始計 (Initial Calculations) — Martial Law & Strategic Assessment
**Principle:** "Assess the 5 factors (Dao, Thien, Dia, Tuong, Phap) before battle."
**Code Verification:** `lib/quan-luat-enforcer.js`
- **Ngũ Sự Assessment:** `assessNguSu(mission)` checks:
  - **Dao:** Constitution compliance.
  - **Thien:** Thermal/Timing (via `sysctl`).
  - **Dia:** Environment/Queue readiness.
  - **Phap:** Queue discipline (`maxQueueSize: 3`).
- **Chain of Command:** Enforces hierarchy `Antigravity > Brain > Daemons`.
- **Territory Guard:** Prevents daemons from exceeding their scope (e.g., `hunter` vs `builder`).

### 2.7. 作戰 (Waging War) — Resource Locking & Coordination
**Principle:** "Do not exhaust the treasury."
**Code Verification:** `lib/team-mutex.js`, `lib/api-rate-gate.js`, & `lib/mission-dispatcher.js`
- **Team Mutex:** `/tmp/tom_hum_team_active.lock` prevents Swarm (lightweight) and Agent Teams (heavy) from running simultaneously.
- **API Rate Gate:** `/tmp/tom_hum_api.lock` enforces `MIN_GAP_MS` (5s) between heavy calls.
- **Monorepo Discipline:** `lib/mission-dispatcher.js` injects `MONOREPO_RULE` into every prompt: "CẤM chạy npm install bên trong folder con. PHẢI chạy từ ROOT dùng flag --workspace".
- **Language Enforcement:** Injects `VI_PREFIX` ("Trả lời bằng TIẾNG VIỆT") to ensure consistent logging and reporting.

## 3. Resilience Architecture (Antifragility)

The system uses a **"Let it Crash"** philosophy managed by `brain-tmux.js`, `task-watcher.js`, and `self-healer.js`.

### 3.1. The Self-Healer (`lib/self-healer.js`)
A dedicated subsystem implements a 4-layer defense:
1.  **Health Monitor:**
    - Checks `tmux` session liveness.
    - Detects "Shell Prompt" (indicating CLI crash).
    - Detects "Stuck TUI" (requires Escape/Ctrl-C).
    - Detects "Stale Output" (>3 min no change).
2.  **Proxy Gate:**
    - Pings `/v1/models` before *every* dispatch.
    - If down, restarts `anthropic-adapter.js` automatically.
3.  **Model Fallback Chain:**
    - If the model is rejected (HTTP 400/404), it rotates through: `Sonnet` → `Gemini Flash` → `Qwen`.
4.  **Escalation:**
    - If recovery fails 3 times (`MAX_RECOVERY_ATTEMPTS`), it sends a Telegram alert ("TÔM HÙM ALERT").

### 3.2. Infinite Game (Auto-CTO)
Verified in `lib/auto-cto-pilot.js`:
- **Cycle Tracking:** Explicitly increments `state.cycles` when all projects are visited.
- **Reset Logic:** When a project completes all tasks, `state.completedTasks[project]` is reset to `[]`, forcing the agent to re-audit the codebase indefinitely.
- **Smart Filtering:** Checks for `tsconfig.json` before assigning `type_safety` tasks, and `locales/` before `i18n_sync`.

### 3.3. Core Stability
1.  **Daemon Logic:** `uncaughtException` handlers log errors but **do not exit**.
2.  **External Brain:** The LLM logic runs in a separate `tmux` process. If the CLI hangs/crashes, the Daemon detects the "shell prompt" or "dead process" and respawns it.
3.  **Concurrency Locking:** `activePaneLocks` set prevents race conditions where multiple missions might try to write to the same tmux pane.

## 4. Risks & Weaknesses Identified

1.  **Regex Fragility (`brain-tmux.js`):**
    - The entire state machine relies on scraping English text from the CLI output ("Photosynthesizing", "Cooked for").
    - **Risk:** If Anthropic changes the CLI output text (e.g., to "Processing..." or "Finished"), the robot will go blind (stuck in `unknown` or `busy` state).
    - **Mitigation:** The list of patterns is extensive, but requires manual updates.

2.  **Fail-Open Safety (`safety-guard.js`):**
    - **Behavior:** If the safety check proxy fails (timeout/network), the system allows the mission to proceed.
    - **Risk:** A malicious actor could DoS the proxy to bypass safety checks.
    - **Trade-off:** Chosen to prevent work stoppage during network blips (Availability > Consistency).

3.  **Hard-Coded Thresholds:**
    - `MAX_FILES_CHANGED = 15` is hard-coded. Large legitimate refactors will be blocked and require manual intervention or splitting.

## 5. Conclusion

The OpenClaw Worker is a mature, production-grade implementation of an Autonomous Agent Runner. It successfully translates abstract strategic principles (Binh Phap) into concrete, resilient code. The addition of **Martial Law (Quân Luật)** and **Team Mutex** ensures that the system scales without self-destructing under load.

**Recommendation:**
- Maintain the **Strict Separation of Concerns** (Daemon vs. Brain).
- Consider moving regex patterns to a config file for easier updates.
- Expand **Auto-CTO** capabilities to include "Refactoring" missions for high-complexity code paths.
