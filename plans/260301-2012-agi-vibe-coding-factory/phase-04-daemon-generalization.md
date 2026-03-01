---
phase: 4
title: "Daemon Generalization (OpenClaw → mekong-daemon)"
priority: P2
status: pending
effort: 8h
depends_on: [1, 3]
---

# Phase 4: Daemon Generalization

## Overview
Extract reusable autonomous daemon framework from OpenClaw (apps/openclaw-worker). Remove Antigravity/tmux/Binh Phap hardcoding. Result: a Python daemon that watches a task directory, classifies complexity, dispatches to LLM executor, and learns from outcomes.

## Key Insights (from research)
- OpenClaw is Node.js (14 sub-modules, ~56KB) — rewrite core in Python for consistency
- Reusable patterns: task queue + DLQ, complexity classifier, post-mission gate, learning journal
- Personal infra to remove: tmux pane management, Antigravity proxy routing, Binh Phap task templates, project-specific routing
- File-based IPC is simple and dependency-free — keep this pattern
- Mission lifecycle: file detect → priority sort → classify → route → execute → gate → journal → archive

## Requirements

### Functional
- F1: `TaskWatcher` — watch directory for mission files (fs polling, configurable interval)
- F2: `ComplexityClassifier` — keyword-based routing (configurable via YAML)
- F3: `MissionExecutor` — abstract executor using `LLMProvider` from Phase 3
- F4: `PostGate` — verify mission success (build/test commands, configurable)
- F5: `LearningJournal` — record mission outcomes for analysis
- F6: `DeadLetterQueue` — failed missions after N retries → DLQ directory
- F7: YAML config for projects, keywords, task templates, timeouts

### Non-Functional
- NF1: Pure Python, no Node.js dependency
- NF2: Single-process daemon (no tmux/expect)
- NF3: Graceful shutdown on SIGTERM/SIGINT
- NF4: System resource monitoring (load/RAM) — optional, enabled via config

## Architecture

```
src/daemon/                    # NEW Python package
├── __init__.py
├── watcher.py                 # TaskWatcher — polls task directory
├── classifier.py              # ComplexityClassifier — keyword routing
├── executor.py                # MissionExecutor — runs missions via LLM/shell
├── gate.py                    # PostGate — post-mission verification
├── journal.py                 # LearningJournal — outcome telemetry
├── dlq.py                     # DeadLetterQueue — failed mission storage
├── scheduler.py               # DaemonScheduler — main loop orchestration
└── resource_monitor.py        # ResourceMonitor — CPU/RAM guard (optional)
```

```yaml
# configs/daemon.yaml
daemon:
  watch_dir: ./tasks
  poll_interval_secs: 5
  max_retries: 3
  max_workers: 2

projects:
  - name: myproject
    path: ./src
    verify_commands: ["python3 -m pytest", "python3 -m mypy src/"]

complexity:
  simple: { keywords: [add, update, fix], timeout: 900 }
  complex: { keywords: [refactor, redesign, architecture], timeout: 3600 }

resource_limits:
  max_load: 8.0
  min_free_ram_mb: 200
```

## Related Code Files

### Reference (Node.js → Python port)
- `apps/openclaw-worker/lib/task-queue.js` → `src/daemon/watcher.py` + `dlq.py`
- `apps/openclaw-worker/lib/mission-complexity-classifier.js` → `src/daemon/classifier.py`
- `apps/openclaw-worker/lib/brain-process-manager.js` → `src/daemon/executor.py`
- `apps/openclaw-worker/lib/auto-cto-pilot.js` → `src/daemon/scheduler.py`
- `apps/openclaw-worker/lib/m1-cooling-daemon.js` → `src/daemon/resource_monitor.py`

### Create
- `src/daemon/__init__.py`
- `src/daemon/watcher.py` (~80 lines)
- `src/daemon/classifier.py` (~50 lines)
- `src/daemon/executor.py` (~60 lines)
- `src/daemon/gate.py` (~40 lines)
- `src/daemon/journal.py` (~50 lines)
- `src/daemon/dlq.py` (~40 lines)
- `src/daemon/scheduler.py` (~80 lines)
- `src/daemon/resource_monitor.py` (~50 lines)
- `configs/daemon.yaml`

### Modify
- `src/main.py` — add `mekong daemon start/stop/status` commands

## Implementation Steps

1. Create `src/daemon/` package with `__init__.py`
2. Implement `watcher.py` — `TaskWatcher` class using `pathlib.Path.iterdir()` + polling loop
3. Implement `classifier.py` — `ComplexityClassifier` with configurable keyword sets
4. Implement `executor.py` — `MissionExecutor` wrapping `subprocess.run()` for shell missions, `LLMClient` for LLM missions
5. Implement `gate.py` — `PostGate` running verify commands and checking exit codes
6. Implement `journal.py` — `LearningJournal` appending JSON records to journal file
7. Implement `dlq.py` — `DeadLetterQueue` moving failed missions to dead-letter directory
8. Implement `resource_monitor.py` — `ResourceMonitor` using `os.getloadavg()` and `psutil` (optional dep)
9. Implement `scheduler.py` — `DaemonScheduler` main loop: watch → classify → execute → gate → journal
10. Add `mekong daemon start|stop|status` CLI commands to `src/main.py`
11. Create `configs/daemon.yaml` with example configuration
12. Write tests: `tests/test_daemon_watcher.py`, `tests/test_daemon_classifier.py`

## Success Criteria
- [ ] `mekong daemon start` watches task dir, processes missions
- [ ] Mission file dropped in `tasks/` → auto-classified → executed → archived
- [ ] Failed missions (3 retries) → moved to `tasks/dead-letter/`
- [ ] Journal file records duration, success, complexity for each mission
- [ ] Resource monitor pauses dispatch when load > threshold
- [ ] `mekong daemon stop` gracefully shuts down
- [ ] No Antigravity/tmux/Binh Phap references in daemon code

## Risk Assessment
- **Medium**: Python daemon signal handling differs from Node.js — use `signal.signal(SIGTERM, handler)`
- **Low**: File watching via polling is simple but has latency — acceptable for 5s interval
- **Note**: `psutil` is optional — `os.getloadavg()` works on macOS/Linux, skip Windows for now
- **Decision**: Skip tmux multi-pane — single-process daemon is simpler and sufficient for v1

## Todo
- [ ] Create daemon package structure
- [ ] Implement TaskWatcher
- [ ] Implement ComplexityClassifier
- [ ] Implement MissionExecutor
- [ ] Implement PostGate
- [ ] Implement LearningJournal + DLQ
- [ ] Implement DaemonScheduler main loop
- [ ] Add CLI commands
- [ ] Write tests
