# Plan: IPO-023-Webhooks-V2 - Advanced Webhook Infrastructure

## Overview
This plan outlines the implementation of an advanced webhook infrastructure to ensure reliable, secure, and observable data delivery.

## Architecture

### 1. Database Schema
- **`webhook_configs`**: Existing table.
- **`webhook_deliveries`**: Existing table, enhanced with `idempotency_key`.
- **`webhook_delivery_attempts`**: New table to track every individual attempt.
- **`dlq_entries`**: New table for dead letter queue.

### 2. Services
- **`AdvancedWebhookService`**: Orchestrates the delivery process.
- **`SignatureService`**: Handles signing.
- **`WebhookTransformer`**: Handles payload transformation.
- **`RetryPolicyEngine`**: Calculates backoff and manages circuit breaker state (using Redis).
- **`RateLimiter`**: Manages token buckets (using Redis).

### 3. Workers
- **`WebhookRetryWorker`**: Polls for pending retries and executes them.
- **`DLQWorker`**: Moves permanently failed items to DLQ (if not done inline).

### 4. API
- **`POST /api/webhooks/trigger`**: Internal endpoint to trigger webhooks.
- **`GET /api/webhooks/dlq`**: List DLQ entries.
- **`POST /api/webhooks/dlq/{id}/replay`**: Replay a DLQ entry.
- **`DELETE /api/webhooks/dlq/{id}`**: Discard a DLQ entry.

## Implementation Steps

### Phase 1: Database & Core Models
1.  Create migration for `webhook_delivery_attempts` and `dlq_entries`.
2.  Update `WebhookDelivery` model.

### Phase 2: Core Services
1.  Implement `SignatureService` (HMAC SHA-256/512, Ed25519, RSA).
2.  Implement `WebhookTransformer` (Jinja2).
3.  Implement `RateLimiter` (Redis-based Token Bucket).
4.  Implement `RetryPolicyEngine` (Backoff + Circuit Breaker).

### Phase 3: Advanced Webhook Service
1.  Create `AdvancedWebhookService` integrating all above.
2.  Implement Idempotency check.
3.  Implement Batch delivery logic.

### Phase 4: Workers & DLQ API
1.  Implement `WebhookRetryWorker`.
2.  Implement DLQ API endpoints.

### Phase 5: Frontend
1.  Create DLQ Viewer page.
2.  Create Webhook Health Dashboard.

### Phase 6: Testing & Documentation
1.  Unit tests for all services.
2.  Integration tests for full flow.
3.  Load tests.
4.  Update documentation.

## Success Criteria
- [x] All 10 components implemented.
- [x] Tests passing.
- [x] Win-Win-Win validation confirmed.
