# 🏯 Mekong CLI

**AI-operated business platform. Open source. Universal LLM.**

Giao việc cho AI → AI lập kế hoạch → thực thi → kiểm tra → giao kết quả.
289 commands • 245 skills • 176 contracts • 5-tầng doanh nghiệp.

## Quick Start

### Cho user có API key (OpenRouter / Qwen / DeepSeek / bất kỳ):
```bash
pip install mekong-cli
export LLM_BASE_URL=https://openrouter.ai/api/v1
export LLM_API_KEY=sk-or-v1-yourkey
export LLM_MODEL=anthropic/claude-sonnet-4
mekong cook "Create a REST API with auth"
```

### Cho user dùng LLM local (free):
```bash
pip install mekong-cli
# Install Ollama: curl -fsSL https://ollama.ai/install.sh | sh
ollama pull qwen2.5-coder
export OLLAMA_BASE_URL=http://localhost:11434/v1
mekong cook "Create a Python calculator"
```

### Cho founder (non-tech):
```bash
pip install mekong-cli
mekong annual "Kế hoạch kinh doanh 2026"
```

## Architecture

```
👑 Founder    /annual /okr /fundraise /swot        — Chiến lược
🏢 Business   /sales /marketing /finance /hr        — Vận hành
📦 Product    /plan /sprint /roadmap /brainstorm    — Sản phẩm
⚙️ Engineer   /cook /code /test /deploy /review     — Kỹ thuật
🔧 Ops        /audit /health /security /status      — Vận hành
```

## How It Works

```
Goal → PLAN (LLM decompose) → EXECUTE (multi-mode) → VERIFY (quality gates)
       ↓ failed?             ↓ self-heal              ↓ auto-retry
       Strategy hint          LLM correction           Rollback
```

| Phase | Module | What It Does |
|-------|--------|-------------|
| **Plan** | `src/core/planner.py` | LLM decomposes goal into ordered steps |
| **Execute** | `src/core/executor.py` | Runs shell/code/API tasks in parallel |
| **Verify** | `src/core/verifier.py` | Exit codes, tests, types, LLM assessment |
| **Orchestrate** | `src/core/orchestrator.py` | PEV loop, rollback, self-healing |

## LLM Provider (Universal — 3 vars, any provider)

```bash
# OpenRouter (300+ models):
export LLM_BASE_URL=https://openrouter.ai/api/v1

# Qwen Coding Plan ($10/mo unlimited):
export LLM_BASE_URL=https://dashscope.aliyuncs.com/compatible-mode/v1

# DeepSeek (cheapest):
export LLM_BASE_URL=https://api.deepseek.com

# Ollama (free, local):
export OLLAMA_BASE_URL=http://localhost:11434/v1

# Any OpenAI-compatible endpoint works.
```

## Deploy (3-layer, Cloudflare-only)

| Layer | Platform | Cost | When |
|-------|----------|------|------|
| Frontend | Cloudflare Pages | $0 | Every project |
| Edge API | Cloudflare Workers | $0 | Need API/webhooks |
| Backend | CF Workers + D1 + KV + R2 | $0 | Need DB/storage/daemon |

```bash
# Scaffold by scale:
bash mekong/infra/scaffold.sh myproject startup  # frontend + API
bash mekong/infra/scaffold.sh myproject scale     # all 3 layers
```

## Commands (Top 10)

| Command | What It Does | MCU |
|---------|-------------|-----|
| `mekong cook` | Full PEV pipeline | 3 |
| `mekong fix` | Debug & fix bugs | 3 |
| `mekong plan` | Create implementation plan | 1 |
| `mekong review` | Code quality review | 1 |
| `mekong deploy` | Deployment orchestration | 5 |
| `mekong company/init` | Initialize agentic company | 3 |
| `mekong founder/validate` | Customer discovery & PMF | 3 |
| `mekong founder/pitch` | Pitch deck practice | 3 |
| `mekong founder/vc/cap-table` | Dilution modeling | 5 |
| `mekong founder/ipo/ipo-day` | IPO Day execution | 5 |

Full command list: 289 commands across 5 layers. Run `mekong help` for details.

## For Developers (Fork Guide)

```bash
git clone https://github.com/longtho638-jpg/mekong-cli.git
cd mekong-cli
make setup       # Install deps + validate factory
make self-test   # Should show 100/100
# Set LLM key in .env
mekong cook "hello world"
```

## RaaS (Revenue as a Service)

Customer submit goal → pay credits → OpenClaw executes → deliver result.

| Tier | Credits/mo | Price |
|------|-----------|-------|
| Starter | 200 | $49 |
| Pro | 1,000 | $149 |
| Enterprise | Unlimited | $499 |

## CLI Flags

| Flag | Effect |
|------|--------|
| `--verbose / -v` | Step-by-step execution details |
| `--dry-run / -n` | Plan only, no execution |
| `--strict` | Fail on first verification error |
| `--json / -j` | Machine-readable JSON output |

## Project Structure

```
mekong-cli/
├── src/core/           # PEV Engine (planner, executor, verifier, orchestrator)
├── src/agents/         # Pluggable agent modules
├── src/raas/           # Credit billing (RaaS)
├── mekong/             # Namespace (skills, adapters, infra, daemon)
├── .agencyos/commands/ # 245 command definitions
├── factory/contracts/  # 176 JSON machine contracts
├── apps/openclaw-worker/ # Tôm Hùm autonomous daemon
├── frontend/landing/   # AgencyOS storefront
└── tests/              # Test suite
```

## License

MIT — Use it, fork it, build your AI agency on it.

**Mekong CLI** © 2026 Binh Phap Venture Studio
