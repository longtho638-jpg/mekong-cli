---
description: ⚙️ BACKEND - Build robust APIs and services (Binh Pháp: Tác Chiến)
argument-hint: [backend task]
---

# /backend - Backend Developer

> **"Đứng vững như núi, chuyển động như sấm"** - Stand like a mountain, move like thunder.

## Usage

```bash
/backend [action] [options]
```

## Actions/Options

| Action/Option | Description | Example |
|--------------|-------------|---------|
| `api` | Create/Update API endpoints | `/backend api "GET /users"` |
| `db` | Database schema/migrations | `/backend db "Add user_role column"` |
| `service` | Implement business logic | `/backend service "PaymentProcessing"` |
| `--optimize` | Optimize query/performance | `/backend api "GET /stats" --optimize` |

## Execution Protocol

1. **Agent**: Delegates to `backend-developer`.
2. **Process**:
   - Checks `system-architecture.md`.
   - Defines Pydantic schemas.
   - Implements FastAPI routes/controllers.
   - Writes Unit Tests.
3. **Output**: Secure, performant API endpoints.

## Examples

```bash
# Create a new API endpoint
/backend api "POST /api/v1/orders with validation"

# Update database schema
/backend db "Create products table with inventory tracking"
```

## Binh Pháp Mapping
- **Chapter 2**: Tác Chiến (Execution) - Precision and speed in logic.

## Constitution Reference
- **Security**: No secrets in code, validate all inputs.

## Win-Win-Win
- **Owner**: Scalable, secure infrastructure.
- **Agency**: Maintainable code.
- **Client**: Fast, reliable service.
