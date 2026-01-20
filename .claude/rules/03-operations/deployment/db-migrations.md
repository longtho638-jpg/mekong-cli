# Database Migration Standards

Guidelines for managing database schema changes.

## Rules
- All database changes must be managed via migration scripts (e.g., Alembic, Flyway, Knex).
- Migrations must be version-controlled and applied sequentially.
- Schema changes must be backwards-compatible (additive) to support zero-downtime deployments.
- Never delete or rename columns in a single step; use a multi-phase approach (Add -> Migrate Data -> Deprecate -> Remove).
- Test migrations against a production-sized data set in staging to verify performance and timing.
- Always perform a database backup before applying migrations in production.
- Include a "down" or "rollback" script for every migration when feasible.
