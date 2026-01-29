from typing import Generator
from unittest.mock import MagicMock

import pytest
from fastapi.testclient import TestClient

from backend.api.main import app
from backend.api.routers.admin.settings import get_admin_service
from backend.api.security.rbac import require_admin, require_owner
from backend.models.admin import SystemSetting


@pytest.fixture
def mock_admin_service():
    return MagicMock()


@pytest.fixture
def client(mock_admin_service) -> Generator:
    app.dependency_overrides[get_admin_service] = lambda: mock_admin_service
    with TestClient(app) as c:
        yield c
    app.dependency_overrides = {}


def test_list_settings_admin(client, mock_admin_service):
    """Test listing settings requires admin."""
    # Correct Pydantic model usage with dict for value
    mock_admin_service.list_settings.return_value = [
        SystemSetting(
            key="maintenance_mode",
            value={"enabled": False},
            description="System maintenance",
            updated_at="2024-01-01T00:00:00Z",
        )
    ]

    app.dependency_overrides[require_admin] = lambda: True
    try:
        response = client.get("/admin/settings")
    finally:
        del app.dependency_overrides[require_admin]

    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["key"] == "maintenance_mode"
    # value is returned as dict
    assert data[0]["value"] == {"enabled": False}


def test_update_setting_owner(client, mock_admin_service):
    """Test updating setting requires owner."""
    mock_admin_service.update_setting.return_value = SystemSetting(
        key="maintenance_mode",
        value={"enabled": True},
        description="System maintenance",
        updated_at="2024-01-01T00:00:00Z",
    )

    app.dependency_overrides[require_owner] = lambda: True
    try:
        response = client.patch(
            "/admin/settings/maintenance_mode", json={"value": {"enabled": True}}
        )
    finally:
        del app.dependency_overrides[require_owner]

    assert response.status_code == 200
    assert response.json()["value"]["enabled"] is True
