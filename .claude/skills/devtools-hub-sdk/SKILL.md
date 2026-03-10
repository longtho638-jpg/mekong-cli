---
name: devtools-hub-sdk
description: Unified developer tools SDK — Supabase helpers, dev workflow, scaffolding, environment management. Use for developer tooling and database utilities.
license: MIT
version: 1.0.0
---

# DevTools Hub SDK Skill

Build developer tools with unified Supabase helpers and workflow management facades.

## When to Use

- Supabase typed query helpers
- Org-scoped CRUD operations
- Dev environment management
- Project scaffolding and templates
- Database subscription helpers

## SDK Architecture

| Sub-path | Facade | Domain |
|----------|--------|--------|
| `@agencyos/devtools-hub-sdk/supabase` | SupabaseFacade | Typed queries, org-scoped CRUD |
| `@agencyos/devtools-hub-sdk/workflow` | WorkflowFacade | Scaffolding, environments |

## Underlying Packages

| Package | Purpose |
|---------|---------|
| `@agencyos/vibe-supabase` | Supabase helpers |
| `@agencyos/vibe-dev` | Dev workflow |
