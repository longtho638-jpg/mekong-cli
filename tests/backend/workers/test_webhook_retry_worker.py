from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from backend.workers.webhook_retry_worker import WebhookRetryWorker


@pytest.fixture
def mock_db():
    return MagicMock()

@pytest.fixture
def mock_redis():
    return MagicMock()

@pytest.fixture
def mock_fire_engine():
    return AsyncMock()

@pytest.fixture
def worker(mock_db, mock_redis, mock_fire_engine):
    with patch("backend.workers.webhook_retry_worker.get_db", return_value=mock_db), \
         patch("backend.workers.webhook_retry_worker.get_redis_client", return_value=mock_redis), \
         patch("backend.workers.webhook_retry_worker.WebhookFireEngine", return_value=mock_fire_engine):
        return WebhookRetryWorker()

@pytest.mark.asyncio
async def test_process_pending_retries_none(worker, mock_db):
    # Setup
    mock_db.table.return_value.select.return_value.eq.return_value.lte.return_value.limit.return_value.execute.return_value.data = []

    # Execute
    await worker.process_pending_retries()

    # Verify
    # Should check DB was queried
    mock_db.table.assert_called_with("webhook_deliveries")

@pytest.mark.asyncio
async def test_process_pending_retries_found(worker, mock_db):
    # Setup
    deliveries = [{"id": "del_1"}, {"id": "del_2"}]
    mock_db.table.return_value.select.return_value.eq.return_value.lte.return_value.limit.return_value.execute.return_value.data = deliveries

    worker.execute_retry = AsyncMock()

    # Execute
    await worker.process_pending_retries()

    # Verify
    assert worker.execute_retry.call_count == 2

@pytest.mark.asyncio
async def test_execute_retry(worker, mock_db):
    # Setup
    delivery = {
        "id": "del_1",
        "webhook_config_id": "conf_1",
        "payload": {"key": "value"}
    }
    config = {"id": "conf_1", "url": "http://test.com"}

    mock_db.table.return_value.select.return_value.eq.return_value.execute.return_value.data = [config]

    # Execute
    await worker.execute_retry(delivery)

    # Verify
    worker.fire_engine.execute_attempt.assert_called_once_with("del_1", config, {"key": "value"})

@pytest.mark.asyncio
async def test_execute_retry_config_missing(worker, mock_db):
    # Setup
    delivery = {
        "id": "del_1",
        "webhook_config_id": "conf_1",
        "payload": {}
    }
    mock_db.table.return_value.select.return_value.eq.return_value.execute.return_value.data = []

    # Execute
    await worker.execute_retry(delivery)

    # Verify
    worker.fire_engine.execute_attempt.assert_not_called()
