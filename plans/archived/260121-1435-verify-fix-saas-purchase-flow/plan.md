# Plan: Verify and Fix SaaS Purchase Flow

## Context
The user wants to verify and fix the SaaS purchase flow, specifically standardizing webhook routing. The tests have already passed, providing a good baseline.

## Goals
1.  Verify SaaS purchase flow.
2.  Standardize webhook routing.
3.  Push fixes with `--no-verify`.

## Analysis
-   **Current State:** Tests passed.
-   **Task:** Standardize webhook routing. This suggests there might be multiple or inconsistent ways webhooks are handled currently.

## Steps
1.  **Explore:** Find all webhook related files in `backend/`.
2.  **Analyze:** Understand the current routing and identify inconsistencies.
3.  **Refactor:** Standardize the routing mechanism.
4.  **Verify:** Run tests again to ensure no regression.
5.  **Commit:** Push changes with `--no-verify`.

## Files to Modify
-   Likely `backend/api/routes/webhooks.py` or similar.
-   `backend/core/payment/` or similar.

## Detailed Plan
-   [ ] Search for webhook handlers.
-   [ ] Check `backend/main.py` or `backend/api/router.py` for route definitions.
-   [ ] Refactor to a unified webhook router if needed.
-   [ ] Verify with `pytest`.
-   [ ] Commit and push.
