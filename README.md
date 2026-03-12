# 🏯 Mekong CLI

**AI-operated business platform. Open source. Universal LLM.**

Describe your goal → AI plans → executes → verifies → delivers results.
319 commands • 463 skills • 410 contracts • 5 business layers.

## Quick Start

### With API key (OpenRouter / Qwen / DeepSeek / any provider):

```bash
pip install mekong-cli
export LLM_BASE_URL=https://openrouter.ai/api/v1
export LLM_API_KEY=sk-or-v1-yourkey
export LLM_MODEL=anthropic/claude-sonnet-4
mekong cook "Create a REST API with auth"
```

### With local LLM (free):

```bash
pip install mekong-cli
# Install Ollama: curl -fsSL https://ollama.ai/install.sh | sh
ollama pull qwen2.5-coder
export LLM_BASE_URL=http://localhost:11434/v1
mekong cook "Create a Python calculator"
```

### For founders (non-tech):

```bash
mekong annual "2026 business plan"
mekong founder:raise "Pre-seed for AI platform"   # 8 agents parallel
mekong founder:validate-sprint "Is this investable?"  # PMF verdict in 25 min
```

## 5 Business Layers

```
👑 Founder    /annual /okr /fundraise /swot         — Strategy & fundraising
💼 Business   /sales /marketing /finance /hr         — Revenue & operations
🎯 Product    /plan /sprint /roadmap /brainstorm     — Product management
⚙️ Engineering /cook /code /test /deploy /review      — Build & ship
🔧 Ops        /audit /health /security /status       — Monitor & maintain
```

## 101 Super Commands

One command triggers parallel AI agents via DAG recipes:

```bash
$ mekong founder:raise "Series A for AI platform"
  ⚡ Group 1 (parallel): /unit-economics + /tam + /moat-audit
  ⚡ Group 2 (parallel): /financial-model + /data-room
  ⚡ Group 3 (sequential): /cap-table → /pitch → /vc-map
  ✅ Output: reports/raise-ready-kit/ (investor-ready)
```

32 roles from CEO to intern. 85 DAG workflow recipes. [See full list →](docs/COMMANDS.md)

## Architecture

```
Plan → Execute → Verify (PEV Engine)
       ↓ failed?             ↓ self-heal              ↓ auto-retry
     Debug → Fix → Retest   Learn → Adapt            Escalate → Human
```

- **Universal LLM**: 3 env vars, any OpenAI-compatible provider
- **DAG Scheduler**: Parallel execution with dependency graphs
- **Self-healing**: Failed steps auto-diagnosed and corrected
- **100% Cloudflare**: Pages (frontend) + Workers (backend) + D1 + KV + R2

## Deploy

All infrastructure runs on Cloudflare:

| Layer | Platform | Cost |
|-------|----------|------|
| Frontend | Cloudflare Pages | $0 |
| Edge API | Cloudflare Workers | $0 |
| Database | Cloudflare D1 | $0 |
| Storage | Cloudflare R2 | $0 |
| Cache | Cloudflare KV | $0 |

## VC Studio Platform v6.0 — Binh Phap Ton Tu

Three-party orchestration: **VC + Expert + Founder**, powered by OpenClaw.

```
🏯 Studio    /studio /portfolio /dealflow /expert /venture /match
```

| Command Group | Examples |
|---------------|----------|
| Studio | `mekong studio init`, `studio status`, `studio report` |
| Portfolio | `mekong portfolio create`, `portfolio list`, `portfolio health` |
| Deal Flow | `mekong dealflow add`, `dealflow screen`, `dealflow diligence` |
| Expert | `mekong expert add`, `expert match`, `expert dispatch` |
| Venture | `mekong venture thesis`, `venture terrain`, `venture five-factors` |
| Match | `mekong match founder-idea`, `match vc-startup`, `match expert-need` |

23 CC CLI commands + 18 DAG recipes. See [HUONG-DAN-SU-DUNG-v6.0.md](HUONG-DAN-SU-DUNG-v6.0.md) for full guide.

## Project Structure

```
├── src/                   # Python CLI core (PEV engine)
├── src/studio/            # VC Studio Python modules (v6.0)
├── src/cli/               # CLI command registration
├── apps/openclaw-worker/  # Tôm Hùm autonomous daemon
├── frontend/landing/      # Next.js 16 landing (agencyos.network)
├── .agencyos/commands/    # 319 command definitions
├── factory/contracts/     # 410 JSON machine contracts
├── recipes/               # 85+ DAG workflow recipes
├── mekong/                # Namespace (skills, adapters, config)
└── reports/               # Self-dogfood analysis (242 reports)
```

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) and [QUICKSTART.md](QUICKSTART.md).

## License

**Mekong CLI** © 2026 Binh Phap Venture Studio — [MIT License](LICENSE)
