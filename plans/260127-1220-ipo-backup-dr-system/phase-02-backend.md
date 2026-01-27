# Phase 2: Backend Core Services

## Overview
Implement the application logic to handle backup creation, processing (compression/encryption), and upload.

## Tasks
- [ ] Create `backend/services/backup/` package.
- [ ] Implement `EncryptionService` (AES-256).
- [ ] Implement `CompressionService` (Gzip).
- [ ] Implement `PostgresBackupStrategy`.
- [ ] Implement `RedisBackupStrategy`.
- [ ] Implement `S3StorageAdapter`.
- [ ] Implement `BackupOrchestrator`.

## Architecture
- **Interface**: `BackupStrategy` (backup, restore, verify).
- **Services**: Composable services for storage and processing.
- **Async**: Heavy lifting done in background tasks.
