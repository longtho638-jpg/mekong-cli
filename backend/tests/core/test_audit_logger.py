from unittest.mock import AsyncMock, Mock, patch

import pytest
from sqlalchemy.orm import Session

from backend.core.audit_logger import AuditLogger
from backend.services.audit_service import audit_service


@pytest.mark.asyncio
async def test_audit_logger_log_event():
    mock_db = Mock(spec=Session)

    with patch.object(audit_service, 'create_audit_log', new_callable=AsyncMock) as mock_create:
        mock_create.return_value = Mock(id=1)

        await AuditLogger.log_event(
            db=mock_db,
            action="test_action",
            user_id="user_123",
            resource_type="order",
            resource_id="order_999",
            metadata={"amount": 100},
            ip_address="127.0.0.1",
            request_id="req_abc"
        )

        mock_create.assert_called_once()
        call_kwargs = mock_create.call_args[1]
        assert call_kwargs["db"] == mock_db
        assert call_kwargs["action"] == "test_action"
        assert call_kwargs["user_id"] == "user_123"
        assert call_kwargs["resource_type"] == "order"
        assert call_kwargs["resource_id"] == "order_999"
        assert call_kwargs["metadata"] == {"amount": 100}

@pytest.mark.asyncio
async def test_audit_logger_log_security_event():
    mock_db = Mock(spec=Session)

    with patch.object(AuditLogger, 'log_event', new_callable=AsyncMock) as mock_log_event:
        await AuditLogger.log_security_event(
            db=mock_db,
            action="login_failed",
            user_id="user_123",
            details={"reason": "bad_password"},
            ip_address="1.2.3.4"
        )

        mock_log_event.assert_called_once()
        call_kwargs = mock_log_event.call_args[1]
        assert call_kwargs["action"] == "security.login_failed"
        assert call_kwargs["resource_type"] == "security"
        assert call_kwargs["metadata"]["event_type"] == "SECURITY"
        assert call_kwargs["metadata"]["reason"] == "bad_password"

@pytest.mark.asyncio
async def test_audit_logger_exception_handling():
    mock_db = Mock(spec=Session)

    with patch.object(audit_service, 'create_audit_log', side_effect=Exception("DB Error")):
        # Should not raise exception
        result = await AuditLogger.log_event(
            db=mock_db,
            action="test_action"
        )
        assert result is None
