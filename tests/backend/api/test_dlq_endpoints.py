from unittest.mock import MagicMock

import pytest
from fastapi.testclient import TestClient

from backend.api.main import app
from backend.api.routers.dlq import get_webhook_service
from backend.services.webhooks.advanced_service import AdvancedWebhookService

client = TestClient(app)

@pytest.fixture
def mock_webhook_service():
    service = MagicMock(spec=AdvancedWebhookService)
    app.dependency_overrides[get_webhook_service] = lambda: service
    yield service
    app.dependency_overrides = {}

def test_list_dlq_entries(mock_webhook_service):
    mock_webhook_service.get_dlq_entries.return_value = [{"id": "1", "error": "msg"}]

    response = client.get("/dlq/")
    assert response.status_code == 200
    assert response.json() == [{"id": "1", "error": "msg"}]

def test_replay_dlq_entry(mock_webhook_service):
    mock_webhook_service.replay_dlq_entry.return_value = True

    # Use a valid UUID
    entry_id = "123e4567-e89b-12d3-a456-426614174000"

    response = client.post(f"/dlq/{entry_id}/replay")
    assert response.status_code == 200
    assert response.json() == {"status": "replayed"}

def test_replay_dlq_entry_not_found(mock_webhook_service):
    mock_webhook_service.replay_dlq_entry.return_value = False
    entry_id = "123e4567-e89b-12d3-a456-426614174000"

    response = client.post(f"/dlq/{entry_id}/replay")
    assert response.status_code == 404

def test_discard_dlq_entry(mock_webhook_service):
    entry_id = "123e4567-e89b-12d3-a456-426614174000"
    response = client.delete(f"/dlq/{entry_id}")
    assert response.status_code == 200
    mock_webhook_service.discard_dlq_entry.assert_called_with(entry_id)
