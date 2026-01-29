from types import SimpleNamespace
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from fastapi.testclient import TestClient

from backend.api.auth.dependencies import get_current_user
from backend.main import app


# Setup client as fixture to ensure fresh dependency overrides and mocks
@pytest.fixture
def client():
    return TestClient(app)

def test_audit_log_endpoint_protected(client):
    response = client.get("/audit/logs")
    assert response.status_code == 401  # No token


def test_audit_log_access_denied_for_user(client):
    # Override get_current_user to return a normal user object (needs attribute access)
    async def override_get_current_user_user():
        return SimpleNamespace(id="user1", username="user", role="user", is_superuser=False)

    app.dependency_overrides[get_current_user] = override_get_current_user_user

    try:
        response = client.get("/audit/logs")
        assert response.status_code == 403
    finally:
        app.dependency_overrides = {}


def test_audit_log_access_allowed_for_admin(client):
    # Override get_current_user to return an admin object
    async def override_get_current_user_admin():
        return SimpleNamespace(id="admin1", username="admin", role="admin", is_superuser=True)

    app.dependency_overrides[get_current_user] = override_get_current_user_admin

    # Mock audit_service instance in the router
    # Note: The router imports 'audit_service' instance, not 'AuditService' class
    with patch("backend.api.routers.audit.audit_service") as mock_service:
        mock_service.search_audit_logs = AsyncMock(return_value=[])

        try:
            response = client.get("/audit/logs")
            assert response.status_code == 200
            assert isinstance(response.json(), list)
        finally:
            app.dependency_overrides = {}

