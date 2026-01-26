# Phase 03: Licensing System

## Overview
Core security module for generating, validating, and managing license keys.

## Objectives
- Implement `KeyGenerator` with strong checksums.
- Build `ActivationServer` (FastAPI).
- Implement `SeatManager` for seat tracking.

## Implementation Steps
1.  **Key Generator** (`licensing/key-generator.ts`):
    - Format: `AGY-{TENANT}-{DATE}-{CHECKSUM}`.
    - Logic: SHA-256 hash of secrets + metadata.
2.  **Activation Server** (`licensing/activation-server.ts` - Python/FastAPI):
    - Endpoint: `POST /v1/activate`.
    - Logic:
        1. Parse License Key.
        2. Verify Checksum.
        3. Check Billing Status (via Billing Module).
        4. Check Seat Count (via Redis/DB).
        5. Return `access_token` or error.
3.  **Seat Manager** (`licensing/seat-manager.ts`):
    - Logic to increment/decrement active seats per license.
    - "Heartbeat" check to keep sessions alive.

## Deliverables
- [ ] Key generation logic (TypeScript).
- [ ] Activation API (FastAPI).
- [ ] Seat management logic.
- [ ] Security audit (self-check) of key generation.
