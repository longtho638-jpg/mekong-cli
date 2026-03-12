# Sophia Proposal - README

**Version:** 1.0.0
**Status:** ✅ GREEN - Production Live
**Last Updated:** 2026-03-12

---

## Quick Start

### Prerequisites
- Node.js 18+
- pnpm 9.15.0+

### Install
```bash
cd apps/sophia-proposal
pnpm install
```

### Development
```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000)

### Build
```bash
pnpm build
```

### Test
```bash
npx vitest run
```

---

## Project Structure

```
app/
├── admin/               # Admin dashboard
│   ├── licenses/        # License management
│   └── components/      # Admin UI components
├── api/                 # API routes
│   ├── licenses/        # License CRUD
│   └── usage/           # Usage metering
├── components/
│   ├── auth/            # AuthGuard (client-side auth)
│   ├── ui/              # Reusable UI components
│   ├── sections/        # Landing page sections
│   └── layout/
├── lib/
│   ├── license-service.ts       # License management
│   ├── usage-metering.ts        # Usage tracking
│   ├── overage-alert-engine.ts  # 80/90/100% alerts
│   ├── audit-logger.ts          # Audit trail
│   ├── polar-webhook-handler.ts # Payment webhooks
│   ├── polar-config.ts          # Polar.sh config
│   ├── raas-gate.ts             # License gate
│   └── utils.test.ts            # Test files
├── page.tsx
├── layout.tsx
└── globals.css

docs/                # Documentation
plans/               # Project plans
```

---

## Tech Stack

| Layer | Technology | Version |
|-------|------------|---------|
| Framework | Next.js 16 | 16.1.6 |
| UI Library | React | 19.2.3 |
| Language | TypeScript | 5.9.3 |
| Styling | Tailwind CSS v4 | 4.2.1 |
| Animation | Framer Motion | 12.34.3 |
| Icons | Lucide React | 0.563.0 |
| Testing | Vitest | 4.0.18 |
| Validation | Zod | 4.3.6 |
| Deployment | Vercel | Latest |

---

## Components

### Landing Page (10 sections)
1. **Hero** - Value proposition
2. **Workflow** - 4-step process
3. **Features** - Capabilities
4. **AffiliateDiscovery** - 18 programs (3 tiers)
5. **Pricing** - 4 subscription tiers
6. **TechStack** - Technologies
7. **ROICalculator** - Interactive ROI projection
8. **Affiliates** - Success stories
9. **FAQ** - Common questions
10. **Footer** - Links & legal

### Admin Dashboard
- **LicensesPage** - CRUD operations for licenses
- **CreateLicenseModal** - New license creation
- **LicenseList** - License table with filters
- **AuthGuard** - Client-side authentication

---

## ROIaaS Features (Phases 1-5)

| Phase | Feature | Status |
|-------|---------|--------|
| Phase 1 | License Gate (raas-gate.ts) | ✅ |
| Phase 2 | License CRUD UI | ✅ |
| Phase 3 | Polar Webhook Integration | ✅ |
| Phase 4 | Usage Metering + Overage Alerts | ✅ |
| Phase 5 | Analytics Dashboard | ✅ |

### Phase 4: Overage Alert Engine
- **80% threshold** - Warning alert
- **90% threshold** - Critical alert
- **100% threshold** - Exceeded alert
- Channels: Dashboard, Email, Webhook

### Phase 4: Audit Logger
- LICENSE_CREATE, LICENSE_READ, LICENSE_UPDATE, LICENSE_DELETE
- LICENSE_REVOKE, SUBSCRIPTION_UPDATE, USAGE_ACCESS
- Timestamped audit trail

### Security Features
- **Security Headers:** CSP, HSTS, X-Frame-Options, X-Content-Type-Options
- **Zod Validation:** Input validation for license service
- **AuthGuard:** Client-side route protection
- **Audit Logging:** All license operations logged

---

## Testing

### Test Coverage
- **65 tests passing** (6 test files)
- Chaos tests for webhook handling (13 tests)
- Component tests for admin UI

### Test Files
```
app/lib/polar-webhook-handler.test.ts   # Chaos tests
app/lib/usage-metering.test.ts          # Overage alerts
app/lib/llm-client.test.ts              # LLM integration
app/lib/affiliate-data.test.ts          # Data validation
app/lib/utils.test.ts                   # Utilities
app/admin/licenses/__tests__/license-page.test.tsx
```

---

## Quality Metrics

| Metric | Target | Current |
|--------|--------|---------|
| Build | Success | ✅ |
| Tests | 100% pass | ✅ 65/65 |
| TypeScript | 0 errors | ✅ |
| ESLint | 0 errors | ✅ |
| console.log | 0 in prod | ✅ |

---

## Documentation

- [Project Overview](./project-overview-pdr.md)
- [System Architecture](./system-architecture.md)
- [Code Standards](./code-standards.md)
- [Development Roadmap](./development-roadmap.md)
- [Deployment Guide](./deployment-guide.md)

---

## Deployment

```bash
git push origin main
# → GitHub Actions → Vercel auto-deploy
```

Production: https://sophia-ai-factory.vercel.app

---

## License

Private - AgencyOS
