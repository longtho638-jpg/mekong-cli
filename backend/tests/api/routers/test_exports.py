from datetime import datetime
from unittest.mock import MagicMock, patch
from uuid import uuid4

import pytest
from fastapi.testclient import TestClient

from backend.main import app
from backend.services.queue_service import QueueService
from core.infrastructure.database import Database

client = TestClient(app)

# Mock dependencies
@pytest.fixture
def mock_queue_service():
    with patch("backend.api.routers.exports.QueueService") as MockQueue:
        yield MockQueue.return_value

@pytest.fixture
def mock_storage_service():
    with patch("backend.api.routers.exports.StorageService") as MockStorage:
        yield MockStorage.return_value

@pytest.fixture
def mock_db():
    with patch("backend.api.routers.exports.get_db") as MockDB:
        db_instance = MagicMock()
        MockDB.return_value = db_instance
        yield db_instance

@pytest.fixture
def override_auth():
    # Mock authentication to return a test user
    from backend.api.auth.dependencies import get_current_user_id
    app.dependency_overrides[get_current_user_id] = lambda: "test-user-id"
    yield
    app.dependency_overrides = {}

def test_create_export(mock_queue_service, mock_db, override_auth):
    # Setup DB mock
    mock_db.table.return_value.insert.return_value.execute.return_value.data = [{
        "id": str(uuid4()),
        "user_id": "test-user-id",
        "format": "csv",
        "status": "pending",
        "progress": 0
    }]

    # Setup Queue mock
    mock_queue_service.enqueue_job.return_value = "job-id-123"

    payload = {
        "format": "csv",
        "resource_type": "users",
        "filters": {"active": True},
        "columns": ["id", "email"]
    }

    response = client.post("/api/exports/", json=payload)

    assert response.status_code == 201
    data = response.json()
    assert data["status"] == "pending"
    assert data["user_id"] == "test-user-id"

    # Verify queue call
    mock_queue_service.enqueue_job.assert_called_once()
    call_args = mock_queue_service.enqueue_job.call_args
    assert call_args[1]["job_type"] == "export_data"
    assert call_args[1]["payload"]["format"] == "csv"

def test_list_exports(mock_db, override_auth):
    # Setup DB mock
    mock_exports = [
        {
            "id": str(uuid4()),
            "user_id": "test-user-id",
            "format": "csv",
            "status": "completed",
            "created_at": datetime.utcnow().isoformat()
        }
    ]
    mock_db.table.return_value.select.return_value.eq.return_value.order.return_value.limit.return_value.range.return_value.execute.return_value.data = mock_exports

    response = client.get("/api/exports/")

    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["format"] == "csv"

def test_get_export(mock_db, mock_storage_service, override_auth):
    export_id = str(uuid4())
    # Setup DB mock
    mock_export = {
        "id": export_id,
        "user_id": "test-user-id",
        "format": "csv",
        "status": "completed",
        "file_url": "exports/test.csv",
        "created_at": datetime.utcnow().isoformat()
    }
    mock_db.table.return_value.select.return_value.eq.return_value.eq.return_value.single.return_value.execute.return_value.data = mock_export

    # Setup Storage mock
    mock_storage_service.generate_presigned_url.return_value = "https://s3.example.com/signed-url"

    response = client.get(f"/api/exports/{export_id}")

    assert response.status_code == 200
    data = response.json()
    assert data["id"] == export_id
    assert data["file_url"] == "https://s3.example.com/signed-url"

def test_create_template(mock_db, override_auth):
    # Setup DB mock
    mock_db.table.return_value.insert.return_value.execute.return_value.data = [{
        "id": str(uuid4()),
        "name": "My Template",
        "user_id": "test-user-id",
        "format": "json",
        "resource_type": "invoices",
        "created_at": datetime.utcnow().isoformat(),
        "updated_at": datetime.utcnow().isoformat()
    }]

    payload = {
        "name": "My Template",
        "format": "json",
        "resource_type": "invoices",
        "columns": ["id", "amount"]
    }

    response = client.post("/api/exports/templates", json=payload)

    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "My Template"
    assert data["resource_type"] == "invoices"
