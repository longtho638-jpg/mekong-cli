# Nightly Reconciliation Cron Job

Automated billing reconciliation with Stripe integration.

## Overview

The nightly reconciliation job automatically:
- Compares local usage records with billing records
- Fetches Stripe invoices and compares with local amounts
- Detects variances and discrepancies
- Logs results and triggers alerts for critical mismatches

## Installation

### 1. Install Dependencies

```bash
pip install stripe requests
```

### 2. Configure Environment Variables

```bash
# Required
export DATABASE_URL="postgresql://user:pass@localhost:5432/mekong"
export STRIPE_SECRET_KEY="sk_live_..."  # or sk_test_...

# Optional - Alerts
export TELEGRAM_BOT_TOKEN="bot_token"
export TELEGRAM_OPS_CHANNEL_ID="@channel_id"
export RECONCILIATION_WEBHOOK_URL="https://api.example.com/webhooks/reconciliation"

# Optional - Logging
export LOG_LEVEL="INFO"  # DEBUG, INFO, WARNING, ERROR
```

## Usage

### Run Manually

```bash
# Run for yesterday (default)
python3 -m src.jobs.nightly_reconciliation

# Run for specific date
python3 -m src.jobs.nightly_reconciliation --date 2026-03-06

# Dry run (no saves)
python3 -m src.jobs.nightly_reconciliation --dry-run

# Verbose logging
python3 -m src.jobs.nightly_reconciliation --verbose
```

### Schedule as Cron Job

**Linux/macOS (system cron):**

```bash
# Edit crontab
crontab -e

# Add entry - run daily at 2 AM
0 2 * * * cd /path/to/mekong-cli && /usr/bin/python3 -m src.jobs.nightly_reconciliation >> /var/log/mekong/reconciliation.log 2>&1
```

**With environment variables:**

```bash
0 2 * * * \
    DATABASE_URL="postgresql://..." \
    STRIPE_SECRET_KEY="sk_live_..." \
    cd /path/to/mekong-cli && \
    /usr/bin/python3 -m src.jobs.nightly_reconciliation \
    >> /var/log/mekong/reconciliation.log 2>&1
```

### GitHub Actions Scheduler

Create `.github/workflows/nightly-reconciliation.yml`:

```yaml
name: Nightly Reconciliation

on:
  schedule:
    # Run daily at 2 AM UTC
    - cron: '0 2 * * *'
  workflow_dispatch:  # Allow manual trigger

jobs:
  reconcile:
    runs-on: ubuntu-latest
    environment: production

    steps:
      - uses: actions/checkout@v4

      - name: Set up Python
        uses: actions/setup-python@v5
        with:
          python-version: '3.11'

      - name: Install dependencies
        run: |
          pip install -e .
          pip install stripe requests

      - name: Run reconciliation
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
          STRIPE_SECRET_KEY: ${{ secrets.STRIPE_SECRET_KEY }}
          TELEGRAM_BOT_TOKEN: ${{ secrets.TELEGRAM_BOT_TOKEN }}
          TELEGRAM_OPS_CHANNEL_ID: ${{ secrets.TELEGRAM_OPS_CHANNEL_ID }}
          RECONCILIATION_WEBHOOK_URL: ${{ secrets.RECONCILIATION_WEBHOOK_URL }}
        run: |
          python3 -m src.jobs.nightly_reconciliation --verbose

      - name: Notify on failure
        if: failure()
        env:
          TELEGRAM_BOT_TOKEN: ${{ secrets.TELEGRAM_BOT_TOKEN }}
          TELEGRAM_OPS_CHANNEL_ID: ${{ secrets.TELEGRAM_OPS_CHANNEL_ID }}
        run: |
          curl -s -X POST "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage" \
            -d "chat_id=${TELEGRAM_OPS_CHANNEL_ID}" \
            -d "text=🚨 Nightly Reconciliation FAILED" \
            -d "parse_mode=Markdown"
```

### Cloud Scheduler Options

#### 1. AWS EventBridge + Lambda

```python
# lambda_function.py
import json
from src.jobs.nightly_reconciliation import main

def lambda_handler(event, context):
    try:
        main()
        return {"statusCode": 200, "body": "Reconciliation complete"}
    except SystemExit as e:
        if e.code == 1:
            return {"statusCode": 500, "body": "Critical discrepancies found"}
        raise
```

#### 2. Google Cloud Scheduler + Cloud Run

```dockerfile
# Dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY . .
RUN pip install -e .
CMD ["python", "-m", "src.jobs.nightly_reconciliation"]
```

#### 3. Heroku Scheduler

```bash
# Add to Heroku Scheduler via dashboard:
# Frequency: Daily
# Time: 02:00 UTC
# Command: python -m src.jobs.nightly_reconciliation
```

## Output

### Console Output

```
🔍 Nightly Reconciliation
Audit Date: 2026-03-06
Dry Run: False

Found 150 active licenses

✓ Reconciliation Report

┌─────────────────────────┬────────┐
│ Metric                  │ Value  │
├─────────────────────────┼────────┤
│ Run Date                │ 2026-03-06 │
│ Total Licenses          │ 150    │
│ Reconciled (Local)      │ 145    │
│ Reconciled (Stripe)     │ 140    │
│ Discrepancies           │ 5      │
│ Critical (>10%)         │ 2      │
│ Total Variance          │ $245.50│
│ Duration                │ 12.45s │
└─────────────────────────┴────────┘

Discrepancies:
┌─────────────┬───────────┬──────────┬───────────┬─────────┬────────────┐
│ License     │ Local     │ Stripe   │ Variance  │ %       │ Status     │
├─────────────┼───────────┼──────────┼───────────┼─────────┼────────────┤
│ lk_abc123   │ $49.00    │ $52.50   │ -$3.50    │ 7.14%   │ open       │
│ lk_xyz789   │ $199.00   │ $245.00  │ -$46.00   │ 18.78%  │ open       │
└─────────────┴───────────┴──────────┴───────────┴─────────┴────────────┘

Warnings (8):
  • lk_abc123: Local variance $3.50 (7.14%)
  • lk_xyz789: Stripe variance $46.00 (18.78%)
  • ... and 6 more

⚠ 2 critical discrepancies require attention
```

### Exit Codes

| Code | Meaning |
|------|---------|
| 0 | Success - no critical discrepancies |
| 1 | Critical discrepancies found (>10% variance) |
| 2 | Configuration error (missing env vars) |
| 3 | Database connection error |
| 4 | Stripe API error |

## Alert Configuration

### Telegram Alerts

1. Create a Telegram bot via [@BotFather](https://t.me/botfather)
2. Get bot token: `TELEGRAM_BOT_TOKEN`
3. Add bot to your ops channel
4. Get channel ID: `TELEGRAM_OPS_CHANNEL_ID`

**Alert Message Format:**
```
🚨 Billing Reconciliation Alert

Date: 2026-03-06
Critical Issues: 2
Total Variance: $245.50
Discrepancies: 5
Duration: 12.45s
```

### Webhook Alerts

Configure `RECONCILIATION_WEBHOOK_URL` to receive JSON payloads:

```json
{
  "event_type": "reconciliation.critical",
  "data": {
    "run_date": "2026-03-06",
    "critical_count": 2,
    "total_variance": "245.50",
    "discrepancies_count": 5,
    "discrepancies": [...]
  }
}
```

## Discrepancy Resolution Workflow

### 1. Review Discrepancies

```bash
# Query discrepancies from database
psql "$DATABASE_URL" -c "
  SELECT license_key, variance, variance_percent, status
  FROM reconciliation_audits
  WHERE audit_date = '2026-03-06'
  AND variance_percent > 10
  ORDER BY variance_percent DESC;
"
```

### 2. Investigate Root Cause

Common causes:
- **Timing differences**: Usage recorded after invoice generated
- **Proration errors**: Mid-cycle plan changes
- **Rate card mismatches**: Custom pricing not reflected
- **Missing events**: Usage events not captured

### 3. Resolve

```python
# Update discrepancy status
psql "$DATABASE_URL" -c "
  UPDATE reconciliation_audits
  SET status = 'resolved',
      notes = 'Proration adjustment applied',
      resolved_at = NOW(),
      resolved_by = 'admin@example.com'
  WHERE audit_id = 'audit_lk_abc123_2026-03-06';
"
```

### 4. Adjust Billing (if needed)

```python
# Create credit/adjustment record
mekong billing adjust \
  --license lk_abc123 \
  --type credit \
  --amount 3.50 \
  --reason "Reconciliation adjustment for 2026-03-06"
```

## Monitoring & Observability

### Log Aggregation

```bash
# View logs
tail -f /var/log/mekong/reconciliation.log

# Search for errors
grep "ERROR\|CRITICAL" /var/log/mekong/reconciliation.log
```

### Metrics to Track

| Metric | Alert Threshold |
|--------|-----------------|
| Reconciliation duration | > 5 minutes |
| Critical discrepancies | > 0 |
| Total variance | > $500 |
| Stripe API errors | > 5% of requests |

### Dashboard Queries

```sql
-- Daily reconciliation summary
SELECT
  audit_date,
  COUNT(*) as total_audits,
  SUM(CASE WHEN status = 'matched' THEN 1 ELSE 0 END) as matched,
  SUM(CASE WHEN variance_percent > 10 THEN 1 ELSE 0 END) as critical,
  AVG(variance_percent) as avg_variance
FROM reconciliation_audits
GROUP BY audit_date
ORDER BY audit_date DESC
LIMIT 30;
```

## Troubleshooting

### Missing DATABASE_URL

```
Error: DATABASE_URL environment variable not set
Solution: export DATABASE_URL="postgresql://..."
```

### Stripe API Rate Limit

```
Error: Rate limit exceeded
Solution: Implement retry with exponential backoff
```

### No Stripe Customer Found

```
Warning: No Stripe customer found for user@example.com
Solution: Ensure customer email matches Stripe record
```

## Best Practices

1. **Run during off-peak hours** - 2-4 AM local time
2. **Set up alerting** - Telegram/webhook for critical issues
3. **Review discrepancies daily** - Don't let them accumulate
4. **Log rotation** - Configure log rotation to prevent disk fill
5. **Monitor duration** - Job should complete in < 5 minutes
6. **Test with dry-run** - Before deploying configuration changes

## Related Files

- `src/jobs/nightly_reconciliation.py` - Main reconciliation script
- `src/billing/reconciliation.py` - Reconciliation service
- `src/api/billing_endpoints.py` - Billing API endpoints
- `docs/billing-cli.md` - Billing CLI documentation
