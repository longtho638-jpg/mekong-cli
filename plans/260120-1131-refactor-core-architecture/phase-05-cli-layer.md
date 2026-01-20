# Phase 5: CLI Layer Refactoring (P2 - Medium)

> **Priority:** P2 - MEDIUM
> **Status:** completed
> **Effort:** 2h

## Overview

Refactor CLI layer files that exceed or approach the 200-line limit.

## Key Insights

- `cli/entrypoint.py` (251 lines) - main CLI entry point
- `antigravity/cli/__init__.py` (308 lines) - CLI module init
- Commands are well-organized but entrypoint has too many inline definitions

## Requirements

### Functional
- Maintain exact same CLI interface
- All commands work identically

### Non-Functional
- Each file <= 200 lines
- Commands grouped logically

## Architecture

### cli/entrypoint.py (251 lines) -> Split into:

```
cli/
  entrypoint.py           # Main entry point (86 lines)
  commands/
    strategy_commands.py  # Strategy sub-commands (37 lines)
    dev_commands.py       # Development commands (57 lines)
    mcp_commands.py       # MCP sub-commands (29 lines)
    revenue_commands.py   # Revenue sub-commands (29 lines)
    utility_commands.py   # Utility commands (85 lines)
```

### antigravity/cli/__init__.py (308 lines) -> Split into:

```
antigravity/cli/
  __init__.py             # Minimal exports (43 lines)
  app.py                  # Main app configuration (68 lines)
  agency_commands.py      # Agency setup commands (152 lines)
  vibe_commands.py        # VIBE IDE commands (60 lines)
  commands.py             # Re-exports (27 lines)
  utils.py                # Shared utilities (58 lines)
```

## Files Created

- [x] `cli/commands/strategy_commands.py`
- [x] `cli/commands/dev_commands.py`
- [x] `cli/commands/mcp_commands.py`
- [x] `cli/commands/revenue_commands.py`
- [x] `cli/commands/utility_commands.py`
- [x] `antigravity/cli/app.py`
- [x] `antigravity/cli/agency_commands.py`
- [x] `antigravity/cli/vibe_commands.py`
- [x] `antigravity/cli/commands.py`
- [x] `antigravity/cli/utils.py`

## Implementation Steps

1. [x] Extract strategy commands from entrypoint.py
2. [x] Extract dev commands (cook/test/ship) from entrypoint.py
3. [x] Extract utility commands from entrypoint.py
4. [x] Refactor entrypoint.py to import from new modules
5. [x] Split antigravity/cli/__init__.py
6. [x] Run CLI tests
7. [x] Manual verification of all commands

## Todo List

- [x] Extract strategy_commands.py
- [x] Extract dev_commands.py
- [x] Extract utility_commands.py
- [x] Refactor entrypoint.py to < 100 lines
- [x] Split antigravity/cli/__init__.py
- [x] Run pytest
- [x] Manual test: `python main.py --help`

## Success Criteria

- [x] entrypoint.py <= 100 lines (86 lines)
- [x] All new files <= 200 lines
- [x] All CLI commands work
- [x] `python main.py --help` shows all commands

## Risk Assessment

| Risk | Mitigation |
|------|------------|
| Breaking CLI interface | Test each command manually |
| Import order issues | Use lazy imports where needed |

## Verification Results

```bash
# All tests pass
pytest tests/test_cli_refactor.py -v
# 4 passed in 0.17s

# CLI help works
python main.py --help
# Shows all commands: cook, test, ship, dashboard, init, etc.

# Subcommands work
python main.py strategy --help
python main.py revenue --help
```

## Next Steps

After Phase 5:
- Proceed to Phase 6 (Testing)
