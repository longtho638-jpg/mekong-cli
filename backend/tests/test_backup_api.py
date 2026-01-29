import sys
from unittest.mock import MagicMock, patch

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

# Define fixtures for mocking dependencies BEFORE imports that require them

@pytest.fixture(scope="module")
def mock_aws_modules():
    """Mock boto3 and infrastructure modules globally for this test file."""
    mock_boto3 = MagicMock()
    mock_botocore = MagicMock()
    mock_infra = MagicMock()

    # Create a dictionary of modules to patch
    modules_to_patch = {
        "boto3": mock_boto3,
        "botocore": mock_botocore,
        "botocore.exceptions": MagicMock(),
        "backend.core.infrastructure": mock_infra,
        "backend.core.infrastructure.database": mock_infra
    }

    # Apply patches
    with patch.dict(sys.modules, modules_to_patch):
        yield

@pytest.fixture
def client(mock_aws_modules):
    # Import router INSIDE fixture to ensure mocks are in place
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

    return TestClient(app)

@pytest.fixture
def mock_orchestrator():
    with patch("backend.api.routers.backup.get_orchestrator") as mock:
        yield mock

def test_list_backups_endpoint(client):
    # Re-import inside test or use patch on the module path that was imported
    # Since we imported inside fixture, we need to patch where it was imported from
    # But standard patching works on the target module path
    with patch("backend.api.routers.backup.S3StorageAdapter") as mock_storage_cls:
        mock_instance = mock_storage_cls.return_value
        # Async mock for list_backups
        async def async_list():
            return ["backup1.json", "backup2.json"]
        mock_instance.list_backups.side_effect = async_list

        response = client.get("/backups/")
        assert response.status_code == 200
        assert response.json() == ["backup1.json", "backup2.json"]

def test_trigger_backup_endpoint(client, mock_orchestrator):
    # Mock orchestrator instance
    mock_orch_instance = MagicMock()
    mock_orchestrator.return_value = mock_orch_instance

    # Mock perform_backup return value (it's async)
    async def async_backup(*args, **kwargs):
        from datetime import datetime

        # We need to import BackupMetadata.
        # Since we mocked backend.core.infrastructure, verify imports work.
        # backend.services.backup.interfaces likely doesn't depend on infra directly.
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

def test_restore_backup_endpoint(client, mock_orchestrator):
    mock_orch_instance = MagicMock()
    mock_orchestrator.return_value = mock_orch_instance

    async def async_restore(loc):
        return True
    mock_orch_instance.restore_backup.side_effect = async_restore

    response = client.post("/backups/restore/s3://bucket/backup.json")
    assert response.status_code == 200
    assert response.json() == {"status": "success", "message": "Database restored successfully"}
