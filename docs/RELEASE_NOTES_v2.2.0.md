# Release Notes — mekong-cli v2.2.0

> **Open Source Milestone** | 2026-02-28
> AGI CLI Platform — Plan-Execute-Verify autonomous engine

## Highlights

- **Plan-Execute-Verify Engine** — LLM-powered task decomposition, multi-mode execution (shell/LLM/API), automated verification with rollback
- **Tôm Hùm Autonomous Daemon** — Self-healing worker with brain lifecycle, file IPC dispatch, auto-CTO quality tasks
- **830 tests passing** — Full pytest suite, zero failures
- **Modular agent system** — GitAgent, FileAgent, ShellAgent, LeadHunter, ContentWriter, RecipeCrawler
- **NLU intent classification** — Smart routing from natural language goals to recipe execution

## What's New

### Core Engine
- `RecipePlanner` — LLM-powered task decomposition with dependency graphs
- `RecipeExecutor` — Multi-mode runner (shell, LLM, API) with `ExecutionResult`
- `RecipeVerifier` — Exit code validation, file checks, LLM quality assessment
- `RecipeOrchestrator` — Full Plan→Execute→Verify with self-healing and rollback
- `IntentClassifier` — NLU pre-routing for goal→recipe matching

### AGI Integration
- Mem0 + Qdrant vector memory for cross-session knowledge
- Langfuse observability pipeline
- Aider self-healing code correction
- ClawWork economic benchmark framework
- Dual revenue pipeline architecture

### OpenClaw Worker (Tôm Hùm)
- Modular architecture: 5 brain components
- Auto-CTO pilot: generates Binh Phap quality tasks when queue empty
- M1 thermal/RAM protection daemon
- File-based IPC with atomic writes
- Crash recovery with rate-limited respawn

### CI/CD
- Ruff lint gate on `src/` and `tests/`
- pytest with coverage (70% threshold)
- pnpm 10 for frontend monorepo
- `importorskip` guards for optional dependencies

## CLI Commands

```bash
mekong cook "<goal>"     # Full pipeline: Plan → Execute → Verify
mekong plan "<goal>"     # Plan only (preview steps)
mekong run <recipe.md>   # Execute existing recipe
mekong agent <name>      # Run agent directly
mekong list              # List available recipes
mekong search <query>    # Search recipes
mekong version           # v2.2.0
```

## Tech Stack

| Layer | Technology |
|-------|------------|
| CLI | Python 3.11+ · Typer · Rich · Pydantic |
| Orchestration | Node.js (OpenClaw) · Expect (brain control) |
| Gateway | FastAPI (local) · Cloudflare Workers (cloud) |
| Tests | pytest · 830 tests · ~6 min runtime |

## Requirements

- Python 3.9+
- Node.js 20+ (for OpenClaw worker)
- pnpm 10+ (for frontend packages)

## Install

```bash
pip install -e .
mekong --help
```

## License

MIT
