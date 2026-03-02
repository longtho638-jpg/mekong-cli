# Contributing to Mekong CLI

Thank you for your interest in contributing to Mekong CLI!

---

## Setting Up

### Requirements
- **Python**: >= 3.9
- **Poetry**: For dependency management

### Installation
```bash
git clone https://github.com/mekong-cli/mekong-cli.git
cd mekong-cli
pip install poetry
poetry install
cp .env.example .env
python3 -m pytest tests/ -v
```

---

## Code Standards

### File Organization
- Keep files under **200 lines** — split into focused modules
- **snake_case** for Python files (`credit_store.py`)
- Type hints required for all functions
- Docstrings for classes and public methods

### Quality Gates

Your code must pass these checks before merging:

| Gate | Criterion | Verification |
|------|-----------|-------------|
| Tests | All pass, coverage must not decrease | `python3 -m pytest tests/ -v` |
| Type Safety | 100% type hints in Python | `grep -r ": any" src/ \| wc -l` → 0 |
| Tech Debt | No TODOs/FIXMEs in production | `grep -r "TODO\|FIXME" src/ \| wc -l` → 0 |
| Security | No hardcoded secrets | `grep -r "API_KEY\|SECRET" src/ \| wc -l` → 0 |
| Docs | Updated for any logic changes | Review |

---

## Architecture

### Plan-Execute-Verify (PEV)

Core pattern — all features follow this flow:

```
Planner → Executor → Verifier → (Rollback on failure)
```

- `src/core/planner.py` — LLM decomposes goals into steps
- `src/core/executor.py` — Runs steps (shell/LLM/API modes)
- `src/core/verifier.py` — Validates results against criteria
- `src/core/orchestrator.py` — Coordinates PEV + automatic rollback

### Adding a New Agent

1. Create `src/agents/your_agent.py`
2. Inherit from `AgentBase` (`src/core/agent_base.py`)
3. Implement `plan()`, `execute()`, `verify()`
4. Register in `src/agents/__init__.py` → `AGENT_REGISTRY`
5. Add tests in `tests/test_your_agent.py`

---

## PR Workflow

1. Fork & create branch: `feat/your-feature` or `fix/your-fix`
2. Write code + tests
3. Verify: `python3 -m pytest tests/ -v`
4. Submit PR with clear title and description
5. Merged when CI is GREEN + maintainer approves

### Commit Convention
```
feat: [module] - Add new feature
fix: [module] - Fix bug
refactor: [module] - Code improvement
test: [module] - Add/update tests
docs: Update documentation
```

**Never** commit `.env`, API keys, or credentials.

---

## License

By contributing, you agree your contributions are licensed under the [MIT License](LICENSE).
