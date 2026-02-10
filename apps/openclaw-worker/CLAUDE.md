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
| Brain Control | Tmux session with interactive CC CLI (v24.0) |
| Proxy | Antigravity Proxy (port 8080) |
| Model | claude-opus-4-6-thinking |

## Architecture (v24.0 Tmux Visible Brain)

```
apps/openclaw-worker/
├── task-watcher.js              # Thin orchestrator: boot + shutdown (entry point)
├── config.js                    # All constants, paths, env vars, project registry
└── lib/
    ├── brain-process-manager.js # Tmux-based CC CLI brain (v24.0: visible session)
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
- `TMUX_SESSION` — Tmux session name (`tom-hum-brain`)
- `PROJECTS` — Array of sub-project names for routing

### Execution Protocol (v24.0: Tmux Visible Brain)
- CC CLI runs inside tmux session `tom-hum-brain` (user can `tmux attach` to watch)
- Missions injected via `tmux send-keys -l` (literal mode for special chars)
- Completion detected via `tmux capture-pane -p` polling for prompt return
- Debounce: prompt must persist 2s to confirm idle (not mid-output)
- CC CLI stays alive across missions (persistent interactive session)
- Brain auto-respawns if tmux session dies before next mission

### Legacy: Expect Brain + claude -p (DEPRECATED)
- `scripts/tom-hum-persistent-dispatch.exp` — expect brain, broken by Ink TUI
- `claude -p` direct spawn — invisible, no user observation possible

## Development Rules (Domain-Specific)

### File Naming
- All lib modules use kebab-case: `brain-process-manager.js`
- Mission files use snake_case: `mission_{project}_{task}.txt` (consumed by regex)

### Modifying the Brain
- Changes to `brain-process-manager.js` require testing the full mission cycle
- Test by writing a `tasks/mission_test_*.txt` file and watching logs
- Verify tmux session: `tmux has-session -t tom-hum-brain && echo OK`
- Watch CC CLI live: `tmux attach -t tom-hum-brain`

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
