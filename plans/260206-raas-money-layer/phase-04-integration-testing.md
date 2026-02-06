---
title: "Phase 4: Integration Testing"
description: "Pytest suite for Money Layer."
status: pending
priority: P1
effort: 1d
branch: feat/money-layer
tags: [testing, pytest, mocks]
created: 2026-02-06
---

# Phase 4: Integration Testing

## Context
Financial systems require rigorous testing. We cannot rely on manual testing against the live Stripe API for every build. We need mocked integration tests for the payment flow and real DB tests for the ledger.

## Requirements
-   **Framework:** `pytest` + `pytest-asyncio`.
-   **DB Testing:** Use a temporary Postgres DB or rollback transactions per test.
-   **Mocking:** `unittest.mock` or `pytest-mock` for Stripe.

## Implementation Steps

1.  **Test Configuration**
    -   `tests/conftest.py`:
        -   `async_client`: `httpx.AsyncClient` for API requests.
        -   `db_session`: Async session fixture that rolls back after each test.
        -   `mock_stripe`: Autouse fixture to mock `stripe.checkout.Session.create` and `stripe.Webhook.construct_event`.

2.  **Ledger Tests (`tests/test_ledger.py`)**
    -   **Test Deposit:** Add 100 credits -> Balance increases.
    -   **Test Usage:** Deduct 50 credits -> Balance decreases.
    -   **Test Overdraft:** Try to deduct more than balance -> Should raise Error (if logic enforced) or allow negative (depending on business rule). *Decision: Prevent negative balance for usage.*
    -   **Test Concurrency:** Run multiple async transactions effectively (ensure atomic updates work).

3.  **Payment Flow Tests (`tests/test_payments.py`)**
    -   **Test Checkout Create:** Assert Stripe mock is called with correct parameters (metadata).
    -   **Test Webhook Success:** Simulate valid webhook payload -> Check DB for new transaction.
    -   **Test Webhook Idempotency:** Send same payload twice -> DB should only have 1 transaction.
    -   **Test Webhook Invalid Signature:** Simulate bad signature -> Return 400/401.

4.  **API Endpoint Tests**
    -   `tests/test_api.py`: Verify `/health`, `/wallets/me` (auth required).

## Success Criteria
-   [ ] All tests pass with `pytest`.
-   [ ] Coverage > 80% for `app/services` and `app/api`.
-   [ ] Idempotency logic is explicitly verified by a test case.

## Todo List
-   [ ] Setup `conftest.py` with DB and Async Client fixtures
-   [ ] Implement Ledger Logic Tests
-   [ ] Implement Stripe Mock Fixtures
-   [ ] Write Payment Flow Integration Tests
-   [ ] Write Webhook Idempotency Tests
