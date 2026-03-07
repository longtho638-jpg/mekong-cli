---
phase: 2
title: "Tier Rate Limiter Factory"
effort: 1.5h
---

# Phase 2: Tier Rate Limiter Factory

## Context Links
- Depends on: Phase 1 (TierConfig)
- Related: `src/lib/raas_gate.py` (rate limiter implementation)

## Overview
**Priority:** P0 | **Status:** ✅ Complete

**Files Created:** `src/lib/rate_limiter_factory.py`

Factory pattern to return configured rate limiter based on tenant tier.

## Key Insights

Factory benefits:
- Single entry point for rate limiter lookup
- Easy to add new tiers without touching limiter code
- Caching layer for performance

## Requirements

### Functional
- `get_rate_limiter_for_tier(tier_name)` returns configured limiter
- `get_rate_limiter_for_license(license_key)` extracts tier + returns limiter
- In-memory cache with 5min TTL

### Non-functional
- <2ms total lookup time (including cache)
- Thread-safe cache access
- Graceful degradation if cache miss

## Architecture

```python
# src/lib/rate_limiter_factory.py (NEW)
class RateLimiterFactory:
    _cache = {}  # tier -> RateLimiter
    _cache_ttl = 300  # 5 minutes

    @classmethod
    def get_limiter(cls, tier: str) -> RateLimiter:
        if tier not in cls._cache or cls._cache_expired(tier):
            cls._cache[tier] = cls._create_limiter(tier)
        return cls._cache[tier]

    @classmethod
    def get_limiter_for_license(cls, license_key: str) -> RateLimiter:
        tier = extract_tier_from_license(license_key)
        return cls.get_limiter(tier)
```

## Implementation Steps

1. Create `src/lib/rate_limiter_factory.py`
2. Implement `RateLimiterFactory` class with cache
3. Add `get_limiter(tier)` method
4. Add `get_limiter_for_license(license_key)` method
5. Integrate with `raas_gate.py` middleware
6. Add cache invalidation on config change

## Related Code Files
- **Create:** `src/lib/rate_limiter_factory.py`
- **Modify:** `src/lib/raas_gate.py` (use factory instead of direct limiter)
- **Modify:** `src/lib/jwt_license_generator.py` (add tier extraction helper)

## Todo List
- [ ] Create RateLimiterFactory class
- [ ] Implement in-memory cache with TTL
- [ ] Add get_limiter(tier) method
- [ ] Add get_limiter_for_license(license_key) method
- [ ] Integrate factory into raas_gate middleware
- [ ] Add cache invalidation logic

## Success Criteria
- Factory returns correct limiter for each tier
- Cache hits <1ms, cache misses <10ms
- License key → limiter in single call

## Risk Assessment
- **Risk:** Cache staleness after config changes
- **Mitigation:** 5min TTL + manual invalidation method

## Next Steps
→ Phase 3: Add database persistence for tier configs
