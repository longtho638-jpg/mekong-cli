# 💰 Billing CLI System

> **RaaS API Usage Billing - CLI Operations Manual**
>
> **Last Updated:** 2026-03-07
>
> **Version:** v0.2.0

## Overview

The billing CLI system provides command-line operations for API usage metering, billing calculations, and reconciliation auditing. It implements a complete pay-per-use model with rate cards, proration, and idempotency protection against double-billing.

### Architecture

```
Billing CLI System
├── CLI Layer (src/cli/billing_commands.py)
│   ├── simulate          - Preview billing before usage
│   ├── submit-usage      - Submit real usage for billing
│   ├── reconcile         - Run daily audit
│   ├── emit-event        - Emit billing events
│   └── status            - Get license billing status
│
├── Core Engine (src/billing/engine.py)
│   ├── BillingEngine     - Calculate charges from usage events
│   ├── RateCardResolver  - Resolve rates per license tier
│   └── LineItem          - Individual charge line item
│
├── Proration (src/billing/proration.py)
│   ├── ProrationCalculator - Prorate mid-cycle plan changes
│   └── OverageTracker    - Track accumulated overage
│
├── Idempotency (src/billing/idempotency.py)
│   └── IdempotencyManager - Prevent double-billing on batches
│
├── Reconciliation (src/billing/reconciliation.py)
│   └── ReconciliationService - Nightly variance audit
│
└── Event Emitter (src/billing/event_emitter.py)
    └── BillingEventEmitter - Emit events for analytics sync
```

### Key Features

- **Rate Cards**: Tiered pricing (free, starter, growth, premium, enterprise)
- **Idempotency**: Batch ID prevents duplicate billing submissions
- **Proration**: Mid-cycle plan change calculations
- **Reconciliation**: Nightly audit for variance detection
- **Event System**: Structured billing events for dashboard sync

---

## Installation

The billing CLI is included in Mekong CLI. No separate installation required.

```bash
# Verify installation
mekong version
# Should show v0.2.0+

# Show billing commands help
mekong billing --help
```

---

## Environment Configuration

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `ANTHROPIC_BASE_URL` | Antigravity Proxy URL | Yes | http://localhost:9191 |
| `SUPABASE_URL` | PostgreSQL connection | Yes | From config |
| `SUPABASE_SERVICE_KEY` | Database auth key | Yes | From config |
| `RAAS_LICENSE_KEY` | License for billing operations | Conditional | User-provided |

**Database Schema**: Migration `008_billing_system.sql` creates:

- `billing_periods` - Billing cycle tracking
- `billing_records` - Individual charge records
- `billing_line_items` - Detailed breakdown
- `batch_idempotency` - Double-billing prevention
- `rate_cards` - Pricing configuration
- `reconciliation_audits` - Audit trail
- `usage_events_staging` - Batch processing staging

---

## Commands Reference

### `mekong billing simulate`

🧪 Simulate billing calculation for usage before submitting.

**Syntax**:
```bash
mekong billing simulate --license <key> [options]
```

**Arguments**:

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `--license, -l` | string | *required* | License key for calculation |
| `--api-calls` | integer | 100 | Number of API calls |
| `--token-input` | integer | 1000 | Input tokens (in K) |
| `--token-output` | integer | 500 | Output tokens (in K) |
| `--agent-spawns` | integer | 10 | Number of agent spawns |
| `--model` | string | null | Model name for simulation |
| `--period-start` | YYYY-MM-DD | today | Billing period start |
| `--period-end` | YYYY-MM-DD | today | Billing period end |

**Examples**:

```bash
# Basic simulation with default usage
mekong billing simulate -l lk_pro_abc123

# Custom usage profile
mekong billing simulate \
  -l lk_pro_abc123 \
  --api-calls 5000 \
  --token-input 10000 \
  --token-output 5000 \
  --agent-spawns 50

# Specific billing period
mekong billing simulate \
  -l lk_pro_abc123 \
  --api-calls 2000 \
  --period-start 2026-03-01 \
  --period-end 2026-03-31
```

**Output**:

```
🧪 Simulating Billing Calculation

✓ Billing Calculation Complete

Metric              Value
License Key         lk_pro_abc123
Period              2026-03-07 → 2026-03-07
Line Items          4
Subtotal            $1.25
Discount            $0.00
Total               $1.25
Currency            USD

Line Items:
Event Type          Model               Quantity    Unit        Unit Price  Amount
api_call            -                   5000        calls       $0.0008     $4.00
token_input         -                   10000       1K tokens   $0.0004     $4.00
token_output        -                   5000        1K tokens   $0.0012     $6.00
agent_spawn         -                   50          spawns      $0.008      $0.40

Simulation only — no charges applied
```

---

### `mekong billing submit-usage`

📤 Submit usage events for billing with idempotency protection.

**Syntax**:
```bash
mekong billing submit-usage --license <key> [options]
```

**Arguments**:

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `--license, -l` | string | *required* | License key |
| `--events-file, -f` | filepath | null | JSON file with usage events |
| `--event-type, -t` | string | null | Event type (if no file) |
| `--metric` | string | "requests" | Metric name |
| `--value, -v` | float | null | Usage value |
| `--model` | string | null | Model name |
| `--batch-id` | string | auto | Batch ID for idempotency |
| `--dry-run, -n` | flag | false | Simulate without submitting |

**Event Types**:

- `api_call` - API request
- `token_input` - Input tokens (in K)
- `token_output` - Output tokens (in K)
- `agent_spawn` - Agent instance spawn
- `model_usage` - Specific model quota

**Usage File Format** (`usage.json`):
```json
{
  "events": [
    {
      "event_type": "api_call",
      "metric": "requests",
      "value": 100,
      "model": "qwen3.5-plus",
      "timestamp": "2026-03-07T10:00:00Z",
      "metadata": {"source": "production"}
    }
  ]
}
```

**Examples**:

```bash
# Submit via JSON file
mekong billing submit-usage \
  -l lk_pro_abc123 \
  --events-file usage.json

# Submit single event
mekong billing submit-usage \
  -l lk_pro_abc123 \
  --event-type api_call \
  --value 100 \
  --metric requests

# Batch submission with custom batch ID (idempotency)
mekong billing submit-usage \
  -l lk_pro_abc123 \
  --events-file usage.json \
  --batch-id batch_lk_abc123_20260307_1000

# Dry run to verify
mekong billing submit-usage \
  -l lk_pro_abc123 \
  --event-type token_input \
  --value 5000 \
  --dry-run
```

**Output**:
```
📤 Submitting Usage for Billing

Processing 1 event(s)...
Batch ID: batch_lk_abc123_20260307_a1b2c3d4e5f6

✓ Batch processed successfully
Billing Record ID: br_batch_lk_abc123_20260307_1741357200
Total Charge: $2.50
```

---

### `mekong billing reconcile`

🔍 Trigger reconciliation audit for variance detection.

**Syntax**:
```bash
mekong billing reconcile [options]
```

**Arguments**:

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `--license, -l` | string | all | Specific license key |
| `--date, -d` | YYYY-MM-DD | yesterday | Audit date |
| `--all` | flag | false | Reconcile all licenses |

**Examples**:

```bash
# Reconcile all licenses for yesterday
mekong billing reconcile --all

# Reconcile specific license
mekong billing reconcile -l lk_pro_abc123

# Reconcile specific date
mekong billing reconcile -l lk_pro_abc123 --date 2026-03-06

# Reconcile with date and license
mekong billing reconcile --date 2026-03-06 --all
```

**Output**:
```
🔍 Running Reconciliation Audit

Audit Date: 2026-03-06
License: all

License Key              Status      Expected    Actual      Variance    Variance %
lk_starter_xyz           matched     $50.00      $50.00      $0.00       0.00%
lk_growth_abc            matched     $125.00     $125.00     $0.00       0.00%
lk_premium_def           matched     $250.00     $245.00     -$5.00      2.00%

Summary:
  Matched: 2
  Variance: 1
  Investigating: 0

⚠ Variances detected — review reconciliation_audits table
```

---

### `mekong billing emit-event`

📡 Emit billing event to event bus or webhook.

**Syntax**:
```bash
mekong billing emit-event <event_type> [options]
```

**Event Types**:

| Type | Description |
|------|-------------|
| `billing:recorded` | New billing record created |
| `billing:overage` | Overage detected |
| `billing:period_closed` | Billing period finalized |
| `billing:reconciliation` | Audit completed |
| `billing:batch_processed` | Batch processing completed |
| `billing:idempotency_conflict` | Duplicate batch detected |

**Arguments**:

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `event_type` | string | *required* | Event type to emit |
| `--payload, -p` | JSON | null | Event payload |
| `--payload-file, -f` | filepath | null | JSON file with payload |
| `--webhook, -w` | URL | null | Webhook URL to emit to |

**Payload Examples**:

```bash
# Emit billing recorded event
mekong billing emit-event billing:recorded \
  -p '{"license_key": "lk_pro_abc123", "total": "49.00"}'

# Emit with payload file
mekong billing emit-event billing:overage \
  --payload-file overage_payload.json

# Emit to webhook endpoint
mekong billing emit-event billing:batch_processed \
  -p '{"batch_id": "batch_abc123", "status": "completed"}' \
  --webhook https://hooks.example.com/billing
```

**Output**:
```
📡 Emitting Billing Event

Event Type: billing:recorded
Timestamp: 2026-03-07 15:18:00
Payload: {
  "license_key": "lk_pro_abc123",
  "total": "49.00"
}

✓ Webhook response: 200
```

---

### `mekong billing status`

📊 Get billing status for a license.

**Syntax**:
```bash
mekong billing status --license <key>
```

**Arguments**:

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `--license, -l` | string | *required* | License key |

**Examples**:

```bash
mekong billing status -l lk_pro_abc123
```

**Output**:
```
📊 Billing Status

License: lk_pro_abc123

Metric              Value
Tier                premium
Status              active
Period Start        2026-03-01
Current Charge      $49.50
Line Items          3
```

---

## Usage Examples

### Simulation Workflow

```bash
# 1. Simulate expected charges
mekong billing simulate \
  -l lk_growth_abc123 \
  --api-calls 5000 \
  --token-input 10000 \
  --token-output 5000 \
  --agent-spawns 100

# 2. Review simulation output
# Check if within budget before submitting

# 3. Submit actual usage
mekong billing submit-usage \
  -l lk_growth_abc123 \
  --events-file daily_usage.json

# 4. Verify billing was recorded
mekong billing status -l lk_growth_abc123
```

### Batch Submission with Idempotency

```bash
# Generate batch ID from usage data
# Same events → same batch ID → duplicate protection

mekong billing submit-usage \
  -l lk_pro_xyz789 \
  --events-file batch_001.json \
  --batch-id batch_pro_xyz789_20260307_v1

# Retry safe - duplicate detection
mekong billing submit-usage \
  -l lk_pro_xyz789 \
  --events-file batch_001.json \
  --batch-id batch_pro_xyz789_20260307_v1

# Output shows: ⚠ Duplicate batch detected
```

### Daily Reconciliation Workflow

```bash
# 1. Run daily reconciliation (scheduled task)
cron: 0 2 * * * mekong billing reconcile --all

# 2. Check for variances
mekong billing reconcile --all | grep variance

# 3. Investigate specific license
mekong billing reconcile -l lk_premium_issue

# 4. Review in database
psql "$(supabase db url)" -c "SELECT * FROM reconciliation_audits WHERE status='variance';"
```

---

## Rate Card Configuration

### Default Rate Cards

| Tier | Event Type | Unit | Included | Unit Price | Overage Rate |
|------|------------|------|----------|------------|--------------|
| free | api_call | calls | 100 | $0.001 | $0.001 |
| free | token_input | 1K tokens | 50 | $0.0005 | $0.0005 |
| starter | api_call | calls | 1000 | $0.0008 | $0.001 |
| growth | api_call | calls | 5000 | $0.0006 | $0.0008 |
| premium | api_call | calls | 20000 | $0.0005 | $0.0006 |
| enterprise | api_call | calls | 100000 | $0.0003 | $0.0005 |

### Custom Rate Card

**SQL**:
```sql
-- Add custom rate card for premium tier
INSERT INTO rate_cards (plan_tier, event_type, unit, unit_price, included_quantity, overage_rate, valid_from, is_active)
VALUES ('premium', 'custom_endpoint', 'requests', 0.002, 5000, 0.003, '2026-03-01', true)
ON CONFLICT DO NOTHING;
```

---

## Integration Guide

### Programmatic Usage (Python)

```python
from src.billing.engine import get_engine, BillingResult
from src.core.usage_metering import UsageEvent, UsageEventType
from datetime import datetime

# Initialize
engine = get_engine()

# Create usage events
events = [
    UsageEvent(
        event_type=UsageEventType.API_CALL,
        metric="requests",
        value=100,
        timestamp=datetime.now().timestamp(),
        metadata={"key_id": "key_abc123"}
    )
]

# Calculate charges
result: BillingResult = await engine.calculate_charges(
    license_key="lk_pro_abc123",
    usage_events=events,
    period_start=datetime.now(),
    period_end=datetime.now()
)

print(f"Total charge: ${result.total}")
```

### Event Bus Integration

```python
from src.core.event_bus import get_event_bus, EventType

event_bus = get_event_bus()

# Emit event for billing recorded
event_bus.emit(EventType.BILLING_RECORDED, {
    "license_key": "lk_pro_abc123",
    "billing_record_id": "br_abc123",
    "total_amount": "49.50",
    "currency": "USD"
})
```

### Webhook Configuration

```bash
# Configure webhook for billing events
export BILLING_WEBHOOK_URL="https://yourdomain.com/webhooks/billing"

# Test webhook
mekong billing emit-event billing:recorded \
  -p '{"license_key": "lk_test", "total": "0.00"}' \
  --webhook $BILLING_WEBHOOK_URL
```

---

## Troubleshooting

### Common Errors

| Error | Cause | Resolution |
|-------|-------|------------|
| `License not found` | License key doesn't exist | Generate via `mekong license generate` |
| `No rate card found` | Rate card missing for tier | Seed rate cards via migration |
| `Batch duplicate detected` | Same events submitted twice | Check batch ID or remove duplicate |
| `Reconciliation variance > 5%` | Usage/events mismatch | Review `reconciliation_audits` table |

### Debug Commands

```bash
# Check if rate card exists
psql "$(supabase db url)" -c \
  "SELECT * FROM rate_cards WHERE plan_tier='premium' AND event_type='api_call';"

# Check batch status
psql "$(supabase db url)" -c \
  "SELECT batch_id, status, processed_at FROM batch_idempotency WHERE license_key='lk_abc' ORDER BY created_at DESC LIMIT 5;"

# View pending bills
psql "$(supabase db url)" -c \
  "SELECT * FROM billing_records WHERE status='pending' LIMIT 10;"
```

---

## Best Practices

1. **Simulate First**: Always use `simulate` to preview charges before `submit-usage`
2. **Batch ID Management**: Use deterministic batch IDs for idempotency
3. **Daily Reconciliation**: Run `reconcile --all` nightly to catch variances
4. **Monitor Overage**: Set up alerts for licenses approaching limits
5. **Event Auditing**: Emit all billing events to webhook for external tracking

---

## Migration Guide

### From Old Billing System

```bash
# 1. Run migration
psql "$(supabase db url)" -f src/db/migrations/008_billing_system.sql

# 2. Seed rate cards
# Migration includes default rate cards

# 3. Verify tables created
psql "$(supabase db url)" -c "\dt billing_*"

# 4. Test CLI commands
mekong billing simulate -l lk_test --api-calls 100
```

---

## CLI Reference Links

| Command | Help |
|---------|------|
| `mekong billing --help` | All billing commands |
| `mekong billing simulate --help` | Simulate options |
| `mekong billing submit-usage --help` | Submit options |
| `mekong billing reconcile --help` | Reconcile options |
| `mekong billing emit-event --help` | Event options |
| `mekong billing status --help` | Status options |

---

**Previous**: [RaaS Billing Setup](./raas-billing-setup.md)
**Next**: [Rate Limiting](./tier-rate-limiting.md)
