# Plan: IPO-033-Rate-Limiting (Redis-backed API Rate Limiting)

## Context
- Task ID: d4939101
- Goal: Implement Redis-backed API rate limiting with multiple algorithms (Sliding Window, Token Bucket, Fixed Window).
- Terrain: Security/Performance.

## Phase 1: Core Services (Limiters)
- [ ] Create `backend/services/sliding_window_limiter.py`
- [ ] Create `backend/services/token_bucket_limiter.py`
- [ ] Create `backend/services/fixed_window_limiter.py`
- [ ] Create `backend/services/rate_limiter_service.py` (Facade)

## Phase 2: Configuration & Middleware
- [ ] Create `config/rate-limit-config.yaml`
- [ ] Create/Update `backend/middleware/rate_limit_middleware.py`
- [ ] Register middleware in `backend/main.py`

## Phase 3: API & Database
- [ ] Create migration `backend/database/migrations/20260127_009_rate_limits.sql`
- [ ] Create `backend/api/routers/rate_limits.py` (Admin endpoints)

## Phase 4: Monitoring & Scripts
- [ ] Create `scripts/rate-limits/check-limits.sh`
- [ ] Create `scripts/rate-limits/reset-limits.sh`
- [ ] (Optional) Dashboard integration

## Phase 5: Testing
- [ ] Unit tests for limiters
- [ ] Integration tests for middleware
