# 🦞 OpenClaw Worker — TÔM HÙM Autonomous Daemon

> **第九篇 行軍 (Xing Jun)** — On the march, seek high ground and reliable water sources
>
> This file governs CC CLI behavior ONLY when working inside `apps/openclaw-worker/`.
> Inherits from root `CLAUDE.md` (Constitution) and `~/.claude/CLAUDE.md` (Global).

## Identity

**Codename:** Tôm Hùm (Lobster)
**Role:** General / Đại Tướng — autonomous task dispatch daemon
**ĐIỀU 54:** Tôm Hùm Tự Trị (Autonomous Self-Governance)

## Tech Stack

| Component | Technology |
|-----------|------------|
| Runtime | Node.js |
| Language | JavaScript (CommonJS) |
| Brain Control | Direct `claude -p` spawn (v2 — replaced expect) |
| Proxy | Antigravity Proxy (port 8080) |
| Model | claude-opus-4-6-thinking |

## Architecture (v23.0 Direct Execution)

```
apps/openclaw-worker/
├── task-watcher.js              # Thin orchestrator: boot + shutdown (entry point)
├── config.js                    # All constants, paths, env vars, project registry
└── lib/
    ├── brain-process-manager.js # Spawn claude -p per mission (v2: no expect)
    ├── mission-dispatcher.js    # Prompt building, project routing, runMission()
    ├── task-queue.js            # File watching (fs.watch + poll), FIFO queue
    ├── auto-cto-pilot.js        # Self-CTO: generates Binh Phap quality tasks
    └── m1-cooling-daemon.js     # M1 thermal/RAM protection
```

## Key Files & Contracts

### config.js — Single Source of Truth
- `MEKONG_DIR` — Root project directory
- `WATCH_DIR` — `tasks/` directory for mission files
- `PROCESSED_DIR` — `tasks/processed/` for completed missions
- `TASK_PATTERN` — `/^mission_.*\.txt$/` (file naming convention)
- `MISSION_TIMEOUT_MS` — 45 minutes per mission
- `PROJECTS` — Array of sub-project names for routing

### Execution Protocol (v2: Direct claude -p)
- Each mission spawns: `claude -p "<prompt>" --model X --dangerously-skip-permissions`
- stdin set to `'ignore'` (critical: piped stdin causes hang)
- stdout/stderr captured and logged
- Process exit code determines success (0 = done)
- No file IPC needed — Node.js child_process handles everything
- Timeout watchdog kills process after MISSION_TIMEOUT_MS

### Legacy: Expect Brain Protocol (DEPRECATED)
- `scripts/tom-hum-persistent-dispatch.exp` — no longer works with CC CLI v2.1.38+
- CC CLI uses Ink (React TUI) with alternate screen buffer
- Expect cannot detect prompt output through Ink's rendering

## Development Rules (Domain-Specific)

### File Naming
- All lib modules use kebab-case: `brain-process-manager.js`
- Mission files use snake_case: `mission_{project}_{task}.txt` (consumed by regex)

### Modifying the Brain
- Changes to `brain-process-manager.js` require testing the full mission cycle
- Test by writing a `tasks/mission_test_*.txt` file and watching logs
- Critical: stdin MUST be `'ignore'` when spawning claude -p (piped stdin hangs)

### Adding New Modules
- Create in `lib/` with kebab-case naming
- Export from module, import in `task-watcher.js`
- Keep modules < 100 lines (thin, focused)

### Testing
- No automated test suite (daemon process, not unit-testable)
- Manual testing: write a `tasks/mission_test_*.txt` and watch logs
- Log file: `~/tom_hum_cto.log`

## Quality Gates (Binh Phap)

- All missions must use `/cook` or `/binh-phap` prefix (ĐIỀU 47)
- Sequential processing only (no parallel missions)
- M1 cooling daemon kills resource hogs every 90s
- Auto-CTO generates quality tasks when queue empty for 5min
