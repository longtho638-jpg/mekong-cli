---
description: Manage sales pipeline and deals
---

# /sales/pipeline - Pipeline Manager

> **Track deals from lead to close**

## View Pipeline

// turbo

```bash
curl -s http://localhost:8000/crm/deals | jq
```

## Pipeline Stages

1. **Lead** - Initial contact
2. **Qualified** - Budget confirmed
3. **Proposal** - Sent proposal
4. **Negotiation** - Terms discussion
5. **Closed Won** - Deal closed
6. **Closed Lost** - Did not convert

## Update Deal

```bash
curl -X PUT http://localhost:8000/crm/deals/{id} \
  -d '{"stage": "proposal", "value": 25000}'
```

## 🏯 Binh Pháp

> "Tiên phát chế nhân" - Move fast, close first.
