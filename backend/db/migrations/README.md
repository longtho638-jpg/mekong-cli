# Database Migration Scripts

This directory contains PostgreSQL migration scripts for the SaaS backend database.

## Overview

The migrations are organized into logical groups:

1. **001_initial_schema.sql** - Core tables (users, licenses, teams, subscriptions, payments)
2. **002_affiliates.sql** - Affiliate system (affiliates, referrals, commissions, payouts)
3. **003_analytics.sql** - Analytics system (usage events, aggregates, feature usage, API tracking, audit logs)

## Prerequisites

- PostgreSQL 14+ (for UUID, JSONB, and advanced features)
- Database user with CREATE privileges
- Environment variables configured (see below)

## Environment Variables

Create a `.env` file in the project root or set these in your environment:

```bash
# PostgreSQL connection
DATABASE_URL="postgresql://username:password@localhost:5432/database_name"

# Or individual components
DB_HOST=localhost
DB_PORT=5432
DB_NAME=saas_db
DB_USER=postgres
DB_PASSWORD=yourpassword
DB_SCHEMA=public
```

## Running Migrations

### Option 1: Using psql (Command Line)

Run migrations in order:

```bash
# Set environment variable
export DATABASE_URL="postgresql://username:password@localhost:5432/database_name"

# Run migrations
psql $DATABASE_URL -f backend/db/migrations/001_initial_schema.sql
psql $DATABASE_URL -f backend/db/migrations/002_affiliates.sql
psql $DATABASE_URL -f backend/db/migrations/003_analytics.sql
```

### Option 2: Using Python Script

Create a migration runner script:

```python
# backend/db/run_migrations.py
import os
import psycopg2
from pathlib import Path

def run_migrations():
    # Get database URL from environment
    database_url = os.getenv('DATABASE_URL')
    if not database_url:
        raise ValueError("DATABASE_URL not set")

    # Connect to database
    conn = psycopg2.connect(database_url)
    conn.autocommit = True
    cursor = conn.cursor()

    # Migration files in order
    migrations_dir = Path(__file__).parent / 'migrations'
    migration_files = [
        '001_initial_schema.sql',
        '002_affiliates.sql',
        '003_analytics.sql'
    ]

    # Run each migration
    for filename in migration_files:
        filepath = migrations_dir / filename
        print(f"Running {filename}...")

        with open(filepath, 'r') as f:
            sql = f.read()
            cursor.execute(sql)

        print(f"✓ {filename} completed")

    cursor.close()
    conn.close()
    print("\n✓ All migrations completed successfully")

if __name__ == '__main__':
    run_migrations()
```

Run it:

```bash
python backend/db/run_migrations.py
```

### Option 3: Using Alembic (Recommended for Production)

Install Alembic:

```bash
pip install alembic psycopg2-binary
```

Initialize Alembic:

```bash
cd backend
alembic init alembic
```

Configure `alembic.ini` and create migration versions from the SQL files.

## Migration Details

### 001_initial_schema.sql

Creates core tables:
- `users` - User accounts with authentication
- `licenses` - Software licenses with seat management
- `teams` - Team/organization entities
- `team_members` - Team membership junction table
- `subscriptions` - Stripe subscription tracking
- `payment_transactions` - Payment history

**Key Features:**
- UUID primary keys
- Automatic `updated_at` triggers
- Check constraints for data validation
- Comprehensive indexes for performance
- Foreign key cascades for data integrity

### 002_affiliates.sql

Creates affiliate system tables:
- `affiliates` - Affiliate partner accounts
- `affiliate_referrals` - Referral tracking
- `affiliate_commissions` - Commission records
- `affiliate_payouts` - Payout batches
- `affiliate_clicks` - Click-through tracking

**Key Features:**
- Automated stats updates via triggers
- Commission calculation and tracking
- Multi-status workflow support
- UTM parameter tracking

### 003_analytics.sql

Creates analytics and tracking tables:
- `usage_events` - High-volume event tracking
- `usage_aggregates_daily` - Daily usage summaries
- `usage_aggregates_monthly` - Monthly trends
- `feature_usage` - Feature adoption metrics
- `api_usage` - API performance tracking
- `error_logs` - Application error tracking
- `audit_logs` - Security audit trail

**Key Features:**
- Aggregation functions for reporting
- Event categorization system
- Performance indexes for time-series queries
- Severity levels for error tracking

## Indexes

All tables include appropriate indexes for:
- Primary key lookups (UUID)
- Foreign key relationships
- Common filter columns (status, type, dates)
- Time-series queries (created_at, occurred_at)
- Full-text search candidates (where applicable)

## Triggers

The schema includes several triggers:
- `update_updated_at_column()` - Auto-update timestamps
- `update_affiliate_referral_stats()` - Keep affiliate stats current
- `update_affiliate_earnings()` - Update commission totals

## Data Validation

Tables use PostgreSQL CHECK constraints for:
- Status enums (only valid statuses allowed)
- Numeric ranges (positive amounts, valid percentages)
- Business rules (seats_used <= seats_total)
- Date logic (year/month validation)

## Rollback

To rollback migrations, drop the schema:

```sql
-- WARNING: This will delete all data
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
```

For production, use proper migration tools with version tracking.

## Testing Migrations

Test migrations in a clean database:

```bash
# Create test database
createdb saas_test

# Run migrations
export DATABASE_URL="postgresql://localhost/saas_test"
psql $DATABASE_URL -f backend/db/migrations/001_initial_schema.sql
psql $DATABASE_URL -f backend/db/migrations/002_affiliates.sql
psql $DATABASE_URL -f backend/db/migrations/003_analytics.sql

# Verify tables created
psql $DATABASE_URL -c "\dt"

# Drop test database
dropdb saas_test
```

## Performance Considerations

- **Partitioning**: For high-volume tables like `usage_events`, consider table partitioning by date
- **Archiving**: Implement archiving strategy for old events and logs
- **Materialized Views**: Consider materialized views for complex reporting queries
- **Connection Pooling**: Use pgBouncer or similar for connection management

## Security Notes

- Never commit `.env` files with credentials
- Use strong passwords for database users
- Enable SSL for production database connections
- Restrict database user permissions appropriately
- Enable PostgreSQL audit logging for compliance

## Maintenance

Regular maintenance tasks:

```sql
-- Analyze tables for query optimization
ANALYZE;

-- Vacuum to reclaim space
VACUUM;

-- Reindex for performance
REINDEX DATABASE saas_db;

-- Check table sizes
SELECT
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

## Support

For issues or questions:
- Check PostgreSQL logs: `tail -f /var/log/postgresql/postgresql-*.log`
- Verify connection: `psql $DATABASE_URL -c "SELECT version();"`
- Review table structure: `psql $DATABASE_URL -c "\d+ tablename"`
