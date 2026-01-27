#!/bin/bash
set -e

# Configuration
BACKUP_DIR="/tmp/backups_inc"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
S3_BUCKET="agencyos-backups-primary-us-east-1"

mkdir -p $BACKUP_DIR

# For Postgres, real incremental backups require WAL archiving (continuous).
# This script simulates a frequent "light" backup or checks WAL status.
# For this IPO readiness task, we will just do a schema dump or critical table dump
# if we aren't setting up full WAL shipping here (which is infra level).
# Alternatively, if this is Supabase, we rely on their PITR, but we want an offsite copy.

# Strategy: Periodic frequent dump of critical "orders" / "transactions" tables.

echo "Starting Incremental Backup at $TIMESTAMP"

TABLES_TO_BACKUP="-t public.orders -t public.invoices -t public.users"
INC_FILE="$BACKUP_DIR/pg_inc_$TIMESTAMP.sql.gz"

pg_dump --data-only $TABLES_TO_BACKUP "$POSTGRES_URL" | gzip -9 > "$INC_FILE"

aws s3 cp "$INC_FILE" "s3://$S3_BUCKET/incremental/$TIMESTAMP/"

rm "$INC_FILE"
