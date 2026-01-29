import io
from unittest.mock import AsyncMock, MagicMock

import pytest

from backend.services.backup.interfaces import (
    IBackupStrategy,
    ICompressionService,
    IEncryptionService,
    IStorageAdapter,
)
from backend.services.backup.orchestrator import BackupOrchestrator


@pytest.mark.asyncio
async def test_backup_orchestrator_flow():
    # Mocks
    mock_strategy = MagicMock(spec=IBackupStrategy)
    mock_strategy.backup = AsyncMock(return_value=io.BytesIO(b"raw_data"))
    mock_strategy.verify = AsyncMock(return_value=True)

    mock_storage = MagicMock(spec=IStorageAdapter)
    mock_storage.upload = AsyncMock(return_value="s3://bucket/backup.dat")
    mock_storage.download = AsyncMock(return_value=io.BytesIO(b"downloaded_data"))

    mock_compression = MagicMock(spec=ICompressionService)
    mock_compression.compress.side_effect = lambda x: io.BytesIO(b"compressed_" + x.read())
    mock_compression.decompress.side_effect = lambda x: io.BytesIO(
        x.read().replace(b"compressed_", b"")
    )

    mock_encryption = MagicMock(spec=IEncryptionService)
    mock_encryption.encrypt.side_effect = lambda x: io.BytesIO(b"encrypted_" + x.read())
    mock_encryption.decrypt.side_effect = lambda x: io.BytesIO(x.read().replace(b"encrypted_", b""))

    # Instantiate Orchestrator
    orchestrator = BackupOrchestrator(
        strategy=mock_strategy,
        storage=mock_storage,
        compression=mock_compression,
        encryption=mock_encryption,
    )

    # Execute Backup
    metadata = await orchestrator.perform_backup()

    # Assertions
    assert metadata.backup_id is not None
    assert metadata.location == "s3://bucket/backup.dat"
    assert metadata.compressed is True
    assert metadata.encrypted is True

    # Check calls
    mock_strategy.backup.assert_called_once()
    mock_compression.compress.assert_called_once()
    mock_encryption.encrypt.assert_called_once()
    mock_storage.upload.assert_called_once()

    # Verification flow checks
    mock_storage.download.assert_called_once()  # Verification triggers download
    mock_encryption.decrypt.assert_called_once()
    mock_compression.decompress.assert_called_once()
    mock_strategy.verify.assert_called_once()


@pytest.mark.asyncio
async def test_backup_orchestrator_restore():
    # Mocks
    mock_strategy = MagicMock(spec=IBackupStrategy)
    mock_strategy.restore = AsyncMock(return_value=True)

    mock_storage = MagicMock(spec=IStorageAdapter)
    mock_storage.download = AsyncMock(return_value=io.BytesIO(b"encrypted_compressed_raw_data"))

    # For restore, we assume the pipeline reverses perfectly.
    # Here we just check the calls pass through.
    mock_compression = MagicMock(spec=ICompressionService)
    mock_compression.decompress = MagicMock(return_value=io.BytesIO(b"raw_data"))

    mock_encryption = MagicMock(spec=IEncryptionService)
    mock_encryption.decrypt = MagicMock(return_value=io.BytesIO(b"compressed_raw_data"))

    orchestrator = BackupOrchestrator(
        strategy=mock_strategy,
        storage=mock_storage,
        compression=mock_compression,
        encryption=mock_encryption,
    )

    result = await orchestrator.restore_backup("s3://bucket/backup.dat")

    assert result is True
    mock_storage.download.assert_called_with("s3://bucket/backup.dat")
    mock_encryption.decrypt.assert_called()
    mock_compression.decompress.assert_called()
    mock_strategy.restore.assert_called()
