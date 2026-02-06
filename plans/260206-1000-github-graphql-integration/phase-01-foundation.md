# Phase 1: Foundation & Authentication

**Status:** COMPLETE
**Priority:** High
**Context:** Establishing the connection to GitHub GraphQL API for the Project Management integration.

## Context Links
- Master Plan: `plans/260206-1000-github-graphql-integration/plan.md`
- Target Package: `packages/vibe-dev`

## Overview
This phase focuses on setting up the basic infrastructure to communicate with GitHub. We will create a `GitHubClient` class that wraps the GraphQL requests, handling authentication via the existing `gh` CLI credentials or a PAT.

## Requirements
- Use native `fetch` (Node 18+) to avoid extra dependencies if possible, or `graphql-request` if complex.
- Authenticate using `gh auth token` (via child_process) or `GITHUB_TOKEN` env var.
- Define `GitHubClient` interface.
- Implement `testConnection` method.

## Architecture
- `packages/vibe-dev/src/lib/github-client.ts`: Main client class.
- `packages/vibe-dev/src/types/github.types.ts`: TypeScript definitions for GraphQL responses.

## Implementation Steps
1.  [ ] Initialize `packages/vibe-dev` structure if needed (tsconfig, src dir).
2.  [ ] Create `GitHubClient` class in `packages/vibe-dev/src/lib/github-client.ts`.
3.  [ ] Implement authentication logic:
    -   Check `GITHUB_TOKEN` env var.
    -   If missing, try `gh auth token` via `execSync`.
4.  [ ] Implement `graphql<T>(query: string, variables?: object): Promise<T>` method.
    -   Handle 200 OK but `errors` in body.
    -   Handle 4xx/5xx network errors.
5.  [ ] Add a simple `getViewer` method to verify connection.
6.  [ ] Write a standalone test script `packages/vibe-dev/scripts/test-github-connection.ts` to validate.

## Verification
- Run the test script: `npx tsx packages/vibe-dev/scripts/test-github-connection.ts`
- Expected output: `Connected to GitHub as: <username>`
