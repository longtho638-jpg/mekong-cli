#!/bin/bash
set -e

# Verification Script
# Usage: ./verify-backup.sh s3://bucket/path/to/backup.enc

BACKUP_URI=$1
TEMP_DIR=$(mktemp -d)
ENCRYPTION_KEY=${BACKUP_ENCRYPTION_KEY}

if [ -z "$BACKUP_URI" ]; then
    echo "Usage: $0 <s3-uri>"
    exit 1
fi

echo "Verifying backup: $BACKUP_URI"

# 1. Download
echo "Downloading..."
aws s3 cp "$BACKUP_URI" "$TEMP_DIR/backup.enc"

# 2. Decrypt & Decompress
echo "Decrypting and Decompressing..."
openssl enc -d -aes-256-cbc -salt -pbkdf2 -pass pass:"$ENCRYPTION_KEY" -in "$TEMP_DIR/backup.enc" | \
gzip -d > "$TEMP_DIR/backup.dump"

# 3. Verify Integrity
if [[ "$BACKUP_URI" == *"pg_"* ]]; then
    echo "Checking Postgres Dump Integrity..."
    if pg_restore --list "$TEMP_DIR/backup.dump" > /dev/null; then
        echo "✅ Verification Successful: Valid Custom Dump Format"
    else
        echo "❌ Verification Failed: Invalid Dump Format"
        rm -rf "$TEMP_DIR"
        exit 1
    fi
elif [[ "$BACKUP_URI" == *"redis_"* ]]; then
    echo "Checking Redis RDB Integrity..."
    if redis-check-rdb "$TEMP_DIR/backup.dump"; then
        echo "✅ Verification Successful: Valid RDB File"
    else
        echo "❌ Verification Failed: Invalid RDB File"
        rm -rf "$TEMP_DIR"
        exit 1
    fi
else
    echo "⚠️ Unknown backup type. Skipping specific integrity check."
    echo "File decrypted successfully."
fi

# Cleanup
rm -rf "$TEMP_DIR"
exit 0
