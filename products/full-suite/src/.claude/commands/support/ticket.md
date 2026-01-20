---
description: Priority support ticket
---

# /support/ticket - Support Tickets

> **Create and track support requests**

## Create Ticket

```bash
curl -X POST https://api.agencyos.network/support \
  -H "Authorization: Bearer $API_KEY" \
  -d '{"subject": "Issue with billing", "priority": "high"}'
```

## Priority Levels

| Level    | Response (Pro) |
| -------- | -------------- |
| Low      | 48h            |
| Medium   | 24h            |
| High     | 4h             |
| Critical | 1h             |

## 🏯 Binh Pháp

> "Hậu cần mạnh, tiền tuyến mạnh" - Strong support, strong frontline.
