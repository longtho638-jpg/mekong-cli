# Task 07: Documentation Generation

**Status:** Ready to Execute
**Priority:** Medium
**Estimated Time:** 15-20 minutes
**Dependencies:** None
**Terminal:** #8

---

## 🎯 Objective

Generate/update critical documentation files (project overview, architecture, API reference, deployment guide). Ensure docs are consistent with current codebase state.

---

## 📋 WIN-WIN-WIN Validation

### 👑 ANH (Owner) WINS:
- Documentation = easier handoffs
- Knowledge preservation
- Reduced "bus factor"

### 🏢 AGENCY WINS:
- Client onboarding faster (good docs)
- Developer productivity (no need to ask questions)
- Professional image

### 🚀 CLIENT/STARTUP WINS:
- Self-service documentation
- API reference for integrations
- Clear deployment procedures

✅ **All 3 parties WIN** → Proceed

---

## ⚡ Execution Commands

```bash
cd /Users/macbookprom1/mekong-cli

echo "=== Documentation Generation ==="

# Check existing documentation structure
echo ""
echo "=== Current Documentation Status ==="
ls -lh docs/*.md 2>/dev/null | awk '{print $9, "(" $5 ")"}'

# Generate/Update key documentation files

# 1. Project Overview PDR
echo ""
echo "=== Generating Project Overview (PDR) ==="
cat > docs/project-overview-pdr.md << 'EOF'
# AgencyOS - Product Development Requirements (PDR)

**Version:** 5.1.1
**Last Updated:** $(date +%Y-%m-%d)
**Status:** Production Ready

## Executive Summary

AgencyOS is an AI-native operating system for solopreneurs and agencies, built on **Binh Pháp (Art of War)** principles. It provides 24+ AI agents, 14 MCP servers, and 48+ reusable skills to automate agency operations.

## Core Features

### 1. AI Workforce
- 24 specialized agents (Planner, Coder, Marketer, Strategist)
- Multi-agent orchestration via MCP servers
- Context-aware task delegation

### 2. Revenue Engine
- Integrated PayPal/Stripe payments
- Subscription management
- Vietnam tax compliance (0.5% simplified, 20% standard+VAT)
- License generation (AGY-{tenant}-{timestamp}-{checksum})

### 3. Development Tools
- CLI commands (cc revenue, cc deploy, cc finance)
- Frontend: Next.js 15 + Material Design 3
- Backend: FastAPI + Supabase + PostgreSQL

### 4. Growth Infrastructure
- Content generation (marketing, social, email)
- Lead management
- Affiliate program support

## Technical Architecture

### Frontend
- **Dashboard:** apps/dashboard (Next.js 15, MD3, React 19)
- **Docs:** apps/docs (Astro static site)
- **Web:** apps/web (Marketing landing page)

### Backend
- **API:** backend/api (FastAPI, Python 3.11+)
- **Database:** Supabase (PostgreSQL)
- **Cache:** Redis (optional)

### Deployment
- **Frontend:** Vercel (auto-deploy from main branch)
- **Backend:** Google Cloud Run (containerized)
- **MCP Servers:** Cloud Run (separate services)

## Target Users

1. **Solo Founders:** $395/year (Solo plan)
2. **Small Agencies:** $995/year (Team plan, 5 users)
3. **Enterprise Agencies:** Custom pricing (unlimited users)

## Success Metrics

- **MRR Target:** $10K by Q2 2026
- **ARR Target:** $120K by Q4 2026
- **Users:** 100+ active licenses
- **Response Time:** API <200ms, Dashboard <1s load

## Roadmap

### Q1 2026 (Current)
- ✅ Payment integration (PayPal)
- ✅ License generation
- ✅ Dashboard polish
- 🚧 MCP server deployment

### Q2 2026
- Stripe subscriptions
- Affiliate management
- A/B testing framework
- Mobile app (React Native)

### Q3 2026
- AI-powered proposals
- Contract generation
- CRM integration (HubSpot, Salesforce)

EOF

echo "✅ Generated: docs/project-overview-pdr.md"

# 2. System Architecture
echo ""
echo "=== Generating System Architecture ==="
cat > docs/system-architecture.md << 'EOF'
# AgencyOS - System Architecture

**Version:** 5.1.1
**Last Updated:** $(date +%Y-%m-%d)

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Client Layer                         │
│  Dashboard (Next.js) | Docs (Astro) | Web (Next.js)    │
└─────────────────────────────────────────────────────────┘
                          ▼
┌─────────────────────────────────────────────────────────┐
│                   API Gateway (FastAPI)                 │
│  /api/revenue | /api/payments | /api/finance           │
└─────────────────────────────────────────────────────────┘
                          ▼
┌─────────────────────────────────────────────────────────┐
│              Antigravity Core (24 Agents)               │
│  Planner | Coder | Tester | Marketer | Strategist      │
└─────────────────────────────────────────────────────────┘
                          ▼
┌─────────────────────────────────────────────────────────┐
│           MCP Servers (14 Microservices)                │
│  Agency | Revenue | Security | Orchestrator | Quota    │
└─────────────────────────────────────────────────────────┘
                          ▼
┌─────────────────────────────────────────────────────────┐
│              Data Layer                                 │
│  Supabase (PostgreSQL) | Redis Cache | File Storage    │
└─────────────────────────────────────────────────────────┘
```

## Component Details

### Frontend Apps
- **Dashboard:** Command center for agency operations
- **Docs:** Product documentation and guides
- **Web:** Marketing landing pages

### Backend Services
- **FastAPI:** RESTful API server
- **Payment Service:** PayPal/Stripe webhook handlers
- **License Service:** Key generation and validation

### MCP Servers
See `.claude/docs/QUANTUM_MANIFEST.md` for full 14-server inventory.

### Database Schema
- `users` - User accounts and auth
- `subscriptions` - Plan management
- `invoices` - Billing records
- `licenses` - License keys (AGY-* format)
- `payments` - Transaction log

## Deployment Architecture

### Production Environment
- **Frontend:** Vercel (CDN + Edge Functions)
- **Backend:** Google Cloud Run (auto-scaling)
- **Database:** Supabase (managed PostgreSQL)
- **Monitoring:** Cloud Logging + Sentry

### CI/CD Pipeline
```
GitHub Push → GitHub Actions → Build → Test → Deploy
```

## Security Layers

1. **API Authentication:** JWT tokens
2. **Webhook Verification:** Signature validation (PayPal, Stripe)
3. **Rate Limiting:** 100 req/min per IP
4. **Secrets Management:** Google Secret Manager

EOF

echo "✅ Generated: docs/system-architecture.md"

# 3. API Reference (generate from FastAPI OpenAPI schema)
echo ""
echo "=== Generating API Reference ==="
if [ -f "backend/main.py" ]; then
  # Extract OpenAPI schema (requires backend running)
  python3 << 'PYEOF'
import sys
sys.path.insert(0, '/Users/macbookprom1/mekong-cli')

try:
    from backend.main import app
    from fastapi.openapi.utils import get_openapi
    import json

    schema = get_openapi(
        title=app.title,
        version=app.version,
        routes=app.routes,
    )

    with open('docs/api-reference.json', 'w') as f:
        json.dump(schema, f, indent=2)

    print("✅ Generated: docs/api-reference.json")

    # Generate markdown summary
    with open('docs/api-reference.md', 'w') as f:
        f.write("# API Reference\n\n")
        f.write(f"**Version:** {schema.get('info', {}).get('version', 'N/A')}\n\n")
        f.write("## Endpoints\n\n")

        for path, methods in schema.get('paths', {}).items():
            for method, details in methods.items():
                summary = details.get('summary', 'No description')
                f.write(f"### {method.upper()} {path}\n")
                f.write(f"{summary}\n\n")

    print("✅ Generated: docs/api-reference.md")

except Exception as e:
    print(f"⚠️ Could not generate API reference: {e}")
    print("   (Backend may need to be running)")
PYEOF
else
  echo "⚠️ backend/main.py not found - skipping API reference generation"
fi

# 4. Deployment Guide
echo ""
echo "=== Generating Deployment Guide ==="
cat > docs/deployment-guide.md << 'EOF'
# AgencyOS - Deployment Guide

**Version:** 5.1.1
**Last Updated:** $(date +%Y-%m-%d)

## Prerequisites

- Google Cloud account (for Cloud Run)
- Vercel account (for frontend)
- Supabase account (for database)
- PayPal/Stripe accounts (for payments)

## Environment Setup

### Backend (.env)
```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key
PAYPAL_CLIENT_ID=your_client_id
PAYPAL_CLIENT_SECRET=your_secret
PAYPAL_WEBHOOK_ID=your_webhook_id
PAYPAL_MODE=live  # or 'sandbox'
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

### Frontend (.env.production)
```bash
NEXT_PUBLIC_API_URL=https://api.agencyos.network
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

## Deployment Steps

### 1. Backend Deployment (Cloud Run)
```bash
cd /Users/macbookprom1/mekong-cli
./deploy-production.sh
```

### 2. Frontend Deployment (Vercel)
```bash
# Auto-deploys on push to main branch
git push origin main

# Manual deployment:
cd apps/dashboard
vercel --prod
```

### 3. Configure Webhooks

**PayPal Webhook URL:**
```
https://api.agencyos.network/api/payments/paypal/webhook
```

**Stripe Webhook URL:**
```
https://api.agencyos.network/api/payments/stripe/webhook
```

## Health Checks

```bash
# Backend
curl https://api.agencyos.network/health

# Frontend
curl https://agencyos.network
```

## Rollback Procedure

```bash
# Backend
./deploy-production.sh --rollback

# Frontend
vercel rollback
```

EOF

echo "✅ Generated: docs/deployment-guide.md"

# Summary
echo ""
echo "=== Documentation Generation Complete ==="
ls -lh docs/*.md | awk '{print $9, "(" $5 ")"}'
```

---

## ✅ Success Criteria

- [ ] `docs/project-overview-pdr.md` created/updated
- [ ] `docs/system-architecture.md` created/updated
- [ ] `docs/api-reference.md` generated (or documented why not)
- [ ] `docs/deployment-guide.md` created/updated
- [ ] All docs are ≥500 words (substantial content)
- [ ] No broken internal links
- [ ] Markdown syntax is valid

---

## 🔧 Failure Recovery

### API Reference Generation Fails
```bash
# Alternative: Use FastAPI's built-in docs
# Start backend and visit: http://localhost:8000/docs
# Manually document critical endpoints
```

### Docs Directory Missing
```bash
mkdir -p docs
```

---

## 🚀 Next Steps After Success

1. Review generated docs for accuracy
2. Add screenshots to docs (if needed)
3. Publish docs to docs.agencyos.network
4. Proceed to Task 08: Security Audit

---

**Report:** `echo "TASK 07 COMPLETE - DOCS GENERATED" >> /tmp/binh-phap-execution.log`
