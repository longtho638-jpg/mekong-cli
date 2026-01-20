# Scout Report: Refactoring Candidates

**Date:** 2026-01-20  
**Task:** Find files >200 LOC + TODO/FIXME/HACK comments

---

## Summary

- **Total files >200 LOC:** 67 files across all directories
- **TODO comments found:** 41 instances
- **FIXME comments:** 0 instances
- **HACK comments:** 2 instances (ContentPillar.AUTOMATION_HACKS - enum value, not tech debt)

---

## Files Exceeding 200 Lines (High Priority)

### Critical (>500 LOC) - Immediate Refactor Needed

| Lines | File | Notes |
|-------|------|-------|
| 906 | `/scripts/legacy/paypal_ai_agent.py` | Legacy, consider deprecation |
| 853 | `/antigravity/core/algorithm_enhanced.py` | Core algo - needs modularization |
| 731 | `/antigravity/core/ab_testing_engine.py` | Testing engine - split by concern |
| 670 | `/antigravity/core/ml_optimizer.py` | ML module - extract sub-modules |
| 636 | `/scripts/vibeos/workflow_engine.py` | Workflow - break into phases |
| 590 | `/antigravity/infrastructure/opentelemetry.py` | Infra - split by layer |
| 585 | `/antigravity/infrastructure/distributed_queue.py` | Queue - extract workers |
| 584 | `/core/security/env_manager.py` | Security - high priority |
| 577 | `/scripts/legacy/paypal_error_handler.py` | Legacy |
| 572 | `/scripts/legacy/payment_hub.py` | Legacy |
| 561 | `/scripts/legacy/agentops-mvp/agents/guardian/guardian_agent_original.py` | Legacy |
| 550 | `/scripts/setup/setup_claude_bridge.py` | Setup - break into steps |
| 550 | `/scripts/legacy/paypal_payflow.py` | Legacy |
| 528 | `/scripts/legacy/agentops-mvp/agents/dealflow/dealflow_scout.py` | Legacy |
| 524 | `/core/security/validate_phase2_fixes.py` | Validation - can split |
| 518 | `/scripts/legacy/agentops-mvp/agents/portfolio/portfolio_monitor.py` | Legacy |

### High Priority (300-500 LOC)

| Lines | File |
|-------|------|
| 481 | `/scripts/vibeos/solo_revenue_daemon.py` |
| 476 | `/scripts/legacy/consolidate_docs.py` |
| 465 | `/newsletter-saas/src/__tests__/payment-security.test.ts` |
| 464 | `/scripts/vibeos/commander_engine.py` |
| 463 | `/scripts/legacy/passive_income.py` |
| 445 | `/antigravity/core/revenue_ai.py` |
| 418 | `/antigravity/core/agent_swarm.py` |
| 400 | `/antigravity/core/tracing.py` |
| 394 | `/antigravity/core/self_improve.py` |
| 393 | `/scripts/legacy/agentops-mvp/agents/revenue/revenue_agent.py` |
| 392 | `/scripts/legacy/campaign_manager.py` |
| 388 | `/core/repositories/client_portal_repository.py` |
| 375 | `/antigravity/core/observability.py` |
| 372 | `/core/repositories/analytics_repository.py` |
| 371 | `/antigravity/core/code_guardian.py` |
| 369 | `/core/hr/career_development.py` |
| 363 | `/core/finance/investor_relations.py` |
| 360 | `/core/ops/network.py` |
| 358 | `/scripts/legacy/agentops-mvp/test_server.py` |
| 357 | `/antigravity/mcp_server.py` |
| 351 | `/tests/fixtures/mock_data.py` |
| 351 | `/scripts/legacy/paypal_production_setup.py` |
| 349 | `/packages/vibe-analytics/index.test.ts` |
| 346 | `/scripts/antibridge/server.py` |
| 340 | `/antigravity/infrastructure/viral_defense.py` |
| 340 | `/tests/test_navigation_flow.py` |
| 338 | `/core/services/analytics_service.py` |
| 334 | `/core/hr/talent_acquisition.py` |
| 332 | `/core/modules/content/services.py` |
| 331 | `/core/portal/client_portal.py` |
| 329 | `/core/finance/term_sheet.py` |
| 327 | `/antigravity/core/ml/models.py` |
| 327 | `/tests/test_wow.py` |
| 327 | `/core/agents/personas/ciso.py` |
| 318 | `/core/services/client_portal_service.py` |
| 317 | `/antigravity/infrastructure/scale.py` |
| 312 | `/antigravity/core/cashflow_engine.py` |
| 312 | `/core/security/auth_middleware.py` |
| 309 | `/packages/vibe-money/index.ts` |
| 308 | `/antigravity/cli/__init__.py` |
| 305 | `/antigravity/core/algorithm.py` |
| 305 | `/newsletter-saas/src/app/page.tsx` |
| 304 | `/core/outreach/call_center.py` |

### Medium Priority (200-300 LOC) - Backend Agents

| Lines | File |
|-------|------|
| 270 | `/backend/tests/test_viral_tracing.py` |
| 270 | `/newsletter-saas/src/app/pricing/page.tsx` |
| 265 | `/packages/vibe-bridge/index.ts` |
| 255 | `/apps/docs/src/components/agencyos/DynamicCard.tsx` |
| 255 | `/newsletter-saas/src/app/dashboard/page.tsx` |
| 252 | `/newsletter-saas/src/app/dashboard/editor/[id]/page.tsx` |
| 251 | `/cli/entrypoint.py` |
| 250 | `/backend/main.py` |
| 246 | `/packages/vibe/hardened.ts` |
| 238 | `/packages/vibe/flow.ts` |
| 237 | `/packages/vibe-analytics/index.ts` |
| 235 | `/backend/api/middleware/rate_limiting.py` |
| 233 | `/newsletter-saas/src/lib/security.ts` |
| 233 | `/backend/agents/props/outreach_agent.py` |
| 231 | `/backend/api/tunnel/optimizer.py` |
| 230 | `/backend/agents/finops/budget_manager.py` |
| 230 | `/backend/agents/adminops/report_generator_agent.py` |
| 228 | `/backend/agents/community.py` |
| 227 | `/backend/agents/ldops/development_agent.py` |
| 226 | `/backend/agents/serviceops/ticket_manager.py` |
| 226 | `/backend/agents/props/press_release_agent.py` |
| 225 | `/backend/api/middleware/metrics.py` |
| 223 | `/apps/docs/src/components/agencyos/ApprovalDialog.tsx` |
| 223 | `/backend/agents/serviceops/chatbot_agent.py` |
| 220 | `/backend/api/routers/webhooks.py` |
| 216 | `/backend/agents/marketingcoordops/event_agent.py` |
| 214 | `/newsletter-saas/src/app/signup/page.tsx` |
| 214 | `/backend/agents/adminops/task_manager_agent.py` |
| 213 | `/backend/agents/compbenops/payroll_agent.py` |
| 211 | `/backend/agents/influencermarketingops/influencer_campaign_agent.py` |
| 209 | `/apps/docs/src/pages/api/client/dashboard.ts` |
| 209 | `/packages/antigravity/core/treasury.ts` |
| 209 | `/backend/agents/seops/demo_manager_agent.py` |
| 208 | `/packages/vibe-crm/index.ts` |
| 206 | `/packages/vibe-agents/index.ts` |
| 203 | `/packages/vibe-ui/index.test.ts` |

---

## TODO Comments Analysis

### Active TODOs Requiring Action

| File | Line | TODO Comment |
|------|------|--------------|
| `/newsletter-saas/src/app/api/ai/write/route.ts` | 13 | Integrate with OpenAI/Gemini |
| `/newsletter-saas/src/app/api/subscribe/route.ts` | 87 | Trigger welcome automation if exists |
| `/apps/docs/src/pages/api/promo/validate.ts` | 90 | Check Polar.sh discounts (when configured) |
| `/apps/docs/src/pages/api/agency/stats.ts` | 15 | Add admin authentication |
| `/apps/dashboard/lib/tenant/white-label.ts` | 184 | Implement actual DNS verification |
| `/scripts/legacy/agentops-mvp/orchestrator/main.py` | 58 | Add other 29 agents as they're built |
| `/scripts/legacy/agentops-mvp/orchestrator/main.py` | 173 | Calculate real WIN^3 metrics from agent data |
| `/scripts/legacy/agentops-mvp/agents/revenue/revenue_agent.py` | 191-192 | Send actual email via SendGrid/AWS SES + Log reminder in Supabase |
| `/scripts/legacy/agentops-mvp/agents/revenue/revenue_agent.py` | 232-233 | Auto-generate invoice for success fee + Notify team |
| `/scripts/legacy/agentops-mvp/agents/guardian/guardian_agent_original.py` | 99 | Use LLM to extract terms from document |
| `/scripts/legacy/agentops-mvp/agents/guardian/services/contract_service.py` | 24 | Use LLM to extract terms from document |
| `/scripts/legacy/agentops-mvp/agents/guardian/agents/term_sheet_parser.py` | 42 | Implement regex-based extraction |
| `/scripts/legacy/agentops-mvp/agents/dealflow/dealflow_scout.py` | 108 | Integrate with real APIs |
| `/scripts/legacy/agentops-mvp/agents/dealflow/dealflow_scout.py` | 243 | Integrate with Calendly/Google Calendar |
| `/scripts/legacy/agentops-mvp/agents/dealflow/dealflow_scout.py` | 367 | Integrate with real CRM (HubSpot, Pipedrive) |
| `/scripts/legacy/agentops-mvp/agents/portfolio/portfolio_monitor.py` | 103 | Integrate with real APIs (Stripe, Mixpanel) |
| `/scripts/contract_gen/templates.py` | 6 | Load these from dynamic config or database |
| `/antigravity/core/money_maker.py` | 38 | Move to pricing.yaml config file |
| `/mekong-docs/src/components/AIChat.tsx` | 40 | Replace with actual API call when backend is available |
| `/external/vibe-kanban/frontend/src/lib/client/cache.ts` | 105 | Track hit/miss counts |
| `/external/vibe-kanban/frontend/src/contexts/WorkspaceContext.tsx` | 127 | Support multiple repos |

### TaskStatus.TODO (Enum values, not tech debt)
- `/core/services/client_portal_service.py`
- `/backend/agents/adminops/task_manager_agent.py`
- `/backend/agents/sweops/sprint_agent.py`
- `/backend/agents/marketingmanagerops/team_agent.py`

---

## Refactoring Recommendations

### Priority 1: Critical Files (>500 LOC)
1. **`/antigravity/core/algorithm_enhanced.py`** (853 LOC)
   - Split into: base algorithm, enhanced features, utilities
   - Extract helper functions into separate modules

2. **`/antigravity/core/ab_testing_engine.py`** (731 LOC)
   - Split into: experiment config, variation logic, results analysis
   
3. **`/antigravity/core/ml_optimizer.py`** (670 LOC)
   - Extract: model management, training pipeline, inference engine

4. **`/core/security/env_manager.py`** (584 LOC)
   - Critical security code - split carefully by responsibility

### Priority 2: Legacy Cleanup
- Many 500+ LOC files in `/scripts/legacy/` - evaluate deprecation vs refactor
- PayPal-related files: consolidate or deprecate based on current usage

### Priority 3: Infrastructure
- Split `/antigravity/infrastructure/opentelemetry.py` by telemetry type
- Break `/antigravity/infrastructure/distributed_queue.py` into queue/worker/config

### Priority 4: Test Files
- `/tests/fixtures/mock_data.py` (351 LOC) - split by domain
- Large test files acceptable but consider test organization

---

## Unresolved Questions

1. Are files in `/scripts/legacy/` still in active use or can they be deprecated?
2. Should PayPal integration files be consolidated or removed?
3. What is the timeline priority for antigravity core refactoring?
