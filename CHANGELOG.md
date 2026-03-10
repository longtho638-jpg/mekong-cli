# Changelog

## [Unreleased]

### ✨ Features
- feat: Complete Memory Architecture Implementation - 5-module persistent memory system
  - Context-Aware Conversations with local backup (`src/core/context_manager.py`)
  - Intelligent Prompt Caching with similarity matching (`src/core/prompt_cache.py`)
  - Learning History Tracker with analytics dashboard (`src/core/learning_tracker.py`)
  - Cross-Session Intelligence with persistent user profiles (`src/core/cross_session_intelligence.py`)
  - Memory-Augmented Decision Making with historical context (`src/core/decision_maker.py`)
  - Robust fallback mechanisms using local YAML/JSON when vector storage unavailable
  - User session isolation with UUID-based scoping across all modules
  - Integration with existing MemoryFacade system for seamless operation

## [2.1.0] - 2026-01-27

### ✨ Features
- feat: Mobile PWA Experience (Manifest, Service Worker, Offline Support)
- feat: Mobile Bottom Navigation & Responsive UI (MD3)
- feat: Push Notifications Infrastructure (FCM Backend + Frontend Hooks)
- feat: Add to Home Screen Prompt & Offline Indicator

## [2.0.0] - 2026-01-25

### ✨ Features
- feat: Execute 5 Binh Pháp Tasks - Full Validation Complete ([d7b67f5d])
- feat: CC CLI vNext Complete - Technical Debt Eliminated ([0977d87a])
- feat: PayPal SDK Complete Setup ([aa50e615])
- feat: Complete PayPal Payment Flow - Binh Pháp Architecture ([d5e309b8])
- feat: Add Next.js pricing page for dashboard app ([7b74019c])
- feat: Factory Optimization Phase 3 - Partial (before system cleanup) ([127acd28])
- feat: Brain & Muscle Protocol - CLAUDE.md + CLI_REFERENCE.md ([5e99c616])
- feat: Finance Ops Legal Escalation Ladder Configuration ([5f7bb310])
- feat: PayPal LIVE Mode + Technical Debt Cleanup Complete ([d2e012b2])
- feat: PayPal Sandbox Mode - Safe Testing Configuration ([60dd6ba4])
- feat: Payment Gateway Abstraction - PayPal Primary Ready ([30d0ee45])
- feat: Payment Orchestrator - PayPal Primary + Polar Backup ([5f5a3af0])
- feat: Tab 3+4 Complete - Migration + Billing Dashboard ([3f69f9e1])
- feat: Add 6 Agent Prompt Lists for FastSaaS production pipeline ([4f99deb9])

### 🐛 Bug Fixes
- fix: Replace CSS variable syntax with semantic Tailwind classes (108 lint warnings) ([27220f05])

### 📚 Documentation
- docs: Binh Pháp Execution Plans - 13 Task Files ([165e53d1])
- docs: Architecture Master Plan + Terminal Execution Plan ([470b4558])
- docs: Add comprehensive ARCHITECTURE.md for business application ([feec7e70])
- docs: Update TAX_STRATEGY_VN_2026.md với nguồn chính thống ([2722374f])
- docs: Add TAX_STRATEGY_VN_2026.md - Vietnam Tax Optimization ([7f45f1db])
- docs: Add FINANCE_OPS.md - Vietnam Financial Operations Guide ([ec1c6315])
- docs: Add SCHEMA_SYNC.md - Cross-Agent Schema Documentation ([58387195])
- docs: Add MISSION_CONTROL.md for 4-tab parallel agent orchestration ([e36f077f])
- docs: Add CLI_REFERENCE.md for AI Agent self-documentation ([a49c8710])
- docs: Add CHANGELOG.md for v2.0.0 official release ([c5816367])

### 🔧 Other Changes
- 🏯 CC CLI v2.0.0 - Complete 9-module command center ([68febf20])
- 🚨 SECURITY: Remove .env.local from git tracking ([14457aff])
- 🎉 RELEASE v2.0.0 - DEFCON 5 - AgencyOS Production Ready ([ade14408])

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
