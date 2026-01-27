# Phase 1: Database Models & Schemas

## Context
We need to store affiliate data, their generated links, tracked conversions (sales), and payout records.

## Requirements
- Define SQLAlchemy models for:
  - `Affiliate`: User info, commission rate, tax info.
  - `AffiliateLink`: Unique referral codes and destination URLs.
  - `Conversion`: Tracked sales linked to an affiliate.
  - `Payout`: Records of payments to affiliates.
- Define Pydantic schemas for API request/response validation.

## Files to Create
- `backend/models/affiliate.py`: SQLAlchemy models.
- `backend/api/schemas/affiliate.py`: Pydantic schemas.

## Data Structure

### Affiliate Model
- `id`: UUID (PK)
- `user_id`: UUID (FK to User, if applicable, or email/name)
- `code`: String (Unique, e.g., "johndoe")
- `commission_rate`: Float (Default 0.20)
- `payment_email`: String
- `tax_id`: String (Optional)
- `created_at`: DateTime
- `updated_at`: DateTime

### AffiliateLink Model
- `id`: UUID (PK)
- `affiliate_id`: UUID (FK)
- `slug`: String (Unique)
- `destination_url`: String
- `clicks`: Integer (Default 0)
- `created_at`: DateTime

### Conversion Model
- `id`: UUID (PK)
- `affiliate_id`: UUID (FK)
- `external_id`: String (Gumroad Sale ID)
- `amount`: Float
- `currency`: String
- `commission_amount`: Float
- `status`: Enum (pending, paid, refunded)
- `meta_data`: JSON (Product info, customer email hash)
- `created_at`: DateTime

### Payout Model
- `id`: UUID (PK)
- `affiliate_id`: UUID (FK)
- `amount`: Float
- `tax_amount`: Float
- `tax_rate`: Float
- `status`: Enum (pending, processing, paid)
- `period_start`: Date
- `period_end`: Date
- `created_at`: DateTime

## Implementation Steps
1. Create `backend/models/affiliate.py`.
2. Define Enum types for statuses.
3. Create `backend/api/schemas/affiliate.py` with Create/Update/Response schemas.
4. Ensure relationships are defined (Affiliate has many Links/Conversions/Payouts).
