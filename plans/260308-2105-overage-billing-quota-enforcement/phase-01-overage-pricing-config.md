# Phase 1: Overage Pricing Config + Tier Enhancement

## Overview
- **Priority**: P1
- **Status**: pending
- **Effort**: 1h

Add overage pricing configuration to existing tier system. Configurable per-tier overage rates and soft/hard limit thresholds.

## Key Insights

- `TIER_LIMITS` in `credit_rate_limiter.py` already defines daily/monthly limits per tier
- `BillingService` in `raas_billing_service.py` has `PLAN_LIMITS` (MCU-based) — separate from credit limits
- Need unified overage config that both systems can reference
- Enterprise tier (0 = unlimited) never triggers overage
- `BillingEngine.RateCard` already has `overage_rate` field — reuse concept

## Requirements

### Functional
- Per-tier overage pricing: $/credit for usage beyond monthly limit
- Overage allowance flag: some tiers allow overage (billed), others hard-block
- Warning threshold: percentage at which to flag "approaching limit" (e.g., 80%)

### Non-functional
- Pure Python dataclass config — no DB migration needed
- Backward compatible — existing code using TIER_LIMITS unchanged

## Related Code Files

### Modify
- `src/raas/credit_rate_limiter.py` — add `OVERAGE_CONFIG` dataclass + per-tier config
- `src/api/raas_billing_service.py` — add overage awareness to `TenantLedger`

## Implementation Steps

1. **Add OverageConfig dataclass** to `credit_rate_limiter.py`:
```python
@dataclass
class OverageConfig:
    """Per-tier overage billing configuration."""
    allow_overage: bool          # True = bill overage, False = hard block
    overage_rate_per_credit: float  # USD per credit beyond limit (e.g., 0.01)
    warning_threshold_pct: int   # Warn at this % of limit (e.g., 80)
    max_overage_credits: int     # Cap overage at this amount (0 = no cap)
```

2. **Add OVERAGE_TIERS dict** below existing TIER_LIMITS:
```python
OVERAGE_TIERS: dict[str, OverageConfig] = {
    "free":       OverageConfig(allow_overage=False, overage_rate_per_credit=0.0, warning_threshold_pct=80, max_overage_credits=0),
    "starter":    OverageConfig(allow_overage=False, overage_rate_per_credit=0.0, warning_threshold_pct=80, max_overage_credits=0),
    "growth":     OverageConfig(allow_overage=True,  overage_rate_per_credit=0.02, warning_threshold_pct=80, max_overage_credits=500),
    "pro":        OverageConfig(allow_overage=True,  overage_rate_per_credit=0.01, warning_threshold_pct=80, max_overage_credits=2000),
    "enterprise": OverageConfig(allow_overage=True,  overage_rate_per_credit=0.005, warning_threshold_pct=90, max_overage_credits=0),
}
```

3. **Add helper function** `get_overage_config(tier: str) -> OverageConfig` in same file

4. **Add `overage_used` field** to `TenantLedger` in `raas_billing_service.py`:
```python
@dataclass
class TenantLedger:
    tenant_id: str
    plan: str = "free"
    mcu_used: int = 0
    mcu_limit: int = PLAN_LIMITS["free"]
    overage_credits: int = 0        # NEW: credits used beyond limit
    overage_charges_usd: float = 0  # NEW: accumulated overage charges
    history: List[UsageEntry] = field(default_factory=list)
```

5. **Update `record_usage()`** in BillingService to track overage:
   - If `mcu_used >= mcu_limit`, check `OverageConfig.allow_overage`
   - If allowed: increment `overage_credits`, calculate charge
   - If not allowed: leave as-is (middleware handles blocking)

6. **Export** new symbols in `__all__`

## Todo List
- [ ] Add `OverageConfig` dataclass
- [ ] Add `OVERAGE_TIERS` config dict
- [ ] Add `get_overage_config()` helper
- [ ] Add overage fields to `TenantLedger`
- [ ] Update `BillingService.record_usage()` for overage tracking
- [ ] Update `__all__` exports

## Success Criteria
- `get_overage_config("pro").allow_overage` returns `True`
- `get_overage_config("free").allow_overage` returns `False`
- Existing `TIER_LIMITS` usage unchanged
- `python3 -c "from src.raas.credit_rate_limiter import OVERAGE_TIERS; print(OVERAGE_TIERS)"` works

## Risk Assessment
- **Low**: Pure additive changes, no existing behavior modified
- Mitigation: existing tests must still pass unchanged
