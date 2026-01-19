---
description: Manage territories and franchisees
---

# /franchise/territories - Territory Manager

> **Assign and manage franchise territories**

## List Territories

// turbo

```bash
curl -s http://localhost:8000/franchise/territories | jq
```

## Create Territory

```bash
curl -X POST http://localhost:8000/franchise/territories \
  -d '{"name": "Vietnam", "owner": "partner@vn.com"}'
```

## Territory Stats

| Metric  | Description     |
| ------- | --------------- |
| MRR     | Monthly revenue |
| Clients | Total clients   |
| Churn   | Monthly churn   |
| Growth  | MoM growth      |

## 🏯 Binh Pháp

> "Phân chia thiên hạ" - Divide territories, multiply revenue.
