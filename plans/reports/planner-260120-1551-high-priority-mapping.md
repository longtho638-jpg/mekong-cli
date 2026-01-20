# Report: High-Priority Mapping (Top 20 Violations)

This report maps the top 20 files exceeding the 200 LOC limit to specific refactoring strategies.

| File | LOC | Category | Strategy |
|------|-----|----------|----------|
| `core/security/env_manager.py` | 584 | Security | Split into `definitions.py`, `validator.py`, `generator.py`. |
| `core/security/validate_phase2_fixes.py` | 524 | Security | Split into `checks/` directory by category. |
| `core/repositories/client_portal_repository.py` | 388 | Data | Extract domain-specific queries into `core/portal/queries/`. |
| `core/repositories/analytics_repository.py` | 372 | Data | Extract aggregator logic into `core/analytics/aggregators.py`. |
| `core/hr/career_development.py` | 369 | HR | Extract `Training` and `Skill` models; use `vibe_ui` for dashboards. |
| `core/finance/investor_relations.py` | 363 | Finance | Extract `Investor` models; use `vibe_ui` for dashboards. |
| `core/ops/network.py` | 360 | Ops | Split into `scanner.py`, `monitor.py`, and `tunnel.py`. |
| `packages/vibe-analytics/index.test.ts` | 349 | Test | Split into `service.test.ts` and `repository.test.ts`. |
| `core/services/analytics_service.py` | 338 | Service | Delegate complex calculations to a new `AnalyticsEngine`. |
| `core/hr/talent_acquisition.py` | 334 | HR | Split into `sourcing.py` and `interviewing.py`. |
| `core/modules/content/services.py` | 332 | Content | Extract specific social media providers into `providers/`. |
| `core/portal/client_portal.py` | 331 | Portal | Modularize by component (billing, support, project). |
| `core/finance/term_sheet.py` | 329 | Finance | Extract clause validation logic into `validators/`. |
| `core/agents/personas/ciso.py` | 327 | Agents | Move large persona prompts to `prompts/ciso.txt`. |
| `core/services/client_portal_service.py` | 318 | Service | Modularize service methods by domain (auth, billing, notifications). |
| `core/security/auth_middleware.py` | 312 | Security | Split into `jwt_handler.py`, `rate_limiter.py`, and `headers.py`. |
| `packages/vibe-money/index.ts` | 309 | Package | Split into `currency.ts`, `invoice.ts`, and `payment.ts`. |
| `core/outreach/call_center.py` | 304 | Outreach | Extract specific provider logic (Twilio/Aircall) into adapters. |
| `core/analytics/analytics.py` | 298 | Analytics | Extract reporting logic into `core/analytics/reporter.py`. |
| `core/memory/memory.py` | 288 | Core | Split into `short_term.py` and `long_term.py` (Vector DB). |

## General Action Items
- **Move Prompts**: All large string prompts (> 50 lines) should be moved to separate `.txt` or `.md` files and loaded at runtime.
- **UI Decoupling**: Extract all ASCII/Box-drawing logic to `core/utils/vibe_ui.py`.
- **Model Separation**: Ensure dataclasses/enums are in their own `models.py` or `enums.py` files within the module directory.
