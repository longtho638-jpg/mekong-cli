---
phase: 6
title: "Package Restructure (src/ → mekong/)"
priority: P1
status: pending
effort: 6h
depends_on: [1, 2, 3, 4, 5]
---

# Phase 6: Package Restructure for PyPI

## Overview
Rename `src/` → `mekong/` for PyPI-publishable package. Update all imports. Modernize `pyproject.toml` to use standard build system. Remove private/internal dependencies. Keep backward compat via `src/` shim.

## Key Insights (from research)
- Current `pyproject.toml` uses Poetry with `packages = [{include = "src"}]` (pyproject.toml:17)
- Imports throughout use `from src.core.X import Y` and `from src.agents.X import Y`
- Entry point: `mekong = "src.main:app"` (pyproject.toml:20)
- Heavy deps not needed for core: stripe, sqlalchemy, psycopg2, jinja2, python-jose, passlib
- 62 tests in `tests/` reference `src.` imports

## Requirements

### Functional
- F1: `pip install mekong-cli` from PyPI installs working CLI
- F2: `mekong cook/plan/run/version` all work after rename
- F3: Core package has minimal deps: typer, rich, requests, pydantic, pyyaml
- F4: Optional extras: `mekong-cli[gemini]`, `mekong-cli[full]`
- F5: `src/` shim module for backward compat during transition

### Non-Functional
- NF1: Package name on PyPI: `mekong-cli`, import as `mekong`
- NF2: Version from single source (`mekong/__version__.py`)
- NF3: No private infra deps in published package

## Architecture

```
mekong-cli/                     # Repository root
├── mekong/                     # PUBLIC Python package
│   ├── __init__.py             # Version, top-level exports
│   ├── __version__.py          # Single version source
│   ├── cli.py                  # Typer app (renamed from main.py)
│   ├── core/                   # PEV Engine
│   │   ├── __init__.py
│   │   ├── orchestrator.py
│   │   ├── planner.py
│   │   ├── executor.py
│   │   ├── verifier.py
│   │   ├── llm_client.py
│   │   ├── providers.py        # Phase 3
│   │   ├── protocols.py        # Phase 1
│   │   ├── agent_registry.py   # Phase 1
│   │   ├── dag_scheduler.py    # Phase 2
│   │   ├── plugin_loader.py    # Phase 5
│   │   ├── memory.py
│   │   ├── telemetry.py
│   │   ├── parser.py
│   │   ├── agent_base.py
│   │   └── ... (other core modules)
│   ├── agents/                 # Built-in agents
│   ├── daemon/                 # Phase 4
│   └── py.typed                # PEP 561 marker
├── src/                        # SHIM (backward compat, not published)
│   ├── __init__.py             # re-exports from mekong.*
│   ├── core/                   # from mekong.core import *
│   ├── agents/                 # from mekong.agents import *
│   └── main.py                 # from mekong.cli import app
├── configs/
├── recipes/
├── tests/
├── pyproject.toml              # Modernized
└── README.md
```

```toml
# pyproject.toml (modernized)
[project]
name = "mekong-cli"
version = "3.0.0"
description = "AGI Vibe Coding Factory — Plan-Execute-Verify autonomous engine"
requires-python = ">=3.9"
dependencies = [
    "typer>=0.9.0",
    "rich>=13.0.0",
    "requests>=2.28.0",
    "pydantic>=2.0.0",
    "pyyaml>=6.0",
]

[project.optional-dependencies]
gemini = ["google-genai>=1.0.0"]
full = ["google-genai>=1.0.0", "fastapi>=0.100.0", "uvicorn>=0.25.0"]

[project.scripts]
mekong = "mekong.cli:app"

[project.entry-points."mekong.agents"]
# Built-in agents auto-registered

[build-system]
requires = ["hatchling"]
build-backend = "hatchling.build"

[tool.hatch.build.targets.wheel]
packages = ["mekong"]
```

## Related Code Files

### Modify (ALL files — import rewrite)
- Every `from src.core.X import Y` → `from mekong.core.X import Y`
- Every `from src.agents.X import Y` → `from mekong.agents.X import Y`
- `pyproject.toml` — complete rewrite for modern build
- `tests/` — update all imports

### Create
- `mekong/__init__.py` — package root with version
- `mekong/__version__.py` — `__version__ = "3.0.0"`
- `mekong/py.typed` — PEP 561 marker
- `mekong/cli.py` — renamed from src/main.py
- `src/` shim modules (re-exports)

### Delete
- Remove heavy deps from core: stripe, sqlalchemy, psycopg2, python-jose, passlib, jinja2

## Implementation Steps

1. Create `mekong/` directory structure mirroring `src/`
2. Copy all `src/core/*.py` → `mekong/core/`, `src/agents/*.py` → `mekong/agents/`
3. Copy `src/daemon/` → `mekong/daemon/` (from Phase 4)
4. Create `mekong/__init__.py` with version and top-level exports
5. Run find-and-replace: `from src.core.` → `from mekong.core.`, `from src.agents.` → `from mekong.agents.`
6. Rename `src/main.py` logic → `mekong/cli.py`
7. Create `src/` shim: each `__init__.py` re-exports from `mekong.*`
8. Rewrite `pyproject.toml` — switch to hatchling, minimal deps, optional extras
9. Update all test imports: `from src.` → `from mekong.`
10. Add `mekong/py.typed` marker
11. Run `python3 -m pytest tests/` — all tests pass
12. Test `pip install -e .` and `mekong version`
13. Test `pip install -e ".[gemini]"` for optional deps

## Success Criteria
- [ ] `pip install -e .` works with minimal deps
- [ ] `mekong version` shows 3.0.0
- [ ] `mekong cook "list files"` works end-to-end
- [ ] All 62+ tests pass with new imports
- [ ] `src/` shim allows old import paths to work
- [ ] `python -c "import mekong"` succeeds
- [ ] No stripe/sqlalchemy/psycopg2 in core requirements

## Risk Assessment
- **High**: Mass import rename — use automated `sed` or `rope` refactoring
- **Mitigation**: `src/` shim prevents breakage for anyone importing from `src.`
- **Medium**: Some tests may hardcode `src.` paths — systematic grep and replace
- **Decision**: Switch from Poetry to hatchling — simpler, faster, standard PEP 517

## Todo
- [ ] Create mekong/ directory
- [ ] Copy and rename all modules
- [ ] Mass import rewrite (automated)
- [ ] Create src/ shim
- [ ] Rewrite pyproject.toml
- [ ] Update test imports
- [ ] Verify pip install -e .
- [ ] Run full test suite
