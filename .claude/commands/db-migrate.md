---
description: 🗄️ DB Migrate — Database Migrations (Prisma, Rails, Flyway)
argument-hint: [up|down|reset|status]
---

**Think harder** để db migrate: <$ARGUMENTS>

**IMPORTANT:** Migrations PHẢI version-controlled — reversible, tested.

## Prisma Migrate

```bash
# === Create Migration ===
npx prisma migrate dev --name add_user_table

# === Apply Migrations ===
npx prisma migrate deploy

# === Reset Database ===
npx prisma migrate reset

# === View Status ===
npx prisma migrate status

# === Resolve Migration Issues ===
npx prisma migrate resolve --applied "20240101000000_migration"

# === Generate Client ===
npx prisma generate
```

## Rails ActiveRecord

```bash
# === Generate Migration ===
rails generate migration AddEmailToUsers email:string

# === Run Migrations ===
rails db:migrate

# === Rollback ===
rails db:rollback

# === Rollback Multiple ===
rails db:rollback STEP=3

# === Reset Database ===
rails db:drop db:create db:migrate

# === Seed Database ===
rails db:seed

# === View Status ===
rails db:migrate:status
```

## Flyway

```bash
# === Migrate ===
flyway migrate

# === Clean ===
flyway clean

# === Repair ===
flyway repair

# === Validate ===
flyway validate

# === Info ===
flyway info
```

## Migration Template

```sql
-- YYYYMMDDHHMMSS_add_user_table.sql

-- Up
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);

-- Down
DROP TABLE IF EXISTS users;
```

## CI/CD Integration

```yaml
# .github/workflows/db-migrate.yml
name: Database Migrations

on:
  push:
    paths:
      - 'prisma/migrations/**'

jobs:
  migrate:
    runs-on: ubuntu-latest
    environment: production

    steps:
    - uses: actions/checkout@v4

    - name: Run Migrations
      run: npx prisma migrate deploy
      env:
        DATABASE_URL: ${{ secrets.DATABASE_URL }}
```

## Related Commands

- `/db-seed` — Seed database
- `/db-backup` — Database backup
- `/deploy` — Deploy project
