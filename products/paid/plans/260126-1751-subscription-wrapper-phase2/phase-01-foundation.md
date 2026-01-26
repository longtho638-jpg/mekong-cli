# Phase 01: Foundation & Setup

## Overview
Establish the project structure, install dependencies, and define base interfaces for the Subscription Wrapper.

## Objectives
- Create directory structure.
- Initialize `package.json` and install core dependencies.
- Define `BillingAdapter` interface.
- Define `LicenseManager` base class.

## Implementation Steps
1.  **Directory Structure**:
    ```bash
    mkdir -p subscription-wrapper/{billing,licensing,updates,portal,tests}
    ```
2.  **Dependencies**:
    - `stripe`, `paddle-sdk` (mock/wrapper)
    - `axios`, `zod` (validation)
    - `react`, `lucide-react` (for portal)
    - `fastapi`, `uvicorn` (for activation server - python)
3.  **Base Interfaces**:
    - `IBillingAdapter`: `createSubscription`, `cancelSubscription`, `getInvoice`.
    - `ILicenseKey`: Structure of the license key (TenantID + Timestamp + Checksum).

## Deliverables
- [ ] Project scaffolded.
- [ ] `tsconfig.json` and `pyproject.toml` configured.
- [ ] Base interfaces defined in `shared/types.ts`.
- [ ] Env validation setup (`zod` schema for keys).
