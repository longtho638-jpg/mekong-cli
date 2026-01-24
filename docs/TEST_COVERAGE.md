# Test Coverage Report

**Generated:** January 25, 2026
**Command:** `pytest tests/ backend/tests/ --cov=backend --cov=antigravity --cov-report=html --cov-report=term -q`

## Summary

**Total Tests:** 604 collected
**Tests Passed:** 595
**Tests Failed:** 7
**Tests Skipped:** 2

### Test Results
- **Pass Rate:** 98.5%
- **Failed Tests:** 7 (6 E2E/webhook tests, 1 health check test)
- **Skipped Tests:** 2 (two-factor authentication tests)

## Coverage Overview

The coverage report shows varying levels of test coverage across the codebase:

### High Coverage Areas (>80%)
- Core business logic modules (mostly 90%+)
- Agent orchestration systems
- Algorithm engines
- Infrastructure components (OpenTelemetry, distributed queues)
- Backend API services

### Areas Needing Improvement (<50%)

#### CLI Components (0% coverage)
- `antigravity/cli/__init__.py` - 0%
- `antigravity/cli/agency_commands.py` - 0%
- `antigravity/cli/app.py` - 0%
- `antigravity/cli/commands.py` - 0%
- `antigravity/cli/utils.py` - 0%
- `antigravity/cli/vibe_commands.py` - 0%

#### A/B Testing Analysis (19-52% coverage)
- `antigravity/core/ab_testing/analysis.py` - 19%
- `antigravity/core/ab_testing/lifecycle.py` - 26%
- `antigravity/core/ab_testing/reporting.py` - 52%
- `antigravity/core/ab_testing/experiments.py` - 43%

#### ML Engine Components (34-59%)
- `antigravity/core/algorithm/ml_engine/inference.py` - 36%
- `antigravity/core/algorithm/ml_engine/persistence.py` - 34%
- `antigravity/core/algorithm/ml_engine/training.py` - 34%
- `antigravity/core/algorithm/ml_engine/model_registry.py` - 59%

#### Agent Orchestrator (30-67%)
- `antigravity/core/agent_orchestrator/reporting.py` - 30%
- `antigravity/core/agent_orchestrator/delegator.py` - 56%
- `antigravity/core/agent_orchestrator/engine.py` - 67%

#### Legacy/Deprecated Modules (0% coverage)
- `antigravity/core/agent_chains.py` - 0%
- `antigravity/core/agent_crews.py` - 0%
- `antigravity/core/agent_memory.py` - 0%
- `antigravity/core/agent_orchestrator.py` - 0%
- `antigravity/core/algorithm/base.py` - 0%

## Failed Tests

### E2E Critical Flows
1. `test_health_check` - Missing 'modules' key in health endpoint response
   - Location: `tests/e2e/test_critical_flows.py:11`
   - Issue: Health response format changed

### Purchase Flow Tests (4 failures)
2. `test_complete_purchase_flow_success` - 415 Unsupported Media Type
   - Location: `tests/e2e/test_purchase_flow.py:170`
   - Issue: Content-type validation rejection (application/x-www-form-urlencoded)

3. `test_webhook_invalid_signature` - 415 Unsupported Media Type
   - Location: `tests/e2e/test_purchase_flow.py:223`
   - Expected: 400/401/500, Got: 415

4. `test_license_activation_flow` - 400 Bad Request
   - Location: `tests/e2e/test_purchase_flow.py:317`
   - Issue: DB not available (audit log skipped)

5. `test_webhook_duplicate_handling` - 415 Unsupported Media Type
   - Location: `tests/e2e/test_purchase_flow.py:378`

### Gumroad Webhook Tests (2 failures)
6. `test_gumroad_webhook_success` - 401 Unauthorized
   - Location: `backend/tests/test_gumroad_webhooks.py:38`
   - Issue: Missing X-Gumroad-Signature header

7. `test_gumroad_webhook_failure` - 401 Unauthorized
   - Location: `backend/tests/test_gumroad_webhooks.py:60`
   - Expected: 400, Got: 401

## Priority Test Gaps

### P0 - Critical (0% coverage)
1. **CLI commands** - All CLI entry points need integration tests
2. **Deprecated modules** - Either test or remove:
   - `agent_chains.py`, `agent_crews.py`, `agent_memory.py`, `agent_orchestrator.py`

### P1 - High Priority (<30% coverage)
1. **A/B Testing Analysis** (19%)
   - Statistical analysis functions
   - Confidence interval calculations
   - Variant comparison logic

2. **ML Engine Components** (34-36%)
   - Model training workflows
   - Model persistence and loading
   - Inference pipeline
   - Model registry operations

3. **Agent Orchestrator Reporting** (30%)
   - Report generation logic
   - Metrics aggregation
   - Performance tracking

### P2 - Medium Priority (30-50% coverage)
1. **A/B Testing Lifecycle** (26%)
2. **Algorithm Scoring** (25%)
3. **Agent Orchestrator Delegator** (56%)
4. **A/B Testing Experiments** (43%)
5. **Agent Memory Blackboard** (56%)

## Recommendations

### Immediate Actions
1. **Fix failing E2E tests** - Address webhook content-type validation and signature handling
2. **Health endpoint** - Update test assertions to match current response format
3. **CLI testing** - Add integration tests for all CLI commands

### Short-term Improvements
1. **A/B Testing module** - Increase coverage from 19-52% to >70%
   - Add tests for statistical analysis
   - Test experiment lifecycle management
   - Validate reporting accuracy

2. **ML Engine** - Increase coverage from 34-59% to >70%
   - Test model training pipelines
   - Validate persistence mechanisms
   - Test inference workflows

3. **Remove or test deprecated modules** - Clarify module status:
   - If deprecated: remove from codebase
   - If active: add tests to achieve >60% coverage

### Long-term Strategy
1. **Establish coverage targets:**
   - Core business logic: >90%
   - Infrastructure: >80%
   - CLI/Tools: >70%
   - Experimental features: >60%

2. **Implement coverage gates** in CI/CD:
   - Fail builds if coverage drops below thresholds
   - Require tests for new features

3. **Deprecation policy:**
   - Document which modules are deprecated
   - Set sunset dates
   - Migrate functionality to tested modules

## HTML Coverage Report

Full detailed coverage report available at: `htmlcov/index.html`

Open in browser to explore:
- File-by-file coverage breakdowns
- Line-by-line coverage highlighting
- Missing coverage identification
- Function-level coverage statistics

## Next Steps

1. ✅ Run coverage analysis - DONE
2. ✅ Generate coverage summary - DONE
3. 🔄 Fix failing E2E tests
4. 🔄 Add CLI integration tests
5. 🔄 Improve A/B testing coverage
6. 🔄 Improve ML engine coverage
7. 🔄 Clean up deprecated modules
