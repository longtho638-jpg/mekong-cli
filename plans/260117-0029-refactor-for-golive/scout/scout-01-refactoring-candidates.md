# Scout Report: Refactoring Candidates - Comprehensive File-Level Analysis

**Date**: 2026-01-19
**Agent**: scout (3-agent parallel exploration)
**Target**: Complete codebase refactoring candidate identification

---

## Executive Summary

**Total Files Scanned**: 250+ files across all codebases
**Critical Refactoring Targets (P0)**: 14 files
**High Priority (P1)**: 12 files
**Medium Priority (P2)**: 10+ files
**Architectural Violations**: 11 identified
**TODOs Found**: 32 total (1 critical DNS verification blocker)

**Go-Live Impact**: 18-24 hours critical path (security + billing)

---

## P0 - Critical Refactoring Targets (>300 lines OR critical issues)

### Core Business Logic (antigravity/core/)

1. **control_enhanced.py** (672 lines) - **[CRITICAL]**
   - Issues: Complex Redis integration, 4 daemon threads, feature flags, circuit breakers
   - Security: Remote config fetching, analytics tracking
   - Refactor: Split into redis_client.py, feature_flags.py, circuit_breaker.py, analytics.py
   - Priority: **P0** - System stability risk

2. **knowledge_graph.py** (429 lines)
   - Issues: AST parsing, global singleton, recursive directory traversal
   - Performance: Memory growth on large codebases, no indexing limits
   - Refactor: Extract entity_extractor.py, search_engine.py, ast_parser.py
   - Priority: **P0** - Performance bottleneck

3. **agent_chains.py** (353 lines)
   - Issues: 275+ lines of static chain definitions, hardcoded paths
   - Technical debt: No validation for missing agent files
   - Refactor: Move definitions to YAML/JSON config, separate validation
   - Priority: **P0** - Maintainability

### Backend API (backend/api/)

4. **tunnel.py** (406 lines)
   - Issues: Hardcoded `http://localhost:8000`, magic numbers (5s, 10s, 30s TTLs)
   - Modularization: Extract ResponseCache module, metrics tracking
   - Priority: **P0** - Configuration management

5. **middleware/metrics.py** (230 lines)
   - Issues: Hardcoded buckets `[0.1, 0.25, 0.5, 1.0, 2.5, 5.0, 10.0]`
   - Refactor: Extract endpoint categorization, config-driven buckets
   - Priority: **P0** - Observability foundation

6. **middleware/rate_limiting.py** (222 lines)
   - Issues: Hardcoded plan limits (free:100, pro:500, enterprise:1000)
   - Duplicate: Endpoint categorization logic also in metrics.py
   - Refactor: Extract PLAN_LIMITS to config, reuse categorization
   - Priority: **P0** - Revenue protection

7. **middleware/multitenant.py** (207 lines)
   - Issues: Hardcoded TENANT_STORE in-memory, sqlite paths
   - Refactor: Extract tenant resolution strategies, move to database
   - Priority: **P0** - Scalability blocker

8. **routers/webhooks.py** (209 lines)
   - Issues: Hardcoded portal URL, in-memory `_customers` store
   - Duplicate: License key generation vs core/licensing
   - Refactor: Extract customer service, unify license logic
   - Priority: **P0** - Payment security

### CLI (cli/)

9. **entrypoint.py** (251 lines)
   - Issues: Monolithic command registration, hardcoded banner text
   - Refactor: Extract command groups into registry pattern, separate UI
   - Priority: **P1** - Developer experience

10. **commands/ops.py** (235 lines)
    - Issues: Mixed concerns (network/quota/health/deploy), subprocess calls
    - Refactor: Split into ops/network.py, ops/monitoring.py, ops/deployment.py
    - Priority: **P1** - Security (subprocess handling)

### Dashboard (apps/dashboard/)

11. **components/CommandPalette.tsx** (366 lines) - **[RULE VIOLATION: 250 line limit]**
    - Issues: 143 hardcoded commands, inline API logic, no separation
    - Refactor: Extract command definitions to config, separate API service
    - Priority: **P0** - Bundle size + maintainability

12. **lib/tenant/white-label.ts** (335 lines) - **[RULE VIOLATION + TODO]**
    - Issues: TODO at L184 (DNS verification unimplemented), class-based not hooks
    - Refactor: Convert to hooks/services, implement DNS verification
    - Priority: **P0** - Go-live blocker (DNS verification)

13. **components/CommandCenter/CommandCenter.tsx** (276 lines) - **[RULE VIOLATION]**
    - Issues: Duplicate command patterns with CommandPalette, mock data
    - Refactor: Share command definitions, extract agent service
    - Priority: **P1** - Code duplication

14. **.claude/statusline.cjs** (~400 lines estimated)
    - Issues: Monolithic file, complex parsing logic
    - Refactor: Already uses modular imports, split main logic further
    - Priority: **P2** - Infrastructure maintainability

---

## P1 - High Priority (200-300 lines OR security concerns)

### Core Business Logic

15. **control.py** (292 lines)
    - Issues: Thread safety with locks, circuit breaker state management
    - Refactor: Extract circuit breaker to separate module

16. **money_maker.py** (293 lines) - **[SECURITY]**
    - Issues: Financial calculations, no input validation, hardcoded pricing
    - Refactor: Add validation, extract pricing tables to config

17. **agent_crews.py** (258 lines)
    - Issues: time.sleep() in execution loops, simulated execution
    - Refactor: Replace with production-ready async patterns

18. **proposal_generator.py** (258 lines)
    - Issues: Large template strings, no template validation
    - Refactor: Extract templates to files, add validation

19. **checkpointing.py** (255 lines)
    - Issues: State serialization, no encryption for sensitive data
    - Refactor: Add encryption layer for financial/auth state

20. **vibe_workflow.py** (239 lines) - **[SECURITY + 1 TODO]**
    - Issues: Subprocess calls without sanitization, TODO at L186-187
    - Refactor: Add subprocess input validation, resolve TODO

21. **autonomous_mode.py** (235 lines)
    - Issues: Hardcoded keyword matching, no ML-based planning
    - Refactor: Extract heuristics to config, consider ML integration

### Backend API

22. **routers/code.py** (197 lines)
    - Issues: Hardcoded version "1.0.0", minimal request validation
    - Refactor: Extract code execution engine, add validators

23. **routers/dashboard.py** (189 lines)
24. **routers/commands.py** (173 lines)

### CLI

25. **onboard.py** (156 lines)
26. **commands/bridge.py** (153 lines)

---

## P2 - Medium Priority (100-200 lines OR hardcoded values)

### Configuration Issues

- **backend/api/config.py** (30 lines)
  - Hardcoded SECRET_KEY default "super-secret-key-change-in-production"
  - Hardcoded CORS origins

- **backend/api/main.py** (137 lines)
  - Hardcoded CORS origins

### Financial Systems

- **cli/billing.py** (130 lines) - License validation logic
- **cli/commands/sales.py** (128 lines) - Missing GUMROAD_ACCESS_TOKEN validation
- **backend/api/routers/paypal_webhooks.py** (120 lines)

### Subprocess Usage (Security Concern)

- **cli/developer.py** (113 lines)
- **cli/commands/mcp.py** (79 lines)
- **cli/project.py** (95 lines)
- **cli/commands/outreach.py** (138 lines)

---

## Architecture Issues

### Critical Duplications

1. **License Key Generation**
   - `backend/api/routers/webhooks.py:generate_license_key()`
   - `core/licensing/legacy.py:generate_license_key()`
   - **Action**: Unify in core/licensing module

2. **Endpoint Categorization**
   - `metrics.py:_extract_endpoint()`
   - `rate_limiting.py:get_endpoint_category()`
   - **Action**: Create shared utility module

3. **Pydantic Models**
   - `backend/api/schemas.py` VibeRequest/Response
   - `backend/models/vibe.py` VibeRequest/Response
   - **Action**: Consolidate in schemas.py

4. **Command Systems** (Dashboard)
   - CommandPalette: 143 commands
   - CommandCenter: 3 quick commands
   - **Action**: Unified command registry

### .claude vs mekong-cli Misalignments

1. **Command Duplication**
   - Scout defined in `/commands/scout.md` (32 lines) AND `/agents/scout.md` (108 lines)
   - Different purposes but naming overlap
   - **Action**: Clarify separation (command vs agent)

2. **Config Split**
   - Rules in `.claude/rules/` AND `$HOME/.claude/workflows/`
   - Unclear precedence
   - **Action**: Document precedence hierarchy

3. **Workflow Fragmentation**
   - kanban-workflow.md (62 lines)
   - kanban-agent-flow.md
   - **Action**: Consolidate or clarify relationship

### Hardcoded Values (Should Be Config)

**URLs:**
- `http://localhost:8000` (tunnel.py)
- `https://agencyos.network`
- `https://platform.billmentor.com` (webhooks.py)

**Secrets:**
- SECRET_KEY default "super-secret-key-change-in-production"

**Rate Limits:**
- 60/100/500/1000 per minute tiers

**Timeouts:**
- 5s, 10s, 30s cache TTLs

**Thresholds:**
- 0.05s fast response
- 0.1s slow request

**DB Paths:**
- `sqlite:///./default.db`
- `./agencyos.db`
- `./mekong.db`

**Action**: Extract all to backend/api/config.py and cli/config.py

### Missing Implementations

1. **DNS Verification** (white-label.ts L184) - **GO-LIVE BLOCKER**
2. **Input Validation** in API routers despite Pydantic imports
3. **Subprocess Timeout Handling** across CLI commands

---

## Code Standards Violations

**Per `.claude/rules/development-rules.md` (Max 250 lines/file):**

1. CommandPalette.tsx: 366 lines (46% over limit)
2. white-label.ts: 335 lines (34% over limit)
3. CommandCenter.tsx: 276 lines (10% over limit)

**Per code-standards.md (Max 500 lines hard limit):**
- control_enhanced.py: 672 lines (34% over hard limit)

---

## Security \u0026 Performance Audit

### Critical Security Issues

1. **Webhook Signature Verification** (from researcher report)
   - Fails open in non-production environments
   - **Impact**: Revenue security

2. **Admin Authentication Missing**
   - Stats endpoints (2 locations) lack auth checks
   - **Impact**: Data exposure

3. **Subprocess Sanitization**
   - 5 files use subprocess without input validation
   - **Impact**: Command injection risk

4. **Hardcoded Secrets**
   - SECRET_KEY default in config.py
   - **Impact**: Production security

### Performance Bottlenecks

1. **Bundle Size**
   - Current: ~1.5MB
   - Target: <1MB
   - Opportunities: 200-500KB savings (lucide-react + playwright)

2. **Memory Growth**
   - knowledge_graph.py: No indexing limits
   - **Impact**: System stability on large codebases

3. **Thread Management**
   - control_enhanced.py: 4 daemon threads, no timeout
   - **Impact**: Resource leaks

---

## Refactoring Priority Matrix

### Immediate (Go-Live Blockers) - 18-24 hours

| File | Lines | Issues | Effort | Impact |
|------|-------|--------|--------|--------|
| white-label.ts | 335 | DNS verification TODO | 4h | **HIGH** (blocker) |
| webhooks.py | 209 | Payment security | 3h | **HIGH** (revenue) |
| rate_limiting.py | 222 | Hardcoded limits | 2h | **MEDIUM** |
| config.py | 30 | Secrets | 1h | **HIGH** (security) |
| **TOTAL** | | | **10h** | |

### Phase 1 (Week 1) - Core Infrastructure

| File | Lines | Issues | Effort | Impact |
|------|-------|--------|--------|--------|
| control_enhanced.py | 672 | Threading + Redis | 12h | **HIGH** |
| knowledge_graph.py | 429 | Memory + perf | 8h | **MEDIUM** |
| agent_chains.py | 353 | Config hardcoding | 6h | **MEDIUM** |
| tunnel.py | 406 | Hardcoded config | 6h | **MEDIUM** |
| CommandPalette.tsx | 366 | Monolithic | 8h | **HIGH** |
| **TOTAL** | | | **40h** | |

### Phase 2 (Week 2) - Modularization

- CLI commands splitting (ops.py, etc.): 16h
- Middleware extraction: 12h
- Core business logic: 20h
- **TOTAL**: 48h

---

## Success Metrics

**Before Refactoring:**
- Files >250 lines: 14
- Files >500 lines: 1
- Hardcoded configs: 20+
- Duplicate implementations: 4 pairs
- TODOs: 32
- Bundle size: 1.5MB
- Test coverage: Unknown

**Target After Refactoring:**
- Files >250 lines: 0
- Files >500 lines: 0
- Hardcoded configs: 0 (all in config files)
- Duplicate implementations: 0
- TODOs: 0
- Bundle size: <1MB
- Test coverage: >80%

---

## Unresolved Questions

1. **Pricing Strategy**: Should pricing tables in money_maker.py move to database or config?
2. **Checkpoint Encryption**: Is encryption needed for checkpoint state with financial data?
3. **Agent Chains Validation**: Run at startup or on-demand?
4. **Knowledge Graph Limits**: Memory limit strategy for large codebases?
5. **Newsletter SaaS Status**: Is newsletter-saas/ active or archived?
6. **Playwright Dependency**: Production requirement or dev-only?
7. **Test Coverage Baseline**: Current coverage % across codebase?
8. **E2E Test Infrastructure**: Existing setup or needs creation?

---

**Next Steps**: Delegate to planner subagent to synthesize research + scout reports into comprehensive enhanced plan with 10 phases.
