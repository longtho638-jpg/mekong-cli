---
title: "Phase 1: Architecture & Project Structure Alignment"
description: "Map .claude rules to codebase, establish refactoring patterns"
status: pending
priority: P0
effort: 4h
phase: 1
---

# Phase 1: Architecture & Project Structure Alignment

> Mapping VIBE development rules to existing codebase structure.

## Context Links

- Scout Report: `/plans/reports/scout-260120-0101-refactoring-candidates.md`
- Development Rules: `.claude/rules/development-rules.md`
- VIBE Rules: `.claude/rules/vibe-development-rules.md`

## Overview

**Priority:** P0 - Foundation for all subsequent phases
**Current Status:** pending
**Description:** Establish refactoring patterns and modularization strategies before execution.

## Key Insights

1. **67 files exceed 200 LOC** - VIBE rule violation
2. **16 critical files exceed 500 LOC** - Immediate action required
3. **kebab-case naming required** - Current: mixed (snake_case + kebab)
4. **Existing modular work started** - `antigravity/core/quota/` already split

## Requirements

### Functional
- Define modularization strategy for each critical file
- Create naming convention mapping
- Establish module boundaries

### Non-Functional
- Zero breaking changes in public APIs
- Maintain backward compatibility
- Preserve git history (avoid mass renames in single commit)

## Architecture

### Current Structure (Problematic)
```
antigravity/core/
  algorithm_enhanced.py  # 853 LOC - Monolithic
  ab_testing_engine.py   # 731 LOC - Monolithic
  ml_optimizer.py        # 670 LOC - Monolithic
```

### Target Structure (Modular)
```
antigravity/core/
  algorithm/
    __init__.py          # Public exports
    base.py              # Core algorithm
    enhanced.py          # Enhancements
    utilities.py         # Helpers
  ab_testing/
    __init__.py
    engine.py            # Core engine
    experiments.py       # Experiment config
    variations.py        # Variation logic
    analysis.py          # Results analysis
  ml/
    __init__.py
    optimizer.py         # Optimizer facade
    models.py            # Model management
    training.py          # Training pipeline
    inference.py         # Inference engine
```

## Modularization Pattern

### Step-by-Step Process
1. **Analyze** - Read file, identify logical boundaries
2. **Extract** - Create sub-module directory with `__init__.py`
3. **Split** - Move functions/classes to appropriate sub-modules
4. **Facade** - Keep original file as re-export facade (deprecation path)
5. **Test** - Verify no import errors, run existing tests
6. **Document** - Update docstrings and module docs

### Example Pattern
```python
# BEFORE: algorithm_enhanced.py (853 LOC)
class EnhancedAlgorithm:
    def calculate(): ...
    def optimize(): ...
    def validate(): ...
    # 800+ more lines

# AFTER: algorithm/__init__.py
from .base import BaseAlgorithm
from .enhanced import EnhancedAlgorithm
from .utilities import calculate, optimize, validate

__all__ = ["BaseAlgorithm", "EnhancedAlgorithm", "calculate", "optimize", "validate"]
```

## Related Code Files

### To Analyze
| File | LOC | Action |
|------|-----|--------|
| `antigravity/core/algorithm_enhanced.py` | 853 | Split to algorithm/ |
| `antigravity/core/ab_testing_engine.py` | 731 | Split to ab_testing/ |
| `antigravity/core/ml_optimizer.py` | 670 | Split to ml/ |
| `antigravity/core/revenue_ai.py` | 445 | Split to revenue/ |
| `antigravity/core/agent_swarm.py` | 418 | Split to swarm/ |

### Already Modularized (Reference)
- `antigravity/core/quota/` - Good example to follow
- `antigravity/core/chains/` - Already modular
- `antigravity/core/models/` - Already modular

## Implementation Steps

1. [ ] Create architecture mapping document
2. [ ] Define sub-module boundaries for each critical file
3. [ ] Establish import/export patterns
4. [ ] Create refactoring checklist template
5. [ ] Set up branch protection for refactor work
6. [ ] Create automated LOC checking script

## Todo List

- [ ] Audit all 67 files and categorize by domain
- [ ] Map dependencies between critical files
- [ ] Define split strategy for each file category
- [ ] Create `__init__.py` templates
- [ ] Document backward compatibility approach

## Success Criteria

- [ ] All 16 critical files have defined split strategy
- [ ] Modularization pattern documented
- [ ] Branch `refactor/10x-go-live` created
- [ ] Team aligned on approach

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| Breaking imports | High | Facade pattern with re-exports |
| Circular dependencies | Medium | Dependency injection, interfaces |
| Test failures | High | Run tests after each file split |
| Git conflicts | Medium | Small, focused commits |

## Security Considerations

- No credential changes in this phase
- Preserve existing auth patterns
- Review security files separately (Phase 3)

## Next Steps

After Phase 1 approval:
- Proceed to Phase 2: Core Engine Refactoring
- Execute splits for `algorithm_enhanced.py` first (highest LOC)
