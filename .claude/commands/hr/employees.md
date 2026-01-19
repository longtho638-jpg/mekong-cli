---
description: Manage HR and employee records
---

# /hr/employees - Employee Manager

> **Track employee info, payroll, and performance**

## List Employees

// turbo

```bash
curl -s http://localhost:8000/hr/employees | jq
```

## Add Employee

```bash
curl -X POST http://localhost:8000/hr/employees \
  -d '{"name": "John Doe", "role": "Developer", "salary": 5000}'
```

## HR Features

- Employee directory
- Payroll tracking
- Leave management
- Performance reviews

## 🏯 Binh Pháp

> "Tướng tài là quân mạnh" - Great talent makes great armies.
