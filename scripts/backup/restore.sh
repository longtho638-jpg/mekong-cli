#!/bin/bash
# Interactive Restore Script

echo "WARNING: This will overwrite the current database!"
read -p "Are you sure? (y/N) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    exit 1
fi

read -p "Enter S3 URI to restore from: " S3_URI

if [ -z "$S3_URI" ]; then
    echo "S3 URI required"
    exit 1
fi

echo "Downloading..."
aws s3 cp "$S3_URI" restored_backup.enc

echo "Decrypting and Decompressing..."
openssl enc -d -aes-256-cbc -salt -pbkdf2 -pass pass:"$BACKUP_ENCRYPTION_KEY" -in restored_backup.enc | \
gzip -d > restored_backup.dump

if [[ "$S3_URI" == *"pg_"* ]]; then
    echo "Detected PostgreSQL Backup."
    read -p "Restore specific table only? (Leave empty for FULL restore): " TABLE_NAME

    echo "Restoring to Postgres..."
    if [ -z "$TABLE_NAME" ]; then
        echo "Performing FULL Restore..."
        pg_restore --clean --if-exists --no-password --dbname "$POSTGRES_URL" restored_backup.dump
    else
        echo "Performing SELECTIVE Restore for table: $TABLE_NAME..."
        pg_restore --no-password --dbname "$POSTGRES_URL" --table="$TABLE_NAME" restored_backup.dump
    fi
elif [[ "$S3_URI" == *"redis_"* ]]; then
    echo "Detected Redis Backup (RDB)."
    echo "WARNING: Restoring Redis requires overwriting the dump.rdb file and restarting the service."
    read -p "Enter path to Redis data directory (e.g. /var/lib/redis): " REDIS_DIR

    if [ -d "$REDIS_DIR" ]; then
        echo "Stopping Redis (if running)..."
        # Try systemctl or similar if available, otherwise warn
        echo "Please ensure Redis is stopped manually if not using a service manager."

        echo "Moving RDB file to $REDIS_DIR/dump.rdb"
        mv restored_backup.dump "$REDIS_DIR/dump.rdb"

        echo "Restore file placed. Please restart Redis server."
    else
        echo "Redis directory not found. RDB file is located at: $(pwd)/restored_backup.dump"
    fi
else
    echo "Unknown backup type. File decrypted to: restored_backup.dump"
fi

echo "Restore Complete"
rm restored_backup.enc
# Don't delete restored_backup.dump if we didn't consume it (e.g. unknown type)
if [[ "$S3_URI" == *"pg_"* ]]; then
    rm restored_backup.dump
fi
