---
description: 💾 DB Backup — Database Backup, Restore, Point-in-Time Recovery
argument-hint: [--output=backup.sql] [--database=main]
---

**Think harder** để db backup: <$ARGUMENTS>

**IMPORTANT:** Backup PHẢI tự động daily — off-site, encrypted, tested restore.

## PostgreSQL Backup

```bash
# === Full Backup ===
pg_dump -h localhost -U postgres app_production > backup.sql

# === Compressed Backup ===
pg_dump -h localhost -U postgres app_production | gzip > backup.sql.gz

# === Custom Format (for restore flexibility) ===
pg_dump -h localhost -U postgres -Fc app_production > backup.dump

# === Schema Only ===
pg_dump -h localhost -U postgres --schema-only app_production > schema.sql

# === Data Only ===
pg_dump -h localhost -U postgres --data-only app_production > data.sql

# === Specific Tables ===
pg_dump -h localhost -U postgres -t users -t orders app_production > tables.sql

# === Restore ===
psql -h localhost -U postgres app_production < backup.sql

# === Restore Custom Format ===
pg_restore -h localhost -U postgres -d app_production backup.dump
```

## MySQL Backup

```bash
# === Full Backup ===
mysqldump -u root -p app_production > backup.sql

# === Compressed ===
mysqldump -u root -p app_production | gzip > backup.sql.gz

# === Restore ===
mysql -u root -p app_production < backup.sql
```

## Automated Backups

```bash
#!/bin/bash
# scripts/backup-db.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups/postgres"
DB_NAME="app_production"
DB_USER="postgres"

# Create backup
pg_dump -h localhost -U $DB_NAME $DB_NAME | gzip > $BACKUP_DIR/${DB_NAME}_${DATE}.sql.gz

# Delete backups older than 30 days
find $BACKUP_DIR -name "*.sql.gz" -mtime +30 -delete

# Upload to S3 (optional)
aws s3 cp $BACKUP_DIR/${DB_NAME}_${DATE}.sql.gz s3://backets-bucket/backups/

echo "✅ Backup completed: ${DB_NAME}_${DATE}.sql.gz"
```

## Point-in-Time Recovery

```sql
-- Enable WAL archiving
ALTER SYSTEM SET wal_level = replica;
ALTER SYSTEM SET archive_mode = on;
ALTER SYSTEM SET archive_command = 'cp %p /wal_archive/%f';
SELECT pg_reload_conf();

-- Restore to specific point
-- 1. Stop PostgreSQL
-- 2. Restore base backup
-- 3. Create recovery.signal
-- 4. Configure recovery_target_time
-- 5. Start PostgreSQL
```

## CI/CD Backup

```yaml
# .github/workflows/backup-db.yml
name: Database Backup

on:
  schedule:
    - cron: '0 2 * * *'  # Daily at 2 AM

jobs:
  backup:
    runs-on: ubuntu-latest

    steps:
    - uses: actions/checkout@v4

    - name: Backup Database
      run: |
        pg_dump -h ${{ secrets.DB_HOST }} -U ${{ secrets.DB_USER }} ${{ secrets.DB_NAME }} \
          | gzip > backup_$(date +%Y%m%d).sql.gz

    - name: Upload to S3
      run: aws s3 cp backup_*.sql.gz s3://${{ secrets.S3_BUCKET }}/backups/
```

## Backup Verification

```bash
# === Verify Backup ===
gunzip -c backup.sql.gz | head -100

# === Test Restore (staging) ===
gunzip -c backup.sql.gz | psql -h staging-db -U staging_user app_staging

# === Check Size ===
ls -lh backup.sql.gz
```

## Related Commands

- `/db-migrate` — Database migrations
- `/db-seed` — Database seeding
- `/environment-sync` — Environment sync
