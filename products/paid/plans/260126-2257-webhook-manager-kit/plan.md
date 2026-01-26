# Plan: Webhook Manager Kit Implementation

## Overview
**Goal:** Build a production-ready Webhook Manager Kit ($57 product) with receiver framework, signature verification, event queue, and dashboard.

**Target Audience:** Developers integrating third-party webhooks.

## Phase 1: Core Backend & Verification (Receiver)
- [x] Implement `WebhookReceiver` service with modular verification strategies.
    - [x] Stripe Verification
    - [x] GitHub Verification
    - [x] Gumroad Verification
    - [x] Shopify Verification
- [x] Create API endpoints for receiving webhooks from these providers (`/api/v1/webhooks/{provider}`).
- [x] Standardize incoming events into a common `WebhookEvent` format.

## Phase 2: Event Queue & Processing
- [x] Implement Redis-backed queue system (using `arq` or `Celery`).
    - *Decision: Use `arq` for async-native lightweight Redis job queue.*
- [x] Refactor `process_event` to push jobs to queue.
- [x] Implement worker to process jobs (delivery to registered endpoints).
- [x] Ensure Retry Logic works correctly within the worker context.

## Phase 3: Dashboard API & Frontend
- [x] Verify/Implement API endpoints for:
    - [x] List events
    - [x] Get event details
    - [x] List deliveries
    - [x] Retry delivery (manual trigger)
- [x] Update Frontend to consume these APIs.
    - [x] Dashboard View (Recent Events)
    - [x] Event Detail View (Payload, headers, delivery status)
    - [x] Retry Button implementation.

## Phase 4: Developer Tools
- [x] Create `scripts/mock_sender.py` for local testing.
- [x] Create `scripts/local_server.py` or instructions for ngrok.

## Phase 5: Documentation & Packaging
- [x] Write `README.md` (Setup, usage).
- [x] Write `docs/PROVIDERS.md` (How to configure each provider).
- [x] Write `docs/DEPLOYMENT.md`.
- [x] Package into ZIP with checksum.

## Phase 6: Validation
- [x] Run full test suite.
- [x] Verify verifying logic with test vectors.
