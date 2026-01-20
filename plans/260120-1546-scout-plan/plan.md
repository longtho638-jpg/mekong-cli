# Plan: Scout Command Implementation

> **Goal:** Create a unified `scout` command and agent workflow that efficiently locates files and code in the codebase.

## 1. Analysis & Strategy
The goal is to provide a robust "Scout" capability that works both as a CLI command (`mekong scout`) and as a specialized agent (`scout`) within the Claude Code environment.

- **Current State:**
  - `scout` agent is defined in `CLAUDE.md` but implementation details need consolidation.
  - `/scout` command exists as a shell script/alias or is missing proper implementation.
  - File search logic is scattered.

- **Target State:**
  - **Unified Logic:** A single source of truth for "scouting" (searching) logic in `antigravity/core/scout_engine.py` (or similar).
  - **CLI Command:** `mekong scout <query>` wrapper.
  - **Agent Integration:** `scout` agent uses the same underlying engine.
  - **Performance:** Optimized for speed (ripgrep/glob) and relevance.

## 2. Implementation Steps

### Phase 1: Core Scout Engine
- [ ] Create `antigravity/core/scout/engine.py`
  - Implement `ScoutEngine` class.
  - Methods: `search_files(pattern)`, `search_content(query)`, `find_definitions(symbol)`.
  - Integrate `ripgrep` (via `subprocess` or python lib) for speed.

### Phase 2: CLI Command
- [ ] Create/Update `cli/commands/scout_commands.py`
  - Add `scout` command to Typer app.
  - Arguments: `query`, `--type` (file/content), `--limit`.
  - Connect to `ScoutEngine`.

### Phase 3: Claude Agent Integration
- [ ] Update `.claude/agents/scout.md` (if exists) or `CLAUDE.md` definition.
  - Ensure it uses the `scout` CLI tool or Python functions directly if possible (or just standard `grep`/`glob` tools effectively).
  - *Note:* The user prompt implies `scout` is already an agent type. We need to ensure it's "wired up" correctly.

### Phase 4: Integration & Testing
- [ ] Add `scout` to `claude_bridge/command_mappings.json`.
- [ ] Write tests in `tests/test_scout.py`.
- [ ] Verify `mekong scout` works in terminal.

## 3. Unresolved Questions
- Should `scout` utilize the `Explore` agent type internally or be its own distinct logic? (Plan: It should be a distinct tool/engine that agents can *use*).

## 4. Next Actions
- Verify if `antigravity/core/scout/` exists.
- Draft `ScoutEngine`.
