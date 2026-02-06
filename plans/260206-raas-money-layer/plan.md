---
title: "Phase 2: Money Layer Integration"
description: "Implementation of the Python/FastAPI monetization service with Stripe and Double-Entry Ledger."
status: completed
priority: P1
effort: 5 days
branch: feat/money-layer
tags: [python, fastapi, stripe, ledger, postgres]
created: 2026-02-06
completed: 2026-02-06
---

# Phase 2: Money Layer Integration

## Overview
This phase focuses on building the "Money Layer" for the AgencyOS RaaS platform. We will implement a dedicated Python/FastAPI service responsible for handling monetization via Stripe (purchasing credits) and maintaining a strict double-entry ledger for user balances.

## Goals
1.  Establish a robust Python microservice environment (`apps/api`).
2.  Implement a Double-Entry Ledger system to track user credits accurately.
3.  Integrate Stripe for "Credit Pack" purchases (Checkout & Webhooks).
4.  Ensure financial data consistency and security (Idempotency, Signatures).

## Phases

### [Phase 1: Scaffold FastAPI Service](./phase-01-scaffold-fastapi.md)
**Status:** Completed
**Goal:** Initialize the Python environment, FastAPI application structure, Docker containerization, and database connectivity.

### [Phase 2: Ledger Schema Design](./phase-02-ledger-schema.md)
**Status:** Completed
**Goal:** Design and implement the SQLAlchemy ORM models and Alembic migrations for the financial core (Wallets, Transactions, CreditPacks).

### [Phase 3: Stripe Integration](./phase-03-stripe-integration.md)
**Status:** Completed
**Goal:** Implement the Stripe payment flow, including Checkout Session creation and secure Webhook processing for ledger updates.

### [Phase 4: Integration Testing](./phase-04-integration-testing.md)
**Status:** Completed
**Goal:** Verify the system with a comprehensive Pytest suite, focusing on ledger consistency and payment flow edge cases.

## Key Dependencies
-   **Python 3.11+**
-   **FastAPI / Uvicorn**
-   **PostgreSQL** (Shared with Engine or dedicated)
-   **Stripe API**
-   **Redis** (Optional, for locking if needed later)

## Risks & Mitigations
-   **Risk:** Double-spending or double-crediting via Webhook retries.
    -   *Mitigation:* Strict idempotency checks on `stripe_session_id` in the `transactions` table.
-   **Risk:** Floating point errors in currency/credit calculations.
    -   *Mitigation:* Use integer math for credits and cents for currency.
-   **Risk:** Schema drift between Python API and Engine.
    -   *Mitigation:* Clear ownership of tables. `users` table treated as read-only or loosely coupled via `external_id` if managed by Engine.
