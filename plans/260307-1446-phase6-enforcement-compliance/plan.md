---
title: "Phase 6: Enforcement & Compliance Implementation"
description: "Runtime license enforcement, billing state integration, automatic throttling for mekong-cli ROIaaS"
status: pending
priority: P1
effort: 8h
branch: master
tags: [raas, license, enforcement, compliance, phase-6]
created: 2026-03-07
---

# Phase 6: Enforcement & Compliance

## Context Links
- **HIẾN PHÁP ROIaaS**: `/Users/macbookprom1/mekong-cli/docs/HIEN_PHAP_ROIAAS.md`
- **Phase 1-5 Status**: Implemented (license gate, UI, webhook, metering, analytics)
- **Related Reports**: `plans/reports/phase6-*.md`

## Overview

**Goal**: Build automated license enforcement hooks that validate `RAAS_LICENSE_KEY` at runtime, block unauthorized usage, integrate with billing state, and throttle/disable features when subscriptions lapse.

**Scope**:
- Runtime license validation middleware
- Billing state integration (Polar.sh webhook state)
- Automatic feature throttling
- Grace period enforcement
- Compliance audit logging

## Key Insights

1. **Existing Foundation**: `src/lib/raas_gate.py` already has Phase 6 features (rate limiting, quota checks, JWT validation)
2. **Gap Analysis**: Missing billing state sync, graceful degradation, compliance reporting
3. **YAGNI**: Don't rebuild what exists—extend `RaasLicenseGate` with billing integration
4. **KISS**: Single middleware layer, not multiple validation points
5. **DRY**: Reuse `CreditRateLimiter`, `quota_cache`, `ViolationEvent` from existing code

## Requirements

### Functional
- [ ] Validate license on EVERY premium command execution
- [ ] Sync billing state from Polar.sh webhooks
- [ ] Block commands when license revoked/expired
- [ ] Throttle usage when quota exceeded
- [ ] Grace period for offline mode (24h)
- [ ] Audit log all enforcement actions

### Non-Functional
- [ ] Validation latency < 50ms (cached)
- [ ] Zero downtime during billing state changes
- [ ] Idempotent enforcement actions
- [ ] Thread-safe state management

## Architecture

### Validation Flow (Enhanced)

```
┌──────────────────────────────────────────────────────────────────────────┐
│ 1. Command Triggered                                                     │
│    ↓                                                                     │
│ 2. Check Cache (5min TTL) → REVOKE/EXPIRED? → BLOCK (0ms)               │
│    ↓                                                                     │
│ 3. JWT Token? → RSA Verify Offline → Extract Quotas                     │
│    ↓                                                                     │
│ 4. Remote API (Polar state) → Cache Result                              │
│    ↓                                                                     │
│ 5. Rate Limit Check (sliding window) → BLOCK if exceeded                │
│    ↓                                                                     │
│ 6. Quota Check (PostgreSQL) → BLOCK if exceeded                         │
│    ↓                                                                     │
│ 7. Allow + Record Usage + Warning if >= 80%                             │
└──────────────────────────────────────────────────────────────────────────┘
```

### Component Diagram

```
┌──────────────────────────────────────────────────────────────────────────┐
│ ┌─────────────────────────────────────────────────────────────────────┐ │
│ │ CLI Commands (cook/swarm/gateway/etc.)                              │ │
│ └─────────────────────────────────────────────────────────────────────┘ │
│                                 ↓                                       │
│ ┌─────────────────────────────────────────────────────────────────────┐ │
│ │ RaasLicenseGate.check(command)                                      │ │
│ │  - Cache lookup (quota_cache.py)                                    │ │
│ │  - JWT validation (jwt_license_generator.py)                        │ │
│ │  - Remote validation (raas_gate.py)                                 │ │
│ │  - Rate limiting (credit_rate_limiter.py)                           │ │
│ │  - Quota tracking (usage_meter.py)                                  │ │
│ └─────────────────────────────────────────────────────────────────────┘ │
│                                 ↓                                       │
│ ┌─────────────────────────────────────────────────────────────────────┐ │
│ │ Enforcement Actions                                                  │ │
│ │  - Allow → record_usage() + warning if needed                       │ │
│ │  - Throttle → return retry_after                                    │ │
│ │  - Block → format_quota_error() / format_license_revoked()          │ │
│ └─────────────────────────────────────────────────────────────────────┘ │
│                                 ↓                                       │
│ ┌─────────────────────────────────────────────────────────────────────┐ │
│ │ Analytics & Compliance                                               │ │
│ │  - ViolationTracker (violation_tracker.py)                          │ │
│ │  - ValidationLogger (validation_logger.py)                          │ │
│ │  - LicenseMonitor (license_monitor.py)                              │ │
│ └─────────────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────────┘
```

## Files to Modify

| File | Changes | Effort |
|------|---------|--------|
| `src/lib/raas_gate.py` | Add billing state sync, enhance offline enforcement | 3h |
| `src/raas/billing.py` | Add Polar webhook state integration | 2h |
| `src/services/license_enforcement.py` | Add compliance audit logging | 1h |
| `src/core/license_monitor.py` | Add grace period enforcement | 1h |
| `src/raas/quota_cache.py` | Add billing state caching | 30m |
| `src/lib/quota_error_messages.py` | Add billing lapse messages | 30m |

## Files to Create

| File | Purpose | Effort |
|------|---------|--------|
| `src/raas/billing_state_sync.py` | Sync Polar billing state to license status | 1h |
| `tests/test_enforcement.py` | Enforcement test scenarios | 1h |

## Implementation Steps

### Step 1: Billing State Integration (billing_state_sync.py)

```python
"""
Billing State Sync — Phase 6

Syncs Polar.sh billing state to local license status.
Triggered by webhook events: subscription.active, subscription.expired, subscription.canceled.
"""

from dataclasses import dataclass
from typing import Optional, Dict, Any
from datetime import datetime, timezone

@dataclass
class BillingState:
    key_id: str
    subscription_status: str  # active, expired, canceled, past_due
    current_period_end: Optional[datetime]
    cancel_at_period_end: bool
    paused: bool

class BillingStateSync:
    """
    Sync billing state from Polar.sh to license enforcement.

    Integration points:
    - Polar webhook → /api/v1/billing/webhook → update_billing_state()
    - License validation → check billing state → block if not active
    """

    def __init__(self):
        self._cache: Dict[str, BillingState] = {}
        self._cache_ttl = 300  # 5 minutes

    async def update_billing_state(
        self,
        key_id: str,
        subscription_status: str,
        current_period_end: Optional[datetime] = None,
        cancel_at_period_end: bool = False,
        paused: bool = False,
    ) -> None:
        """Update billing state from webhook event."""
        pass

    def get_billing_state(self, key_id: str) -> Optional[BillingState]:
        """Get cached billing state."""
        pass

    def is_billing_active(self, key_id: str) -> bool:
        """Check if billing is active (not expired/canceled/past_due)."""
        state = self.get_billing_state(key_id)
        if not state:
            return True  # No billing state = assume active (legacy license)
        return state.subscription_status == "active" and not state.paused
```

### Step 2: Enhance RaasLicenseGate with Billing Check

Modify `src/lib/raas_gate.py`:

1. Add `_billing_state_sync: Optional[BillingStateSync]` to `__init__`
2. Add billing state check in `check()` method (after rate limit, before quota)
3. Add `format_billing_lapsed()` error message

```python
# In check() method, after rate limit check:
if not self._billing_state_sync.is_billing_active(self._key_id):
    return False, format_billing_lapsed(self._billing_state_sync.get_billing_state(self._key_id))
```

### Step 3: Compliance Audit Logging

Enhance `src/services/license_enforcement.py`:

```python
@dataclass
class ComplianceEvent:
    event_type: str  # license_blocked, quota_exceeded, grace_period_used, billing_lapsed
    key_id: str
    command: Optional[str]
    timestamp: float
    metadata: Dict[str, Any]
    ip_address: Optional[str] = None

class ComplianceAuditLogger:
    """
    Log all enforcement actions for compliance reporting.

    Events logged:
    - license_blocked: License invalid/revoked/expired
    - quota_exceeded: Daily/monthly limit exceeded
    - grace_period_used: Offline grace period activated
    - billing_lapsed: Subscription expired/canceled
    """

    def __init__(self, db=None):
        self._db = db or get_database()

    async def log_event(self, event: ComplianceEvent) -> None:
        """Log compliance event to raas_compliance_events table."""
        query = """
            INSERT INTO raas_compliance_events
            (event_type, key_id, command, timestamp, metadata, ip_address)
            VALUES ($1, $2, $3, $4, $5::jsonb, $6)
        """
        await self._db.execute(
            query,
            event.event_type,
            event.key_id,
            event.command,
            event.timestamp,
            json.dumps(event.metadata),
            event.ip_address,
        )
```

### Step 4: Grace Period Enforcement

Enhance `src/core/license_monitor.py`:

1. Add method to check grace period status
2. Integrate with `RaasLicenseGate.check()` offline mode
3. Emit `LICENSE_GRACE_PERIOD_EXPIRED` event when grace period ends

### Step 5: Error Message Enhancements

Add to `src/lib/quota_error_messages.py`:

```python
def format_billing_lapsed(billing_state: BillingState) -> str:
    """Format billing lapse error message."""
    if billing_state.subscription_status == "expired":
        return (
            "💳 Subscription Expired\n\n"
            f"Your subscription expired on {billing_state.current_period_end.strftime('%Y-%m-%d')}.\n"
            "To continue using premium features, please renew your subscription.\n\n"
            "👉 Renew: https://raas.mekong.dev/pricing"
        )
    elif billing_state.subscription_status == "canceled":
        return (
            "💳 Subscription Canceled\n\n"
            "Your subscription has been canceled.\n"
            "To continue using premium features, please resubscribe.\n\n"
            "👉 Subscribe: https://raas.mekong.dev/pricing"
        )
    elif billing_state.paused:
        return (
            "💳 Subscription Paused\n\n"
            "Your subscription is currently paused.\n"
            "Resume your subscription to continue using premium features.\n\n"
            "👉 Resume: https://raas.mekong.dev/pricing"
        )
```

## Success Criteria

- [ ] License validation on 100% of premium commands
- [ ] Billing state sync from Polar webhooks working
- [ ] Blocked commands return proper error messages
- [ ] Grace period (24h) works in offline mode
- [ ] All enforcement actions logged to compliance events table
- [ ] Tests pass for all scenarios (see Test Scenarios below)

## Test Scenarios

### Unit Tests (`tests/test_enforcement.py`)

```python
class TestLicenseEnforcement:
    """Test Phase 6 enforcement features."""

    def test_valid_license_allows_command(self):
        """Valid license + active billing → command allowed."""
        pass

    def test_revoked_license_blocks_command(self):
        """Revoked license → command blocked with proper error."""
        pass

    def test_expired_license_blocks_command(self):
        """Expired license → command blocked with expiry message."""
        pass

    def test_billing_lapsed_blocks_command(self):
        """Billing not active → command blocked with billing message."""
        pass

    def test_quota_exceeded_blocks_command(self):
        """Quota exceeded → command blocked with retry_after."""
        pass

    def test_grace_period_allows_offline_command(self):
        """Offline mode + grace period active → command allowed."""
        pass

    def test_grace_period_expired_blocks_command(self):
        """Offline mode + grace period expired → command blocked."""
        pass

    def test_rate_limit_throttles_command(self):
        """Rate limit exceeded → command throttled with retry_after."""
        pass

    def test_free_command_always_allowed(self):
        """Free commands (init, version, list) → always allowed."""
        pass

    def test_compliance_event_logged_on_block(self):
        """Blocked command → compliance event logged."""
        pass
```

### Integration Tests

```python
class TestEnforcementIntegration:
    """Test enforcement with real dependencies."""

    async def test_polar_webhook_updates_license_status(self):
        """Polar webhook → license status updated in DB."""
        pass

    async def test_enforcement_respects_billing_state_change(self):
        """Billing state change → enforcement reflects new state within 5min."""
        pass

    async def test_offline_mode_falls_back_to_jwt(self):
        """Remote API down + JWT valid → command allowed with warning."""
        pass
```

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| Billing state sync delay | Users blocked incorrectly | 5-min cache TTL, manual override API |
| Offline grace period abuse | Unlimited free usage | 24h limit, JWT expiration |
| Compliance log DB overload | Performance degradation | Async logging, batch inserts |
| Polar webhook failures | State desync | Webhook retry, manual sync endpoint |

## Security Considerations

- **License Key Validation**: JWT with RSA-256, public key pinned
- **Billing State**: Signed webhook payloads from Polar
- **Audit Logs**: Immutable, append-only, tamper-evident
- **Rate Limiting**: Per-key_id, sliding window, no bypass

## Next Steps

1. Create `billing_state_sync.py` with Polar webhook handler
2. Enhance `RaasLicenseGate.check()` with billing state check
3. Add compliance audit logging to enforcement actions
4. Write comprehensive tests for all scenarios
5. Test with real Polar webhook events (staging environment)

---

## Unresolved Questions

1. **Polar Webhook Secret**: Where to store webhook signing secret? (`.env` vs secret manager)
2. **Compliance Log Retention**: How long to keep compliance events? (30 days? 1 year?)
3. **Grace Period Extension**: Should admins be able to extend grace period for enterprise users?
