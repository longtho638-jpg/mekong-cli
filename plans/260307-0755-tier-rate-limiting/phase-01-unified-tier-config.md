---
phase: 1
title: "Unified Tier Configuration"
effort: 1.5h
---

# Phase 1: Unified Tier Configuration

## Context Links
- Related: `src/lib/raas_gate.py` (current rate limiting)
- Related: `src/lib/jwt_license_generator.py` (tier definitions)

## Overview
**Priority:** P0 (Critical Foundation) | **Status:** ✅ Complete

**Files Created:** `src/lib/tier_config.py`

Merge 2 tier systems into single source of truth with database-backed configs.

## Key Insights

Current state:
- `jwt_license_generator.py`: FREE, TRIAL, PRO, ENTERPRISE tiers
- `raas_gate.py`: Hardcoded limits, no tier awareness
- No database storage for tier configs

## Requirements

### Functional
- Define 4 tiers: free, trial, pro, enterprise
- Store limits in database, not hardcoded
- Support custom presets (requests/hour, requests/day, burst)

### Non-functional
- Config changes without code deploy
- <1ms lookup time for tier configs
- Thread-safe config access

## Architecture

```python
# src/lib/tier_config.py (NEW)
class TierConfig:
    FREE = {
        "requests_per_hour": 100,
        "requests_per_day": 1000,
        "burst_limit": 10,
        "multiplier": 1.0
    }
    TRIAL = { ... }
    PRO = { ... }
    ENTERPRISE = { ... }
```

## Implementation Steps

1. Create `src/lib/tier_config.py` with TierConfig class
2. Define 4 tier presets with limits
3. Add `get_tier_config(tier_name)` method
4. Add validation for tier names
5. Remove hardcoded limits from `raas_gate.py`

## Related Code Files
- **Create:** `src/lib/tier_config.py`
- **Modify:** `src/lib/raas_gate.py` (remove hardcoded limits)
- **Modify:** `src/lib/jwt_license_generator.py` (align tier names)

## Todo List
- [ ] Create TierConfig class with 4 tier presets
- [ ] Add tier validation function
- [ ] Export get_tier_config() public API
- [ ] Update raas_gate.py to use TierConfig
- [ ] Add tier config tests

## Success Criteria
- `get_tier_config("pro")` returns correct limits in <1ms
- All 4 tiers defined with sensible defaults
- Zero hardcoded limits in rate limiter code

## Risk Assessment
- **Risk:** Breaking existing license validation
- **Mitigation:** Keep backward compat with old tier names

## Next Steps
→ Phase 2: Build factory pattern on top of this config
