# AGI Evolution Implementation Plan
> **Date:** 2026-02-15
> **Goal:** Evolve Mekong-CLI from an automated task runner to an autonomous, self-correcting, and ethical AGI system.
> **Status:** Planning

## Overview
This plan outlines the evolution of the "Tom Hum" OpenClaw Worker into a true AGI agent capable of self-correction, ethical decision-making, and continuous meta-learning.

## Phases

### [Phase 1: Constitutional Guardrails (Ethics & Safety)](./phase-01-constitutional-guardrails.md)
**Goal:** Implement a pre-dispatch safety layer to prevent harmful or unethical actions.
- **Key Components:** `mission-dispatcher.js`, `lib/safety-guard.js`
- **Mechanism:** LLM-based classification of mission intent against Binh Phap Constitution.

### [Phase 2: Self-Correction (Proactive Logic Repair)](./phase-02-self-correction.md)
**Goal:** Enable the system to analyze failures and try alternative strategies automatically.
- **Key Components:** `mission-recovery.js`, `lib/strategy-optimizer.js`
- **Mechanism:** Feedback loop analysis (stderr/logs) -> Strategy modification -> Retry.

### [Phase 3: Meta-Learning (Dynamic Skill Synthesis)](./phase-03-meta-learning.md)
**Goal:** Extract reusable skills and knowledge from successful missions.
- **Key Components:** `knowledge-synthesizer.js`, `lib/skill-factory.js`
- **Mechanism:** Post-mission analysis -> Pattern extraction -> Skill generation (.claude/skills).

### [Phase 4: Auto-CTO Evolution (Dynamic Syllabus)](./phase-04-auto-cto-evolution.md)
**Goal:** Transform the static Auto-CTO into a dynamic, learning planner.
- **Key Components:** `auto-cto-pilot.js`, `lib/project-profiler.js`
- **Mechanism:** Project weakness analysis -> Dynamic task generation based on Knowledge Graph.

## Success Criteria
1.  **Safety:** 0 destructive actions executed without explicit user confirmation.
2.  **Resilience:** System automatically recovers from logical errors (not just crashes) in >50% of cases.
3.  **Learning:** System generates at least 1 new reusable skill per week of operation.
4.  **Autonomy:** Auto-CTO generates relevant, non-hardcoded tasks for specific project needs.

## Context & References
- [System Analysis](./research/researcher-01-systems-analysis.md)
- `apps/openclaw-worker/CLAUDE.md`
- `apps/openclaw-worker/config.js`
