# Phase 2: Backend Logic

**Status**: In Progress
**Goal**: Implement the core feature flag evaluation engine and the API endpoints.

## Steps

1. **Schemas (Pydantic Models)**
   - `FeatureFlagCreate`, `FeatureFlagUpdate`, `FeatureFlagResponse`.
   - `EvaluationContext` (user_id, email, custom properties).

2. **Core Logic (Evaluation Engine)**
   - Implement `evaluate_flag(flag, context) -> bool`.
   - Handle:
     - Global `is_active`.
     - Specific Rules (e.g., `user_id` in list).
     - Percentage Rollout (deterministic hashing of `user_id` + `flag_key`).

3. **CRUD Service**
   - Create/Read/Update/Delete flags in DB.

4. **API Endpoints**
   - `POST /api/v1/flags`: Create flag (Admin).
   - `GET /api/v1/flags`: List flags (Admin).
   - `POST /api/v1/evaluate`: Client endpoint for SDKs to get flag status.

## Deliverables
- Functional API to manage flags.
- Functional API to evaluate flags based on context.
