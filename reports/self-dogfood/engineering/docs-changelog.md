# CHANGELOG — Mekong CLI v5.0
**Generated:** 2026-03-11 | **Source:** git log

---

## [5.0.0] — 2026-03-11

### Major Release: RaaS Agency Operating System

This release establishes Mekong CLI as a full RaaS (Recipe-as-a-Service) platform with 5-layer business pyramid, AGI v2 subsystems, and global standard infrastructure.

---

### Added

#### RaaS Platform (Global Standard)
- Global standard RaaS engine + SaaS dashboard (`feat(raas)`)
- RaaS gateway with 7 HTTP endpoints for remote orchestration
- MCU billing model: 1 credit per successful mission delivery
- Polar.sh webhook integration as sole payment provider

#### AGI v2 — 9 Subsystems
- NLU intent classifier with confidence scoring
- ReflectionEngine: post-execution learning + calibration
- WorldModel: state tracking + side-effect prediction
- ToolRegistry: dynamic tool discovery from CLI help output
- BrowserAgent: HTTP status check + page analysis
- CollaborationProtocol: multi-agent review/debate
- CodeEvolutionEngine: self-improvement pattern analysis
- VectorMemoryStore: semantic search over execution history
- Consciousness Score (0–100): aggregate subsystem health

#### 5-Layer Command Pyramid
- 19 C-level super commands — DAG workflow recipes for all 5 layers
- 28 manager super commands — department workflows for 11 roles
- 36 IC super commands — daily task workflows for 16 roles
- 6 VC studio super commands — parallel workflow recipes for founder layer
- Total: **289 commands** across Founder/Business/Product/Engineer/Ops

#### Infrastructure
- 4-layer deploy templates: Cloudflare Pages + Workers + Vercel + Fly.io
- `mekong/infra/scaffold.sh` for one-command project bootstrap
- Cloudflare Worker deployed to production + staging
- AlgoTrader: Cloudflare R2 + secrets setup scripts

#### CLI Commands
- `mekong swarm` — distributed multi-node execution
- `mekong autonomous` — AGI loop control (run/status/resume/reflect/world/predict)
- `mekong evolve-code` — source code self-improvement analysis
- `mekong collab` — multi-agent debate + review
- `mekong tools` — dynamic tool registry + discovery
- `mekong browse` — web automation + page analysis
- `mekong trace` — execution trace viewer
- `mekong start` — daemon start

---

### Changed

#### Refactoring
- `src/main.py` modularized: command registration delegated to `src/cli/` submodules
- `usage_commands.py` (1057 lines) split into 6 focused modules
- 14 Vietnamese command IDs renamed to English
- 830+ Vietnamese runtime strings translated to English

#### Architecture
- Universal LLM config: 3 env vars, any provider (BYOK architecture)
- Fallback chain: OpenRouter → DashScope → DeepSeek → Anthropic → OpenAI → Google → Ollama → Offline
- `mekong/` namespace internalized (skills/commands stay in `.claude/`)

---

### Fixed

#### Security
- Shell injection patched in core execution modules (`fix(security)`)
- Secret exposure in output/logs masked
- Auth middleware hardened

#### Tests & CI
- Test suite repaired after BYOK refactor
- CI workflows updated to match actual codebase structure
- pnpm used for mekong-engine workspace protocol
- Pre-push hook turbo recursion fixed

#### Landing / Frontend
- 47 landing page mismatches corrected (English 100%, correct stats)
- Pricing aligned: Starter $49 / Pro $149 / Enterprise $499
- Dark theme + Mekong gradient palette

#### AlgoTrade
- SignalGenerator aggregate fix
- Bellman-Ford cycle detection fix
- OrderManager import fix

---

### Removed

- Antigravity Proxy (ports 9191/20128) purged from all runtime code
- PayPal components and SDK (replaced by Polar.sh)
- Broken symlink refs from CLAUDE.md
- 390MB junk: `.venv`, `.pyc`, `.map`, stale configs

---

## [4.x] — Prior Releases

### v4.0 — Mission Dispatcher
- JSON contract support for 176 machine contracts
- `factory/contracts/` directory with validated schemas
- Mission dispatcher v4 with `type` field for v4 validation

### v3.x — AGI v1 + Swarm
- Initial autonomous engine
- Swarm node registration + dispatch
- Schedule recurring jobs
- Memory store + search

### v2.0 — PEV Engine
- Plan-Execute-Verify core loop
- RecipeParser + RecipeExecutor
- Binh Pháp quality gates in verifier
- Rollback on verification failure
