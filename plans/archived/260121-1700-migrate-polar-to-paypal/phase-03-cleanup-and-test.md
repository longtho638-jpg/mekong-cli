# Phase 3: Cleanup & Test

> **Focus**: Removing technical debt and verifying the system.

## Context
With PayPal operational, the Polar code is now dead weight. It poses a maintenance risk and confuses the codebase structure.

## Requirements
1.  **Remove Polar**:
    -   Uninstall `@polar-sh/sdk`.
    -   Delete `POLAR_SETUP.md`.
    -   Delete `apps/web/app/api/create-checkout`.
    -   Delete `apps/web/app/api/get-license`.
    -   Delete `apps/dashboard/app/api/polar`.
    -   Delete `apps/docs/api/webhook/polar.ts`.
2.  **Testing**:
    -   Verify that no "Polar" references remain in active code paths.
    -   Test the "Buy" flow from start to finish.
    -   Test the "Cancel" flow (if implemented in frontend).

## Implementation Steps

1.  **Code Deletion**:
    -   Execute `rm` commands for the targeted files.
    -   Grep for "polar" to find stragglers.
2.  **Package Cleanup**:
    -   Run `pnpm remove @polar-sh/sdk` in relevant workspaces.
3.  **Database check**:
    -   (Optional) Migration to drop `polar_` columns if we are 100% sure we don't need history. *Decision: Keep columns for now for historical data, just deprecate usage.*
4.  **Final Verification**:
    -   Run the app `pnpm dev`.
    -   Attempt a purchase.
    -   Check logs.

## Files to Modify
-   `apps/web/package.json`
-   `apps/dashboard/package.json`
-   `apps/docs/package.json`
-   Many deletions.

## Success Criteria
-   [ ] Grep for "Polar" returns only historical data/migrations, no active code.
-   [ ] Build passes without errors.
-   [ ] Application runs and processes PayPal payments correctly.
