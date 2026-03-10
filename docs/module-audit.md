# Module Audit — apps/openclaw-worker/lib/

> Audit date: 2026-03-09 | Total: 110 files (107 lib + 3 v2)
> Method: `node --check` + exports analysis + logic depth review

## Summary

| Grade | Count | Criteria |
|-------|-------|----------|
| **A** | 95 | Syntax OK + real logic + proper exports |
| **B** | 10 | Thin wrapper, re-export, config-only, or minimal logic |
| **C** | 0 | Syntax error (none found) |
| **D** | 5 | Dead code, standalone CLI, backup, or no exports |

**Syntax check: 107/107 PASS** (0 errors). `.bak` file excluded from `node --check`.

---

## Grade A — Real Logic (95 modules)

Modules with substantial business logic, proper `module.exports`, and active callers.

| # | Module | Lines | Funcs | Squad |
|---|--------|-------|-------|-------|
| 1 | `agi-score-calculator.js` | 59 | 6 | RECON |
| 2 | `api-rate-gate.js` | 90 | 5 | RESOURCE |
| 3 | `auto-cto-pilot.js` | 804 | 24 | RECON |
| 4 | `auto-task-chain.js` | 193 | 3 | MISSION |
| 5 | `binh-phap-strategist.js` | 153 | 8 | STRATEGIC |
| 6 | `brain-boot-sequence.js` | 169 | 6 | BRAIN |
| 7 | `brain-dispatch-helpers.js` | 213 | 2 | BRAIN |
| 8 | `brain-headless-per-mission.js` | 171 | 12 | MISSION |
| 9 | `brain-health-server.js` | 117 | 8 | BRAIN |
| 10 | `brain-heartbeat.js` | 58 | 5 | BRAIN |
| 11 | `brain-mission-runner.js` | 518 | 9 | MISSION |
| 12 | `brain-output-hash-stagnation-watchdog.js` | 184 | 8 | BRAIN |
| 13 | `brain-spawn-manager.js` | 313 | 18 | BRAIN |
| 14 | `brain-state-machine.js` | 447 | 17 | BRAIN |
| 15 | `brain-supervisor.js` | 337 | 18 | BRAIN |
| 16 | `brain-system-monitor.js` | 63 | 3 | BRAIN |
| 17 | `brain-terminal-app.js` | 274 | 9 | BRAIN |
| 18 | `brain-tmux-controller.js` | 160 | 10 | BRAIN |
| 19 | `brain-vscode-terminal.js` | 277 | 15 | BRAIN |
| 20 | `circuit-breaker.js` | 55 | 5 | DEFENSE |
| 21 | `claudekit-updater.js` | 198 | 16 | FACTORY |
| 22 | `clawwork-integration.js` | 133 | 6 | REVENUE |
| 23 | `cto-codebase-scanner.js` | 49 | 1 | RECON |
| 24 | `cto-dashboard-logger.js` | 57 | 1 | COMMS |
| 25 | `cto-escalation.js` | 125 | 5 | COMMS |
| 26 | `cto-pane-handler.js` | 260 | 4 | CTO_INFRA |
| 27 | `cto-pane-state-detector.js` | 69 | 1 | CTO_INFRA |
| 28 | `cto-pre-dispatch-scan.js` | 95 | 1 | RECON |
| 29 | `cto-progress-tracker.js` | 96 | 6 | COMMS |
| 30 | `cto-ram-policy.js` | 91 | 3 | RESOURCE |
| 31 | `cto-task-dispatch.js` | 297 | 8 | MISSION |
| 32 | `cto-tmux-helpers.js` | 118 | 5 | CTO_INFRA |
| 33 | `cto-visual-dashboard.js` | 284 | 14 | COMMS |
| 34 | `cto-worker-coordinator.js` | 100 | 5 | CTO_INFRA |
| 35 | `doanh-trai-registry.js` | 237 | 3 | STRATEGIC |
| 36 | `dynamic-syllabus.js` | 134 | 5 | EVOLUTION |
| 37 | `evolution-engine.js` | 439 | 16 | EVOLUTION |
| 38 | `factory-pipeline.js` | 573 | 19 | FACTORY |
| 39 | `gemini-agentic.js` | 314 | 17 | EXTERNAL_AI |
| 40 | `google-ultra.js` | 345 | 17 | EXTERNAL_AI |
| 41 | `handover-generator.js` | 225 | 6 | REVENUE |
| 42 | `hunter-scanner.js` | 211 | 11 | RECON |
| 43 | `jules-agent.js` | 239 | 14 | EXTERNAL_AI |
| 44 | `knowledge-synthesizer.js` | 148 | 6 | EVOLUTION |
| 45 | `learning-engine.js` | 310 | 17 | EVOLUTION |
| 46 | `lightmem-forgetting.js` | 309 | 9 | MEMORY |
| 47 | `lightmem-memory.js` | 511 | 7 | MEMORY |
| 48 | `lightmem-retrieval.js` | 310 | 11 | MEMORY |
| 49 | `llm-interpreter.js` | 331 | 15 | EXTERNAL_AI |
| 50 | `llm-perception.js` | 489 | 29 | EXTERNAL_AI |
| 51 | `m1-cooling-daemon.js` | 343 | 19 | RESOURCE |
| 52 | `mission-complexity-classifier.js` | 397 | 12 | STRATEGIC |
| 53 | `mission-dispatcher.js` | 556 | 10 | MISSION |
| 54 | `mission-generator.js` | 195 | 13 | MISSION |
| 55 | `mission-journal.js` | 161 | 5 | EVOLUTION |
| 56 | `mission-recovery.js` | 193 | 7 | MISSION |
| 57 | `moltbook-integration.js` | 130 | 6 | REVENUE |
| 58 | `monitor-24-7.js` | 272 | 12 | CTO_INFRA |
| 59 | `nvidia-client.js` | 156 | 3 | EXTERNAL_AI |
| 60 | `openclaw-rl-client.js` | 184 | 7 | EVOLUTION |
| 61 | `perception-engine.js` | 192 | 9 | RECON |
| 62 | `post-mission-gate.js` | 252 | 12 | DEFENSE |
| 63 | `post-mortem-reflector.js` | 357 | 7 | EVOLUTION |
| 64 | `production-board.js` | 245 | 19 | FACTORY |
| 65 | `project-bootstrapper.js` | 245 | 5 | FACTORY |
| 66 | `project-commander.js` | 383 | 17 | STRATEGIC |
| 67 | `project-profiler.js` | 198 | 7 | RECON |
| 68 | `project-scanner.js` | 154 | 5 | RECON |
| 69 | `project-score-calculator.js` | 190 | 12 | RECON |
| 70 | `quan-luat-enforcer.js` | 335 | 7 | DEFENSE |
| 71 | `question-handler.js` | 176 | 7 | COMMS |
| 72 | `quota-tracker.js` | 211 | 9 | RESOURCE |
| 73 | `raas-license-validator.js` | 448 | 10 | REVENUE |
| 74 | `resource-governor.js` | 129 | 5 | RESOURCE |
| 75 | `revenue-health-scanner.js` | 193 | 7 | REVENUE |
| 76 | `safety-guard.js` | 180 | 4 | DEFENSE |
| 77 | `self-analyzer.js` | 253 | 15 | EVOLUTION |
| 78 | `self-healer.js` | 662 | 28 | DEFENSE |
| 79 | `signal-bus.js` | 143 | 2 | COMMS |
| 80 | `skill-factory.js` | 107 | 3 | EVOLUTION |
| 81 | `strategic-brain.js` | 325 | 8 | STRATEGIC |
| 82 | `strategy-optimizer.js` | 196 | 4 | STRATEGIC |
| 83 | `swarm-intelligence.js` | 154 | 4 | STRATEGIC |
| 84 | `system-status-registry.js` | 77 | 5 | CTO_INFRA |
| 85 | `tactical-responder.js` | 73 | 2 | MISSION |
| 86 | `task-dedup-registry.js` | 131 | 10 | CTO_INFRA |
| 87 | `task-deduplicator.js` | 110 | 5 | CTO_INFRA |
| 88 | `task-queue.js` | 358 | 13 | CTO_INFRA |
| 89 | `team-mutex.js` | 87 | 4 | RESOURCE |
| 90 | `telegram-client.js` | 49 | 1 | COMMS |
| 91 | `throughput-maximizer.js` | 168 | 7 | RESOURCE |
| 92 | `token-tracker.js` | 138 | 5 | RESOURCE |
| 93 | `trading-cadence-scheduler.js` | 250 | 7 | TRADING |
| 94 | `trading-company-decision-engine.js` | 253 | 6 | TRADING |
| 95 | `trading-post-mission-report-handler.js` | 186 | 5 | TRADING |
| 96 | `vector-service.js` | 183 | 11 | EXTERNAL_AI |
| 97 | `web-researcher.js` | 230 | 18 | EXTERNAL_AI |
| 98 | `work-order-decomposer.js` | 160 | 7 | STRATEGIC |
| 99 | `v2/cli-worker.js` | 124 | 6 | V2 |
| 100 | `v2/mission-executor.js` | 100 | 0 | V2 |

**A subtotal: 100** (adjusted after detailed review — includes 5 small but real-logic modules)

---

## Grade B — Thin Wrapper / Re-export / Config-Only (5 modules)

| # | Module | Lines | Reason |
|---|--------|-------|--------|
| 1 | `brain-process-manager.js` | 36 | Thin re-export facade (all logic in sub-modules) |
| 2 | `brain-logger.js` | 19 | Single `log()` utility function |
| 3 | `brain-respawn-controller.js` | 37 | DISABLED (2026-02-28) — only logs warning + returns false |
| 4 | `hands-registry.js` | 26 | Static config object (HANDS map) |
| 5 | `client-intake-schema.js` | 130 | Schema definition only (no runtime logic) |

---

## Grade C — Syntax Error (0 modules)

**None.** All 107 `.js` files pass `node --check`.

---

## Grade D — Dead Code / Standalone / No Exports (5 modules)

| # | Module | Lines | Reason |
|---|--------|-------|--------|
| 1 | `brain-process-manager.js.bak` | 1245 | Backup file — superseded by modular split |
| 2 | `live-mission-viewer.js` | 56 | Standalone CLI tool (no `module.exports`) |
| 3 | `binh-phap-registry.js` | 113 | Static registry data, no runtime functions |
| 4 | `v2/worker-pool.js` | 56 | V2 WIP — no functions exported, stub pool |
| 5 | `mission-generator.js` | 195 | Duplicates mission-dispatcher + auto-cto-pilot logic |

---

## Statistics

| Metric | Value |
|--------|-------|
| Total files | 110 |
| Syntax OK | 107/107 (100%) |
| Grade A (summonable) | 95 |
| Grade B (thin/config) | 5 |
| Grade C (broken) | 0 |
| Grade D (dead/standalone) | 5 |
| Excluded (.bak) | 1 |
| Total lines of code | ~22,800 |
| Largest module | `auto-cto-pilot.js` (804 lines) |
| Smallest A-grade | `telegram-client.js` (49 lines) |
