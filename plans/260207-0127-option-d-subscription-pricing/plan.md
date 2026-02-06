# Plan: Option D - Single Monthly Subscription Pricing

**Status:** ✅ COMPLETE (2026-02-07)

## Goal

Switch Sophia AI Factory from a complex bundle model to a single all-in monthly subscription model (12-month commitment).

## Products (Polar.sh)

- **Starter**: $199/mo (ID: `ae84ec93-dd5d-456d-9e32-ee24e13bd16d`)
- **Growth**: $399/mo (ID: `10319b56-d854-495c-9811-b5a3e111d765`)
- **Premium**: $799/mo (ID: `38a1bd1b-01db-4a35-8e95-72462580d7d5`)

## Proposed Changes

### 1. Update Configuration

#### [MODIFY] src/config/polar-config.ts

- Replace existing pricing constants with new Option D values and IDs.
- Simplify state management (only 1 product ID per tier).

### 2. Update Pricing UI

#### [MODIFY] src/components/pricing-section.tsx

- Update labels to show "$199/mo", "$399/mo", "$799/mo".
- Add "12-month commitment" badge/disclaimer.
- Update checkout button logic to point directly to the single product ID.

## Verification

- Run `npm run build` to ensure no breaking changes in types.
- Visual confirmation of pricing tiers.
- Test checkout redirect for one tier.
