<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://img.shields.io/badge/🐉_MEKONG_CLI-0d1117?style=for-the-badge&labelColor=0d1117&color=0d1117">
    <img alt="Mekong CLI" src="https://img.shields.io/badge/🐉_MEKONG_CLI-ffffff?style=for-the-badge&labelColor=ffffff&color=ffffff">
  </picture>
</p>

<h1 align="center">
  Mekong CLI
</h1>

<p align="center">
  <strong>The AI agent that plans, executes & verifies — so you don't babysit.</strong>
</p>

<p align="center">
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-22c55e?style=flat-square" alt="MIT" /></a>
  <a href="https://github.com/longtho638-jpg/mekong-cli/actions"><img src="https://img.shields.io/github/actions/workflow/status/longtho638-jpg/mekong-cli/ci.yml?style=flat-square&label=CI" alt="CI" /></a>
  <img src="https://img.shields.io/badge/Python-3.9+-3776AB?style=flat-square&logo=python&logoColor=white" alt="Python" />
  <img src="https://img.shields.io/badge/LLM-Any_Provider-8B5CF6?style=flat-square" alt="LLM" />
  <img src="https://img.shields.io/badge/v0.2.0-blue?style=flat-square" alt="Version" />
</p>

<p align="center">
  <a href="#quick-start">Quick Start</a> •
  <a href="#how-it-works">How It Works</a> •
  <a href="#agents">Agents</a> •
  <a href="#raas">RaaS</a> •
  <a href="CONTRIBUTING.md">Contribute</a>
</p>

---

## Why Mekong?

Most AI tools generate code and hope it works. Mekong **plans**, **executes**, and **verifies** — then rolls back if anything breaks.

```
You: "Create a FastAPI service with JWT auth and tests"

Mekong:
  📋 PLAN     → LLM decomposes into 5 steps with dependency graph
  ⚡ EXECUTE  → Runs each step (shell, code gen, API calls)
  ✅ VERIFY   → Tests pass? Types clean? Builds green?
  🏁 DONE     → All verified. Ship it.

  ❌ FAILED?  → Auto-rollback → Retry with corrected approach.
```

**Zero babysitting. Zero hallucination tolerance.**

## Quick Start

```bash
# 1. Install
git clone https://github.com/longtho638-jpg/mekong-cli.git
cd mekong-cli && pip install -e ".[dev]"

# 2. Configure any OpenAI-compatible LLM
export LLM_BASE_URL="https://api.openai.com/v1"
export LLM_API_KEY="sk-..."

# 3. Go
mekong cook "Create a Python calculator with tests"
```

### Works with every LLM

| Provider | Base URL | Cost |
|----------|----------|------|
| **OpenAI** | `https://api.openai.com/v1` | Pay-per-use |
| **Google Gemini** | `https://generativelanguage.googleapis.com/v1beta/openai` | Free tier |
| **DashScope (Qwen)** | `https://dashscope.aliyuncs.com/compatible-mode/v1` | [Free $50 credits →](https://www.alibabacloud.com/campaign/benefits?referral_code=A9245T) |
| **Ollama (Local)** | `http://localhost:11434/v1` | Free |
| **Any proxy** | Your OpenAI-compatible endpoint | Custom |

## How It Works

### Plan → Execute → Verify (PEV)

```
┌──────────────────────────────────────────────┐
│              🎯 Your Goal                     │
└──────────────┬───────────────────────────────┘
               │
    ┌──────────▼──────────┐
    │  📋 PLAN             │  LLM decomposes goal into
    │  RecipePlanner       │  ordered steps + dependencies
    └──────────┬──────────┘
               │
    ┌──────────▼──────────┐
    │  ⚡ EXECUTE          │  Runs shell, code gen, API
    │  RecipeExecutor      │  calls — parallel where safe
    └──────────┬──────────┘
               │
    ┌──────────▼──────────┐
    │  ✅ VERIFY           │  Exit codes, tests, types,
    │  RecipeVerifier      │  file checks, LLM assessment
    └──────────┬──────────┘
               │
       ┌───────┴───────┐
       │               │
    ✅ Pass         ❌ Fail
       │               │
    🏁 Done        ⏪ Rollback → Retry
```

| Phase | Module | What It Does |
|-------|--------|-------------|
| **Plan** | `src/core/planner.py` | LLM decomposes goal into steps with dependency graph |
| **Execute** | `src/core/executor.py` | Runs shell/code/API tasks, parallel where possible |
| **Verify** | `src/core/verifier.py` | Validates results against success criteria |
| **Orchestrate** | `src/core/orchestrator.py` | Coordinates PEV loop, rollback, self-healing |

## Agents

All agents follow the same `plan() → execute() → verify()` pattern:

```bash
mekong agent git status              # Git operations
mekong agent git commit "feat: ..."  # Smart commits
mekong agent file find "*.py"        # File search & analysis
mekong agent file tree src/          # Directory tree
mekong agent shell "npm test"        # Safe shell execution
mekong agent lead hunt               # Lead generation
mekong agent content write           # SEO content
mekong agent crawler scan            # Recipe discovery
```

[Build your own agent →](CONTRIBUTING.md)

## CLI

```bash
mekong cook  "Build a REST API"      # Full PEV pipeline
mekong plan  "Add OAuth support"     # Plan only (dry run)
mekong run   recipe.md               # Execute recipe file
mekong agent <name> <command>        # Run agent directly
mekong gateway --port 8000           # Start API server
mekong list                          # List available recipes
mekong search "deploy"               # Search recipes
```

| Flag | Effect |
|------|--------|
| `--verbose / -v` | Step-by-step execution details |
| `--dry-run / -n` | Plan only, no execution |
| `--strict` | Fail on first verification error |
| `--json / -j` | Machine-readable JSON output |

## API

Start the gateway: `mekong gateway --port 8000`

```
POST   /v1/tasks              # Submit task (credits deducted)
GET    /v1/tasks/{id}         # Task status
GET    /v1/tasks/{id}/stream  # SSE real-time progress
GET    /v1/agents             # List agents
POST   /v1/agents/{name}/run  # Invoke agent
POST   /v1/license/validate   # Validate license key
GET    /health                # Health check
POST   /billing/webhook       # Polar.sh webhook
```

```bash
curl -X POST http://localhost:8000/v1/tasks \
  -H "Authorization: Bearer mk_your_key" \
  -H "Content-Type: application/json" \
  -d '{"goal": "Create a todo app with tests", "strict": false}'
```

## RaaS

**Revenue as a Service** — Open Core model with built-in credit billing.

| Tier | Credits | Agents |
|------|---------|--------|
| **Free** | 10/month | Core agents |
| **Pro** | 200/month | All agents |
| **Enterprise** | Custom | Custom + API |

| Complexity | Credits | Example |
|-----------|---------|---------|
| Simple | 1 | File edit, git op |
| Standard | 3 | Feature with tests |
| Complex | 5 | Full-stack + deploy |

```python
from src.raas.sdk import MekongClient

client = MekongClient("https://api.mekong.io", "mk_your_key")
result = client.cook("Deploy a landing page")

for event in client.stream_task(result.task_id):
    print(f"Step {event['step']}: {event['title']}")
```

### Premium Agents (License Required)

| Agent | Description |
|-------|-------------|
| `auto-cto-pilot` | Autonomous daily task generation |
| `opus-strategy` | Strategic planning with top-tier LLM |
| `opus-parallel` | Multi-agent parallel orchestration |
| `opus-review` | Security + quality code review |

## Architecture

```
mekong-cli/
├── src/                    # Core engine (Python)
│   ├── core/               # PEV pipeline
│   │   ├── planner.py      # LLM → recipe decomposition
│   │   ├── executor.py     # Shell/code/API runner
│   │   ├── verifier.py     # Quality gate validation
│   │   └── orchestrator.py # PEV loop + rollback
│   ├── agents/             # Pluggable agent system
│   └── raas/               # Credit billing + SDK
├── apps/                   # Services
│   ├── openclaw-worker/    # Autonomous CTO daemon
│   ├── raas-gateway/       # Cloudflare Worker API
│   └── algo-trader/        # Trading engine
├── packages/               # Shared TypeScript libraries
├── tests/                  # Test suite (62 tests)
├── recipes/                # Built-in task templates
└── docs/                   # Documentation
```

## Development

```bash
# Python
pip install -e ".[dev]"
python3 -m pytest              # Run tests

# Node.js (apps & packages)
pnpm install
pnpm run build
pnpm run test
```

## Mekong vs. Alternatives

| Feature | Mekong | Aider | Cursor | Copilot |
|---------|--------|-------|--------|---------|
| Plan → Execute → Verify | ✅ | ❌ | ❌ | ❌ |
| Auto-rollback on failure | ✅ | ❌ | ❌ | ❌ |
| Multiple agents | ✅ 12+ | ❌ | ❌ | ❌ |
| Any LLM provider | ✅ | ✅ | ❌ | ❌ |
| Built-in billing/RaaS | ✅ | ❌ | ❌ | ❌ |
| REST API + WebSocket | ✅ | ⚠️ | ❌ | ⚠️ |
| Self-hosted | ✅ | ✅ | ❌ | ❌ |

## Contributing

Contributors **share in revenue** generated by AgencyOS usage of their code.

- **Agent submissions** → 10% of credits used
- **Recipe contributions** → 5% of credits used
- **Bug bounties** → $50–$500

See [CONTRIBUTING.md](CONTRIBUTING.md) for details.

## Roadmap

- [x] PEV Engine (Plan → Execute → Verify)
- [x] Agent System (Git, File, Shell, Database, Lead, Content)
- [x] Credit Billing (SQLite + Polar.sh)
- [x] Multi-provider LLM support
- [x] Python SDK (sync + async)
- [x] FastAPI Gateway + WebSocket streaming
- [ ] Web dashboard
- [ ] Recipe marketplace
- [ ] npm/PyPI packages
- [ ] Plugin system

## License

[MIT](LICENSE) — Use it, fork it, build on it.

---

<p align="center">
  <sub>Built with 🐉 by <a href="https://binhphap.io">Binh Phap Venture Studio</a></sub><br/>
  <sub><em>"Speed is the essence of war." — Sun Tzu</em></sub>
</p>
