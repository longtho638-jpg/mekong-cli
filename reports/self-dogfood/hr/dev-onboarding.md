# Developer Onboarding — Mekong CLI

**For:** New engineers joining the team | **Time to productive:** 1 day

---

## Environment Setup

### Prerequisites

```bash
# Required
python3 --version   # 3.11+
git --version       # any recent
node --version      # 18+ (for docs site only)

# Recommended
gh auth login       # GitHub CLI
```

### Full Setup

```bash
# 1. Clone
git clone https://github.com/longtho638-jpg/mekong-cli
cd mekong-cli

# 2. Python environment
python3 -m venv .venv
source .venv/bin/activate      # Linux/Mac
# .venv\Scripts\activate       # Windows

# 3. Install with dev dependencies
pip install -e ".[dev]"

# 4. Environment variables
cp .env.example .env
# Edit .env with your LLM credentials

# 5. Verify installation
mekong --version
python3 -m pytest tests/ -v

# 6. Run a test mission
mekong ask "list all available commands"
```

### LLM Configuration Options

```bash
# Option A: OpenRouter (recommended — access to all models)
export LLM_BASE_URL=https://openrouter.ai/api/v1
export LLM_API_KEY=sk-or-v1-...
export LLM_MODEL=anthropic/claude-sonnet-4

# Option B: Anthropic direct
export LLM_BASE_URL=https://api.anthropic.com/v1
export LLM_API_KEY=sk-ant-...
export LLM_MODEL=claude-sonnet-4-5

# Option C: Local Ollama
export LLM_BASE_URL=http://localhost:11434/v1
export LLM_API_KEY=ollama
export LLM_MODEL=llama3.2
```

---

## Architecture Overview

```
mekong-cli/
├── src/
│   ├── core/
│   │   ├── planner.py       # LLM task decomposition
│   │   ├── executor.py      # Shell/LLM/API execution
│   │   ├── verifier.py      # Quality gates + rollback
│   │   ├── orchestrator.py  # PEV loop coordination
│   │   └── llm_client.py    # Universal LLM router
│   ├── agents/
│   │   ├── git_agent.py
│   │   ├── file_agent.py
│   │   ├── shell_agent.py
│   │   └── lead_hunter.py
│   └── api/
│       ├── routes.py        # FastAPI endpoints
│       ├── auth.py          # API key validation
│       └── billing.py       # MCU credit ledger
├── .claude/
│   ├── commands/            # 176 command definitions (.md)
│   └── skills/              # 542 skill definitions
├── factory/
│   └── contracts/           # 176 JSON machine contracts
├── mekong/
│   ├── adapters/            # LLM provider configs
│   ├── infra/               # 4-layer deploy templates
│   └── daemon/              # Tôm Hùm autonomous dispatch
├── tests/
└── docs/
```

### PEV Loop (Core Concept)

Every `mekong` command runs through:

```
Input command
     ↓
[P] Planner — LLM decomposes task into steps
     ↓
[E] Executor — Runs each step (shell/LLM/API)
     ↓
[V] Verifier — Checks output quality, rolls back if needed
     ↓
Output + MCU deduction
```

Understanding PEV is the key to understanding everything else.

---

## Key Files to Read First

| File | Why |
|------|-----|
| `CLAUDE.md` | Project constitution — rules, architecture, namespace |
| `src/core/orchestrator.py` | PEV loop implementation |
| `src/core/llm_client.py` | Universal LLM adapter |
| `.claude/commands/cook.md` | Most-used command — shows command pattern |
| `factory/contracts/cook.json` | JSON contract for cook command |
| `tests/test_core.py` | How we test the core |

---

## Development Workflow

```bash
# Daily workflow
git pull origin main
# Work on feature branch
git checkout -b feat/your-feature

# After changes
python3 -m pytest tests/ -v        # Must pass
python3 -m pytest tests/ --cov     # Check coverage
mekong review                       # Self-review with AI

# Commit
git add src/your-file.py tests/test_your_file.py
git commit -m "feat: add X command to Engineer layer"
git push origin feat/your-feature
gh pr create
```

---

## Code Standards

| Standard | Rule |
|----------|------|
| File size | < 200 lines — split if larger |
| Type hints | Required on all functions |
| Docstrings | Every class and public method |
| Error handling | Try/except on all external calls |
| Naming | snake_case (Python), kebab-case (files) |
| Tests | Every new feature needs test coverage |
| Commits | Conventional: feat/fix/refactor/docs/test/chore |

---

## First Week Goals

| Day | Goal |
|-----|------|
| Day 1 | Setup complete, tests passing, first command run |
| Day 2 | Read all key files, understand PEV loop |
| Day 3 | Fix a `good first issue` bug |
| Day 4 | Submit first PR |
| Day 5 | PR reviewed and merged (or revisions done) |
