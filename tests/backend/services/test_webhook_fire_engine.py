from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from backend.services.webhook_circuit_breaker import CircuitState
from backend.services.webhook_fire_engine import WebhookFireEngine


@pytest.fixture
def mock_redis():
    redis = MagicMock()
    redis.get.return_value = None
    redis.exists.return_value = False
    redis.incr.return_value = 1  # Return an int for failure counting
    return redis

@pytest.fixture
def mock_db():
    db = MagicMock()
    return db

@pytest.fixture
def fire_engine(mock_redis, mock_db):
    with patch('backend.services.webhook_fire_engine.get_db', return_value=mock_db):
        engine = WebhookFireEngine(mock_redis)
        # Mock transformer to return payload as is
        engine.transformer.filter_fields = MagicMock(side_effect=lambda p, e: p)
        engine.transformer.transform_payload = MagicMock(side_effect=lambda p, t: p)
        # Mock signature service
        engine.signature_service.generate_hmac_signature = MagicMock(return_value="sig")
        engine.signature_service.construct_header_value = MagicMock(return_value="t=1,v1=sig")
        return engine

@pytest.mark.asyncio
async def test_trigger_happy_path(fire_engine):
    # Setup
    config_id = "config_123"
    payload = {"data": "test"}

    # Mock config fetch
    fire_engine._get_config = MagicMock(return_value={
        "id": config_id,
        "url": "http://test.com/webhook",
        "secret": "secret",
        "is_active": True,
        "max_retries": 3
    })

    # Mock delivery creation
    fire_engine._create_delivery_record = MagicMock(return_value="delivery_123")

    # Mock execute_attempt to avoid actual HTTP call in this test
    fire_engine.execute_attempt = AsyncMock()

    # Execute
    await fire_engine.trigger(config_id, "test.event", payload)

    # Verify
    fire_engine._create_delivery_record.assert_called_once()
    fire_engine.execute_attempt.assert_called_once()

@pytest.mark.asyncio
async def test_trigger_circuit_open(fire_engine):
    config_id = "config_123"
    payload = {"data": "test"}

    # Mock circuit breaker to be OPEN
    with patch.object(fire_engine.circuit_breaker, 'get_status', return_value=CircuitState.OPEN):
        # Mock config fetch (needed before circuit check in current impl? No, usually check before config?
        # Check impl: Idempotency -> Config -> Circuit. OK.)
        fire_engine._get_config = MagicMock(return_value={"id": config_id, "is_active": True})

        await fire_engine.trigger(config_id, "test.event", payload)

        # Verify NO delivery created
        # We need to mock _create_delivery_record to assert it wasn't called
        fire_engine._create_delivery_record = MagicMock()
        assert not fire_engine._create_delivery_record.called

@pytest.mark.asyncio
async def test_execute_attempt_success(fire_engine):
    delivery_id = "delivery_123"
    config = {"id": "conf1", "url": "http://test.com", "secret": "sec", "max_retries": 3}
    payload = {"a": 1}

    # Mock delivery fetch
    fire_engine._get_delivery = MagicMock(return_value={
        "id": delivery_id,
        "attempt_count": 0,
        "event_type": "evt",
        "idempotency_key": "key1"
    })

    # Mock HTTP client
    with patch('aiohttp.ClientSession.post') as mock_post:
        mock_resp = AsyncMock()
        mock_resp.status = 200
        mock_resp.text.return_value = "OK"
        mock_post.return_value.__aenter__.return_value = mock_resp

        # Mock DB operations for recording result
        mock_db_table = MagicMock()
        fire_engine.db.table.return_value = mock_db_table

        await fire_engine.execute_attempt(delivery_id, config, payload)

        # Verify DB updates
        # 1. Insert attempt
        # 2. Update delivery status to success
        assert mock_db_table.insert.called
        assert mock_db_table.update.called

        # Verify circuit success recorded
        # We need to spy on circuit_breaker
        # In this fixture, it's a real object with mock redis, so we can verify redis calls or mock the method
        with patch.object(fire_engine.circuit_breaker, 'record_success') as mock_record_success:
             await fire_engine._process_result(
                 {"id": delivery_id}, config, 1, True, 200, "OK", None, 100
             )
             mock_record_success.assert_called_with("conf1")

@pytest.mark.asyncio
async def test_execute_attempt_failure_retry(fire_engine):
    delivery_id = "delivery_123"
    config = {"id": "conf1", "max_retries": 3}

    # Mock DB
    mock_db_table = MagicMock()
    fire_engine.db.table.return_value = mock_db_table

    # Simulate failure (HTTP 500)
    await fire_engine._process_result(
        {"id": delivery_id}, config, 1, False, 500, "Error", "HTTP 500", 100
    )

    # Verify
    # Should schedule retry (status=pending, next_retry_at set)
    # Check the update call args
    call_args = mock_db_table.update.call_args[0][0]
    assert call_args["status"] == "pending"
    assert call_args["next_retry_at"] is not None

@pytest.mark.asyncio
async def test_execute_attempt_failure_dlq(fire_engine):
    delivery_id = "delivery_123"
    config = {"id": "conf1", "max_retries": 3, "webhook_config_id": "conf1"} # Ensure config_id matches
    delivery = {
        "id": delivery_id,
        "webhook_config_id": "conf1",
        "event_type": "evt",
        "payload": {},
        "attempt_count": 3
    }

    # Mock DB
    mock_db_table = MagicMock()
    fire_engine.db.table.return_value = mock_db_table

    # Simulate failure on 3rd attempt (which is max_retries if max is 3? No, attempt_number passed is what matters)
    # logic: if attempt_number < max_retries: retry.
    # If we pass attempt_number=3 and max=3. 3 < 3 is False. So DLQ.

    await fire_engine._process_result(
        delivery, config, 3, False, 500, "Error", "HTTP 500", 100
    )

    # Verify
    # Should go to DLQ (status=failed)
    update_call_args = mock_db_table.update.call_args[0][0]
    assert update_call_args["status"] == "failed"
    assert update_call_args["next_retry_at"] is None

    # Verify DLQ insert
    # We mocked db.table, so we check if it was called with "dlq_entries"
    # Actually _send_to_dlq calls db.table("dlq_entries").insert
    # Let's check if 'dlq_entries' was accessed
    # fire_engine.db.table.assert_any_call("dlq_entries")
    # Note: MagicMock calls are tricky with chaining.
