import json
from unittest.mock import MagicMock, patch

import pytest

from backend.services.webhook_queue import WebhookQueueService


@pytest.fixture
def mock_redis():
    with patch('backend.services.webhook_queue.redis') as mock_redis_lib:
        mock_client = MagicMock()
        mock_redis_lib.from_url.return_value = mock_client
        yield mock_client

def test_enqueue(mock_redis):
    # Setup
    service = WebhookQueueService()

    # Execute
    result = service.enqueue("evt_123")

    # Verify
    assert result is True
    mock_redis.lpush.assert_called_with("webhook:queue", "evt_123")

def test_dequeue(mock_redis):
    # Setup
    service = WebhookQueueService()
    mock_redis.brpop.return_value = ("webhook:queue", "evt_123")

    # Execute
    result = service.dequeue()

    # Verify
    assert result == "evt_123"
    mock_redis.brpop.assert_called_with("webhook:queue", timeout=5)

def test_dequeue_empty(mock_redis):
    # Setup
    service = WebhookQueueService()
    mock_redis.brpop.return_value = None

    # Execute
    result = service.dequeue()

    # Verify
    assert result is None

def test_send_to_dlq(mock_redis):
    # Setup
    service = WebhookQueueService()
    event_data = {"id": "evt_fail", "error": "oops"}

    # Execute
    service.send_to_dlq(event_data)

    # Verify
    mock_redis.lpush.assert_called_with("webhook:dlq", json.dumps(event_data))

def test_get_metrics(mock_redis):
    # Setup
    service = WebhookQueueService()
    mock_redis.llen.side_effect = [10, 5] # queue, dlq

    # Execute
    metrics = service.get_metrics()

    # Verify
    assert metrics["queue_depth"] == 10
    assert metrics["dlq_depth"] == 5
