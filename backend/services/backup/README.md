# Backup & Disaster Recovery Service

Production-ready backup system for AgencyOS (PostgreSQL, Redis, S3).

## Architecture

This module implements a Strategy Pattern for backups:
- **Orchestrator**: Manages the pipeline (Backup -> Compress -> Encrypt -> Upload -> Verify).
- **Strategies**: `PostgresBackupStrategy`, `RedisBackupStrategy`.
- **Storage**: `S3StorageAdapter` (Multi-region support via AWS replication).
- **Processing**: `GzipCompressionService`, `AesEncryptionService`.

## Configuration

Configure via `config/backup-policy.yaml` or Environment Variables:

- `BACKUP_ENCRYPTION_KEY`: 32-byte base64 string or strong password.
- `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY`: S3 access.
- `POSTGRES_URL`: Connection string.
- `REDIS_HOST`, `REDIS_PORT`: Redis connection.

## CLI Usage

Scripts are available in `scripts/backup/`:

- `daily-backup.sh`: Full backup run.
- `restore.sh`: Interactive restore from S3.
- `verify-backup.sh`: Check integrity of an encrypted dump.

## API Usage

Triggers available via FastAPI (Superuser only):

```http
POST /api/backups/trigger
GET /api/backups/
POST /api/backups/restore/{s3_key}
```

## Legacy Support

The `backend/services/backup_service.py` handles SQLite backups (legacy).
The new system (`backend/services/backup/`) handles Production (Postgres/Redis).
