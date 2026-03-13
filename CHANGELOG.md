# Changelog

All notable changes to Mekong CLI are documented here.
Format: [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) + [SemVer](https://semver.org/).

---

## [5.1.0] - 2026-03-13 — ROIaaS v1.0 Production Release

### Added - ROIaaS (Revenue-as-a-Service) Complete Platform

#### Phase 1: RAAS License Gate
- Tier-based license gating for PEV Engine (Starter/Pro/Enterprise)
- License validation middleware with JWT token support
- RAAS gate integration in FastAPI server
- License management API endpoints

#### Phase 2: License Management
- Polar.sh webhook integration for license activation
- License lifecycle management (activate/renew/revoke)
- Tier configuration and rate limiting
- License dashboard UI components

#### Phase 3: Trading Execution
- PEV Engine integration with trading strategies
- Signal gate for premium strategy access
- Orderbook analysis module
- Trading visualization components

#### Phase 4: Usage Metering
- Trade metering system for usage tracking
- Usage API routes for metering data
- Tenant-based rate limiting
- Quota management with cache optimization

#### Phase 5: ROI Analytics
- ROI dashboard with real-time metrics
- Analytics queries for performance tracking
- Revenue reporting and export
- Usage-based billing integration

#### Phase 6: Self-Healing & Error Recovery
- Auto-recovery for failed trades
- Error boundary handling in PEV orchestrator
- Graceful shutdown with state preservation
- Violation tracking and compliance alerts

#### Phase 7: Telemetry & Monitoring
- Usage tracking middleware for API requests
- Rate limit metrics collection
- Performance monitoring dashboard
- Alert system for anomalies

#### Phase 8: CLI & Automation
- Auto-release GitHub Action (5+ feat/fix commits trigger release)
- PEV release workflow automation
- CLI commands for license administration
- Usage reporting commands

### Changed
- Enhanced PEV Engine with ROIaaS gating
- Improved test suite with 16+ integration tests
- Consolidated ROIaaS documentation in apps/algo-trader/docs/
- Updated orchestrator with ROIaaS decorators

### Fixed
- Removed unused imports in PEV integration tests
- Fixed 12 test failures in metering module
- Fixed mypy errors in dashboard data
- TypeScript errors in Google Calendar integration
- Go-live hardening for production readiness

### Infrastructure
- Added auto-release GitHub Action workflow
- Added PEV release workflow
- Enhanced CI/CD with usage metering validation

---

## [5.0.0] - 2026-03-10

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
