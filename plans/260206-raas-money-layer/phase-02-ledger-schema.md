---
title: "Phase 2: Ledger Schema Design"
description: "DB Schema Design for Users, Wallets, and Transactions."
status: pending
priority: P1
effort: 1d
branch: feat/money-layer
tags: [schema, sqlalchemy, alembic, ledger]
created: 2026-02-06
---

# Phase 2: Ledger Schema Design

## Context
The core of the Money Layer is the "Ledger". We must ensure that every credit movement is recorded as a transaction. Balances should be calculable by summing transactions, though we may cache the current balance on the Wallet model for read performance.

## Architecture
-   **Pattern:** Service-Repository
-   **ORM:** SQLAlchemy 2.0 (Async)
-   **Validation:** Pydantic v2 Models (DTOs)

## Schema Definition

### 1. Users Table (`users`)
*Note: If sharing DB with Engine, this might already exist. We will assume we need a representation here.*
-   `id`: UUID (Primary Key)
-   `email`: String (Unique, Indexed)
-   `external_id`: String (Optional, for linking to Engine/Auth provider)
-   `stripe_customer_id`: String (Optional, Indexed)
-   `created_at`: DateTime

### 2. Wallets Table (`wallets`)
-   `id`: UUID (Primary Key)
-   `user_id`: UUID (ForeignKey -> users.id, Unique)
-   `balance`: Integer (Cached balance, default 0)
-   `currency`: String (default "CREDITS")
-   `created_at`: DateTime
-   `updated_at`: DateTime

### 3. Credit Packs (`credit_packs`)
-   `id`: UUID (Primary Key)
-   `name`: String (e.g., "Starter Pack")
-   `slug`: String (Unique, e.g., "starter-500")
-   `credit_amount`: Integer (e.g., 500)
-   `price_cents`: Integer (e.g., 1000 = $10.00)
-   `stripe_price_id`: String (Optional, if mapping strictly to Stripe Products)
-   `is_active`: Boolean

### 4. Transactions Table (`transactions`)
-   `id`: UUID (Primary Key)
-   `wallet_id`: UUID (ForeignKey -> wallets.id, Indexed)
-   `amount`: Integer (Positive for deposit, Negative for usage)
-   `type`: Enum (DEPOSIT, USAGE, REFUND, BONUS)
-   `status`: Enum (PENDING, COMPLETED, FAILED)
-   `reference_id`: String (Unique Index - Critical for Idempotency. e.g., Stripe Session ID)
-   `description`: String
-   `meta_data`: JSONB (Optional context)
-   `created_at`: DateTime

## Implementation Steps

1.  **Create Domain Models**
    -   Define SQLAlchemy models in `app/models/`.
    -   Use `Mapped` and `mapped_column` syntax (SQLAlchemy 2.0).

2.  **Create Repositories**
    -   `app/repositories/user_repo.py`: CRUD for Users.
    -   `app/repositories/wallet_repo.py`: methods to `get_by_user`, `create`, `update_balance`.
    -   `app/repositories/transaction_repo.py`: `create_transaction` (atomic).

3.  **Atomic Ledger Logic**
    -   Implement a service method `LedgerService.record_transaction(...)` that:
        1.  Starts a DB transaction.
        2.  Inserts `Transaction` record.
        3.  Updates `Wallet.balance = Wallet.balance + amount`.
        4.  Commits.

4.  **Alembic Migrations**
    -   Run `alembic revision --autogenerate -m "initial_ledger_schema"`
    -   Review and apply migration.

5.  **Seed Data**
    -   Create a script to seed default `CreditPacks`.

## Success Criteria
-   [ ] Schema applied to Postgres successfully.
-   [ ] `users` and `wallets` have 1:1 relationship enforced.
-   [ ] `transactions.reference_id` has a Unique constraint.
-   [ ] Basic repository methods work (tested manually or via script).

## Todo List
-   [ ] Define `User` and `Wallet` models
-   [ ] Define `CreditPack` and `Transaction` models
-   [ ] Implement Repository Layer
-   [ ] Implement `LedgerService` with atomic updates
-   [ ] Generate and Apply Migrations
-   [ ] Create Seed Script for Credit Packs
