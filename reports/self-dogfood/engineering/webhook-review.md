# Engineering: Webhook Implementation Review — Mekong CLI v5.0

## Command: /review
## Date: 2026-03-11

---

## Source File: src/core/webhook_events.py (396 lines)

Webhook event schemas for Mekong CLI → AgencyOS integration.
Pydantic models defining the contract for all event payloads.

---

## Event Type Coverage

Based on MissionStatus and StepStatus type literals:
```python
MissionStatus = Literal["pending", "planning", "running", "completed", "failed", "cancelled"]
StepStatus = Literal["pending", "running", "completed", "failed", "skipped"]
```

### Mission Lifecycle Events (inferred from Pydantic models)

| Event Name | Payload Class | Trigger |
|-----------|---------------|---------|
| mission.created | MissionCreatedPayload | POST /v1/missions succeeds |
| mission.planning | PlanPayload | RecipePlanner generates steps |
| mission.step.started | (step event) | Step execution begins |
| mission.step.completed | (step event) | Step verification passes |
| mission.step.failed | (step event) | Step verification fails |
| mission.completed | (completion event) | All steps done |
| mission.failed | (failure event) | Fatal error or all retries exhausted |
| mission.cancelled | (cancel event) | User or system cancels |

---

## MissionCreatedPayload (lines 44-71)

```python
class MissionCreatedPayload(BaseModel):
    mission_id: str
    goal: str
    tenant_id: str
    priority: Priority = "normal"
    webhook_url: str | None = None
    created_at: datetime
    estimated_credits: int = 1
    
    model_config = {
        "json_schema_extra": {
            "example": {
                "mission_id": "msn_abc123",
                "goal": "Deploy landing page to Vercel",
                ...
                "estimated_credits": 3,
            }
        }
    }
```

- Full example in json_schema_extra — good for documentation
- `estimated_credits` field — enables pre-billing UI display
- Pydantic v2 syntax (`model_config`) — correct for declared pydantic ^2.5.0

---

## PlanPayload (lines 74-80+)

Sent when RecipePlanner generates execution steps.
AgencyOS displays steps in real-time progress UI.
Contains `PlanStep` list with order, title, agent, params, estimated_duration, dependencies.

The `dependencies` field per PlanStep enables AgencyOS to render a DAG visualization.

---

## Webhook Delivery Engine

`src/core/webhook_delivery_engine.py` exists — handles actual HTTP POST delivery.
This is separate from the schema definitions in webhook_events.py.

Key questions not answered by reviewed code:
- Is delivery async (fire-and-forget) or sync?
- Are retries implemented on delivery failure?
- Are delivery logs stored?

---

## WEBHOOK_EVENT_PAYLOADS Registry

```python
from src.core.webhook_events import WEBHOOK_EVENT_PAYLOADS
# Used in gateway.py:
"events": {
    name: model.__name__
    for name, model in WEBHOOK_EVENT_PAYLOADS.items()
},
```

A registry dict mapping event name strings to Pydantic model classes.
Enables dynamic schema documentation at /v1/webhook/schema endpoint.

---

## Security: No Webhook Signature Verification

gateway.py `POST /v1/webhook/test` validates that the webhook URL is reachable.
But there is no HMAC signature on outbound webhook payloads.

Standard webhook security requires:
```
X-Webhook-Signature: sha256=<hmac(secret, payload_body)>
```

Without signatures, AgencyOS cannot verify webhook payloads are authentic.
An attacker who knows the webhook URL can send fake mission events.

From docs/: `PAYMENT_HARDENING.md` and `webhook-fire-attack.md` exist,
suggesting webhook security is known concern but may not be implemented
in gateway.py's current webhook delivery.

---

## Webhook Test Endpoint Analysis

```python
@app.post("/v1/webhook/test", response_model=TestWebhookResponse)
async def test_webhook(request: TestWebhookRequest) -> TestWebhookResponse:
```

Uses `validate_webhook_url()` from `src.core.gateway_api` module.
Returns `success`, `message`, `status_code`, `response_time_ms`.

**Issue:** Status code parsing is brittle:
```python
if "HTTP" in message:
    try:
        status_code = int(message.split()[-1])
    except (ValueError, IndexError):
        pass
```
This depends on message string format — fragile. Should return status code directly
from the HTTP response, not parse it from a message string.

---

## Webhook Schema Endpoint

```python
@app.get("/v1/webhook/schema")
async def webhook_schema() -> dict:
    return {
        "version": "3.3.0",
        "events": {name: model.__name__ for name, model in WEBHOOK_EVENT_PAYLOADS.items()},
        "descriptions": get_webhook_schema(),
    }
```

Returns event name → class name mapping + descriptions.
Does NOT return actual JSON schemas for each event.

**Enhancement:** Should return `model.model_json_schema()` for each event type,
enabling AgencyOS to validate incoming webhooks against the schema.

---

## Dead Letter Queue

`src/core/dead_letter_queue.py` exists — for failed webhook deliveries that
exhaust retries. This is production-grade webhook infrastructure.

Suggests webhook delivery has retry logic and DLQ support, though not confirmed
in the reviewed 80 lines of webhook_events.py.

---

## Polar.sh Webhook Integration

Per CLAUDE.md: "Polar.sh webhooks = only payment source"
Polar.sh uses Standard Webhooks spec with HMAC-SHA256 signatures.

The mcu_billing system should be triggered by Polar.sh webhook events:
- `subscription.created` → add_credits(tier)
- `subscription.cancelled` → no new credits
- `order.completed` → add_credits(one-time)

Specific Polar.sh webhook handler not found in reviewed files — may be in
`src/billing/` or `src/services/` directories (not reviewed).

---

## Recommendations

1. **Add HMAC signatures to outbound webhooks:** Use shared secret + SHA256
2. **Fix status_code parsing:** Return int from HTTP response directly, not parse from string
3. **Return full JSON schemas:** /v1/webhook/schema should return model_json_schema()
4. **Document retry policy:** Confirm webhook_delivery_engine.py retry count and backoff
5. **Add webhook event to /v1/missions stream:** SSE and webhooks should emit identical events
6. **Test Polar.sh webhook handler:** Verify subscription.created → add_credits() flow

---

## Summary
Webhook event schema layer is well-designed with Pydantic v2 models, full type coverage,
and a registry pattern enabling dynamic documentation. Critical gap: no HMAC signature
on outbound webhooks allows spoofing. Brittle status_code parsing in test endpoint.
Dead letter queue infrastructure exists — delivery retry seems implemented.
