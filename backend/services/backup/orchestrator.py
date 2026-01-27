import io
import logging
import uuid
from datetime import datetime
from typing import Optional

from backend.services.backup.interfaces import (
    BackupMetadata,
    IBackupStrategy,
    ICompressionService,
    IEncryptionService,
    IStorageAdapter,
)

logger = logging.getLogger(__name__)

class BackupOrchestrator:
    def __init__(
        self,
        strategy: IBackupStrategy,
        storage: IStorageAdapter,
        compression: Optional[ICompressionService] = None,
        encryption: Optional[IEncryptionService] = None
    ):
        self.strategy = strategy
        self.storage = storage
        self.compression = compression
        self.encryption = encryption

    async def perform_backup(self, backup_type: str = "full") -> BackupMetadata:
        """
        Executes the full backup pipeline:
        1. Backup (Strategy)
        2. Compress (Optional)
        3. Encrypt (Optional)
        4. Upload (Storage)
        5. Verify (Integrity)
        """
        backup_id = str(uuid.uuid4())
        timestamp = datetime.utcnow()
        filename = f"{backup_type}_{timestamp.strftime('%Y%m%d_%H%M%S')}_{backup_id}"

        logger.info(f"Starting backup {backup_id} ({backup_type})")

        try:
            # 1. Perform Backup
            data_stream = await self.strategy.backup()
            original_size = data_stream.getbuffer().nbytes

            # 2. Compress
            is_compressed = False
            if self.compression:
                logger.info(f"Compressing backup {backup_id}")
                data_stream = self.compression.compress(data_stream)
                is_compressed = True

            # 3. Encrypt
            is_encrypted = False
            if self.encryption:
                logger.info(f"Encrypting backup {backup_id}")
                data_stream = self.encryption.encrypt(data_stream)
                is_encrypted = True

            # Calculate final size and checksum (simplified for now, ideally strictly stream-based)
            final_size = data_stream.getbuffer().nbytes
            # Reset stream for upload
            data_stream.seek(0)

            # 4. Upload
            destination = f"backups/{timestamp.year}/{timestamp.month}/{filename}.dat"
            logger.info(f"Uploading backup {backup_id} to {destination}")
            location = await self.storage.upload(data_stream, destination)

            # 5. Verify (Download and check)
            # In a real heavy-duty system, we might skip full download verification every time,
            # or use a separate verification worker. For IPO readiness/High Integrity, we verify.
            logger.info(f"Verifying backup {backup_id}")
            verified = await self.verify_backup(location)
            if not verified:
                raise Exception("Backup verification failed after upload")

            # Create Metadata
            metadata = BackupMetadata(
                timestamp=timestamp,
                backup_id=backup_id,
                strategy=self.strategy.__class__.__name__,
                size_bytes=final_size,
                checksum="checksum-placeholder", # Implement actual checksum calc
                location=location,
                encrypted=is_encrypted,
                compressed=is_compressed,
                metadata={"original_size": original_size}
            )

            logger.info(f"Backup {backup_id} completed successfully")
            return metadata

        except Exception as e:
            logger.error(f"Backup {backup_id} failed: {e}")
            raise

    async def verify_backup(self, location: str) -> bool:
        """
        Downloads and verifies the backup integrity.
        Reverses encryption and compression to verify raw data.
        """
        try:
            # Download
            data_stream = await self.storage.download(location)

            # Decrypt
            if self.encryption:
                data_stream = self.encryption.decrypt(data_stream)

            # Decompress
            if self.compression:
                data_stream = self.compression.decompress(data_stream)

            # Verify Strategy specific integrity (e.g. pg_restore --list)
            return await self.strategy.verify(data_stream)

        except Exception as e:
            logger.error(f"Verification failed for {location}: {e}")
            return False

    async def restore_backup(self, location: str) -> bool:
        """
        Restores a backup from storage to the strategy target.
        """
        try:
            logger.info(f"Starting restore from {location}")
            # Download
            data_stream = await self.storage.download(location)

            # Decrypt
            if self.encryption:
                data_stream = self.encryption.decrypt(data_stream)

            # Decompress
            if self.compression:
                data_stream = self.compression.decompress(data_stream)

            # Restore
            result = await self.strategy.restore(data_stream)
            logger.info(f"Restore result: {result}")
            return result

        except Exception as e:
            logger.error(f"Restore failed: {e}")
            raise
