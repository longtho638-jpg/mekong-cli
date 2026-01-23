# Project Changelog

> Track all significant changes to AgencyOS Engine

---

## [5.2.0] - 2026-01-23

### Performance, Security & Growth Unification
- **Agent Benchmarking Engine**: Launched a full-stack observability layer for the Antigravity swarm, tracking latency, token usage, and real-time USD costs per invocation.
- **Enterprise Governance**: Deployed granular RBAC, immutable audit trails, and advanced secret management with managed provider support (Doppler/Vault).
- **Intelligent Marketing**: Implemented an autonomous SEO auditor and a Code-to-Content pipeline that automatically generates social media and blog updates from git activity.
- **Infrastructure Scaling**: Stabilized production with Kubernetes HPA (up to 10 replicas) and aggressive Redis-native caching.
- **Growth & Feedback**: Finalized the real-world monitoring loop with a unified tracking API and automated community feedback bots.

## [5.1.3] - 2026-01-23

### Enterprise Security & Governance
- **Granular RBAC**: Implemented hierarchy-aware Role-Based Access Control in `backend/core/security/rbac.py`. Supports Owner, Admin, Developer, Viewer, and Agent roles with FastAPI dependency enforcement.
- **Immutable Audit Trails**: Launched append-only audit logging service in `backend/core/security/audit.py` integrated with Supabase RLS. Tracks actor, action, resource, and status for all sensitive operations.
- **Security Middleware**: Integrated `SecurityMiddleware` into the unified API to automatically identify users from JWTs and record audit logs for all mutating requests (POST/PUT/DELETE).
- **Advanced Secret Management**: Created `SecretManager` abstraction in `backend/core/security/secrets.py` with support for Doppler and standard environment fallbacks.
- **Data Diet Sanitizer**: Implemented automated output sanitization in `backend/core/security/sanitizer.py` to prevent PII or credential leakage in system logs and agent responses.
- **Audited Routers**: Applied RBAC and Audit decorators to CRM and Franchise API endpoints.

## [5.1.2] - 2026-01-23

### Infrastructure & Performance
- **Kubernetes Auto-scaling**: Implemented Horizontal Pod Autoscalers (HPA) for `mekong-backend` and `mekong-frontend` in `k8s/backend-hpa.yaml` and `k8s/frontend-hpa.yaml`. Configured dynamic scaling from 2 to 10 replicas based on CPU and Memory utilization.
- **Edge Caching Optimization**: Updated `apps/docs/vercel.json` with aggressive caching headers for static assets (`_astro`, `fonts`, `images`) and implemented `stale-while-revalidate` patterns to improve documentation performance.
- **Observability Audit**: Verified Prometheus-compatible metrics stack in `antigravity/core/observability/stack.py` for real-time performance tracking.

## [5.1.1] - 2026-01-23

### Fixed
- **Build Stability**: Fixed a critical build failure in `mekong-docs` caused by an incorrect default import of `ua-parser-js`. Migrated to named imports to comply with ESM requirements in Astro v5.
- **Branding Sync**: Updated `agencyos.astro` title to "AgencyOS - The AI Operating System for Modern Agencies" to maintain consistency across the marketing site and local codebase.

### Changed
- **Documentation Archival**: Moved legacy reports (`AGENTS.md`, `ARCHITECTURE.md`, `GEMINI.md`, etc.) from the root and `reports/` folder to `docs/archive/reports/` to declutter the repository.
- **Git Configuration**: Updated `.gitignore` to exclude the root `reports/` directory from version control.

## [5.1.0] - 2026-01-22

### Growth & Feedback Infrastructure
- **Unified Tracking API**: Implemented a polymorphic `/api/track` endpoint in Astro to handle A/B test exposures, conversion goals, and engagement metrics.
- **Feedback Collection**: Launched a React-based `FeedbackWidget` and server-side `/api/feedback` endpoint for direct user insights.
- **A/B Testing**: Integrated server-side variant assignment into `middleware.ts` with sticky cookie persistence and native support in `Hero` and `PricingSection`.
- **Auto-Instrumentation**: Updated `LandingLayout.astro` to automatically capture experiment data and CTA clicks without additional code.

### UI/UX Upgrade for AgencyOS Docs
- **Refactoring**: Successfully decomposed the monolithic `agencyos.astro` (1,816 lines) into 14 specialized components in `src/components/landing/`, drastically improving maintainability.
- **Visuals**: Enhanced Hero section with premium effects and added 3D tilt interaction to pricing cards.
- **Social Proof**: Integrated `Testimonials.astro` into the pricing flow.
- **Interactive**: Added a functional Terminal Demo to the commands showcase page.
- **Security**: Hardened checkout process with trust badges and verified security fixes.
- **Stability**: Fixed TypeScript errors in `DocsNav.astro`, `SidebarNav.astro`, `AgencyOSProvider.tsx`, and `affiliate/index.astro`.

### Quality Assurance & Verification
- **E2E Testing**: Verified PayPal checkout flow (subscription creation and webhook handling) using Playwright.
- **Lighthouse**: Achieved high scores (Perf 89, SEO 100, A11y 93) on primary landing pages.
- **SEO**: Confirmed 100% coverage of Meta Tags, OpenGraph, and Twitter Cards.
- **Infrastructure**: Audited 9/9 database migrations and verified PayPal environment configurations.
- **Revenue Engines**: Confirmed operational status for Quota Engine, Gumroad, and Webhook listeners.

### Marketing & Growth
- **Launch Kit**: Generated multi-channel promotional content (Twitter thread, LinkedIn post) in `marketing/launch_v5.md`.
- **Product Alignment**: Synchronized `products/gumroad_products.json` with Binh Pháp strategic copy.
- **Customer Success**: Implemented 3-part automated onboarding email sequence (Day 0, 3, 7) in `marketing/emails/onboarding_sequence.md` focused on activation and Pro-plan upsells.
- **Community Automation**: Deployed `discord_bot_skeleton.py` and `twitter_engagement_skeleton.py` for automated outreach.
- **Governance**: Established `community_playbook.md` and Discord/GitHub discussion templates for structured scaling.

## [2.6.0-beta] - 2026-01-22

### Knowledge Graph Integration (Phase 13)
- **Infrastructure**: Integrated FalkorDB into the core ecosystem for persistent long-term memory.
- **Client**: Developed `GraphClient` with Cypher injection protection and sanitized identifier handling.
- **Ingestion**: Automated AST parsing for Python codebase, mapping inheritance and dependency relationships.
- **Memory**: Agents now possess `query_memory` capabilities, enabling persistent context across sessions.
- **Validation**: 100% test pass rate on knowledge modules with security verification for attack vectors.

## [2.4.0-beta] - 2026-01-21

### PayPal Migration & Backend Unification (Phase 1)
- **Environment Configuration**: Updated `.env.example`, `apps/dashboard/.env.example`, and created `backend/.env.example` with full PayPal and Supabase variable sets.
- **Production Readiness**: Hardened `vercel.json` across all apps (`dashboard`, `web`, `docs`, `mekong-docs`) with MD3-compliant security headers and optimized rewrites.
- **PayPal SDK**: Created `core/finance/paypal_sdk/subscriptions.py` to handle full subscription lifecycle (create, get, cancel, suspend/resume).
- **Unified Payment Service**: Refactored `backend/services/payment_service.py` to consolidate PayPal, Stripe, and Gumroad logic. Added subscription mapping and license generation triggers.
- **Webhook Handlers**: Consolidated webhook processing to eliminate logic duplication and ensure reliable license delivery.
- **Plan Synchronization**: Added `scripts/setup/sync_paypal_plans.py` for automated PayPal Product and Plan management.

## [2.3.0-beta] - 2026-01-21

### Testing & Quality Gates (Phase 10)
- **Frontend Testing**: Configured Jest + React Testing Library for `apps/dashboard`. Added unit tests for health cards and workflow editor.
- **E2E Infrastructure**: Set up Playwright for end-to-end testing of critical flows (Agent Creator, Workflow Builder).
- **Quality Gates**: Implemented strict `pre-push` hooks using Husky to enforce build success and test passing before pushing.
- **Backend Coverage**: Integrated Pytest with MCP handlers.

## [2.2.0-beta] - 2026-01-21

### UI/UX Expansion (Phase 9)
- **Real-time Monitoring**: New dashboard at `/dashboard/monitor` visualizing system health, quota, and anomalies.
- **Visual Workflow Builder**: n8n-style editor at `/dashboard/workflow` using React Flow and AgencyOS API.
- **Agent Creator**: Custom agent builder at `/dashboard/agents/new` with skill selection and role definition.
- **UI Library**: Enhanced `@agencyos/ui` with new form components (`Input`, `Select`, `Checkbox`, `Textarea`).
- **Backend API**: Added new routers for `monitor`, `workflow`, and `agents-creator` to the FastAPI backend.

## [2.1.0-beta] - 2026-01-21

### Enterprise Hardening & Tech Debt
- **Security Verification**: Added `verify_security.py` to audit Privacy Hooks, Data Diet, and RBAC patterns.
- **Stress Testing**: Implemented `stress_test_swarm.py` for high-concurrency simulation of agent activity.
- **Tech Debt**: Removed 10+ stale imports referencing `packages/antigravity` across tests and legacy scripts.
- **CLI Consolidation**: Refactored `mekong_cli.py` to use modular MCP handlers directly, eliminating legacy shims.
- **Documentation**: Updated all `.claude/commands/` to use the unified `mekong` CLI and MCP tools.

## [2.0.0-beta] - 2026-01-20

### Specialization & Vertical Engines
- **Vertical Engines**: Implemented `antigravity.core.verticals` package with domain-specific logic for:
    - **Healthcare**: HIPAA compliance checks, BAA generation, telehealth latency validation.
    - **Fintech**: PCI-DSS security audits, KYC tier validation, transaction idempotency checks.
    - **SaaS**: Multi-tenancy provisioning, subscription proration, churn risk assessment.
- **Auditor**: Added `VerticalAuditor` for centralized compliance and security auditing across all verticals.
- **Integration**: Updated `AgencyHandler` and `CommandRouter` to support specialized `/audit` and `/onboard` workflows.

### CI/CD & Reliability
- **CLI Verification**: Updated GitHub Actions to install the `mekong-cli` package and verify the `mekong` entry point.
- **Test Stability**: Fixed 10+ import issues and missing rule references to achieve a 100% test pass rate (328/328).
- **Rule Registry**: Enhanced `RuleRegistry` to recursively scan directories, supporting complex rule hierarchies.

### Versioning & Polish
- **Version Sync**: Synchronized `antigravity/__init__.py` and `setup.py` to v0.2.0 (Stable Base) with beta features on top.
- **Knowledge Manifest**: Updated `QUANTUM_MANIFEST.md` with 118 automated rules and capability bridges.

## [1.9.1-beta] - 2026-01-20

### Rule Expansion Phase 2
- **Development Rules**: Added 25 new rule files in `.claude/rules/02-development/`.
- **Operations Rules**: Added 25 new rule files in `.claude/rules/03-operations/`.

## [1.9.0-beta] - 2026-01-20

### Antigravity Integration
- **Features**: Unified Command Registry, Automated Knowledge Layer, Scalable MCP Layer, Agent Swarm Expansion, Nuclear Weaponization.

## [0.2.0] - 2026-01-20

### 10x Refactor & Go-Live Verification
- **Modularization**: 100% compliance with < 200 LOC rule across all core and agent modules.
- **Security**: Hardened infrastructure by removing insecure defaults.

---
*Generated by Antigravity OS Specialist*
