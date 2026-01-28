import sys
from unittest.mock import AsyncMock, MagicMock, Mock, patch

# Mock problematic dependencies before they are imported
sys.modules["supabase"] = MagicMock()
sys.modules["gotrue"] = MagicMock()
sys.modules["backend.services.audit_service"] = MagicMock()  # This might import supabase indirectly

import pytest

from backend.services.security_monitor import SecurityMonitor


@pytest.fixture
def monitor():
    return SecurityMonitor()

@pytest.mark.asyncio
async def test_monitor_logs_event(monitor):
    # Mock Redis and Logger
    monitor.redis = Mock()
    monitor.redis.incr.return_value = 1
    monitor.redis.exists.return_value = False

    with patch('backend.services.security_monitor.logger') as mock_logger:
        await monitor.log_security_event(
            event_type="failed_login",
            actor_id="user_123",
            ip_address="1.2.3.4",
            details={"reason": "bad_pass"}
        )

        # Verify log
        mock_logger.warning.assert_called_once()
        assert "SECURITY_EVENT" in mock_logger.warning.call_args[0][0]

        # Verify Redis increment
        monitor.redis.incr.assert_any_call("security:monitor:failed_login:ip:1.2.3.4")
        monitor.redis.incr.assert_any_call("security:monitor:failed_login:user:user_123")

@pytest.mark.asyncio
async def test_monitor_logs_permission_denied(monitor):
    monitor.redis = Mock()
    monitor.redis.incr.return_value = 1

    with patch('backend.services.security_monitor.logger') as _:
        await monitor.log_security_event(
            event_type="permission_denied",
            actor_id="user_456",
            ip_address="5.6.7.8"
        )

        # Verify Redis increment for permission denied
        monitor.redis.incr.assert_any_call("security:monitor:api_violation:ip:5.6.7.8")
        monitor.redis.incr.assert_any_call("security:monitor:api_violation:user:user_456")

@pytest.mark.asyncio
async def test_monitor_triggers_alert(monitor):
    monitor.redis = Mock()
    # Simulate hitting threshold (count = 10)
    monitor.redis.incr.return_value = 10
    monitor.redis.exists.return_value = False

    with patch('backend.services.security_monitor.logger') as mock_logger:
        await monitor.log_security_event(
            event_type="failed_login",
            actor_id="user_123",
            ip_address="1.2.3.4"
        )

        # Should trigger critical alert
        mock_logger.critical.assert_called()
        assert "SECURITY ALERT" in mock_logger.critical.call_args[0][0]

        # Should check cooldown
        monitor.redis.exists.assert_called_with("security:monitor:alert_cooldown:failed_login:user:user_123")
