# Changelog

All notable changes to AgencyOS will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.0.0] - 2026-01-25

### 🚀 Major Release: Full Revenue Engine & AgencyOS Core Activated

This is the biggest release in AgencyOS history, transforming the CLI into a complete command-center for one-person agencies.

### Added

#### 9 CC CLI Modules

- **cc revenue** - Revenue analytics, forecasting, pricing strategy
- **cc agent** - Agent swarm orchestration, spawning, coordination
- **cc devops** - Deployment automation, backup, infrastructure
- **cc client** - Client management, CRM, invoicing
- **cc release** - Version management, changelog, deployment
- **cc analytics** - Dashboard, funnel analysis, cohort reports
- **cc sales** - Sales pipeline, leads, CRM-lite
- **cc content** - AI content generation, scheduling, publishing
- **cc monitor** - System health, alerts, metrics

#### Production Services

- Cache Service with Redis + in-memory fallback
- Backup Service with automated restore
- Feature Flags for A/B testing
- Audit Logging for compliance
- Notification Service for alerts
- Performance Middleware for metrics

#### Architecture

- Plugin system (`antigravity/plugins/`)
- Circuit breaker pattern for resilience
- Config caching for fast startup
- Dynamic versioning from package.json

#### Workflows

- `/run upgrade-protocol` shortcut
- Perfect Execution Profile (3 documents)
- GitHub Actions CI/CD for CC CLI

### Changed

- CLI startup time reduced from ~500ms to <200ms
- Unified `cc` entry point now discovers modules dynamically
- Version synced from package.json (Single Source of Truth)

### Fixed

- Version drift between package.json and CLI
- Missing modules in unified entry point

### Stats

- ~17,000+ lines added
- 80+ files created
- 16 commits
- 187 tests passing

---

## [1.0.0] - Previous

Initial release of AgencyOS.

---

**"Còn sống là còn nâng cấp!"** 🏯
