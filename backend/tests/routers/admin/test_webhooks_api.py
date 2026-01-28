from typing import Generator
from unittest.mock import MagicMock

import pytest
from fastapi.testclient import TestClient

from backend.api.main import app
from backend.api.routers.admin.webhooks import get_admin_service
from backend.api.security.rbac import require_admin, require_developer


@pytest.fixture
def mock_admin_service():
    return MagicMock()

@pytest.fixture
def client(mock_admin_service) -> Generator:
    app.dependency_overrides[get_admin_service] = lambda: mock_admin_service
    with TestClient(app) as c:
        yield c
    app.dependency_overrides = {}

def test_list_webhook_configs(client, mock_admin_service):
    """Test listing webhook configs."""
    mock_admin_service.list_webhook_configs = MagicMock(return_value=[
        {
            "id": "123e4567-e89b-12d3-a456-426614174000",
            "url": "https://api.example.com/webhooks",
            "description": "Main production webhook",
            "event_types": ["user.created", "payment.succeeded"],
            "is_active": True,
            "created_at": "2024-01-01T12:00:00Z"
        },
         {
            "id": "123e4567-e89b-12d3-a456-426614174001",
            "url": "https://staging.example.com/webhooks",
            "description": "Staging webhook",
            "event_types": ["*"],
            "is_active": False,
            "created_at": "2024-01-02T12:00:00Z"
        }
    ])

    app.dependency_overrides[require_developer] = lambda: True
    try:
        response = client.get("/admin/webhooks/configs")
    finally:
        del app.dependency_overrides[require_developer]

    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 2
    assert data[0]["url"] == "https://api.example.com/webhooks"

def test_create_webhook_config_admin(client, mock_admin_service):
    """Test creating webhook config requires admin."""
    mock_admin_service.create_webhook_config = MagicMock(return_value={
        "status": "success", "id": "new-uuid", "message": "Webhook created"
    })

    app.dependency_overrides[require_admin] = lambda: True
    try:
        response = client.post(
            "/admin/webhooks/configs",
            json={"url": "https://new.example.com", "event_types": ["*"]}
        )
    finally:
        del app.dependency_overrides[require_admin]

    assert response.status_code == 200
    assert response.json()["status"] == "success"
