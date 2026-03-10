# Vertical SaaS Builder — Skill

> Design and build industry-specific SaaS products with domain data models, workflow automation, compliance engines, and vertical marketplace patterns.

## When to Activate
- Building a SaaS product targeting a specific industry vertical (legal, healthcare, construction, agriculture, etc.)
- Designing domain-specific data models, workflow engines, or compliance rule sets
- Implementing multi-tenant architecture with vertical-specific customization layers
- Creating embedded marketplaces or partner ecosystems within a vertical product

## Core Capabilities
| Area | Description |
|------|-------------|
| Domain Data Models | Entity schemas, taxonomies, and ontologies specific to the vertical |
| Workflow Automation | Configurable process engines for industry-specific approval/fulfillment flows |
| Compliance Engine | Rule-based validation against regulatory requirements (HIPAA, SOX, CQC, etc.) |
| Vertical Marketplace | Embedded supplier/partner directory, RFQ flows, and commission logic |
| Multi-Tenant Config | Per-tenant feature flags, custom fields, and branded portals |
| Reporting & Analytics | Industry KPI dashboards (e.g., utilization rate, case load, yield per acre) |

## Architecture Patterns
- **Config-Driven Workflows**: store workflow definitions as JSON/YAML in DB — tenants customize steps without code deploys
- **Extensible Schema**: base entity tables + `custom_fields JSONB` column per tenant — avoids schema explosion while supporting vertical diversity
- **Compliance Middleware**: plug-in rule engine (e.g., Drools, json-rules-engine) that validates records before write — swap rule sets per jurisdiction
- **Embedded Marketplace**: first-party product + third-party supplier catalog under one UX — use provider abstraction so internal and external fulfillment share the same API contract
- **Vertical Pricing**: usage-based billing tied to domain metrics (per patient, per job, per hectare) — integrate with Polar.sh / Stripe metered billing

## Key Technologies
- Backend: Node.js (NestJS) or Python (FastAPI) with PostgreSQL (row-level tenant isolation)
- Workflow: Temporal.io or Inngest for durable, retryable business processes
- Rules Engine: `json-rules-engine` (JS) or `rule-engine` (Python) for compliance validation
- Frontend: Next.js + domain-specific component library (shadcn/ui base, vertical-themed)
- Auth + Tenant: Better Auth or Clerk with organization/team primitives
- Search: Algolia or pg_trgm for domain entity search (e.g., ICD codes, legal case numbers)

## Implementation Checklist
- [ ] Define core domain entities and relationships (ERD) — validate with 3+ domain experts
- [ ] Implement tenant isolation strategy (schema-per-tenant vs. row-level security)
- [ ] Build configurable workflow engine with at least: trigger, steps, conditions, notifications
- [ ] Add compliance rule set for primary target regulation; expose violation reports in UI
- [ ] Create vertical KPI dashboard with industry-standard metrics
- [ ] Design onboarding flow that imports existing data (CSV/API migration wizard)
- [ ] Build partner/supplier marketplace scaffold if applicable
- [ ] Add audit log for every state-changing operation (required by most verticals)

## Best Practices
- Interview 5+ practitioners in the target vertical before finalizing data models — domain accuracy is the moat
- Use human-readable IDs for domain entities (e.g., `CASE-2026-0042`) not UUIDs in UI — operators think in their domain language
- Provide bulk import and export in industry-standard formats (HL7 FHIR, LEDES, ACORD, etc.)
- Make compliance rule sets tenant-overridable with approval workflow — jurisdictions differ
- Instrument vertical KPIs from day one — benchmarking data becomes a retention and upsell lever

## Anti-Patterns
- Generalizing too early — a generic workflow builder competes with Zapier; vertical specificity is the defensible wedge
- Hardcoding regulatory rules in application logic — rules change; externalize them to the compliance engine
- Building custom auth instead of layering tenant/org primitives on proven auth libraries
- Skipping data migration tooling — enterprises will not manually re-enter years of records
- Pricing per seat for operational tools — vertical SaaS monetizes better on usage metrics tied to business outcomes
