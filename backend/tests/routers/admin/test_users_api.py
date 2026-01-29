from typing import Generator
from unittest.mock import AsyncMock, MagicMock

import pytest
from fastapi.testclient import TestClient

from backend.api.main import app
from backend.api.routers.admin.users import get_admin_service
from backend.api.security.rbac import require_admin, require_owner, require_viewer
from backend.models.admin import AdminUser


@pytest.fixture
def mock_admin_service():
    return MagicMock()


@pytest.fixture
def client(mock_admin_service) -> Generator:
    # Override dependencies
    app.dependency_overrides[get_admin_service] = lambda: mock_admin_service

    with TestClient(app) as c:
        yield c

    # Clean up
    app.dependency_overrides = {}


def test_list_users_viewer(client, mock_admin_service):
    """Test listing users with viewer role."""
    # Setup mock - list_users is async
    mock_admin_service.list_users = AsyncMock(
        return_value={
            "users": [{"id": "u1", "email": "test@example.com", "role": "user", "is_active": True}],
            "total": 1,
            "page": 1,
            "per_page": 50,
        }
    )

    # Override auth
    app.dependency_overrides[require_viewer] = lambda: True

    try:
        response = client.get("/admin/users")
    finally:
        # We don't clear all overrides here because we want to keep get_admin_service override
        # But for safety in other tests we should manage overrides carefully.
        # Since we set get_admin_service in fixture, we only need to revert auth here.
        # But app.dependency_overrides is a dict, so we can just delete the key.
        if require_viewer in app.dependency_overrides:
            del app.dependency_overrides[require_viewer]

    assert response.status_code == 200
    data = response.json()
    assert "users" in data
    assert len(data["users"]) == 1
    assert data["users"][0]["email"] == "test@example.com"


def test_ban_user_admin(client, mock_admin_service):
    """Test banning user requires admin role."""
    # Setup mock
    mock_admin_service.ban_user.return_value = True

    # Override auth
    app.dependency_overrides[require_admin] = lambda: True

    try:
        response = client.post("/admin/users/u1/ban?duration=forever")
    finally:
        del app.dependency_overrides[require_admin]

    assert response.status_code == 200
    assert response.json()["status"] == "success"
    mock_admin_service.ban_user.assert_called_with("u1", "forever")


def test_update_role_owner(client, mock_admin_service):
    """Test updating role requires owner role."""
    # Setup mock
    mock_admin_service.update_user_role.return_value = True

    # Override auth
    app.dependency_overrides[require_owner] = lambda: True

    try:
        response = client.patch("/admin/users/u1/role?role=admin")
    finally:
        del app.dependency_overrides[require_owner]

    assert response.status_code == 200
    assert response.json()["status"] == "success"
    mock_admin_service.update_user_role.assert_called_with("u1", "admin")
