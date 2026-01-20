---
description: Configure team permissions and access
---

# /team/permissions - Permission Manager

> **Set granular access controls for team members**

## View Permissions

// turbo

```bash
curl -s http://localhost:8000/team/permissions | jq
```

## Update Role

```bash
curl -X PUT http://localhost:8000/team/members/{id}/role \
  -d '{"role": "developer"}'
```

## Permission Matrix

| Feature  | Admin | Dev | Viewer | Billing |
| -------- | ----- | --- | ------ | ------- |
| Code     | ✅    | ✅  | ❌     | ❌      |
| Deploy   | ✅    | ✅  | ❌     | ❌      |
| Billing  | ✅    | ❌  | ❌     | ✅      |
| Settings | ✅    | ❌  | ❌     | ❌      |
| View     | ✅    | ✅  | ✅     | ✅      |

## 🏯 Binh Pháp

> "Phân công rõ ràng" - Clear roles, clear victories.
