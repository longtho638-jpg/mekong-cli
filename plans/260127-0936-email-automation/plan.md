# Implementation Plan - IPO-014: Email Automation System

## Context
This task involves building a production-ready email automation system integrated into the main `mekong-cli` backend. We will leverage the existing logic from `products/paid/email-marketing-kit` but adapt it to the main `backend/` architecture (Clean Architecture).

## Goals
- **Multi-Provider Support**: Integrate Resend (primary) and SendGrid (fallback).
- **Transactional Emails**: Welcome, Password Reset, etc.
- **Drip Campaigns**: Automated sequences.
- **Admin UI**: Campaign management in the dashboard.

## Phase 1: Backend Services & Core Logic
- [ ] **Upgrade `backend/services/email_service.py`**
    - [ ] Abstract `EmailProvider` interface.
    - [ ] Implement `ResendProvider` and `SendGridProvider`.
    - [ ] Add factory logic to switch providers based on config.
- [ ] **Implement `backend/services/drip_campaign.py`**
    - [ ] Port logic from `email-marketing-kit/app/services/drip_service.py`.
    - [ ] Adapt to use the new `EmailService`.
- [ ] **Implement `backend/services/email_templates.py`**
    - [ ] Template rendering logic (Jinja2 or simple replacement).

## Phase 2: Database Models & Migrations
- [ ] **Define Models** in `backend/models/email.py` (or similar):
    - [ ] `Campaign`
    - [ ] `Subscriber`
    - [ ] `EmailLog`
    - [ ] `DripStep`
    - [ ] `DripEnrollment`
- [ ] **Create Migration Script** (Alembic/Supabase) to create these tables.

## Phase 3: API Endpoints
- [ ] **Create `backend/api/routers/email_automation.py`**
    - [ ] `POST /campaigns`: Create campaign
    - [ ] `GET /campaigns`: List campaigns
    - [ ] `POST /subscribers`: Add subscriber
    - [ ] `POST /webhooks/email`: Handle provider webhooks (delivery, bounce)

## Phase 4: Frontend UI
- [ ] **Create `apps/dashboard/app/campaigns/page.tsx`**
    - [ ] List view of campaigns.
    - [ ] Create/Edit campaign form.
    - [ ] Subscriber list view.

## Phase 5: Testing & Documentation
- [ ] **Unit Tests**: Test providers, services, and routers.
- [ ] **Integration Tests**: Test full flow (create campaign -> enroll -> check logs).
- [ ] **Documentation**: Update API docs.

## Dependencies
- `resend` python package (need to check if installed or add to requirements).
- `sendgrid` python package.

## WIN-WIN-WIN Alignment
- **ANH**: IPO-ready asset.
- **AGENCY**: Reusable kit.
- **CLIENT**: Powerful automation.
