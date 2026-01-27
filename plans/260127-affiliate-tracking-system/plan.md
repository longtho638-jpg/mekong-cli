# IPO-013: Affiliate Tracking System Implementation Plan

## Overview
Implement a comprehensive affiliate tracking system with Gumroad integration, supporting unique referral links, conversion attribution, and Vietnam tax-compliant payouts.

## Status
- [ ] Phase 1: Database Models & Schemas
- [ ] Phase 2: Affiliate Service Layer & Payout Logic
- [ ] Phase 3: API Endpoints (Affiliate & Admin)
- [ ] Phase 4: Gumroad Webhook Integration & Attribution

## Dependencies
- SQLAlchemy (Database)
- Pydantic (Validation)
- FastAPI (API)
- Gumroad API (External)

## Key Features
- **Unique Links**: `?ref={code}` format.
- **Attribution**: Cookie-based (30 days) + Payout calculation.
- **Tax Compliance**: VN Tax logic (0.5% vs 20%).
- **Integration**: Real-time sales tracking via Gumroad webhooks.

## References
- `core/finance/gateways/gumroad.py`
- `backend/models/`
- `backend/services/`
