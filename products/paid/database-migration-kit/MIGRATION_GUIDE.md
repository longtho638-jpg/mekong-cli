# Migration Guide

## Creating Migrations

### Manual Creation
To create a new empty migration file:

```bash
dmk create add_users_table
```

This generates a file in `migrations/YYYYMMDDHHMMSS_add_users_table.py`.

Edit the `up` and `down` functions:

```python
from sqlalchemy import text

def up(connection):
    connection.execute(text("""
        CREATE TABLE users (
            id SERIAL PRIMARY KEY,
            username VARCHAR(50) NOT NULL,
            email VARCHAR(100) UNIQUE NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """))

def down(connection):
    connection.execute(text("DROP TABLE users"))
```

### Auto-Generation (Schema Diff)
If you have SQLAlchemy models defined, `dmk` can detect changes.

1. Configure `model_metadata` in `dmk.toml`.
   ```toml
   model_metadata = "my_app.models:Base.metadata"
   ```
2. Run diff command:
   ```bash
   dmk diff
   ```

## Running Migrations
To apply all pending migrations:

```bash
dmk migrate
```

## Checking Status
To see which migrations have been applied:

```bash
dmk status
```

To see a history with timestamps:

```bash
dmk history
```

## Seeding Data
Place seed scripts in `seeds/`. A seed script must have a `run(connection)` function.

```python
# seeds/01_basic_users.py
from sqlalchemy import text

def run(connection):
    connection.execute(text("INSERT INTO users (username, email) VALUES ('admin', 'admin@example.com')"))
```

Run seeds:

```bash
dmk seed
```
