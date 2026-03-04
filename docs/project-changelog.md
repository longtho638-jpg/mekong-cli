# Project Changelog

All notable changes to the Mekong CLI / AgencyOS project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- **AI/ML Engineering Commands**: 12 new commands added for AI/ML development workflows
- **Infinite Command Expansion**: Batch 4/4 complete with 19 new commands (100+ total commands)
- **Algo-trader Deployment**: Docker + GCP Cloud Run deployment support enabled
- **Vibe Factory Monitor**: Algo-trader pane enabled in monitoring dashboard
- **New Command Categories**: AntiBridge, Bridge, Quantum operations, Model status commands
- **Command Scaffolding**: Enhanced capabilities for creating new commands
- **Telegram Bot Integration**: Enhanced remote commander bot functionality
- **AGI Daemon Management**: New commands for Tom Hum AGI daemon operations
- **System Health Checks**: Enhanced diagnostic tools for API status
- **Environment Management**: New commands for environment configuration
- **Advanced Testing**: New strategies for sophisticated test scenarios

### Changed
- **Fixed CI/CD Loop Rule**: Added CẤM CI/CD polling loop rule to prevent context burnout crash
- **Algo-trader Improvements**: Enhanced Docker and GCP Cloud Run deployment capabilities
- **CI/CD Pipeline**: Disabled Docker build (optional for CI), disabled dashboard build (optional component)
- **Installation Process**: Used --shamefully-hoist for dashboard install, removed --frozen-lockfile for dashboard build
- **Performance**: Improved command execution and response times

### Fixed
- **Algo-trader Pane**: Enabled algo-trader pane in vibe-factory-monitor
- **CI/CD Stability**: Fixed context burnout crash prevention mechanism
- **Gateway Connectivity**: Fixed Telegram auth middleware in gateway
- **Dependency Issues**: Resolved various package and module dependency problems

### Added (Previous additions from earlier versions)
- **AGI Deep 10x Master (L11-L12)**: Nâng cấp hệ thống kiến thức & memory.
  - **Level 11 (ClawWork)**: Tích hợp `clawwork-integration.js` cho phân tích kết quả & sinh insight.
  - **Level 12 (Moltbook)**: Tích hợp `moltbook-integration.js` quản lý agent identity & metadata bền vững.
  - **Cross-Session Memory**: `self-analyzer.js` cải tiến hỗ trợ memory persistence giữa các session.
  - **Vector Service Fallback**: `vector-service.js` sử dụng local embedding khi vector DB không sẵn.
  - **Evolution Engine**: Cải tiến phân loại lỗi tự động trong engine xử lý nhiệm vụ.
- **OpenClaw Worker (Tôm Hùm)**: Upgraded to **AGI Level 5 (Self-Learning Edition)**.
  - **Level 3 (Post-Mission Gate)**: Automated build verification and Git commit on success.
  - **Level 3 (Mission Journal)**: Telemetry collection (duration, success rate, token usage).
  - **Level 4 (Project Scanner)**: Autonomous tech debt scanning and mission auto-generation.
  - **Level 5 (Learning Engine)**: Pattern analysis of mission history to optimize strategies.
- **Agents**: Added core autonomous agents (`LeadHunter`, `ContentWriter`, `RecipeCrawler`) for the Genesis Protocol.
- **CLI**: Added interactive UI (`mekong ui`) for module selection and execution.
- **Engine Layer**: Implemented Hub-and-Spoke RaaS Architecture.
  - **Infrastructure**: Docker Compose configuration for Redis (Queue) and PostgreSQL (Data).
  - **Engine API**: Node.js/Fastify service (`apps/engine`) for job ingestion and validation.
  - **Worker Service**: Node.js/BullMQ consumer (`apps/worker`) for asynchronous task execution.
  - **Integration Tests**: Automated shell script (`test-engine-integration.sh`) for end-to-end verification.

## [1.0.0] - 2026-02-06

### Added
- **vibe-analytics**: Initial release (v1.0.0) of the Growth Telemetry Engine.
  - DORA Metrics: Deployment Frequency, Lead Time, Change Failure Rate.
  - Engineering Velocity: Cycle Time, PR metrics.
  - GitHub GraphQL Integration.
- **vibe-dev**: Initial release (v1.0.0) of the Development Workflow Layer.
  - Bidirectional sync between GitHub Projects V2 and local JSON.
  - Interactive CLI with configuration wizards.
  - Integration with `vibe-analytics` for metric tracking.
- **Documentation**: Release readiness reports and core package documentation.

### Added
- **Agency-in-a-Box**: Automated setup recipe (`recipes/agency-box-setup.md`) for scaffolding new client environments (Landing Page + Vercel Config).
- **Genesis Supervisor**: Initial implementation of `genesis.py` and `vibe_manifest.yaml` for autonomous agency generation.
- **Database Integration**: Implemented PostgreSQL persistence for the Engine Layer.
  - **Prisma ORM**: Added `schema.prisma` with `User` and `Job` models.
  - **Engine API**: Updated `/v1/chat/completions` to save jobs to DB before queuing.
  - **Worker Service**: Updated worker to track job status (`PROCESSING`, `COMPLETED`, `FAILED`) in DB.
  - **Scripts**: Added `db:generate` and `db:push` scripts for easier management.
- **System Architecture**: Added `docs/system-architecture.md` detailing the Hub-and-Spoke design.
- **Recipe Registry**: Implemented foundation for Marketplace. Added `list`, `search`, and smart `run` commands to CLI.

### Phase 8: Production Hardening
- **Infrastructure**: Switched default development database to SQLite (removed Docker dependency for local dev).
- **Resilience**: Implemented `safeJSONStringify`/`safeJSONParse` to handle edge cases (BigInt, circular refs).
- **Concurrency**: Added `withRetry` wrapper for SQLite concurrency (`SQLITE_BUSY` handling).
- **Reliability**: Added "Compensation Transaction" pattern in Engine to prevent ghost jobs.
- **Maintenance**: Added Zombie Job cleanup on Worker startup.

### Changed
- **Dependencies**: Updated `vibe-dev` to depend on published `@agencyos/vibe-analytics@^1.0.0` instead of local file protocol.

### Fixed
- **Metamorphosis Protocol (100/100)**: Completed full codebase transformation for `apps/84tea` and `apps/agencyos-landing`.
  - **Refactor**: Split Next.js App Router components into Server (`page.tsx`) and Client (`*-content.tsx`) to fix metadata export issues.
  - **Theme**: Standardized on Tailwind CSS v4 with `@theme` and CSS variables.
  - **Type Safety**: Achieved 100% strict type safety across workspace.
  - **Performance**: Optimized images and bundle sizes.
  - **Security**: Hardened headers and dependencies.
