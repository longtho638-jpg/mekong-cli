---
description: Manage team members and seats
---

# /team/manage - Team Management

> **Add, remove, and manage team seats (Pro plan)**

## List Team

// turbo

```bash
curl -s http://localhost:8000/team/members | jq
```

## Add Member

```bash
curl -X POST http://localhost:8000/team/invite \
  -H "Content-Type: application/json" \
  -d '{"email": "dev@company.com", "role": "developer"}'
```

## Roles

| Role      | Permissions  |
| --------- | ------------ |
| Admin     | Full access  |
| Developer | Code, deploy |
| Viewer    | Read-only    |
| Billing   | Finance only |

## Seat Limits

| Plan      | Seats     |
| --------- | --------- |
| Starter   | 1         |
| Pro       | 5         |
| Franchise | Unlimited |

## 🏯 Binh Pháp

> "Tướng giỏi không chiến một mình" - Great generals lead great teams.
