<p align="center">
  <img src="docs/assets/logo.png" alt="Mekong CLI" width="120" />
</p>

<h1 align="center">Mekong CLI</h1>

<p align="center">
  <strong>Open-source AI agent framework for autonomous task execution.</strong><br/>
  Plan → Execute → Verify — with built-in credit billing for RaaS.
</p>

<p align="center">
  <a href="https://pypi.org/project/mekong-cli/"><img src="https://img.shields.io/pypi/v/mekong-cli?style=flat-square&color=22c55e" alt="PyPI" /></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue?style=flat-square" alt="MIT License" /></a>
  <img src="https://img.shields.io/badge/python-3.9+-3776AB?style=flat-square&logo=python&logoColor=white" alt="Python 3.9+" />
  <img src="https://img.shields.io/badge/status-beta-orange?style=flat-square" alt="Beta" />
</p>

---

## What is Mekong CLI?

Mekong CLI is an **autonomous AI agent framework** that decomposes high-level goals into executable tasks, runs them, and verifies the results — all in one pipeline.

It's designed for developers building **Revenue-as-a-Service (RaaS)** platforms where AI agents do the work and users pay per task via credits.

```
"Create a FastAPI service with JWT auth"
    ↓
  PLAN   → Decompose into 5 steps (LLM-powered)
    ↓
  EXECUTE → Run each step (shell, API, or LLM mode)
    ↓
  VERIFY  → Validate output against quality gates
    ↓
  DONE   → 3 credits deducted
```

## Quick Start

```bash
# Install
pip install mekong-cli

# Or from source
git clone https://github.com/mekong-cli/mekong-cli.git
cd mekong-cli && pip install -e .

# Configure LLM provider (OpenAI-compatible)
export LLM_BASE_URL="https://api.openai.com/v1"
export LLM_API_KEY="sk-..."

# Run your first task
mekong cook "Create a Python calculator with tests"
```

## Core Concepts

### Plan-Execute-Verify (PEV)

Every task goes through three phases:

| Phase | What happens | Module |
|-------|-------------|--------|
| **Plan** | LLM decomposes goal into steps with dependencies | `src/core/planner.py` |
| **Execute** | Runner handles shell commands, API calls, LLM prompts | `src/core/executor.py` |
| **Verify** | Validates results: exit codes, file checks, LLM assessment | `src/core/verifier.py` |

Failed verification triggers automatic rollback of completed steps.

### Agents

Pluggable agents extend Mekong with domain-specific capabilities:

| Agent | Purpose | Usage |
|-------|---------|-------|
| `GitAgent` | Git operations (status, diff, commit, branch) | `mekong agent git status` |
| `FileAgent` | File operations (find, read, tree, grep) | `mekong agent file find "*.py"` |
| `ShellAgent` | Shell command execution | `mekong agent shell "ls -la"` |
| `RecipeCrawler` | Discover recipe files in the workspace | `mekong agent crawler scan` |

All agents inherit `AgentBase` with the same `plan() → execute() → verify()` flow.

### Credit System (RaaS)

Built-in credit billing for monetizing AI agent work:

```python
from src.raas.sdk import MekongClient

client = MekongClient(
    base_url="https://api.your-raas.com",
    api_key="mk_your_key_here"
)

# Submit a mission (auto-deducts credits)
mission = client.create_mission("Deploy a landing page")
print(f"Mission {mission.id}: {mission.status} ({mission.credits_cost} credits)")

# Check balance
summary = client.get_dashboard_summary()
print(f"Credits remaining: {summary.credits['balance']}")
```

**Credit tiers:**

| Complexity | Credits | Example |
|-----------|---------|---------|
| Simple | 1 | Single file edit, git operation |
| Standard | 3 | Multi-step feature implementation |
| Complex | 5 | Full-stack feature with tests |

## CLI Commands

```bash
mekong cook "<goal>"      # Full PEV pipeline
mekong plan "<goal>"      # Plan only (dry run)
mekong run <recipe.md>    # Execute existing recipe
mekong agent <name> <cmd> # Run agent directly
mekong list               # List available recipes
mekong search <query>     # Search recipes
mekong version            # Show version
```

### Flags

| Flag | Description |
|------|------------|
| `--verbose` | Show step-by-step execution details |
| `--dry-run` | Plan only, no execution |
| `--strict` | Fail on first verification error |
| `--no-rollback` | Skip rollback on failure |

## Architecture

```
mekong-cli/
├── src/
│   ├── core/                 # PEV Engine
│   │   ├── planner.py        # LLM task decomposition
│   │   ├── executor.py       # Multi-mode runner
│   │   ├── verifier.py       # Result validation
│   │   ├── orchestrator.py   # PEV coordination + rollback
│   │   ├── llm_client.py     # OpenAI-compatible client
│   │   └── gateway.py        # FastAPI server + WebSocket
│   ├── agents/               # Pluggable agent system
│   │   ├── git_agent.py      # Git operations
│   │   ├── file_agent.py     # File operations
│   │   ├── shell_agent.py    # Shell execution
│   │   └── recipe_crawler.py # Recipe discovery
│   └── raas/                 # Credit billing (RaaS)
│       ├── credits.py        # Credit store (SQLite)
│       ├── billing.py        # Polar.sh webhook handler
│       ├── tenant.py         # Multi-tenant management
│       ├── missions.py       # Mission lifecycle
│       ├── sdk.py            # Python SDK client
│       └── rate_limiter.py   # Fair-use rate limiting
├── tests/                    # Test suite (62+ tests)
├── recipes/                  # Built-in recipe templates
└── docs/                     # Documentation
```

## API Server

```bash
# Start the gateway
uvicorn src.core.gateway:app --host 0.0.0.0 --port 8000
```

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Health check |
| `/cmd` | POST | Execute PEV pipeline |
| `/missions` | POST | Create mission (credits deducted) |
| `/missions` | GET | List missions |
| `/missions/{id}` | GET | Get mission status |
| `/missions/{id}/cancel` | POST | Cancel + refund credits |
| `/billing/webhook` | POST | Polar.sh webhook receiver |
| `/dashboard/summary` | GET | Tenant dashboard data |

## RaaS Integration

Mekong CLI is the open-source engine behind **Agency OS** — a managed platform where non-technical users submit tasks in natural language and pay per execution via credits.

### How it works

```
Non-tech User → "Build me a landing page"
    ↓
Agency OS Dashboard (commercial)
    ↓
Mekong CLI API → Plan → Execute → Verify
    ↓
Credits deducted → Result delivered
```

### Build your own RaaS

```python
# 1. Create a tenant
from src.raas.tenant import TenantStore
store = TenantStore()
tenant = store.create_tenant("Acme Corp")
print(f"API Key: {tenant.api_key}")  # mk_... (shown once)

# 2. Add credits
from src.raas.credits import CreditStore
credits = CreditStore()
credits.add(tenant.id, 100, "initial_grant")

# 3. Submit missions via API
# POST /missions with Bearer token
# Body: {"goal": "Create a REST API for users"}
```

## Configuration

Copy `.env.example` and set:

```bash
# LLM Provider (any OpenAI-compatible API)
LLM_BASE_URL=https://api.openai.com/v1
LLM_API_KEY=sk-...

# Billing (optional, for RaaS)
POLAR_WEBHOOK_SECRET=whsec_...

# Database (default: ~/.mekong/raas/tenants.db)
RAAS_DB_PATH=~/.mekong/raas/tenants.db
```

## Development

```bash
# Install dependencies
pip install poetry && poetry install

# Run tests
python3 -m pytest tests/ -v

# Type check
python3 -m mypy src/ --ignore-missing-imports

# Start dev server
uvicorn src.core.gateway:app --reload --port 8000
```

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines. Key rules:

1. All code must pass `python3 -m pytest`
2. Type hints required for all functions
3. File size < 200 lines (split into modules)
4. No secrets in code (`grep -r "API_KEY" src` = 0 results)

## Roadmap

- [x] PEV Engine (Plan-Execute-Verify)
- [x] Agent System (Git, File, Shell)
- [x] Credit Billing (SQLite, Polar.sh)
- [x] Multi-tenant isolation
- [x] Python SDK
- [ ] DAG execution (parallel task steps)
- [ ] Plugin marketplace
- [ ] Web dashboard (open-source)
- [ ] Community recipe registry

## License

[MIT](LICENSE) — Use it, fork it, build on it.

---

<p align="center">
  <strong>Mekong CLI</strong> &copy; 2026 <a href="https://binhphap.io">Binh Phap Venture Studio</a><br/>
  <em>"Speed is the essence of war." — Sun Tzu</em>
</p>
