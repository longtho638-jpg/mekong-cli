# System Analysis: Current State & AGI Gaps
> **Date:** 2026-02-15
> **Subject:** Analysis of Antigravity Proxy, OpenClaw Worker, and Task Orchestration for AGI Evolution
> **Context:** Preparing for Self-Correction, Ethics, and Meta-Learning upgrades.

## 1. System Overview

The current **Mekong-CLI** ecosystem operates as a robust, autonomous task execution engine ("Tom Hum") driven by Binh Phap principles.

### Core Components

| Component | Current State (v2026.2.13) | Function |
|-----------|----------------------------|----------|
| **Antigravity Proxy** | v4 (Port 11436) | Load balances Anthropic/Gemini/Ollama. Handles quota exhaustion via `proxy-recovery.sh`. |
| **OpenClaw Worker** | Node.js Daemon | Thin orchestrator. Watches `tasks/`, dispatches to CC CLI. Features "WARP SPEED" (3 concurrent missions). |
| **Brain** | Dual-Mode | **Direct** (External process) or **Tmux** (Interactive session). |
| **Self-Healing** | Reactive | `self-healer.js` monitors Proxy/CLI health. `mission-recovery.js` handles 400s/Context Overflow. |
| **Auto-CTO** | Static Loop | Rotates through fixed `BINH_PHAP_TASKS` (security, a11y, tech_debt) when idle. |

## 2. Component Analysis

### A. Antigravity Proxy (`apps/raas-gateway`)
*   **Strengths:** proven resilience against 429 errors; multi-provider failover (Sonnet -> Gemini -> Qwen).
*   **Weakness:** "Dumb" failover. It doesn't understand *why* a model failed, just that it did. No semantic routing based on task type (handled partly in `mission-dispatcher.js` but hardcoded).

### B. OpenClaw Worker (`apps/openclaw-worker`)
*   **Strengths:** Highly resilient daemon (`task-watcher.js` never dies). Atomic file IPC prevents race conditions. M1 cooling protection.
*   **Weakness:**
    *   **Blind Execution:** Dispatches whatever is in `tasks/`. No semantic analysis of the *intent* or *safety* of the mission before running.
    *   **No Memory:** Does not remember *how* a previous similar mission was solved. Every "Fix bug X" is a fresh start.

### C. Auto-CTO (`lib/auto-cto-pilot.js`)
*   **Strengths:** Keeps the system busy. Enforces Binh Phap quality standards (Type Safety, Console Cleanup).
*   **Weakness:** **Static Heuristics.** The list of tasks is hardcoded in `config.js`. It doesn't evolve. It doesn't learn that "Project A always fails type safety" to prioritize it differently.

## 3. Gaps for AGI Evolution

To move from **Automated** to **Autonomous (AGI)**, we must address three critical gaps:

### GAP 1: Self-Correction (Reactive → Proactive)
*   **Current:** `self-healer.js` restarts processes when they crash.
*   **Missing:**
    *   **Logic Self-Repair:** If a test fails 3 times, the system should stop attempting the same fix and try a different strategy (Meta-Reasoning).
    *   **Pattern Recognition:** "Every time I touch `auth.ts`, the build breaks." -> Add a pre-check constraint.

### GAP 2: Ethics & Safety (Implicit → Explicit)
*   **Current:** Relies on the underlying LLM's safety training and simple prompt wrappers (`VI_PREFIX`).
*   **Missing:**
    *   **Constitutional Gate:** A layer *before* dispatch that checks: "Does this mission violate Binh Phap? Is it destructive? Is it asking for something unethical?"
    *   **Impact Analysis:** "Will deleting this file break the build?" (Pre-computation of consequences).

### GAP 3: Meta-Learning (Static → Adaptive)
*   **Current:** `insights/accumulated.md` exists but is passive. `auto-cto` is hardcoded.
*   **Missing:**
    *   **Dynamic Syllabus:** The Auto-CTO should *generate* its own task types based on project weaknesses.
    *   **Skill Crystallization:** Successful missions should auto-generate new `.claude/skills/`.
    *   **Global Knowledge Graph:** Cross-project learning (what worked in `84tea` should apply to `apex-os`).

## 4. Recommendations for Evolution Plan

1.  **Upgrade `mission-dispatcher.js`**: Add an "Ethics/Safety Gate" (LLM-based classification) before queuing.
2.  **Evolve `auto-cto-pilot.js`**: Connect it to a vector DB (or simple JSON memory) of past failures to prioritize tasks dynamically.
3.  **Implement `KnowledgeSynthesizer`**: A post-mission agent that reads `tasks/processed/` and updates `knowledge/` or generates new Skills.

## 5. Unresolved Questions
*   How to implement the "Ethics Gate" without adding significant latency to the "WARP SPEED" 200ms poll loop?
*   Should the Knowledge Graph be local (JSON/SQLite) or remote (Supabase/Vector)? (Likely local first for speed/privacy).
