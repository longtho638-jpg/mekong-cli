# IPO-022-Landing - Landing Page Builder with A/B Testing & Conversion Optimization

## Overview
**Priority**: HIGH
**Status**: In Progress
**Description**: Build a comprehensive Landing Page Builder with drag-and-drop capabilities, A/B testing framework, and conversion optimization tools. This system aims to provide rapid marketing campaign deployment and data-driven growth.

## Strategic Context (Binh Pháp Ch.7)
- **Strategy**: Speed to market + Strategic positioning.
- **Tactics**: Rapid page creation -> A/B Testing -> Data-driven optimization.

## Phases

### Phase 1: Foundation & Scaffolding
- [ ] Initialize `apps/landing` (Next.js 14/15, Tailwind, TypeScript).
- [ ] Configure `backend` for landing page routes (FastAPI).
- [ ] Database schema design (Landing Pages, A/B Tests, Events).
- [ ] Setup shared types/packages if needed.

### Phase 2: Landing Page Builder UI (Frontend)
- [ ] Drag-and-Drop Core (dnd-kit/React DnD).
- [ ] Component Library (Hero, Features, Pricing, CTA, etc.).
- [ ] Property Editor & Canvas.
- [ ] Real-time Preview & Templates.

### Phase 3: Backend Services
- [ ] Landing Page CRUD (FastAPI).
- [ ] A/B Testing Logic (Traffic split, Variant management).
- [ ] Analytics Service (Event tracking, Heatmap data).

### Phase 4: Conversion & Optimization
- [ ] Heatmap visualization integration.
- [ ] Session recording (rrweb).
- [ ] SEO Tools (Meta tags, OG, Schema).

### Phase 5: Testing & Polish
- [ ] Unit Tests (Frontend components, Backend logic).
- [ ] Integration Tests.
- [ ] E2E Tests.
- [ ] Performance Optimization (Lighthouse > 90).
- [ ] Documentation.

## Key Dependencies
- **Frontend**: Next.js, dnd-kit, TailwindCSS, Lucide React, Recharts.
- **Backend**: FastAPI, SQLAlchemy, Pydantic.
- **Storage**: Postgres (Data), S3/GCS (Assets/Recordings).

## Unresolved Questions
- [ ] Integration with specific Email/CRM providers? (Will use webhooks generic for now).
- [ ] Auth for the builder? (Assuming integrated with existing auth system).

## Progress
- [x] Scaffolding started.
- [x] Initialized `apps/landing` with Next.js and Tailwind.
- [x] Implemented Frontend Builder Core:
    - [x] Drag-and-Drop Core (dnd-kit).
    - [x] Component Palette & Canvas.
    - [x] Property Panel.
    - [x] Undo/Redo Reducer.
    - [x] Basic Component Blocks (Hero, Features, CTA, Text).
- [x] Implemented Backend:
    - [x] SQLAlchemy Models (LandingPage, ABTest, AnalyticsEvent).
    - [x] Pydantic Schemas.
    - [x] LandingPageService (CRUD, Publish, Duplicate).
    - [x] ABTestingService (Create Test, Record Event, Get Results).
    - [x] FastAPI Router (`/landing-pages`).
- [x] Created Templates:
    - [x] SaaS Launch.
    - [x] E-commerce Product.
    - [x] Lead Gen.
    - [x] Webinar Registration.
    - [x] App Download.
    - [x] Agency Portfolio.

## Next Steps
- [ ] Create database migrations (Alembic).
- [ ] Write backend tests (Unit/Integration).
- [ ] Verify frontend build.
- [ ] Implement Analytics & Heatmap visualization (Placeholder logic exists).
- [ ] Finalize documentation.
