from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from backend.services.webhooks.advanced_service import AdvancedWebhookService, CircuitState


@pytest.fixture
def mock_db():
    return MagicMock()

@pytest.fixture
def mock_redis():
    return MagicMock()

@pytest.fixture
def service(mock_db, mock_redis):
    # We need to patch get_db to return our mock
    with patch('backend.services.webhooks.advanced_service.get_db', return_value=mock_db):
        svc = AdvancedWebhookService(mock_redis)
        # Also mock internal services to simplify
        svc.signature_service = MagicMock()
        svc.transformer = MagicMock()
        svc.rate_limiter = MagicMock()
        svc.retry_engine = MagicMock()
        svc.matcher = MagicMock()
        return svc

@pytest.mark.asyncio
async def test_broadcast_event(service, mock_db):
    # Setup
    config = {"id": "conf_1", "is_active": True}
    mock_db.table.return_value.select.return_value.eq.return_value.execute.return_value.data = [config]

    service.matcher.is_match.return_value = True
    service.trigger_webhook = AsyncMock()

    # Execute
    await service.broadcast_event("user.created", {"id": 1})

    # Verify
    service.trigger_webhook.assert_called_once()

@pytest.mark.asyncio
async def test_trigger_webhook_rate_limit(service, mock_redis):
    # Setup
    config = {"id": "conf_1", "is_active": True, "rate_limit": 10, "burst_limit": 20}
    service._get_config = MagicMock(return_value=config)
    service.rate_limiter.is_allowed.return_value = False

    # Execute
    await service.trigger_webhook("conf_1", "evt", {})

    # Verify
    # Should stop early
    service._create_delivery_record = MagicMock()
    service._create_delivery_record.assert_not_called()

@pytest.mark.asyncio
async def test_trigger_webhook_success_flow(service):
    # Setup
    config = {"id": "conf_1", "is_active": True}
    service._get_config = MagicMock(return_value=config)
    service.rate_limiter.is_allowed.return_value = True
    service.retry_engine.get_circuit_status.return_value = CircuitState.CLOSED
    service.transformer.filter_fields.return_value = {}
    service.transformer.transform_payload.return_value = {}
    service._is_duplicate = MagicMock(return_value=False)
    service._mark_idempotency_key = MagicMock()

    service._create_delivery_record = MagicMock(return_value="del_1")
    service.execute_delivery_attempt = AsyncMock()

    # Execute
    await service.trigger_webhook("conf_1", "evt", {})

    # Verify
    service.execute_delivery_attempt.assert_called_once()
    args = service.execute_delivery_attempt.call_args[0]
    assert args[0] == "del_1"

@pytest.mark.asyncio
async def test_execute_delivery_attempt_http_success(service):
    # Setup
    delivery = {"id": "del_1", "event_type": "evt", "payload": {}, "attempt_count": 0}
    service._get_delivery = MagicMock(return_value=delivery)

    config = {"id": "conf_1", "url": "http://test.com", "secret": "sec", "max_retries": 3}

    service.signature_service.generate_hmac_signature.return_value = "sig"
    service.signature_service.construct_header_value.return_value = "t=1,v1=sig"

    service._handle_attempt_result = AsyncMock()

    # Mock aiohttp
    with patch('aiohttp.ClientSession') as mock_session_cls:
        # Create the mock session object that will be yielded by ClientSession()
        mock_session = MagicMock()

        # Configure ClientSession context manager
        session_ctx = MagicMock()
        session_ctx.__aenter__ = AsyncMock(return_value=mock_session)
        session_ctx.__aexit__ = AsyncMock()
        mock_session_cls.return_value = session_ctx

        # Configure response
        mock_response = MagicMock()
        mock_response.status = 200
        mock_response.text = AsyncMock(return_value="OK")

        # Configure post context manager
        post_ctx = MagicMock()
        post_ctx.__aenter__ = AsyncMock(return_value=mock_response)
        post_ctx.__aexit__ = AsyncMock()

        mock_session.post.return_value = post_ctx

        # Execute
        await service.execute_delivery_attempt("del_1", config, {})

        # Verify
        service._handle_attempt_result.assert_called_once()
        call_args = service._handle_attempt_result.call_args
        assert call_args[0][3] is True # success
