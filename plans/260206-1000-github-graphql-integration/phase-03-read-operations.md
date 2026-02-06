# Phase 3: Read Operations (Sync Down)

**Status:** COMPLETE
**Priority:** High
**Context:** Implementing the logic to fetch project items from GitHub and map them to the local data model.

## Context Links
- Master Plan: `plans/260206-1000-github-graphql-integration/plan.md`
- Data Models: `packages/vibe-dev/src/types/task.types.ts`
- GitHub Client: `packages/vibe-dev/src/lib/github-client.ts`

## Overview
This phase focuses on the "Sync Down" capability. We need to query GitHub's GraphQL API to retrieve items from a specific Project V2. We will handle pagination (fetching 100 items at a time) and map the raw GraphQL nodes into our `Epic` and `Task` domain objects.

## Requirements
-   Fetch Project V2 by number (within user or org).
-   Fetch Project V2 Items (Issues/Drafts) with field values.
-   Handle pagination for large projects.
-   Map "Status" and "Priority" fields from Project V2 to local types.
-   Identify "Epics" vs "Tasks" (likely based on a Label or specific View, but for now we'll assume a "Type" field or Label).

## Architecture
-   `packages/vibe-dev/src/lib/project-service.ts`: Domain service for project operations.
-   `packages/vibe-dev/src/queries/project.queries.ts`: GraphQL query strings.

## Implementation Steps
1.  [ ] Define GraphQL Queries in `packages/vibe-dev/src/queries/project.queries.ts`.
    -   `GET_PROJECT_V2_BY_NUMBER`: Fetch project ID and fields configuration.
    -   `GET_PROJECT_V2_ITEMS`: Fetch items with pagination and field values.
2.  [ ] Implement `ProjectService` in `packages/vibe-dev/src/lib/project-service.ts`.
    -   `fetchProjectItems(owner: string, projectNumber: number, isOrg: boolean)`
    -   Helper: `mapProjectItemToTask(node: any, fieldMap: any)`
3.  [ ] Handle Field Mapping.
    -   Dynamically resolve field IDs (e.g., "Status" might have ID `PVT_kw...`).
    -   Map option IDs to string values (e.g., "Todo" -> `pending`).
4.  [ ] Write a verification script `packages/vibe-dev/scripts/test-sync-down.ts`.

## Verification
-   Run the script to fetch a real project (if available) or mock the response.
-   Verify that raw GraphQL nodes are correctly transformed into `Task` objects.
