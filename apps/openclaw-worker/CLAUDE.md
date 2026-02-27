# OpenClaw Worker — TOM HUM Autonomous Daemon

**Version:** v2026.2.16

> **Chapter 9 Xing Jun** — On the march, seek high ground and reliable water sources
>
> This file governs CC CLI behavior ONLY when working inside `apps/openclaw-worker/`.
> Inherits from root `CLAUDE.md` (Constitution) and `~/.claude/CLAUDE.md` (Global).

## Identity

**Codename:** Tom Hum (Lobster)
**Role:** General / Dai Tuong — autonomous task dispatch daemon
**DIEU 54:** Tom Hum Tu Tri (Autonomous Self-Governance)

## Tech Stack

| Component | Technology |
|-----------|------------|
| Runtime | Node.js |
| Language | JavaScript (CommonJS) |
| Brain Control | Dual-mode: `direct` (claude -p) or `tmux` (v2026.2.9) |
| Engine | Triple-provider: Ollama Cloud + OpenRouter + Google AI (port 20128) |
| Proxy | Antigravity Proxy v4 (port 20128, Anthropic-compatible) |
| Model | gemini-3-flash-preview (via proxy) |

## Architecture (v2026.2.27 AGI Deep Upgrade Edition)

**Monolith Decomposition:** 56KB `brain-process-manager.js` refactored into 14 focused sub-modules with backward-compatible facade re-export pattern.

```
apps/openclaw-worker/
├── task-watcher.js              # Thin orchestrator: boot + shutdown (entry point)
├── config.js                    # All constants, paths, env vars, project registry
└── lib/
    ├── brain-process-manager.js # Re-export facade (37 lines) — backward compatible API
    ├── CORE MODULES (Brain Lifecycle):
    │   ├── brain-logger.js      # Leaf module: centralized logging
    │   ├── brain-state-machine.js        # State tracking (IDLE/SPAWNING/RUNNING/CRASHED)
    │   ├── brain-boot-sequence.js        # Dual-mode boot logic (direct/tmux)
    │   ├── brain-spawn-manager.js        # Process spawning, stream setup
    │   ├── brain-mission-runner.js       # Mission execution coordinator
    │   ├── brain-respawn-controller.js   # Rate-limited respawn logic
    │   └── brain-terminal-app.js         # VS Code terminal integration
    ├── RELIABILITY MODULES (Fault Tolerance):
    │   ├── circuit-breaker.js   # State machine (CLOSED/OPEN/HALF_OPEN)
    │   ├── brain-heartbeat.js   # File-based liveness check
    │   ├── brain-output-hash-stagnation-watchdog.js  # Detect hung processes
    │   ├── mission-recovery.js  # Model failover & context overflow recovery
    │   └── brain-system-monitor.js      # Thermal/resource monitoring
    ├── OBSERVABILITY MODULES (Health & Metrics):
    │   ├── brain-health-server.js       # HTTP health endpoint (port 9090)
    │   ├── agi-score-calculator.js      # 5-dimension AGI score (100/100 max)
    │   └── api-rate-gate.js     # Rate limiting for mission dispatch
    ├── MISSION MANAGEMENT:
    │   ├── mission-dispatcher.js    # Prompt building, project routing
    │   ├── task-queue.js            # FIFO queue, Dead Letter Queue (DLQ)
    │   ├── mission-journal.js       # Telemetry logging & history
    │   └── mission-complexity-classifier.js  # Classify mission complexity
    ├── AUTONOMOUS PLANNING (AGI L4+):
    │   ├── auto-cto-pilot.js        # Generate Binh Phap quality tasks
    │   ├── project-scanner.js       # Tech debt & build issue scanning
    │   ├── learning-engine.js       # AGI L5: Meta-learning & pattern analysis
    │   ├── evolution-engine.js      # Self-correction & strategy optimization
    │   └── post-mission-gate.js     # AGI L3: CI/CD gate & auto-commit
    ├── SUPPORT MODULES:
    │   ├── m1-cooling-daemon.js     # M1 thermal/RAM protection
    │   ├── live-mission-viewer.js   # Real-time colored log viewer
    │   └── (80+ additional modules: knowledge-synthesizer, skill-factory, etc.)
```

**Key Structural Changes:**
- **Facade Pattern:** `brain-process-manager.js` now re-exports 37 lines; all logic in sub-modules
- **Dependency Graph:** Leaf module `brain-logger.js` has zero dependencies; all others form DAG (no cycles)
- **Health Endpoint:** New `brain-health-server.js` on port 9090 (GET /health, GET /metrics)
- **AGI Score:** New `agi-score-calculator.js` scoring 5 dimensions: reliability, autonomy, learning, safety, throughput
- **Dead Letter Queue:** Failed missions after 3 retries moved to DLQ for manual review
- **Write-Ahead Log:** Task-watcher.js crash recovery via WAL in `~/.openclaw/` directory

## Key Files & Contracts

### post-mission-gate.js — AGI Level 3 (Jun Xing)
- Automates `npm run build` verification after mission completion.
- GREEN build triggers automatic `git commit`.
- RED build triggers automatic high-priority fix mission creation.

### project-scanner.js — AGI Level 4 (Shi Ji)
- Autonomous scanning for tech debt (TODO/FIXME), git status, and build issues.
- Uses LLM to prioritize and auto-generate new missions in `tasks/`.
- Runs every 30 minutes to maintain project health.

### learning-engine.js — AGI Level 5 (Yong Jian)
- Analyzes historical mission patterns from `data/mission-history.json`.
- Identifies failure modes and suggests strategy adjustments.
- Generates `data/learning-insights.json` to guide future missions.

### mission-journal.js — AGI L3/L5 Foundation
- Records mission telemetry: duration, success, tokens, build status.
- Persists history in `data/mission-history.json`.
- Provides stats aggregation (success rate, avg duration).

### config.js — Single Source of Truth
- `MEKONG_DIR` — Root project directory
- `OPENCLAW_HOME` — Runtime data directory (override via `OPENCLAW_HOME` env var, default `~/.openclaw`)
- `WATCH_DIR` — `tasks/` directory for mission files
- `PROCESSED_DIR` — `tasks/processed/` for completed missions
- `TASK_PATTERN` — `/^mission_.*\.txt$/` (file naming convention)
- `MISSION_TIMEOUT_MS` — 45 minutes per mission
- `BRAIN_MODE` — `'direct'` (default) or `'tmux'` (fallback), set via `TOM_HUM_BRAIN_MODE`
- `ENGINE` — `'antigravity'` (default, port 20128), set via `TOM_HUM_ENGINE`
- `QWEN_PROXY_PORT` — 8081 (Qwen Bridge Flask server)
- `QWEN_MODEL_NAME` — `'qwen-coder-plus'` (mapped by bridge to DashScope model)
- `TMUX_SESSION` — Tmux session name (only used in tmux mode)
- `PROJECTS` — Array of sub-project names for routing

### Brain Modes (v2026.2.9)

#### Mode 1: Direct (DEFAULT) — `claude -p`
- Each mission runs: `claude -p "<prompt>" --model X --dangerously-skip-permissions`
- stdin set to `'ignore'` (critical: piped stdin causes hang)
- All ClaudeKit agents, tools, and skills fully supported
- Output streamed to log file in real-time
- User watches via: `node lib/live-mission-viewer.js` in VS Code terminal
- No persistent session — fresh process per mission

#### Mode 2: Tmux (FALLBACK) — persistent session
- CC CLI runs inside tmux session `tom-hum-brain`
- User can `tmux attach -t tom-hum-brain` to watch
- Missions injected via `tmux send-keys -l`
- Completion detected via `tmux capture-pane -p` polling
- Set via: `TOM_HUM_BRAIN_MODE=tmux node task-watcher.js`

### Engines (v2026.2.9)

#### Engine 1: Antigravity (DEFAULT) — port 20128
- Routes through Antigravity Proxy v4 (Ollama Cloud + OpenRouter + Google AI)
- Model: `gemini-3-flash-preview`
- Default for all missions

#### Engine 2: Qwen — port 8081
- Routes through Qwen Bridge (`scripts/qwen_bridge.py`)
- Converts Anthropic Messages API → DashScope OpenAI Chat Completions API
- Model: `qwen-coder-plus` (mapped to DashScope model by bridge)
- Start bridge: `scripts/start-qwen-bridge.sh`
- Set via: `TOM_HUM_ENGINE=qwen node task-watcher.js`

### Recovery Features (v2026.2.9)

#### Model Failover on HTTP 400
When a mission fails and stderr contains model-related errors (400, `model_not_found`, `overloaded`), the brain automatically retries ONCE with a fallback model:
- Antigravity engine fallback: `claude-sonnet-4-20250514`
- Qwen engine fallback: `qwen-max`
- Recovery logic in `lib/mission-recovery.js`

#### Context Overflow Recovery
When stderr indicates context overflow (`token limit`, `too long`, `context overflow`), the brain truncates the prompt to 8000 chars and retries ONCE. Original intent preserved via first-N-chars strategy.

#### OPENCLAW_HOME Environment Override
Set `OPENCLAW_HOME` env var to override the default runtime data directory (`~/.openclaw`). Useful for CI, testing, or multi-instance deployments.

### Live Mission Viewer
Run in any terminal (VS Code recommended) to watch missions:
```bash
node apps/openclaw-worker/lib/live-mission-viewer.js
```
- Colored output: cyan=mission start, green=complete, red=error, yellow=timeout
- Shows last 20 log lines on start, then live-tails new output

## Development Rules (Domain-Specific)

### File Naming
- All lib modules use kebab-case: `brain-process-manager.js`
- Mission files use snake_case: `mission_{project}_{task}.txt` (consumed by regex)

### Modifying the Brain
- Changes to `brain-process-manager.js` require testing the full mission cycle
- Test direct mode:
  ```bash
  node -e "
    const { spawnBrain, runMission } = require('./lib/brain-process-manager');
    spawnBrain();
    runMission('Reply with: TEST_OK', '.', 60000).then(r => console.log(JSON.stringify(r)));
  "
  ```
- Test tmux mode: `TOM_HUM_BRAIN_MODE=tmux node task-watcher.js`
- Test qwen engine: `TOM_HUM_ENGINE=qwen node -e "const c = require('./config'); console.log(c.ENGINE, c.QWEN_PROXY_PORT)"`

### Adding New Modules
- Create in `lib/` with kebab-case naming
- Export from module, import in `task-watcher.js`
- Keep modules < 200 lines

### Testing
- No automated test suite (daemon process, not unit-testable)
- Manual testing: write a `tasks/mission_test_*.txt` and watch logs
- Log file: `~/tom_hum_cto.log`

## Quality Gates (Binh Phap)

- All missions must use `/cook` or `/binh-phap` prefix (DIEU 47)
- **AGI Level 3 Gate:** `post-mission-gate.js` verifies build status after completion.
- **AGI Level 3 Journal:** `mission-journal.js` logs all mission outcomes for self-learning.
- Sequential processing only (no parallel missions)
- M1 cooling daemon kills resource hogs every 90s
- Auto-CTO generates quality tasks when queue empty for 5min
