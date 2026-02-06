# Phase 4: Write Operations (Sync Up)

**Status:** COMPLETE
**Priority:** High
**Context:** Implementing the logic to push local changes to GitHub Projects V2.

## Context Links
- Master Plan: `plans/260206-1000-github-graphql-integration/plan.md`
- Project Service: `packages/vibe-dev/src/lib/project-service.ts`

## Overview
This phase handles the "Sync Up" capability. We need to perform GraphQL mutations to:
1.  Add items (Issues/Drafts) to a Project V2.
2.  Update field values (Status, Priority, etc.) for existing items.

## Requirements
-   Add existing Issue/Draft to Project by ID.
-   Update field values by Item ID and Field ID.
-   Handle type conversions (TaskStatus -> Option ID).
-   Efficiently lookup Field IDs (cache them from the initial fetch).

## Architecture
-   `packages/vibe-dev/src/queries/mutation.queries.ts`: GraphQL mutation strings.
-   `packages/vibe-dev/src/lib/project-service.ts`: Add `updateTaskField` and `addTaskToProject` methods.

## Implementation Steps
1.  [ ] Define Mutations in `packages/vibe-dev/src/queries/mutation.queries.ts`.
    -   `ADD_PROJECT_V2_ITEM_BY_ID`
    -   `UPDATE_PROJECT_V2_ITEM_FIELD_VALUE`
2.  [ ] Extend `ProjectService` in `packages/vibe-dev/src/lib/project-service.ts`.
    -   `updateItemField(projectId: string, itemId: string, fieldId: string, value: any)`
    -   `addItemToProject(projectId: string, contentId: string)`
    -   Helper: `resolveOptionId(field: ProjectV2Field, value: string)`
3.  [ ] Implement logic to map local `TaskStatus` ('pending', 'active') to remote Option IDs.
4.  [ ] Write verification script `packages/vibe-dev/scripts/test-sync-up.ts`.

## Verification
-   Run mock test to verify the mutation construction and logic.
