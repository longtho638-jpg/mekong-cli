import pytest
import time
from unittest.mock import MagicMock
from antigravity.core.ops.auto_healer import AutoHealer, HealthStatus

def test_auto_healer_registration():
    healer = AutoHealer()
    healer.register_service("database")

    status = healer.get_system_status()
    assert "database" in status
    assert status["database"] == "healthy"

def test_auto_healer_recovery_trigger():
    healer = AutoHealer()

    # Mock recovery action
    recovery_mock = MagicMock(return_value="Recovered")
    healer.register_recovery_action("api_gateway", recovery_mock)

    # Report failures (threshold is 3)
    healer.report_health("api_gateway", HealthStatus.UNHEALTHY, "Timeout")
    assert recovery_mock.call_count == 0 # 1 error

    healer.report_health("api_gateway", HealthStatus.UNHEALTHY, "Timeout")
    assert recovery_mock.call_count == 0 # 2 errors

    healer.report_health("api_gateway", HealthStatus.UNHEALTHY, "Timeout")
    assert recovery_mock.call_count == 1 # 3 errors -> Trigger

    # Verify status reset attempt (naive implementation in AutoHealer resets to DEGRADED)
    status = healer.get_system_status()
    assert status["api_gateway"] == "degraded"

def test_auto_healer_recovery_failure():
    healer = AutoHealer()

    # Mock failing action
    def failing_action():
        raise RuntimeError("Restart failed")

    healer.register_recovery_action("cache", failing_action)

    # Trigger threshold
    for _ in range(3):
        healer.report_health("cache", HealthStatus.UNHEALTHY)

    # Should catch exception and log error, not crash
    status = healer.get_system_status()
    assert status["cache"] == "unhealthy" # Should remain unhealthy if recovery fails

if __name__ == "__main__":
    test_auto_healer_registration()
    test_auto_healer_recovery_trigger()
    test_auto_healer_recovery_failure()
