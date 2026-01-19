---
description: Track affiliate referrals and commissions
---

# /affiliate/track - Affiliate Tracker

> **Monitor referrals, conversions, and payouts**

## View Affiliates

// turbo

```bash
curl -s http://localhost:8000/webhooks/customers | jq '.affiliates'
```

## Affiliate Stats

| Metric      | Description  |
| ----------- | ------------ |
| Referrals   | Total clicks |
| Conversions | Paid signups |
| Commission  | Earnings     |
| Payout      | Pending/Paid |

## Create Affiliate Link

```bash
curl -X POST http://localhost:8000/affiliate/create \
  -d '{"partner": "john", "campaign": "launch2026"}'
```

## 🏯 Binh Pháp

> "Dùng gián điệp thắng" - Affiliates are your army of scouts.
