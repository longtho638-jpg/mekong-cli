# Changelog

All notable changes to Mekong CLI are documented here.
Format: [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) + [SemVer](https://semver.org/).

---

## [3.1.0] - 2026-03-10

### Added
- Plugin Ecosystem: registry, validator, marketplace (`src/plugins/`)
- Plugin Developer Guide (`docs/plugin-developer-guide.md`)
- RaaS License Gate: `RAAS_LICENSE_KEY` for premium features
- Persistent Memory Architecture: 5-module system (context, cache, tracker, cross-session, decision)
- GitHub hygiene: CONTRIBUTING.md, CODEOWNERS, issue templates
- CI hard gates: ruff format check, coverage enforcement

### Changed
- CLAUDE.md consolidated into single Hiến Pháp constitutional document
- Model routing via DashScope Coding Plan (20-model pool, $0 cost)

---

## [3.0.0] - 2026-01-25

### Added
- Plan-Execute-Verify (PEV) engine: `RecipePlanner`, `RecipeExecutor`, `RecipeVerifier`
- RaaS (Revenue-as-a-Service) dual-stream architecture
- 6 modular agents: GitAgent, FileAgent, ShellAgent, LeadHunter, ContentWriter, RecipeCrawler
- Antigravity Proxy integration (port 9191, Anthropic-compatible)
- Tôm Hùm autonomous dispatch (OpenClaw v22+)
- FastAPI gateway + Cloudflare Workers edge layer

### Changed
- CLI rebuilt from scratch with Typer + Rich
- All agents inherit `AgentBase` with plan/execute/verify flow

---

## [0.2.0] - 2025-11-01

### Added
- Initial CLI: `mekong cook`, `mekong plan`, `mekong run`, `mekong list`, `mekong search`
- LLM client (`src/core/llm_client.py`) — OpenAI-compatible
- Basic orchestrator with rollback logic
- 62 unit tests (~2.5 min runtime)

---

## [0.1.0] - 2025-10-01

### Added
- Project bootstrap: Python + Typer skeleton
- `mekong version` command
