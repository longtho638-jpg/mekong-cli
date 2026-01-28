from unittest.mock import MagicMock

import pytest
from fastapi.testclient import TestClient

from backend.api.main import app
from backend.api.routers.webhook_health import get_webhook_service
from backend.services.webhooks.advanced_service import AdvancedWebhookService

client = TestClient(app)

@pytest.fixture
def mock_webhook_service():
    service = MagicMock(spec=AdvancedWebhookService)
    app.dependency_overrides[get_webhook_service] = lambda: service
    yield service
    app.dependency_overrides = {}

def test_get_health_stats_global(mock_webhook_service):
    mock_stats = {
        "success_rate": 95.5,
        "avg_latency": 120,
        "total_events": 1000
    }
    mock_webhook_service.get_health_stats.return_value = mock_stats

    response = client.get("/health/stats")
    assert response.status_code == 200
    assert response.json() == mock_stats
    mock_webhook_service.get_health_stats.assert_called_with(None)

def test_get_health_stats_specific_config(mock_webhook_service):
    mock_stats = {
        "success_rate": 98.0,
        "avg_latency": 50,
        "total_events": 200
    }
    mock_webhook_service.get_health_stats.return_value = mock_stats

    config_id = "123e4567-e89b-12d3-a456-426614174000"
    response = client.get(f"/health/stats?webhook_config_id={config_id}")

    assert response.status_code == 200
    assert response.json() == mock_stats
    mock_webhook_service.get_health_stats.assert_called_with(config_id)
