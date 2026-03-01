# 10x Plan: Electron Architecture → Mekong-CLI RaaS AGI

**Binh Phap Ch.10 地形 (Terrain)** — Study the terrain, adapt to advantage.

## Mapping: Electron Patterns → Mekong-CLI

| Electron Concept | Mekong-CLI Mapping | File Target |
|------------------|--------------------|-------------|
| Main Process / Renderer Process | Orchestrator (main) / Agent Workers (renderer) | `src/core/process_manager.py` |
| IPC (ipcMain/ipcRenderer) | Agent IPC Protocol with typed channels | `src/core/ipc_protocol.py` |
| Protocol Handler (protocol.registerSchemeAsPrivileged) | Custom scheme handler (mekong://, recipe://) | `src/core/protocol_handler.py` |
| Session Manager | Execution session lifecycle | `src/core/session_manager.py` |
| Crash Reporter | Crash recovery + telemetry upload | `src/core/crash_reporter.py` |
| Auto-Updater (Squirrel) | Self-update mechanism for CLI | `src/core/auto_updater.py` |
| Context Isolation | Agent sandbox (restricted capabilities) | `src/core/sandbox.py` |
| BrowserWindow.webPreferences | Agent execution preferences/config | `src/core/agent_preferences.py` |
| app lifecycle (ready/will-quit/before-quit) | CLI lifecycle hooks | `src/core/lifecycle_hooks.py` |
| Extension system | Plugin/skill loader | `src/core/plugin_loader.py` |

## Phases

### Phase 1: Process Isolation & IPC (Core)
- `src/core/ipc_protocol.py` — Typed IPC channels between orchestrator ↔ agents
- `src/core/process_manager.py` — Agent process lifecycle management
- Status: 🔴 TODO

### Phase 2: Protocol Handler & Session
- `src/core/protocol_handler.py` — Custom URI schemes (mekong://, recipe://)
- `src/core/session_manager.py` — Session lifecycle with state persistence
- Status: 🔴 TODO

### Phase 3: Crash Reporter & Auto-Updater
- `src/core/crash_reporter.py` — Structured crash capture + recovery
- `src/core/auto_updater.py` — CLI self-update via GitHub releases
- Status: 🔴 TODO

### Phase 4: Context Isolation & Sandbox
- `src/core/sandbox.py` — Agent execution sandbox with capability restrictions
- `src/core/agent_preferences.py` — Per-agent config (like webPreferences)
- Status: 🔴 TODO

### Phase 5: Production Audit
- Lint (ruff), Type check (mypy), Security (bandit), Vulnerability (pip-audit)
- Status: 🔴 TODO

### Phase 6: Build & Verify GREEN
- pytest full suite, verify 0 errors
- Status: 🔴 TODO

## Success Criteria
- [ ] 8 new modules created, all < 200 LOC
- [ ] All 91+ tests pass
- [ ] ruff lint clean
- [ ] mypy type check clean
- [ ] No security issues
- [ ] Build passes
