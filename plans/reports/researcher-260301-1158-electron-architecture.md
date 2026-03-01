# Research Report: Electron Architecture Patterns → CLI Mapping

**Date:** 2026-03-01 | **Sources:** Electron official docs, Chromium design docs, GitHub repo analysis

---

## Executive Summary

Electron's codebase embodies a mature multi-process orchestrator/worker pattern backed by Chromium's battle-tested IPC and V8 bindings. Its architecture maps directly to long-running CLI daemons (Tôm Hùm pattern): main process = orchestrator, renderer = sandboxed worker, IPC = message bus, preload = middleware injection. The 10 patterns below are GUI-agnostic and directly applicable to mekong-cli.

---

## 1. Process Architecture

**Two-tier model:**
- `shell/browser/` — Main process (orchestrator): owns lifecycle, native resources, spawns workers
- `shell/renderer/` — Renderer (worker): isolated, sandboxed, no direct system access
- `shell/common/` — Shared utilities available to both

**CLI mapping → Tôm Hùm already implements this:**
```
Main Process  = task-watcher.js (orchestrator, owns file IPC, queue)
Renderer      = CC CLI child process (isolated execution, no direct queue access)
Common        = config.js (shared constants, paths, env vars)
```

**Key insight:** Process isolation means a crashed worker never kills the orchestrator. Electron respawns renderers; Tôm Hùm respawns brain (expect script outer loop).

---

## 2. IPC Patterns

**Electron patterns:**
- `ipcMain.handle` / `ipcRenderer.invoke` — async request-response (preferred)
- `ipcMain.on` / `ipcRenderer.send` — fire-and-forget events
- `contextBridge.exposeInMainWorld` — secure API proxy across isolation boundary

**Current mekong-cli IPC (file-based):**
```
/tmp/tom_hum_next_mission.txt   → orchestrator → worker (mission inbox)
/tmp/tom_hum_mission_done       → worker → orchestrator (completion signal)
```

**Upgrade path (Electron-inspired):**
- Replace file polling with Unix Domain Socket (`/tmp/tom_hum.sock`)
- Bidirectional JSON-RPC: `{ id, method, params }` → `{ id, result, error }`
- Enables streaming progress updates (no polling needed)

---

## 3. Module Organization

**Electron's shell/ structure:**
```
shell/
├── browser/api/         # Main process APIs (app, BrowserWindow, menu)
├── browser/lib/         # JS wrappers over native bindings
├── renderer/api/        # Renderer-only APIs (webFrame)
├── renderer/lib/        # Renderer init logic
└── common/              # Cross-process utilities + node_bindings.cc
    └── gin_converters/  # C++ ↔ V8 type marshaling
```

**mekong-cli mapping:**
```
src/
├── core/                # orchestrator-layer (planner, orchestrator, verifier)
├── agents/              # worker-layer (each agent = isolated executor)
└── [missing] common/    # candidate: shared types, event bus, logger
```

**Gap identified:** No `common/` layer. Types and utilities duplicated across core + agents.

---

## 4. Build System & Patch System

**GN + patches/ pattern:**
- `patches/config.json` maps upstream repos to patch sets
- Ordered `.patches` files applied sequentially
- Upstream changes don't overwrite local modifications

**CLI mapping for mekong-cli:**
- Skill system (`.claude/skills/`) follows same principle: upstream skill + local overrides
- Migration: could use `patches/` pattern for maintaining local forks of upstream skills without merge conflicts

---

## 5. API Design: Proxy/Wrapper Pattern

**Electron pattern:**
- JS layer (`shell/browser/lib/api/`) = thin public API
- Calls into C++ bindings via `process.electronBinding()` / `gin`
- Users interact with JS proxy, never C++ directly

**Gin bridge:**
```cpp
// C++ class registers JS-accessible methods
gin_helper::ObjectTemplateBuilder(isolate, templ)
  .SetMethod("checkForUpdates", &AutoUpdater::CheckForUpdates)
```

**CLI mapping:** Same pattern exists in RecipeOrchestrator → RecipePlanner/Executor. Public `mekong cook` CLI is a thin proxy; internal PEV (Plan-Execute-Verify) is the "native layer."

**Recommendation:** Formalize the proxy boundary. CLI commands should NEVER call Planner/Executor directly — always via Orchestrator (enforces single entry point).

---

## 6. Event System

**Electron's gin_helper::EventEmitter:**
- C++ classes inherit EventEmitter
- Native events (window closed, GPU crash) → `Emit()` → JS listener callbacks
- Lifecycle: `before-quit` → `will-quit` → `quit` (ordered, cancellable)

**CLI mapping:**
```python
# Current: direct function calls
result = executor.execute(task)
verifier.verify(result)

# Electron-inspired: event pipeline
orchestrator.emit('task:start', task)
orchestrator.emit('task:executed', result)
orchestrator.emit('task:verified', verification)
# Telemetry, logging, rollback attach as listeners — not baked into core
```

**Benefit:** Decouples telemetry (`telemetry.py`) from execution core. Attach/detach without modifying orchestrator.

---

## 7. Security Model

**Three-layer defense:**

| Layer | Electron | CLI Equivalent |
|-------|----------|----------------|
| Process isolation | Renderer sandboxed | Plugin runs in subprocess |
| Context isolation | Preload in isolated V8 world | Plugin gets `ctx` object, not raw `os` |
| Bridge | `contextBridge.exposeInMainWorld` | Orchestrator vets plugin API calls |

**Preload script pattern → CLI middleware:**
```python
# Before task executes, orchestrator injects context
ctx = build_plugin_context(
    allowed_paths=[task.working_dir],
    dry_run=options.dry_run,
    logger=sandboxed_logger
)
plugin.execute(ctx)  # Plugin sees only ctx, not raw filesystem
```

**Recommendation:** RecipeExecutor's `shell` mode runs arbitrary commands with full privileges. Add `--sandbox` flag that restricts shell tasks to working directory via `chroot`/`firejail` (Linux) or subprocess cwd restriction.

---

## 8. Auto-Update: Squirrel → Symlink-Swap Pattern

**Electron/Squirrel architecture:**
- Download delta (`.nupkg`) to temp dir
- Verify checksum
- Swap atomically on restart (old binary still running during download)
- `autoUpdater` events: `checking-for-update` → `update-available` → `update-downloaded` → app restarts

**CLI mapping (symlink-swap pattern):**
```bash
# Download new version
wget https://releases.example.com/mekong-v0.3.0.tar.gz -O ~/.mekong/versions/v0.3.0.tar.gz
# Verify
sha256sum --check

# Atomic swap (old version still running)
ln -sfn ~/.mekong/versions/v0.3.0 ~/.mekong/current

# Rollback: point symlink back
ln -sfn ~/.mekong/versions/v0.2.0 ~/.mekong/current
```

**Benefit:** Instant rollback without reinstall. `pip install -g` is destructive — no rollback.

---

## 9. Crash Reporter: Out-of-Process Monitor

**Electron/Crashpad architecture:**
- Separate "handler" OS process watches main + renderer via `ptrace`/Windows SEH
- On crash: writes `.dmp` minidump, POSTs to endpoint with metadata
- Main process registers: `crashReporter.start({ submitURL, extra: { version, userId } })`

**CLI mapping → Tôm Hùm already partially implements:**
```javascript
// brain-process-manager.js watches expect child process
brainProcess.on('exit', (code) => {
  if (code !== 0) respawnBrain(); // crash recovery
});
```

**Recommended enhancement:**
```python
# orchestrator.py: wrap each task execution
import faulthandler
faulthandler.enable(file=open('crash.log', 'w'))

# Add structured telemetry on TaskResult
telemetry.record({
  'task_id': task.id,
  'exit_code': result.exit_code,
  'duration_ms': result.duration,
  'error': result.error,
})
```

---

## 10. Extension/Plugin System: Declarative Registry

**Electron's approach:**
- `session.loadExtension(path)` loads Chrome extension manifest
- Background pages run in hidden renderer (isolated process)
- Content scripts injected via Isolated Worlds
- Manifest declares `permissions`, `background`, `content_scripts`

**CLI plugin registry pattern (VS Code-inspired):**
```json
// .mekong/plugins/my-plugin/manifest.json
{
  "id": "my-plugin",
  "version": "1.0.0",
  "activationEvents": ["onCommand:cook", "onFilePresent:Dockerfile"],
  "contributes": {
    "commands": [{ "command": "docker.build", "title": "Docker Build" }],
    "hooks": ["before:execute", "after:verify"]
  }
}
```

**Key pattern: Declarative Activation.** Orchestrator reads manifests at startup (fast, no code execution). Plugin code only loaded when `activationEvents` match. Keeps `mekong` startup < 100ms regardless of plugin count.

---

## Testing Patterns

**Electron's split:**
- `spec/` — API tests run inside Electron (renderer context available)
- `spec-main/` — Main process tests in pure Node.js (no UI needed)
- Matrix CI: macOS + Windows + Linux in parallel

**mekong-cli mapping:**
```
tests/test_planner.py      → spec-main/ (orchestrator, no subprocess needed)
tests/test_executor.py     → spec-main/ (executor unit tests)
tests/test_integration_*   → spec/ (full PEV pipeline with real subprocess)
```

**Current gap:** All 62 tests are unit tests. No integration tests that spawn real subprocesses (equivalent of Electron's spec/ running full app).

---

## Key Architectural Patterns Summary

| Pattern | Electron | mekong-cli Status |
|---------|----------|-------------------|
| Orchestrator-Worker | Main + Renderer | Implemented (task-watcher + CC CLI) |
| File IPC | ipcMain/ipcRenderer | Implemented (file-based), upgrade to socket |
| Event Bus | EventEmitter + Emit() | Partial (direct calls), needs middleware pipeline |
| Proxy/Wrapper API | JS → C++ gin bridge | Partial (Orchestrator → PEV) |
| Context Isolation | Isolated Worlds + contextBridge | Missing — plugins run with full privileges |
| Crash Recovery | Crashpad + respawn | Partial (brain-process-manager.js) |
| Declarative Plugins | Extension manifests | Missing — no plugin system |
| Atomic Updates | Squirrel + symlink-swap | Missing — uses pip |
| Separate test tiers | spec/ + spec-main/ | Missing — no integration tests |
| Common utilities layer | shell/common/ | Missing — utilities scattered |

---

## Unresolved Questions

1. Does mekong-cli plan a plugin system? If yes, declarative registry from §10 is the right starting point.
2. Should IPC upgrade to Unix sockets? File-based IPC works but adds 100-500ms latency per poll cycle.
3. Priority of sandbox mode for plugin execution — security vs. complexity tradeoff?
4. Self-update mechanism: is mekong distributed as pip package or binary? Determines which update strategy applies.
5. Should `shell/common/` equivalent (`src/common/`) be extracted now before agent count grows?
