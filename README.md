<p align="center">
  <img src="docs/assets/logo.png" alt="Mekong CLI" width="120" />
</p>

<h1 align="center">Mekong CLI</h1>

<p align="center">
  <strong>Open-source AI agent framework for autonomous task execution.</strong><br/>
  Plan → Execute → Verify — with built-in credit billing for RaaS.
</p>

<p align="center">
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue?style=flat-square" alt="MIT License" /></a>
  <img src="https://img.shields.io/badge/python-3.9+-3776AB?style=flat-square&logo=python&logoColor=white" alt="Python 3.9+" />
  <img src="https://img.shields.io/badge/tests-1121%20passing-22c55e?style=flat-square" alt="Tests" />
  <img src="https://img.shields.io/badge/version-3.1.0-orange?style=flat-square" alt="v3.1.0" />
</p>

---

## What is Mekong CLI?

Mekong CLI is an **autonomous AI agent framework** that decomposes high-level goals into executable tasks, runs them, and verifies the results — all in one pipeline.

It's the open-source engine behind **AgencyOS** — a managed RaaS (Revenue-as-a-Service) platform. Contributors who improve the core engine **share in the revenue**. See [CONTRIBUTING.md](CONTRIBUTING.md) for details.

```
"Create a FastAPI service with JWT auth"
    ↓
  PLAN    → LLM decomposes into 5 steps
    ↓
  EXECUTE → Run each step (shell, API, or LLM)
    ↓
  VERIFY  → Validate output against quality gates
    ↓
  DONE    → 3 credits deducted
```

## Quick Start

```bash
# Install from source
git clone https://github.com/mekong-cli/mekong-cli.git
cd mekong-cli
pip install -e ".[dev]"

# Configure LLM (any OpenAI-compatible API)
cp .env.example .env
# Edit .env → set LLM_API_KEY

# Run your first task
mekong cook "Create a Python calculator with tests"

# Plan without executing
mekong plan "Build a REST API with FastAPI"

# Debug an issue
mekong debug "Fix the broken tests"
```

### Works with any LLM provider

```bash
# OpenAI
export LLM_BASE_URL="https://api.openai.com/v1"
export LLM_API_KEY="sk-..."

# Anthropic (via compatible proxy)
export LLM_BASE_URL="https://your-proxy.com/v1"
export LLM_API_KEY="your-key"

# Local (Ollama, LM Studio, etc.)
export LLM_BASE_URL="http://localhost:11434/v1"
export LLM_API_KEY="not-needed"
```

## Core Concepts

### Plan-Execute-Verify (PEV)

Every task goes through three phases:

| Phase | What happens | Module |
|-------|-------------|--------|
| **Plan** | LLM decomposes goal into steps with dependencies | `src/core/planner.py` |
| **Execute** | Runner handles shell commands, API calls, LLM prompts | `src/core/executor.py` |
| **Verify** | Validates results: exit codes, file checks, LLM assessment | `src/core/verifier.py` |

Failed verification triggers **automatic rollback** of completed steps.

### Agents

Pluggable agents extend Mekong with domain-specific capabilities:

| Agent | Purpose | Usage |
|-------|---------|-------|
| `GitAgent` | Git operations (status, diff, commit, branch) | `mekong agent git status` |
| `FileAgent` | File operations (find, read, tree, grep) | `mekong agent file find "*.py"` |
| `ShellAgent` | Shell command execution | `mekong agent shell "ls -la"` |
| `RecipeCrawler` | Discover recipe files in the workspace | `mekong agent crawler scan` |
| `LeadHunter` | Find CEO/decision-maker contacts | `mekong agent lead hunt` |
| `ContentWriter` | Generate SEO content | `mekong agent content write` |

All agents inherit `AgentBase` with the same `plan() → execute() → verify()` flow. **Want to build your own agent? See [CONTRIBUTING.md](CONTRIBUTING.md).**

### Credit System (RaaS)

Built-in credit billing for monetizing AI agent work:

```python
from src.raas.sdk import MekongClient

client = MekongClient(
    base_url="https://api.your-raas.com",
    api_key="mk_your_key_here"
)

# Submit a task (auto-deducts credits)
result = client.submit_task("Deploy a landing page")
print(f"Task {result.task_id}: {result.status}")

# Stream real-time progress (SSE)
for event in client.stream_task(result.task_id):
    print(f"Step {event['order']}: {event['title']}")
```

| Complexity | Credits | Example |
|-----------|---------|---------|
| Simple | 1 | Single file edit, git operation |
| Standard | 3 | Multi-step feature implementation |
| Complex | 5 | Full-stack feature with tests |

## CLI Commands

```bash
mekong cook "<goal>"          # Full PEV pipeline
mekong plan "<goal>"          # Plan only (dry run)
mekong run <recipe.md>        # Execute existing recipe
mekong agent <name> <cmd>     # Run agent directly
mekong list                   # List available recipes
mekong search <query>         # Search recipes
mekong ask "<question>"       # Quick plan for a question
mekong debug "<issue>"        # Generate debug plan
mekong gateway                # Start API server
mekong dash                   # Interactive action menu
mekong evolve                 # Self-improvement cycle
mekong version                # Show version (v3.0.0)
```

### Flags

| Flag | Description |
|------|------------|
| `--verbose` / `-v` | Show step-by-step execution details |
| `--dry-run` / `-n` | Plan only, no execution |
| `--strict` | Fail on first verification error (default: on) |
| `--no-rollback` | Skip rollback on failure |
| `--json` / `-j` | Machine-readable JSON output |

## Architecture

```
mekong-cli/
├── src/
│   ├── core/                  # PEV Engine
│   │   ├── planner.py         # LLM task decomposition
│   │   ├── executor.py        # Multi-mode runner
│   │   ├── verifier.py        # Result validation + quality gates
│   │   ├── orchestrator.py    # PEV coordination + rollback
│   │   ├── llm_client.py      # OpenAI-compatible LLM client
│   │   ├── gateway.py         # FastAPI server + WebSocket
│   │   ├── dag_scheduler.py   # DAG-based parallel execution
│   │   ├── providers.py       # Multi-provider LLM support
│   │   ├── plugin_loader.py   # Community plugin system
│   │   └── ...                # 30+ core modules
│   ├── agents/                # Pluggable agent system
│   │   ├── git_agent.py       # Git operations
│   │   ├── file_agent.py      # File operations
│   │   ├── shell_agent.py     # Shell execution
│   │   ├── recipe_crawler.py  # Recipe discovery
│   │   ├── lead_hunter.py     # Lead generation
│   │   └── content_writer.py  # Content creation
│   └── raas/                  # Credit billing (RaaS)
│       ├── credits.py         # Credit store (SQLite)
│       ├── billing.py         # Polar.sh webhook handler
│       ├── tenant.py          # Multi-tenant management
│       ├── missions.py        # Mission lifecycle
│       ├── sdk.py             # Python SDK (sync + async)
│       └── rate_limiter.py    # Fair-use rate limiting
├── tests/                     # 1168 tests (100% pass rate)
├── recipes/                   # Built-in recipe templates
└── docs/                      # Documentation
```

## API Server

```bash
# Start the gateway
mekong gateway --port 8000
# Or: make server
```

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Health check |
| `/cmd` | POST | Execute PEV pipeline |
| `/v1/tasks` | POST | Submit task (credits deducted) |
| `/v1/tasks/{id}` | GET | Poll task status + results |
| `/v1/tasks/{id}/stream` | GET | SSE real-time progress |
| `/v1/agents` | GET | List registered agents |
| `/v1/agents/{name}/run` | POST | Run agent directly |
| `/billing/webhook` | POST | Polar.sh webhook receiver |

## Build Your Own RaaS

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

# 3. Submit tasks via API or SDK
from src.raas.sdk import MekongClient
client = MekongClient("https://api.your-raas.com", tenant.api_key)
result = client.submit_task("Create a REST API for users")
```

## Development

```bash
make install    # Install (editable)
make dev        # Install with dev deps
make test       # Run 1168 tests
make lint       # Ruff + mypy
make format     # Auto-format
make server     # Start dev server
make clean      # Remove artifacts
```

## Contributing & Revenue Sharing

We believe contributors should share in the value they create. See [CONTRIBUTING.md](CONTRIBUTING.md) for:

- **Revenue sharing program** — earn from AgencyOS usage of your contributions
- **Code standards** — quality gates, architecture patterns
- **PR workflow** — fork, branch, test, submit

## Roadmap

- [x] PEV Engine (Plan-Execute-Verify)
- [x] Agent System (Git, File, Shell, Lead, Content)
- [x] Credit Billing (SQLite, Polar.sh)
- [x] Multi-tenant isolation
- [x] Python SDK (sync + async)
- [x] DAG scheduler (parallel task steps)
- [x] Multi-provider LLM support
- [x] Plugin loader
- [ ] Plugin marketplace
- [ ] Web dashboard (open-source)
- [ ] Community recipe registry
- [ ] npm/pip package publishing

## Powered By

<p align="center">
  <a href="https://claudekit.cc/?ref=B0DXGRIX"><img src="https://img.shields.io/badge/Powered%20by-ClaudeKit-7c3aed?style=for-the-badge&logo=data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48Y2lyY2xlIGN4PSIxMiIgY3k9IjEyIiByPSIxMCIgZmlsbD0id2hpdGUiLz48L3N2Zz4=" alt="ClaudeKit" /></a>
</p>

Mekong CLI's agentic workflow system is built on [ClaudeKit](https://claudekit.cc/?ref=B0DXGRIX) — the industry-leading engineer toolkit with **50+ commands**, **80+ skills**, and **17+ specialized agents**. ClaudeKit provides the DNA for our Plan-Execute-Verify pipeline and multi-agent orchestration.

👉 **[Get ClaudeKit →](https://claudekit.cc/?ref=B0DXGRIX)**

## License

[MIT](LICENSE) — Use it, fork it, build on it.

---

<p align="center">
  <strong>Mekong CLI</strong> v3.0.0 &copy; 2026 <a href="https://binhphap.io">Binh Phap Venture Studio</a><br/>
  <em>"Speed is the essence of war." — Sun Tzu</em>
</p>
