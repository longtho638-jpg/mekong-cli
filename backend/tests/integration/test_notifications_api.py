from datetime import datetime
from unittest.mock import AsyncMock, MagicMock

import pytest
from fastapi.testclient import TestClient

from backend.api.deps import get_current_user, get_db
from backend.api.main import app
from backend.models.user import User

# Mock User objects
now = datetime.now()
mock_admin_user = User(
    id="admin-123",
    email="admin@example.com",
    role="admin",
    created_at=now,
    updated_at=now
)
mock_regular_user = User(
    id="user-123",
    email="user@example.com",
    role="user",
    created_at=now,
    updated_at=now
)

@pytest.fixture
def mock_db_session():
    session = MagicMock()
    # Default behavior for execute/scalars/all to return empty list
    session.execute.return_value.scalars.return_value.all.return_value = []
    session.execute.return_value.scalar_one_or_none.return_value = None
    return session

@pytest.fixture
def client(mock_db_session):
    # Override DB dependency
    app.dependency_overrides[get_db] = lambda: mock_db_session

    with TestClient(app) as c:
        yield c

    # Cleanup
    app.dependency_overrides = {}

class TestNotificationTemplatesAPI:
    def test_list_templates_admin(self, client, mock_db_session):
        # Override auth as admin
        app.dependency_overrides[get_current_user] = lambda: mock_admin_user

        # Mock DB response
        mock_template = MagicMock()
        mock_template.to_dict.return_value = {
            "id": "temp-1", "name": "Test", "type": "email",
            "content": "Hi", "active": True,
            "created_at": "2023-01-01", "updated_at": "2023-01-01",
            "subject": "Test Subject", "description": "Test Description"
        }
        mock_db_session.execute.return_value.scalars.return_value.all.return_value = [mock_template]

        response = client.get("/api/v1/notifications/templates/")

        assert response.status_code == 200
        assert len(response.json()) == 1
        assert response.json()[0]["name"] == "Test"

    def test_list_templates_forbidden(self, client):
        # Override auth as regular user
        app.dependency_overrides[get_current_user] = lambda: mock_regular_user

        response = client.get("/api/v1/notifications/templates/")

        assert response.status_code == 403

class TestNotificationAnalyticsAPI:
    def test_get_analytics_admin(self, client, mock_db_session):
        app.dependency_overrides[get_current_user] = lambda: mock_admin_user

        # Mock the analytics service inside the route
        # Since the route imports it inside the function, we might need to mock sys.modules or patch it.
        # However, looking at the route, it does: from backend.services.notification_analytics import get_notification_analytics_service

        with pytest.MonkeyPatch.context() as mp:
            mock_service = MagicMock()
            mock_service.get_delivery_stats.return_value = {
                "total_sent": 100, "success_rate": 95,
                "channels": {"email": 80, "push": 20},
                "statuses": {"sent": 95, "failed": 5}
            }
            mock_service.get_daily_trends.return_value = []

            mock_get_service = MagicMock(return_value=mock_service)

            # We need to patch where it is imported/used.
            # Ideally the route should use dependency injection for the service too,
            # but based on the code read previously, it does an inline import.
            # Let's try to patch the function in the module if possible,
            # but since it's an inline import in the function body, patching 'backend.services.notification_analytics.get_notification_analytics_service' works.

            from backend.services import notification_analytics
            mp.setattr(notification_analytics, "get_notification_analytics_service", mock_get_service)

            response = client.get("/api/v1/notifications/analytics")

            assert response.status_code == 200
            data = response.json()
            assert data["stats"]["total_sent"] == 100

class TestPushSubscriptionsAPI:
    def test_subscribe_success(self, client, mock_db_session):
        app.dependency_overrides[get_current_user] = lambda: mock_regular_user

        payload = {
            "endpoint": "https://fcm.googleapis.com/fcm/send/...",
            "p256dh": "key",
            "auth": "auth_secret",
            "user_agent": "Mozilla/5.0"
        }

        # Mock no existing subscription
        mock_db_session.execute.return_value.scalar_one_or_none.return_value = None

        response = client.post("/api/v1/notifications/push/subscribe", json=payload)

        assert response.status_code == 201
        assert response.json()["status"] == "subscribed"
        mock_db_session.add.assert_called()
        mock_db_session.commit.assert_called()

    def test_unsubscribe_success(self, client, mock_db_session):
        app.dependency_overrides[get_current_user] = lambda: mock_regular_user

        # Mock existing subscription
        mock_sub = MagicMock()
        mock_db_session.execute.return_value.scalar_one_or_none.return_value = mock_sub

        response = client.post("/api/v1/notifications/push/unsubscribe", json={"endpoint": "https://endpoint"})

        assert response.status_code == 200
        assert response.json()["status"] == "unsubscribed"
        mock_db_session.delete.assert_called_with(mock_sub)
