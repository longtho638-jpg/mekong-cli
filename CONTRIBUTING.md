# Contributing to Mekong CLI

## Dev Environment Setup

**Requirements:** Python 3.11+

```bash
git clone https://github.com/longtho638-jpg/mekong-cli.git
cd mekong-cli
pip install -r requirements.txt
pip install -e .
mekong --help  # verify install
```

## Running Tests

```bash
python3 -m pytest tests/ --ignore=tests/backend --ignore=tests/e2e \
  --ignore=tests/integration --ignore=tests/unit -v --tb=short
```

Full suite takes ~2.5 min. Run targeted tests during dev:

```bash
python3 -m pytest tests/test_orchestrator.py -v
```

## Code Style

**Lint:** `ruff check src/ tests/`
**Format check:** `ruff format --check src/ tests/`

Rules:
- File naming: kebab-case for files; Python test files use `test_*.py` (snake_case)
- Max file size: 200 lines — split into focused modules
- Type hints required on all public functions
- Docstrings required on all classes and public methods
- No `# type: ignore`, no bare `except`

## PR Process

1. Branch from `master`: `git checkout -b feat/your-feature`
2. Conventional commits:
   - `feat: add plugin validator`
   - `fix: handle timeout in orchestrator`
   - `refactor: split llm_client into modules`
   - `docs: update plugin developer guide`
3. Run lint + tests before pushing
4. Open PR against `master` — describe what/why in the PR body
5. CI must be GREEN before merge

## Plugin Development

See [docs/plugin-developer-guide.md](docs/plugin-developer-guide.md) for:
- Plugin structure and manifest format
- Plugin registry API
- Validation requirements
- Publishing to marketplace

## Architecture Overview

```
src/core/       # Plan-Execute-Verify engine (planner, executor, verifier, orchestrator)
src/agents/     # Modular agents (Git, File, Shell, LeadHunter, ...)
src/plugins/    # Plugin system (registry, validator, marketplace)
tests/          # Test suite (62+ tests)
```

Core pattern: `RecipePlanner` → `RecipeExecutor` → `RecipeVerifier`

## Adding a New Agent

1. Create `src/agents/your_agent.py`
2. Inherit from `AgentBase` (`src/core/agent_base.py`)
3. Implement `plan()`, `execute()`, `verify()`
4. Register in `src/agents/__init__.py` → `AGENT_REGISTRY`
5. Add tests in `tests/test_your_agent.py`

## Questions?

Open an issue with the `question` label or check existing discussions.
