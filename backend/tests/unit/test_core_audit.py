from unittest.mock import ANY, AsyncMock, MagicMock, patch

import pytest
from fastapi import Request

from backend.core.security.audit import AuditLogger, audit_action
from backend.models.audit_log import AuditLog


@pytest.fixture
def mock_db_session():
    with patch("backend.core.security.audit.SessionLocal") as mock:
        session = MagicMock()
        mock.return_value = session
        yield session

@pytest.fixture
def audit_logger_instance():
    return AuditLogger()

@pytest.mark.asyncio
async def test_audit_logger_log_success(audit_logger_instance, mock_db_session):
    """Test explicit log call writes to DB using SQLAlchemy."""
    await audit_logger_instance.log(
        actor_id="user123",
        actor_type="user",
        action="test.action",
        resource="resource1",
        status="success",
        ip_address="127.0.0.1"
    )

    # Verify DB insertion
    mock_db_session.add.assert_called()
    # Check the object added was an AuditLog
    args, _ = mock_db_session.add.call_args
    assert isinstance(args[0], AuditLog)
    assert args[0].action == "test.action"

    mock_db_session.commit.assert_called()
    mock_db_session.close.assert_called()

@pytest.mark.asyncio
async def test_audit_logger_log_db_failure(audit_logger_instance, mock_db_session):
    """Test logging handles DB errors gracefully."""
    mock_db_session.commit.side_effect = Exception("DB Error")

    # Should not raise exception
    await audit_logger_instance.log(
        actor_id="user123",
        actor_type="user",
        action="test.fail"
    )

    mock_db_session.rollback.assert_called()
    mock_db_session.close.assert_called()

@pytest.mark.asyncio
async def test_audit_action_decorator_success(mock_db_session):
    """Test decorator logs success."""

    @audit_action(action="test_decorator", resource_template="item_{id}")
    async def sensitive_op(id: int, request: Request):
        return "result"

    # Mock Request
    request = MagicMock(spec=Request)
    request.client.host = "1.2.3.4"
    request.headers.get.return_value = "TestAgent"
    # Mock user object structure
    user_mock = MagicMock()
    user_mock.username = "admin"
    request.state.user = user_mock

    result = await sensitive_op(id=99, request=request)
    assert result == "result"

    # Check log entry
    mock_db_session.add.assert_called()
    args, _ = mock_db_session.add.call_args
    entry = args[0]
    assert isinstance(entry, AuditLog)
    assert entry.action == "test_decorator"
    assert entry.resource_id == "item_99" # Split logic puts this in resource_id if no colon
    assert entry.metadata_["status"] == "success"

    mock_db_session.commit.assert_called()

@pytest.mark.asyncio
async def test_audit_action_decorator_failure(mock_db_session):
    """Test decorator logs failure when exception occurs."""

    @audit_action(action="test_error")
    async def failing_op(request: Request):
        raise ValueError("Boom")

    request = MagicMock(spec=Request)
    request.client.host = "1.2.3.4"

    with pytest.raises(ValueError):
        await failing_op(request=request)

    # Check log entry
    mock_db_session.add.assert_called()
    args, _ = mock_db_session.add.call_args
    entry = args[0]
    assert isinstance(entry, AuditLog)
    assert entry.metadata_["status"] == "failed"
    assert "Boom" in entry.metadata_["error"]

    mock_db_session.commit.assert_called()

@pytest.mark.asyncio
async def test_audit_action_decorator_no_request(mock_db_session):
    """Test decorator works without request object (system action)."""

    @audit_action(action="system_action")
    async def system_task():
        return "done"

    await system_task()

    mock_db_session.add.assert_called()
    args, _ = mock_db_session.add.call_args
    entry = args[0]
    assert isinstance(entry, AuditLog)
    assert entry.metadata_["actor_id"] == "system"
    assert entry.metadata_["actor_type"] == "agent"

@pytest.mark.asyncio
async def test_audit_logger_log_valid_uuid(audit_logger_instance, mock_db_session):
    """Test logging with valid UUID actor_id stores it in user_id column."""
    import uuid
    valid_uuid = str(uuid.uuid4())

    await audit_logger_instance.log(
        actor_id=valid_uuid,
        actor_type="user",
        action="test.uuid",
        resource="res"
    )

    mock_db_session.add.assert_called()
    args, _ = mock_db_session.add.call_args
    entry = args[0]
    assert entry.user_id == valid_uuid

@pytest.mark.asyncio
async def test_audit_action_decorator_request_in_args(mock_db_session):
    """Test decorator finds request in positional args."""

    @audit_action(action="test_args")
    async def op_with_args(arg1, req, arg2):
        return "ok"

    # Use real Request object to pass isinstance check
    scope = {
        "type": "http",
        "client": ("1.2.3.4", 1234),
        "headers": [(b"user-agent", b"TestAgent")],
        "path": "/",
        "scheme": "http",
        "root_path": "",
        "query_string": b"",
        "http_version": "1.1",
        "method": "GET"
    }
    request = Request(scope)

    # Mock state.user which is usually set by middleware
    # Request.state is a State object, we can set attributes on it
    user_mock = MagicMock()
    user_mock.username = "user_in_args"
    request.state.user = user_mock

    await op_with_args("val1", request, "val2")

    mock_db_session.add.assert_called()
    args, _ = mock_db_session.add.call_args
    entry = args[0]
    assert entry.ip_address == "1.2.3.4"
    assert entry.metadata_["actor_id"] == "user_in_args"

@pytest.mark.asyncio
async def test_audit_action_decorator_formatting_error(mock_db_session):
    """Test graceful fallback when resource template formatting fails."""

    @audit_action(action="test_fmt", resource_template="item_{missing_key}")
    async def bad_fmt_op(request: Request):
        return "ok"

    request = MagicMock(spec=Request)

    await bad_fmt_op(request=request)

    mock_db_session.add.assert_called()
    args, _ = mock_db_session.add.call_args
    entry = args[0]
    # Should fallback to unformatted template
    assert "item_{missing_key}" in entry.resource_id or "item_{missing_key}" in entry.resource_type

@pytest.mark.asyncio
async def test_audit_action_decorator_sync_function(mock_db_session):
    """Test decorator works with synchronous functions."""

    @audit_action(action="test_sync")
    def sync_op(request: Request):
        return "sync_result"

    request = MagicMock(spec=Request)

    # We await the wrapper because the decorator makes it async wrapper?
    # Wait, the decorator defines 'async_wrapper'. So even if func is sync, the wrapper is async.
    # But inside the wrapper:
    # if inspect.iscoroutinefunction(func): await ... else: func(...)
    # So we must await the decorated function.

    result = await sync_op(request=request)
    assert result == "sync_result"

    mock_db_session.add.assert_called()
    args, _ = mock_db_session.add.call_args
    entry = args[0]
    assert entry.action == "test_sync"

def test_audit_action_decorator_not_callable():
    """Test decorator returns object as-is if not callable."""
    # This covers the check: if hasattr(func, "__call__")

    not_a_func = "string_obj"
    decorated = audit_action(action="test")(not_a_func)

    assert decorated == "string_obj"

