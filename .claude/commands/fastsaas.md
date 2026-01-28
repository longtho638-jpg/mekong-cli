---
description: 🏗️ FASTSAAS - Build complete SaaS product
---

# /fastsaas - FastSaaS Factory

> **"Xây SaaS trong 1 ngày"** - Build SaaS in one day

## Usage

```bash
/fastsaas [action] [options]
```

## Actions

| Action | Description | Example |
|--------|-------------|---------|
| `build` | Build from spec | `/fastsaas build --spec spec.yaml` |
| `scaffold` | Generate boilerplate | `/fastsaas scaffold --name "MyApp"` |
| `deploy` | Deploy to production | `/fastsaas deploy` |

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | FastAPI + PostgreSQL |
| Frontend | Next.js 14 + shadcn/ui |
| Auth | JWT + OAuth |
| Payments | Stripe + PayPal |
| Deploy | Vercel + Cloud Run |

## Execution Protocol

1. **Agent**: Delegates to `fastsaas-factory`.
2. **Build**: Sequential phases (DB → API → UI → Auth → Pay → Deploy).
3. **Test**: Verify each phase.
4. **Deploy**: Production ready.

## Examples

```bash
# Build from spec
/fastsaas build --spec saas-spec.yaml

# Quick scaffold
/fastsaas scaffold --name "TenantManagementApp"

# Deploy
/fastsaas deploy --env production
```

## Win-Win-Win
- **Owner**: Rapid prototyping.
- **Agency**: Proven stack.
- **Client**: Fast time-to-market.
