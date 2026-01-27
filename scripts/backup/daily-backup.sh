#!/bin/bash
set -e

# Configuration
BACKUP_DIR="/tmp/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
S3_BUCKET="agencyos-backups-primary-us-east-1"
ENCRYPTION_KEY=${BACKUP_ENCRYPTION_KEY}

mkdir -p $BACKUP_DIR

echo "Starting Daily Full Backup at $TIMESTAMP"

# 1. PostgreSQL Backup
echo "Backing up PostgreSQL..."
PG_FILE="$BACKUP_DIR/pg_full_$TIMESTAMP.sql.gz.enc"
pg_dump --format=custom --no-password "$POSTGRES_URL" | \
gzip -9 | \
openssl enc -aes-256-cbc -salt -pbkdf2 -pass pass:"$ENCRYPTION_KEY" -out "$PG_FILE"

# 2. Redis Backup
echo "Backing up Redis..."
REDIS_FILE="$BACKUP_DIR/redis_full_$TIMESTAMP.rdb.gz.enc"
redis-cli --rdb - | \
gzip -9 | \
openssl enc -aes-256-cbc -salt -pbkdf2 -pass pass:"$ENCRYPTION_KEY" -out "$REDIS_FILE"

# 3. Upload to S3
echo "Uploading to S3..."
aws s3 cp "$PG_FILE" "s3://$S3_BUCKET/daily/$TIMESTAMP/"
aws s3 cp "$REDIS_FILE" "s3://$S3_BUCKET/daily/$TIMESTAMP/"

# 4. Cleanup
rm "$PG_FILE" "$REDIS_FILE"

echo "Backup Completed Successfully"
