# IPO-011: Production License System Implementation Plan

## Context
- **Goal**: Implement a robust licensing system for AgencyOS with tier-based limits, hardware binding, and expiration management.
- **Task ID**: TASK-ffd0e698
- **Work Directory**: /Users/macbookprom1/mekong-cli

## Architecture

### Data Models
- **License**: Stores license key, tenant_id, plan, limits, status, and binding info.
- **LicenseActivation**: Tracks individual activations (devices/instances) against a license.

### Components
1.  **Generator (`backend/core/licensing/generator.py`)**: Creates keys with `AGY-{TENANT}-{DATE}-{CHECKSUM}` format.
2.  **Validator (`backend/core/licensing/validator.py`)**: Verifies keys, checksums, and constraints.
3.  **Middleware (`backend/middleware/license_validator.py`)**: Protects API routes by validating license on requests.
4.  **API (`backend/api/routers/license_production.py`)**: Admin endpoints for generation/management.

## Phases

### Phase 1: Data Modeling & Persistence
- Create SQLAlchemy models for `License` and `LicenseActivation`.
- Create Alembic migration.
- Update Pydantic models to include `max_activations`.

### Phase 2: Core Logic Updates
- Update `LicenseGenerator` to enforce new limits (Solo: 3, Team: 10, Ent: Unlimited).
- Update `LicenseValidator` to support activation tracking and validation against DB.

### Phase 3: Middleware Implementation
- Create `LicenseValidatorMiddleware`.
- Integrate into FastAPI application (conditionally or for specific routes).

### Phase 4: API Implementation
- Connect API endpoints to Database.
- Add activation/deactivation endpoints.

### Phase 5: Testing & Documentation
- Unit tests for Generator/Validator.
- Integration tests for API/Middleware.
- Update documentation.

## Requirements Checklist
- [ ] Format: `AGY-{TENANT_ID}-{TIMESTAMP}-{CHECKSUM}`
- [ ] Limits:
    - [ ] Solo: 3 concurrent activations
    - [ ] Team: 10 concurrent activations
    - [ ] Enterprise: Unlimited
- [ ] Hardware/Domain binding
- [ ] Expiry validation (365 days)
- [ ] Database persistence
- [ ] API Middleware protection

## Files to Modify/Create
- `backend/models/license.py` (New)
- `supabase/migrations/20260127_license_system.sql` (New)
- `backend/core/licensing/models.py` (Update)
- `backend/core/licensing/generator.py` (Update)
- `backend/core/licensing/validator.py` (Update)
- `backend/middleware/license_validator.py` (New)
- `backend/api/routers/license_production.py` (Update)
- `backend/tests/test_licensing.py` (New)
