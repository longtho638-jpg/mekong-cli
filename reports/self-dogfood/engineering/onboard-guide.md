# Developer Onboarding Guide
Generated: 2026-03-11

## Prerequisites

| Tool | Min Version | Check |
|------|-------------|-------|
| Python | 3.9+ | `python3 --version` |
| pip / Poetry | latest | `pip --version` |
| Node.js | 18+ | `node --version` |
| pnpm | 8+ | `pnpm --version` |
| Git | 2.30+ | `git --version` |

---

## 1. Clone

```bash
git clone https://github.com/mekong-cli/mekong-cli.git
cd mekong-cli
```

---

## 2. Python Setup

```bash
# Install all deps (including dev tools: pytest, ruff, mypy)
pip install -e ".[dev]"

# Or via Poetry
poetry install --with dev
```

Verify install:
```bash
python3 -c "import src.main; print('OK')"
# Expected: WARNING about LICENSE_SECRET (normal in dev), then OK
```

---

## 3. Environment Variables

```bash
cp .env.example .env
```

Edit `.env` — minimum required for local dev:
```bash
# Pick ONE of these LLM provider combos:

# Option A: OpenRouter (recommended)
LLM_BASE_URL=https://openrouter.ai/api/v1
LLM_API_KEY=sk-or-v1-your-key
LLM_MODEL=anthropic/claude-sonnet-4

# Option B: Local Ollama (free, no API key)
OLLAMA_BASE_URL=http://localhost:11434/v1
LLM_MODEL=qwen2.5-coder

# Dev-only (not needed for unit tests):
# DATABASE_URL=/tmp/mekong-dev.db
# LICENSE_SECRET=dev-secret-change-in-prod
```

---

## 4. Run Tests

```bash
# Fast unit tests (112 tests, ~3s)
python3 -m pytest tests/unit -q

# Full suite (3637 tests, ~4min)
python3 -m pytest tests/ -q

# With coverage
python3 -m pytest tests/unit --cov=src --cov-report=term-missing -q
```

Expected output:
```
112 passed in 3.14s
```

Known warnings (safe to ignore in dev):
- `LICENSE_SECRET not set. Using dev key.`
- `psutil not found.`

---

## 5. Run the CLI

```bash
# Show all commands
python3 -m src.main --help

# Run a goal
python3 -m src.main cook "Create a hello world Python script"

# Or after pip install -e .:
mekong cook "Create a hello world Python script"
```

---

## 6. Run the API Server

```bash
# Start FastAPI server on port 8000
make server
# or:
python3 -m uvicorn src.core.gateway:app --reload --port 8000

# Test it
curl -s http://localhost:8000/health | python3 -m json.tool
```

---

## 7. Run Linting

```bash
# Ruff (fast linter + formatter check)
python3 -m ruff check src/ tests/

# Type check
python3 -m mypy src/ --ignore-missing-imports

# Or via make
make lint
```

---

## 8. Make Your First Change

Suggested starter tasks (low risk, well-tested area):

1. Add a new CLI command:
   - Create `src/commands/my_command.py`
   - Register in `src/main.py` app
   - Add test in `tests/test_my_command.py`

2. Add a new agent:
   - Copy `src/agents/shell_agent.py` as template
   - Register in `src/agents/registry.py`
   - Add test in `tests/test_my_agent.py`

---

## 9. Commit & PR

```bash
# Pre-commit: lint check
python3 -m ruff check src/ tests/

# Run tests
python3 -m pytest tests/unit -q

# Commit (conventional format)
git commit -m "feat: add my-command for X"

# Push
git push origin feature/my-feature
```

Commit types: `feat` | `fix` | `refactor` | `docs` | `test` | `chore`
No AI references in commit messages.

---

## 10. Project Structure Quick Reference

```
src/
├── main.py          # CLI entry (75 lines — Typer app)
├── core/
│   ├── orchestrator.py   # PEV coordination (needs refactor: 1022 lines)
│   ├── planner.py        # LLM decomposition
│   ├── executor.py       # step execution
│   ├── verifier.py       # quality gates
│   ├── llm_client.py     # 7-provider router
│   └── gateway/          # FastAPI app
├── agents/               # pluggable agents
├── api/                  # RaaS HTTP endpoints
├── raas/                 # billing/auth
└── lib/                  # shared utilities

tests/
├── unit/            # 112 fast tests
├── integration/     # require live services
└── e2e/             # end-to-end flows
```
