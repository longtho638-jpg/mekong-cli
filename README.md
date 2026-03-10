<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://img.shields.io/badge/🐉_MEKONG_CLI-0d1117?style=for-the-badge&labelColor=0d1117&color=0d1117">
    <img alt="Mekong CLI" src="https://img.shields.io/badge/🐉_MEKONG_CLI-ffffff?style=for-the-badge&labelColor=ffffff&color=ffffff">
  </picture>
</p>

<h1 align="center">Mekong CLI</h1>

<p align="center"><strong>The terminal OS for AI-native founders.</strong></p>

<p align="center">
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-22c55e?style=flat-square" alt="MIT" /></a>
  <img src="https://img.shields.io/badge/Python-3.9+-3776AB?style=flat-square&logo=python&logoColor=white" alt="Python 3.9+" />
  <img src="https://img.shields.io/badge/v3.1.0-8B5CF6?style=flat-square" alt="v3.1.0" />
  <img src="https://img.shields.io/badge/AGI_Score-97.6%2F100-22c55e?style=flat-square" alt="AGI Score 97.6/100" />
  <a href="https://github.com/longtho638-jpg/mekong-cli/actions"><img src="https://img.shields.io/github/actions/workflow/status/longtho638-jpg/mekong-cli/ci.yml?style=flat-square&label=CI" alt="CI" /></a>
</p>

<p align="center">
  <a href="#quick-start">Quick Start</a> •
  <a href="#how-it-works">How It Works</a> •
  <a href="#commands">Commands</a> •
  <a href="#agencyos-raas">AgencyOS</a> •
  <a href="#roadmap">Roadmap</a>
</p>

---

Mekong CLI is an autonomous agent framework that plans, executes, and verifies — then rolls back if anything breaks. 55 commands. From `mekong cook` to `/founder ipo-day`. For founders who run their company from the terminal.

## Quick Start

```bash
pip install mekong-cli              # or: git clone + pip install -e ".[dev]"
export LLM_BASE_URL="https://api.openai.com/v1"
export LLM_API_KEY="sk-..."
mekong cook "Build me a SaaS landing page"
```

### Works with every LLM provider

| Provider | Base URL | Cost |
|----------|----------|------|
| **OpenAI** | `https://api.openai.com/v1` | Pay-per-use |
| **Google Gemini** | `https://generativelanguage.googleapis.com/v1beta/openai` | Free tier |
| **DashScope (Qwen)** | `https://coding-intl.dashscope.aliyuncs.com/v1` | [Free credits →](https://www.alibabacloud.com/campaign/benefits?referral_code=A9245T) |
| **Ollama (local)** | `http://localhost:11434/v1` | Free |
| **Any proxy** | Your OpenAI-compatible endpoint | Custom |

## The Journey

```
IDEA ─── BUILD ─── SEED ─── A ─── B ─── C ─── PRE-IPO ─── IPO ─── PUBLIC
  │        │        │       │     │     │        │          │         │
validate  cook    raise   pitch  grow  scale  pre-ipo    ipo-day  public-co
brand     fix     credits  vc/*  hire         s1          insider  succession
          plan                   legal        roadshow
```

## How It Works

```
┌─────────────────────────────────────────────────────────────┐
│                    AgencyOS (RaaS Layer)                     │
│  Dashboard · /v1/missions · MCU Billing · Polar.sh Webhooks │
├─────────────────────────────────────────────────────────────┤
│                   OpenClaw (Orchestrator)                    │
├──────────┬──────────┬──────────┬──────────────────────────┤
│  📋 PLAN  │  ⚡ EXEC  │  ✅ VERIFY │     🤖 AGENTS           │
│ planner  │ executor │ verifier │  git·file·shell·db·lead  │
├──────────┴──────────┴──────────┴──────────────────────────┤
│                        LLM Router                           │
│  Claude · Gemini · Qwen · Ollama · Antigravity Proxy:9191  │
└─────────────────────────────────────────────────────────────┘
```

| Phase | Module | What It Does |
|-------|--------|-------------|
| **Plan** | `src/core/planner.py` | LLM decomposes goal into ordered steps with dependency graph |
| **Execute** | `src/core/executor.py` | Runs shell/code/API tasks in parallel where safe |
| **Verify** | `src/core/verifier.py` | Exit codes, tests, types, file checks, LLM assessment |
| **Orchestrate** | `src/core/orchestrator.py` | Coordinates PEV loop, rollback, self-healing |

## Quick Demo

```bash
$ mekong cook "Add Stripe billing to my FastAPI app"
$ /founder validate --product "AI coding assistant for solo devs"
$ /founder pitch --investor yc --rounds 10
$ /founder vc/term-sheet --file term.pdf
$ /founder ipo-day --exchange nasdaq
```

## Commands

### Core (13)

| Command | Description |
|---------|-------------|
| `cook` | Full PEV pipeline — plan, execute, verify |
| `fix` | Debug and fix bugs with auto-rollback |
| `plan` | Create implementation plan (dry run) |
| `review` | Code quality review |
| `status` | System health check |
| `help` | Command reference |
| `deploy` | Deployment orchestration |
| `launch` | Launch copy for PH, HN, Reddit |
| `credits` | Find startup credits and programs |
| `pricing` | Pricing strategy and tier modeling |
| `raise` | Fundraising prep (tactical) |
| `fundraise` | Fundraising playbook (strategic) |
| `cofounder` | Co-founder strategy |

### Company (6)

| Command | Description |
|---------|-------------|
| `company/init` | Initialize agentic company (8 AI agents) |
| `company/agent` | Manage agents — list, ask, train |
| `company/billing` | MCU balance and billing |
| `company/report` | Business intelligence reports |
| `company/run` | Universal task runner |
| `company/workflow` | Automated workflows |

### Founder (9)

| Command | Description |
|---------|-------------|
| `founder/validate` | Customer discovery and PMF |
| `founder/brand` | Brand identity and positioning |
| `founder/pitch` | Pitch deck practice with AI investor |
| `founder/metrics` | KPI dashboard and anomaly detection |
| `founder/hire` | Agentic recruiting and interview kits |
| `founder/legal` | Legal checklist and IP protection |
| `founder/week` | Weekly CEO rhythm |
| `founder/grow` | GTM playbook execution |
| `founder/secondary` | Founder liquidity mechanics |

### VC (5)

| Command | Description |
|---------|-------------|
| `founder/vc/bootstrap` | Path to $1M ARR without VC |
| `founder/vc/cap-table` | Dilution modeling and exit waterfall |
| `founder/vc/negotiate` | BATNA tactics and counter-offers |
| `founder/vc/term-sheet` | Term sheet red flag detection |
| `founder/vc-map` | VC landscape mapping |

### IPO (7)

| Command | Description |
|---------|-------------|
| `founder/ipo/pre-ipo-prep` | 18-month IPO readiness audit |
| `founder/ipo/s1` | S-1 prospectus framework |
| `founder/ipo/roadshow` | 2-week roadshow sprint |
| `founder/ipo/ipo-day` | IPO Day execution playbook |
| `founder/ipo/public-co` | Public company quarterly rhythm |
| `founder/ipo/insider` | Insider compliance and IR |
| `founder/ipo/succession` | Post-IPO: buybacks, M&A, CEO transition |

### RaaS (5)

| Command | Description |
|---------|-------------|
| `raas/billing` | Billing integration (Polar.sh) |
| `raas/bootstrap` | Bootstrap RaaS service |
| `raas/deploy` | Deploy RaaS to production |
| `raas/mission` | Dispatch AGI mission |
| `raas/status` | RaaS health check |

### Bootstrap (3)

| Command | Description |
|---------|-------------|
| `bootstrap/auto` | Auto bootstrap project |
| `bootstrap/auto/fast` | Quick bootstrap |
| `bootstrap/auto/parallel` | Parallel bootstrap |

## CLI Flags

| Flag | Effect |
|------|--------|
| `--verbose / -v` | Step-by-step execution details |
| `--dry-run / -n` | Plan only, no execution |
| `--strict` | Fail on first verification error |
| `--json / -j` | Machine-readable JSON output |

## AgencyOS RaaS

AgencyOS is the hosted platform built on Mekong CLI — a Revenue as a Service layer with MCU credit billing and multi-tenant orchestration.

### Credit Tiers

| Tier | Price | MCU Credits |
|------|-------|-------------|
| **Starter** | $29/mo | 500 MCU |
| **Growth** | $99/mo | 2,000 MCU |
| **Premium** | $299/mo | Unlimited MCU + white-label |

| Complexity | MCU Cost | Example |
|-----------|----------|---------|
| `simple` | 1 MCU | File edit, git op, single command |
| `standard` | 3 MCU | Feature with tests, multi-step |
| `complex` | 5 MCU | Full-stack + deploy, multi-agent |

### API

```
POST   /v1/tasks              # Submit task
GET    /v1/tasks/{id}         # Task status
GET    /v1/tasks/{id}/stream  # SSE real-time progress
GET    /v1/agents             # List agents
POST   /v1/agents/{name}/run  # Invoke agent
POST   /v1/license/validate   # Validate license key
GET    /health                # Health check
POST   /billing/webhook       # Polar.sh webhook
```

### Python SDK

```python
from src.raas.sdk import MekongClient

client = MekongClient("https://api.agencyos.network", "mk_your_key")
result = client.cook("Deploy a landing page")

for event in client.stream_task(result.task_id):
    print(f"Step {event['step']}: {event['title']}")
```

## Mekong vs. Alternatives

| Feature | Mekong | Aider | Cursor | Copilot |
|---------|--------|-------|--------|---------|
| Plan → Execute → Verify | ✅ | ❌ | ❌ | ❌ |
| Auto-rollback on failure | ✅ | ❌ | ❌ | ❌ |
| 17+ specialized agents | ✅ | ❌ | ❌ | ❌ |
| Any LLM provider | ✅ | ✅ | ❌ | ❌ |
| Built-in billing/RaaS | ✅ | ❌ | ❌ | ❌ |
| Founder OS (idea → IPO) | ✅ | ❌ | ❌ | ❌ |
| Self-hosted | ✅ | ✅ | ❌ | ❌ |

## Development

```bash
# Python core
pip install -e ".[dev]"
python3 -m pytest              # 62 tests (~2.5 min)

# Node.js monorepo
pnpm install && pnpm run build
```

## Roadmap

**v3.1.0 (current)** — 55 commands, Founder OS complete, AGI Score 97.6/100

- [ ] v4.0: Web dashboard + Recipe marketplace
- [ ] Plugin system (custom agents)
- [ ] npm/PyPI public packages
- [ ] Multi-tenant team mode

## Contributing

Contributors share in revenue generated by AgencyOS usage of their code.

- **Agent submissions** → 10% of credits used
- **Recipe contributions** → 5% of credits used
- **Bug bounties** → $50–$500

See [CONTRIBUTING.md](CONTRIBUTING.md) for details.

---

[MIT License](LICENSE) · Built by [Binh Phap Venture Studio](https://binhphap.io) · [GitHub](https://github.com/longtho638-jpg/mekong-cli)
