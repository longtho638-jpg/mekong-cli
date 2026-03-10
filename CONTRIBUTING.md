# Contributing to Mekong CLI

Thank you for your interest in contributing to Mekong CLI! We believe in building together and sharing the rewards.

---

## Revenue Sharing Program

Mekong CLI powers **AgencyOS** — a managed RaaS (Revenue-as-a-Service) platform. Contributors who improve the core engine share in the revenue:

| Contribution Type | Revenue Share | Example |
|-------------------|--------------|---------|
| Core Engine (PEV) | 5% of related revenue | Improve planner, executor, verifier |
| New Agent | 3% of agent usage revenue | Build a new pluggable agent |
| Bug Fix (Critical) | Bounty $50-500 | Fix security vuln, data loss bug |
| Performance | 2% of savings generated | Reduce execution time by 30%+ |
| Documentation | Community credits | Improve docs, tutorials |

Revenue is tracked per-feature via the credit system. Contributors are attributed via git history.

**How it works:**
1. You contribute code to mekong-cli (open-source, MIT)
2. AgencyOS uses mekong-cli as its execution engine
3. When users pay credits for tasks that use your contribution, you earn a share
4. Payouts monthly via Polar.sh (minimum $50 threshold)

See `docs/revenue-sharing.md` for full terms.

---

## Quick Start (5 minutes)

```bash
# Clone
git clone https://github.com/mekong-cli/mekong-cli.git
cd mekong-cli

# Install (editable mode)
pip install -e ".[dev]"

# Configure LLM (any OpenAI-compatible API)
cp .env.example .env
# Edit .env → set LLM_API_KEY

# Verify everything works
python3 -m pytest tests/ -v

# Try it out
mekong cook "Create a hello world Python script"
mekong plan "Build a REST API with FastAPI"
```

### Requirements
- **Python** >= 3.9
- **LLM API key** (OpenAI, Anthropic, or any OpenAI-compatible endpoint)

---

## Code Standards

### File Organization
- Keep files under **200 lines** — split into focused modules
- **snake_case** for Python files (`credit_store.py`)
- Type hints required for all functions
- Docstrings for classes and public methods

### Quality Gates

Your code must pass before merging:

| Gate | Criterion | Command |
|------|-----------|---------|
| Tests | All pass | `make test` |
| Lint | No errors | `make lint` |
| Security | No secrets in code | `grep -r "API_KEY\|SECRET" src/` → 0 |
| Docs | Updated if logic changed | Review |

---

## Architecture

### Plan-Execute-Verify (PEV) — The Core

Every task flows through:

```
Goal → Planner → Executor → Verifier → Result
                                ↓ (fail)
                            Rollback
```

| Module | Purpose |
|--------|---------|
| `src/core/planner.py` | LLM decomposes goals into steps |
| `src/core/executor.py` | Runs steps (shell/LLM/API modes) |
| `src/core/verifier.py` | Validates results against criteria |
| `src/core/orchestrator.py` | Coordinates PEV + automatic rollback |
| `src/core/llm_client.py` | OpenAI-compatible LLM client |

### Adding a New Agent

1. Create `src/agents/your_agent.py`
2. Inherit from `AgentBase` (`src/core/agent_base.py`)
3. Implement `plan()`, `execute()`, `verify()`
4. Register in `src/agents/__init__.py` → `AGENT_REGISTRY`
5. Add tests in `tests/test_your_agent.py`
6. Submit PR — once merged, you earn revenue share on agent usage

### Adding a New LLM Provider

1. Create provider in `src/core/providers.py`
2. Inherit from `LLMProvider`
3. Implement `generate()` method
4. Register in provider registry
5. Add tests

---

## PR Workflow

1. Fork & create branch: `feat/your-feature` or `fix/your-fix`
2. Write code + tests
3. Run: `make test && make lint`
4. Submit PR with clear title and description
5. CI must be GREEN + maintainer approves

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

## Areas We Need Help

| Area | Difficulty | Impact |
|------|-----------|--------|
| DAG execution (parallel task steps) | Hard | High |
| Plugin marketplace | Medium | High |
| New agents (database, cloud, etc.) | Medium | Medium |
| Web dashboard | Medium | High |
| Community recipe registry | Easy | Medium |
| Documentation & tutorials | Easy | Medium |
| Test coverage improvement | Easy | Low |

---

## License

By contributing, you agree your contributions are licensed under the [MIT License](LICENSE).

Questions? Open an issue or join our community discussions.
