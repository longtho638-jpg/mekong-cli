# Rollback Guide

## Overview
Rollbacks are critical for recovering from failed deployments or bad migrations. The Database Migration Kit supports atomic rollbacks using database transactions.

## Standard Rollback
To undo the **last applied migration**:

```bash
dmk rollback
```

This will:
1. Identify the most recent migration ID.
2. Execute the `down()` function of that migration.
3. Remove the record from the `_dmk_migrations` table.
4. Commit the transaction.

## Rollback Multiple Steps
To rollback the last N migrations (e.g., 3 steps):

```bash
dmk rollback --steps 3
```

## Best Practices

### 1. Always Implement `down()`
Never leave the `down()` function empty. It should exactly reverse the `up()` function.

*   `CREATE TABLE` -> `DROP TABLE`
*   `ADD COLUMN` -> `DROP COLUMN`
*   `CREATE INDEX` -> `DROP INDEX`

### 2. Test Rollbacks locally
Before deploying, verify that you can migrate UP and then rollback DOWN without errors.

```bash
dmk migrate
dmk rollback
```

### 3. Handle Data Loss
Rolling back a `DROP COLUMN` or `DROP TABLE` usually results in data loss. Ensure you have backups before performing destructive rollbacks in production.

### 4. Transaction Safety
Most DDL (Data Definition Language) in PostgreSQL is transactional. In MySQL, DDL causes implicit commits, so rollbacks might not be fully atomic if an error occurs *during* the DDL execution. Plan accordingly.
