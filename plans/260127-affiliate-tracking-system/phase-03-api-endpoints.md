# Phase 3: API Endpoints

## Context
REST API for affiliates to manage their account and for the system to track clicks.

## Requirements
- Public endpoints for tracking (redirects).
- Protected endpoints for affiliates (dashboard).
- Admin endpoints for management.

## Files to Create
- `backend/api/routers/affiliates.py`

## Endpoints

### Public
- `GET /affiliates/track/{code}`:
  - Records click.
  - Sets cookie (30 days).
  - Redirects to destination URL (or homepage).

### Affiliate (Protected)
- `GET /affiliates/me`: Get profile & stats.
- `POST /affiliates/links`: Generate specific deep links.
- `GET /affiliates/payouts`: View payout history.

### Admin (Protected)
- `GET /affiliates`: List all affiliates.
- `POST /affiliates/{id}/payout`: Process/Mark payout as paid.
- `PATCH /affiliates/{id}`: Update commission rate.

## Implementation Steps
1. Create router file.
2. Define routes using `FastAPI` APIRouter.
3. Inject `AffiliateService`.
4. Add authentication dependencies.
5. Register router in `backend/api/main.py` (or equivalent).
