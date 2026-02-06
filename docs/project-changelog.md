# Project Changelog

All notable changes to the Mekong CLI / AgencyOS project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
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

### Changed
- **Dependencies**: Updated `vibe-dev` to depend on published `@agencyos/vibe-analytics@^1.0.0` instead of local file protocol.
