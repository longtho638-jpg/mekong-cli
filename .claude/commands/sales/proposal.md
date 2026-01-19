---
description: Generate and send sales proposals
---

# /sales/proposal - Proposal Generator

> **Create professional proposals from templates**

## Generate Proposal

```bash
curl -X POST http://localhost:8000/crm/proposals \
  -H "Content-Type: application/json" \
  -d '{"client": "Acme Corp", "service": "Full Stack Dev", "value": 15000}'
```

## Templates

| Template   | Use Case             |
| ---------- | -------------------- |
| Standard   | General services     |
| Enterprise | Large contracts      |
| Retainer   | Monthly retainers    |
| Project    | Fixed-scope projects |

## 🏯 Binh Pháp

> "Thiện chiến giả, không nhiều chữ" - Good proposals are concise and clear.
