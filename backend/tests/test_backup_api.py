import sys
from unittest.mock import MagicMock, patch

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

# Mock boto3 and botocore before importing anything that might use them
mock_boto3 = MagicMock()
sys.modules["boto3"] = mock_boto3
mock_botocore = MagicMock()
sys.modules["botocore"] = mock_botocore
sys.modules["botocore.exceptions"] = MagicMock()

# Mock missing backend.core.infrastructure module which causes import errors in other routers
mock_infra = MagicMock()
sys.modules["backend.core.infrastructure"] = mock_infra
sys.modules["backend.core.infrastructure.database"] = mock_infra

# Import the router directly
from backend.api.auth.dependencies import get_current_active_superuser
from backend.api.auth.utils import TokenData
from backend.api.routers.backup import router as backup_router

# Create a standalone app for testing this router
app = FastAPI()
app.include_router(backup_router)

# Override dependency to bypass auth
async def mock_superuser():
    return TokenData(username="admin", role="superuser")

app.dependency_overrides[get_current_active_superuser] = mock_superuser

client = TestClient(app)

@pytest.fixture
def mock_orchestrator():
    with patch("backend.api.routers.backup.get_orchestrator") as mock:
        yield mock

def test_list_backups_endpoint():
    with patch("backend.api.routers.backup.S3StorageAdapter") as mock_storage_cls:
        mock_instance = mock_storage_cls.return_value
        # Async mock for list_backups
        async def async_list():
            return ["backup1.json", "backup2.json"]
        mock_instance.list_backups.side_effect = async_list

        response = client.get("/backups/")
        assert response.status_code == 200
        assert response.json() == ["backup1.json", "backup2.json"]

def test_trigger_backup_endpoint(mock_orchestrator):
    # Mock orchestrator instance
    mock_orch_instance = MagicMock()
    mock_orchestrator.return_value = mock_orch_instance

    # Mock perform_backup return value (it's async)
    async def async_backup(*args, **kwargs):
        from datetime import datetime

        from backend.services.backup.interfaces import BackupMetadata
        return BackupMetadata(
            timestamp=datetime.utcnow(),
            backup_id="test-id",
            strategy="TestStrategy",
            size_bytes=1024,
            checksum="abc",
            location="s3://bucket/key",
            encrypted=True,
            compressed=True
        )
    mock_orch_instance.perform_backup.side_effect = async_backup

    response = client.post("/backups/trigger")
    assert response.status_code == 200
    data = response.json()
    assert data["backup_id"] == "test-id"
    assert data["status"] == "completed"

def test_restore_backup_endpoint(mock_orchestrator):
    mock_orch_instance = MagicMock()
    mock_orchestrator.return_value = mock_orch_instance

    async def async_restore(loc):
        return True
    mock_orch_instance.restore_backup.side_effect = async_restore

    response = client.post("/backups/restore/s3://bucket/backup.json")
    assert response.status_code == 200
    assert response.json() == {"status": "success", "message": "Database restored successfully"}
