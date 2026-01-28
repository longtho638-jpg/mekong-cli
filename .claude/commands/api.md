---
description: 🔌 API - Design and document API specifications (Binh Pháp: Hình Thế)
argument-hint: [api task]
---

# /api - API Designer

> **"Thông suốt như mạch máu"** - Flowing like blood vessels (Connectivity).

## Usage

```bash
/api [action] [options]
```

## Actions/Options

| Action/Option | Description | Example |
|--------------|-------------|---------|
| `design` | Design OpenAPI/Swagger spec | `/api design "User Profile"` |
| `validate` | Check API consistency | `/api validate "Auth Endpoints"` |
| `mock` | Create mock responses | `/api mock "Payment Gateway"` |
| `--rest` | Enforce RESTful standards | `/api design "Orders" --rest` |

## Execution Protocol

1. **Agent**: Delegates to `api-designer`.
2. **Process**:
   - Defines resources and methods.
   - Creates/Updates `docs/api-docs.md`.
   - Ensures consistency with `backend` implementation.
3. **Output**: OpenAPI Spec, Interface Definitions.

## Examples

```bash
# Design a new resource
/api design "Subscription Management API"

# Validate existing endpoints
/api validate "Check consistency of error responses"
```

## Binh Pháp Mapping
- **Chapter 4**: Hình Thế (Positioning) - Defining the interfaces (terrain) of interaction.

## Constitution Reference
- **FastAPI Route Standards**: Descriptive paths, Pydantic models.

## Win-Win-Win
- **Owner**: Standardized integrations.
- **Agency**: Decoupled Frontend/Backend dev.
- **Client**: Robust integrations.
