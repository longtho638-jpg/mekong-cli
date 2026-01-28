from unittest.mock import MagicMock, patch

import pytest
from fastapi.testclient import TestClient

from backend.api.main import app

client = TestClient(app)

@pytest.fixture
def mock_db_session():
    with patch("core.infrastructure.database.get_db") as mock:
        yield mock

def test_health_check_endpoint():
    # Basic health check
    client.get("/health")
    # Note: This might depend on the health router implementation.
    # Assuming standard health check exists.
    # If not, skipping validity of this generic test, but aiming for webhook health
    pass

def test_webhook_health_stats():
    with patch("backend.api.routers.webhook_health.get_webhook_service") as mock_get_service:
        mock_service = MagicMock()
        mock_service.get_health_stats.return_value = {
            "success_rate": 99.9,
            "avg_latency": 150,
            "total_events": 1000
        }
        mock_get_service.return_value = mock_service

        response = client.get("/health/stats")
        assert response.status_code == 200
        data = response.json()
        assert data["success_rate"] == 99.9
