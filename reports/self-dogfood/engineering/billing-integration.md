# Engineering: Billing Integration Review — Mekong CLI v5.0

## Command: /revenue
## Date: 2026-03-11

---

## Source File: src/core/mcu_billing.py (319 lines)

MCU = Mission Credit Unit. Billing system for Mekong CLI's SaaS monetization.
"Condition C4: Credit store with MCU deduction per task complexity."

---

## MCU Cost Structure

```python
MCU_COSTS: dict[str, int] = {
    "simple": 1,
    "standard": 3,
    "complex": 5,
}

TIER_CREDITS: dict[str, int] = {
    "starter": 50,
    "growth": 200,
    "premium": 1000,
}

LOW_BALANCE_THRESHOLD = 10
```

Complexity → cost mapping:
- simple = 1 MCU (e.g., status check, quick lookup)
- standard = 3 MCU (e.g., code review, analysis)
- complex = 5 MCU (e.g., full deployment, multi-step workflow)

Tier credit bundles (Polar.sh checkout):
- Starter: 50 MCU (implied ~$49 from CLAUDE.md pricing)
- Growth: 200 MCU (~$149)
- Premium: 1000 MCU (~$499)

---

## Data Model

### MCUTransaction
```python
@dataclass
class MCUTransaction:
    tenant_id: str
    amount: int              # positive = credit, negative = debit
    balance_after: int
    transaction_type: Literal["credit", "debit", "refund"]
    description: str = ""
    mission_id: str = ""
    timestamp: datetime
```

Clean dataclass with full transaction record.
`to_dict()` method for JSON serialization.

### TenantBalance
```python
@dataclass
class TenantBalance:
    tenant_id: str
    balance: int = 0
    total_credited: int
    total_debited: int
    total_refunded: int
    transactions: list[MCUTransaction]
```

Full accounting: tracks credited, debited, refunded separately.
Audit trail via transactions list.

---

## In-Memory Storage Problem

MCUBilling stores tenant balances in an in-memory dict.
The same issue as MISSION_STORE in gateway.py:
- Process restart = lost billing data
- Multiple replicas = inconsistent balances
- No persistence between deployments

**This is critical for a billing system.** A lost balance means free usage or billing disputes.

**Fix:** Store TenantBalance in PostgreSQL (asyncpg is already a dependency).
MCUBilling should be a thin service over a `tenant_balances` table.

---

## deduct() Method Analysis

```python
result = mcu_billing.deduct(
    tenant_id=request.tenant_id,
    complexity=request.complexity,
    mission_id=request.mission_id,
)
```

Expected behavior:
1. Lookup tenant balance
2. Check balance >= cost
3. If insufficient: return error (HTTP 402 in gateway)
4. If sufficient: deduct cost, record transaction, return result
5. Set `low_balance=True` if balance drops below LOW_BALANCE_THRESHOLD (10)

HTTP 402 on zero balance — correct semantic use of Payment Required.

---

## No Authentication on Billing Endpoint

```python
@app.post("/v1/mcu/deduct", response_model=MCUDeductResponse)
async def mcu_deduct(request: MCUDeductRequest) -> MCUDeductResponse:
```

No `_validate_api_key` dependency injected.
Any caller can deduct credits from any tenant by guessing their tenant_id.
This is a critical security vulnerability for a production billing system.

**Fix:** Add X-API-Key validation + verify API key belongs to the tenant_id in the request.

---

## add_credits() / Polar.sh Integration

TIER_CREDITS dict maps Polar.sh tier names to MCU amounts.
Polar.sh webhook should call `mcu_billing.add_credits(tenant_id, amount)` on
successful subscription payment.

From CLAUDE.md: "Polar.sh webhooks = only payment source"
Webhook handler likely in `src/core/webhook_events.py` or a Polar-specific handler.

**Gap:** No audit trail for credits added — only debits are tracked per transaction?
Review add_credits() implementation to confirm credit transactions are also recorded.

---

## Refund Support

`MCUTransaction.transaction_type` includes "refund".
`TenantBalance.total_refunded` counter exists.
Refund path likely implemented — good for customer dispute resolution.

---

## Low Balance Notification

`LOW_BALANCE_THRESHOLD = 10` MCU.
`deduct()` returns `low_balance=True` when balance drops below threshold.
Gateway returns this in MCUDeductResponse — caller can notify user.

Missing: push notification when low_balance detected (email, Telegram, webhook).
Currently caller must check the response and act; no proactive alerting.

---

## MCU Gate (src/core/mcu_gate.py)

`mcu_gate.py` exists as a separate module — likely a middleware gate that checks
balance before allowing mission execution. This is the "HTTP 402 on zero balance" gate
mentioned in CLAUDE.md and gateway architecture.

---

## Integration with gateway.py

```python
from src.core.mcu_billing import MCUBilling, MCU_COSTS
mcu_billing = MCUBilling()  # module-level singleton — process-local
```

Module-level instantiation means one MCUBilling instance per process.
With uvicorn workers, each worker has its own balance state.
Tenant A may exhaust balance on worker 1 but have full balance on worker 2.

---

## Recommendations

1. **Persist to PostgreSQL:** MCUBilling must store state in DB, not memory
2. **Add auth to /v1/mcu/deduct:** Validate X-API-Key and verify tenant ownership
3. **Low balance webhook:** Trigger webhook event when balance drops below threshold
4. **Confirm credit transaction logging:** Verify add_credits() also creates MCUTransaction record
5. **Atomic deductions:** Use DB transactions to prevent double-spend in concurrent requests
6. **Add /v1/mcu/balance endpoint:** Allow tenants to query current balance
7. **Test billing edge cases:** Zero balance, concurrent deductions, negative balance prevention

---

## Summary
MCU billing model is well-designed with correct pricing tiers, transaction types, and
low-balance detection. Critical production gap: in-memory storage loses all balance data
on restart. No authentication on deduct endpoint allows malicious credit drain.
Both issues are blocking for production deployment.
