---
description: View business analytics and KPIs
---

# /analytics/dashboard - Analytics Dashboard

> **Real-time KPIs and business metrics**

## View Summary

// turbo

```bash
curl -s http://localhost:8000/dashboard/summary | jq
```

## Key Metrics

| Metric | API                  |
| ------ | -------------------- |
| MRR    | `/dashboard/revenue` |
| Churn  | `/dashboard/churn`   |
| LTV    | `/dashboard/ltv`     |
| CAC    | `/dashboard/cac`     |

## Export Report

```bash
python3 scripts/vibeos/revenue_agent.py --report weekly
```

## 🏯 Binh Pháp

> "Biết kẻ địch biết ta" - Know your metrics, know your path.
