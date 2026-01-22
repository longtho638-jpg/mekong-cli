---
title: "Phase 4: Legacy Scripts Cleanup"
description: "Deprecate or refactor legacy scripts based on usage analysis"
status: pending
priority: P1
effort: 6h
phase: 4
---

# Phase 4: Legacy Scripts Cleanup

> Decisive action on 15+ legacy files totaling 8000+ LOC.

## Context Links

- Phase 3: `./phase-03-security-infrastructure.md`
- Legacy directory: `/scripts/legacy/`
- Scout report: `/plans/reports/scout-260120-0101-refactoring-candidates.md`

## Overview

**Priority:** P1 - Technical debt reduction
**Current Status:** pending
**Description:** Evaluate, deprecate, or refactor legacy scripts to reduce maintenance burden.

## Key Insights

1. **PayPal scripts dominate** - 4 files, 3000+ LOC total
2. **agentops-mvp is archived** - Contains old agent implementations
3. **Some scripts still in use** - Need usage analysis first
4. **No active development** - Legacy = frozen, not actively maintained

## Requirements

### Functional
- Identify actively used scripts
- Deprecate unused scripts safely
- Refactor essential scripts if needed

### Non-Functional
- Clear deprecation notices
- Migration path for users
- Archive, don't delete (git history)

## Target Files Analysis

### PayPal Integration (Deprecation Candidates)

| File | LOC | Last Modified | Recommendation |
|------|-----|---------------|----------------|
| `paypal_ai_agent.py` | 906 | Legacy | DEPRECATE - Use new payment module |
| `paypal_error_handler.py` | 577 | Legacy | DEPRECATE - Inline errors |
| `payment_hub.py` | 572 | Legacy | DEPRECATE - Use core/finance |
| `paypal_payflow.py` | 550 | Legacy | DEPRECATE |
| `paypal_production_setup.py` | 351 | Legacy | ARCHIVE - Setup complete |
| `paypal_agent.py` | ~300 | Legacy | DEPRECATE |

**Decision:** PayPal integration moved to new architecture. Legacy scripts to archive.

### AgentOps MVP (Archive)

| File | LOC | Recommendation |
|------|-----|----------------|
| `agentops-mvp/agents/guardian/guardian_agent_original.py` | 561 | ARCHIVE |
| `agentops-mvp/agents/dealflow/dealflow_scout.py` | 528 | ARCHIVE |
| `agentops-mvp/agents/portfolio/portfolio_monitor.py` | 518 | ARCHIVE |
| `agentops-mvp/agents/revenue/revenue_agent.py` | 393 | ARCHIVE |
| `agentops-mvp/test_server.py` | 358 | ARCHIVE |

**Decision:** MVP phase complete. Archive entire directory, reference for new implementations.

### Potentially Active Scripts

| File | LOC | Recommendation |
|------|-----|----------------|
| `consolidate_docs.py` | 476 | EVALUATE - May be needed |
| `passive_income.py` | 463 | EVALUATE - Revenue feature |
| `campaign_manager.py` | 392 | REFACTOR - If still used |

## Architecture

### Deprecation Strategy

```
scripts/legacy/
  _ARCHIVED/                    # Move deprecated here
    paypal/
      paypal_ai_agent.py       # With deprecation header
      paypal_error_handler.py
      ...
    agentops-mvp/
      ...
  _DEPRECATED.md               # Deprecation notice
  consolidate_docs.py          # Keep if needed
  passive_income.py            # Keep if needed
```

### Deprecation Header Template

```python
"""
DEPRECATED - 2026-01-20

This module is deprecated and will be removed in a future version.

Migration:
- For PayPal integration, use: core.finance.payment_processor
- For payment hub, use: core.finance.payment_gateway
- Documentation: docs/migration/paypal-legacy.md

This file is preserved for reference only.
"""
import warnings
warnings.warn(
    "This module is deprecated. Use core.finance.payment_processor instead.",
    DeprecationWarning,
    stacklevel=2
)
```

## Implementation Steps

### Analysis Phase
1. [ ] Run usage analysis on all legacy scripts
2. [ ] Check git log for recent modifications
3. [ ] Search codebase for imports of legacy modules
4. [ ] Document findings

### PayPal Deprecation
5. [ ] Create `_ARCHIVED/paypal/` directory
6. [ ] Add deprecation headers to all PayPal files
7. [ ] Move files to archive
8. [ ] Update any remaining imports (should be none)
9. [ ] Create migration guide

### AgentOps MVP Archive
10. [ ] Move entire `agentops-mvp/` to `_ARCHIVED/`
11. [ ] Add README explaining archive status
12. [ ] Extract any useful patterns to documentation

### Active Scripts Evaluation
13. [ ] Test `consolidate_docs.py` - still needed?
14. [ ] Test `passive_income.py` - still needed?
15. [ ] If needed, refactor to < 200 LOC
16. [ ] If not needed, archive

### Vibeos Scripts (Separate Evaluation)
17. [ ] Evaluate `scripts/vibeos/` - newer scripts
18. [ ] `workflow_engine.py` (636 LOC) - REFACTOR if active
19. [ ] `solo_revenue_daemon.py` (481 LOC) - REFACTOR if active
20. [ ] `commander_engine.py` (464 LOC) - REFACTOR if active

## Todo List

- [ ] Usage analysis complete
- [ ] PayPal scripts archived (6 files, ~3200 LOC)
- [ ] AgentOps MVP archived (5+ files, ~2400 LOC)
- [ ] Remaining scripts evaluated
- [ ] Migration documentation created
- [ ] _DEPRECATED.md created

## Success Criteria

- [ ] Legacy LOC reduced by 80%+
- [ ] No broken imports
- [ ] Clear deprecation notices
- [ ] Migration guide available
- [ ] Archive structure clean

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| Breaking active features | HIGH | Usage analysis first |
| Losing useful code | LOW | Archive, don't delete |
| Incomplete migration | MEDIUM | Migration guide |
| Team confusion | LOW | Clear documentation |

## Security Considerations

- PayPal credentials must not be in legacy scripts
- Review archived files for any secrets
- Ensure no API keys in git history (already committed)

## Unresolved Questions

1. Is `consolidate_docs.py` used by documentation pipeline?
2. Is `passive_income.py` generating any revenue?
3. Are `vibeos/` scripts part of active roadmap?
4. Should `agentops-mvp` be fully deleted or kept as reference?

## Next Steps

After Phase 4:
- Phase 5: Testing & Quality Assurance
- Focus on 100% test pass rate
