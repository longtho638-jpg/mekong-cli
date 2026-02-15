# SELF_HEALING_EVOLUTION.md — Tự Chữa Lành & Tiến Hóa

> **Version:** 2026.2
> **System:** Mekong-CLI / OpenClaw Worker
> **Philosophy:** "Systems that cannot heal themselves are liabilities."

## 1. Architectural Overview

The Mekong-CLI ecosystem implements a **Biological Self-Healing Architecture** consisting of three biological layers:
1.  **Nervous System (Auto-Detection):** Real-time sensing of process, session, and logic health.
2.  **Immune System (Auto-Recovery):** Graduated response from soft correction to nuclear restart.
3.  **Muscular System (Auto-Scaling):** Dynamic resource contraction/expansion based on thermal limits.

---

## 2. Layer 1: Auto-Detection (The Nervous System)

Detection is multi-layered to distinguish between transient glitches and systemic failures.

### 2.1 Process Health (Daemon Level)
*   **Watcher:** `apps/openclaw-worker/task-watcher.js`
*   **Mechanism:**
    *   **Exception Traps:** Captures `uncaughtException` and `unhandledRejection` to log errors to WAL without crashing the supervisor.
    *   **Zombie Detection:** Scans `.wal.json` and `.gate-results.json` on boot. Records older than 24h are purged as "zombie states" from previous crashes.

### 2.2 Session Health (Tmux Level)
*   **Watcher:** `apps/openclaw-worker/lib/brain-tmux.js`
*   **Mechanism:**
    *   **Liveness Probe:** Periodically runs `tmux has-session` and `pgrep -f "claude"`.
    *   **Shell Drop Detection:** Regex scans the last pane line. If it sees raw shell prompts (`bash-3.2$`, `zsh%`) instead of the Claude `❯` prompt, it declares "Brain Death".
    *   **Stuck State Analysis:** Identifies "TUI Purgatory" (menus asking for "Clarification" or "Approval") via `detectState()`.

### 2.3 Mission Health (Logic Level)
*   **Watcher:** `apps/openclaw-worker/lib/mission-recovery.js`
*   **Mechanism:**
    *   **Output Stagnation:** `lib/self-healer.js` hashes stdout. No hash change for 3 minutes triggers `stale_output` alert.
    *   **Semantic Error Parsing:** Scans stderr for critical keywords:
        *   **Capacity:** `overloaded`, `429`, `503`.
        *   **Context:** `token limit`, `context overflow`.
        *   **Auth:** `invalid_api_key`, `permission_denied`.

---

## 3. Layer 2: Auto-Recovery (The Immune System)

Recovery strategies follow a **Graduated Escalation Protocol** to minimize downtime.

### 3.1 Level 1: Soft Correction (In-Place)
*   **Action:** Disruption-free interventions.
*   **Triggers:** Stale output, stuck TUI menus.
*   **Mechanisms:**
    *   **Kickstart Protocol:** Sends `\n` (Enter) to wake up hung CLI processes.
    *   **TUI Breakout:** Sends `Escape` + `Ctrl+C` sequences to exit stuck menus.
    *   **Context Hygiene:** Auto-runs `/clear` (every 5 missions) or `/compact` (every 10 missions).

### 3.2 Level 2: Tactical Restart (Component Reset)
*   **Action:** Restart specific failing components without killing the supervisor.
*   **Triggers:** Persistent connection errors, model refusal.
*   **Mechanisms:**
    *   **Proxy Recycle:** `restartProxy()` kills `anthropic-adapter.js` and spawns a new instance on port 11436.
    *   **Model Failover:** If `gemini-flash` fails, `lib/mission-recovery.js` rotates configuration to next provider in `MODEL_FALLBACK_CHAIN`.

### 3.3 Level 3: Nuclear Respawn (Full Reset)
*   **Action:** Destroy and recreate the brain environment.
*   **Triggers:** Shell drop, session death, repeated failures.
*   **Mechanisms:**
    *   **Brain Transplant:** `respawnBrain()` executes `tmux kill-session` -> `spawnBrain()`.
    *   **WAL Replay:** `task-watcher.js` reads `.wal.json` and re-queues the crashed mission to ensure zero data loss.

---

## 4. Layer 3: Auto-Scaling (The Muscular System)

Resources are managed dynamically to optimize throughput on constrained hardware (MacBook M1).

### 4.1 Worker Pooling (Mitochondria)
*   **Component:** `apps/openclaw-worker/lib/brain-tmux.js`
*   **Design:**
    *   **Static Pooling:** Maintains `AGENT_TEAM_SIZE_DEFAULT` (default: 4) active panes inside tmux.
    *   **Round-Robin Dispatch:** `rotateWorker()` cycles through idle panes. While Pane 1 is thinking (waiting for API), Pane 2 processes user input.
    *   **Self-Repairing Pool:** If a pane dies, `spawnBrain()` detects the count mismatch and hot-swaps a new worker pane.

### 4.2 Thermal Throttling (Homeostasis)
*   **Component:** `apps/openclaw-worker/lib/m1-cooling-daemon.js`
*   **Design:**
    *   **Negative Scaling:** Scales *down* activity when hardware is stressed.
    *   **Gatekeeper:** `waitForSafeTemperature()` blocks new missions if:
        *   Load Average > 7.0
        *   Free RAM < 200MB
    *   **Active Cooling:** Aggressively `kill -9` known resource hogs (`pyrefly`, `eslint_d`, `node` zombies) during heat spikes.

---

## 5. Implementation Reference

| Capability | Detection File | Recovery File |
|------------|----------------|---------------|
| **Zombie Process** | `task-watcher.js` | `task-watcher.js` (WAL Replay) |
| **Brain Death** | `lib/brain-tmux.js` | `lib/brain-tmux.js` (Respawn) |
| **Stale Output** | `lib/self-healer.js` | `lib/self-healer.js` (Kickstart) |
| **Context Overflow**| `lib/mission-recovery.js`| `lib/mission-recovery.js` (Truncate) |
| **Overheating** | `lib/m1-cooling-daemon.js`| `lib/m1-cooling-daemon.js` (Kill/Wait) |

## 6. Future Evolution

*   **Cloud Offloading:** When local M1 thermal throttling engages, overflow tasks should route to Cloudflare Workers.
*   **Predictive Healing:** Use telemetry to predict context overflow *before* it happens based on prompt size history.
*   **Swarm Immunity:** If one worker node identifies a "poison pill" prompt that crashes the model, broadcast the prompt hash to all nodes to block it.
