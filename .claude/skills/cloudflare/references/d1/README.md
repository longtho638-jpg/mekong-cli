# Cloudflare D1 Reference

## Overview

D1 is Cloudflare's serverless SQLite database with automatic global replication.

**Use When:**

- Need SQL queries and transactions
- Relational data with joins
- Complex filtering and aggregation
- ACID compliance required

**Don't Use When:**

- Simple key-value lookups → Use KV
- Large files → Use R2
- High write throughput → Consider external DB

## Quick Start

```bash
# Create database
wrangler d1 create my-db

# Run SQL directly
wrangler d1 execute my-db --command="CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT)"

# Run from file
wrangler d1 execute my-db --file=./schema.sql

# Local development
wrangler d1 execute my-db --local --file=./schema.sql
```

## Configuration

```toml
# wrangler.toml
[[d1_databases]]
binding = "DB"
database_name = "my-db"
database_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
```

## API Reference

### Basic Queries

```javascript
// SELECT
const { results } = await env.DB.prepare("SELECT * FROM users WHERE id = ?")
    .bind(userId)
    .all();

// Single row
const user = await env.DB.prepare("SELECT * FROM users WHERE id = ?")
    .bind(userId)
    .first();

// INSERT
const result = await env.DB.prepare(
    "INSERT INTO users (name, email) VALUES (?, ?)",
)
    .bind(name, email)
    .run();
// result.meta.last_row_id

// UPDATE
await env.DB.prepare("UPDATE users SET name = ? WHERE id = ?")
    .bind(newName, userId)
    .run();

// DELETE
await env.DB.prepare("DELETE FROM users WHERE id = ?").bind(userId).run();
```

### Batch Operations

```javascript
// Multiple statements in one round-trip
const results = await env.DB.batch([
    env.DB.prepare("INSERT INTO users (name) VALUES (?)").bind("Alice"),
    env.DB.prepare("INSERT INTO users (name) VALUES (?)").bind("Bob"),
    env.DB.prepare("SELECT * FROM users"),
]);
```

### Raw SQL

```javascript
// For complex queries
const { results } = await env.DB.exec(`
  CREATE TABLE IF NOT EXISTS logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    message TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);
```

## Migrations

### File-based Migrations

```
migrations/
├── 0001_create_users.sql
├── 0002_add_email.sql
└── 0003_create_posts.sql
```

```sql
-- 0001_create_users.sql
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 0002_add_email.sql
ALTER TABLE users ADD COLUMN email TEXT;
CREATE UNIQUE INDEX idx_users_email ON users(email);
```

```bash
# Apply migrations
wrangler d1 migrations apply my-db

# Apply to local
wrangler d1 migrations apply my-db --local
```

## Patterns

### Repository Pattern

```javascript
class UserRepository {
    constructor(db) {
        this.db = db;
    }

    async findById(id) {
        return this.db
            .prepare("SELECT * FROM users WHERE id = ?")
            .bind(id)
            .first();
    }

    async findByEmail(email) {
        return this.db
            .prepare("SELECT * FROM users WHERE email = ?")
            .bind(email)
            .first();
    }

    async create({ name, email }) {
        const result = await this.db
            .prepare("INSERT INTO users (name, email) VALUES (?, ?)")
            .bind(name, email)
            .run();
        return { id: result.meta.last_row_id, name, email };
    }

    async update(id, { name, email }) {
        await this.db
            .prepare("UPDATE users SET name = ?, email = ? WHERE id = ?")
            .bind(name, email, id)
            .run();
    }
}
```

### Pagination

```javascript
async function getPaginatedUsers(db, page = 1, limit = 10) {
    const offset = (page - 1) * limit;

    const [{ count }] = await db
        .prepare("SELECT COUNT(*) as count FROM users")
        .all()
        .then((r) => r.results);

    const { results } = await db
        .prepare(
            `
    SELECT * FROM users 
    ORDER BY created_at DESC 
    LIMIT ? OFFSET ?
  `,
        )
        .bind(limit, offset)
        .all();

    return {
        data: results,
        pagination: {
            page,
            limit,
            total: count,
            pages: Math.ceil(count / limit),
        },
    };
}
```

## Gotchas

1. **Read Replicas**: Reads may be slightly stale (eventual consistency). Use `.first()` for consistency-critical reads.

2. **Row Size**: Max 1MB per row. Store large data in R2.

3. **Database Size**: 10GB limit per database.

4. **Concurrent Writes**: SQLite single-writer. Batch writes when possible.

5. **No JOINs in Free Tier**: Complex queries may be slower. Denormalize if needed.

6. **Local vs Production**: Local uses real SQLite; production has D1-specific behavior. Test in production environment.
