"""
🧪 Test Suite: ControlCenter (Simplified)
==========================================

Simplified tests that match actual ControlCenter API.
"""

import os
import sys

import pytest

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", ".."))

from antigravity.core.control import (
    ControlCenter,
    check_breaker,
    check_rate,
    get_control,
    is_enabled,
)


class TestFeatureFlags:
    """Test feature flag functionality."""

    @pytest.fixture
    def control(self):
        return ControlCenter()

    def test_flag_enabled(self, control):
        """Test flag is enabled when set."""
        control.set_flag("test_feature", enabled=True)
        assert control.is_enabled("test_feature")

    def test_flag_disabled(self, control):
        """Test flag can be disabled."""
        control.set_flag("test_feature", enabled=False)
        assert not control.is_enabled("test_feature")

    def test_unknown_flag_defaults_enabled(self, control):
        """Test unknown flag returns True by default."""
        # Default behavior in control.py returns True for unknown
        result = control.is_enabled("unknown_flag")
        assert result is True


class TestCircuitBreakers:
    """Test circuit breaker functionality."""

    @pytest.fixture
    def control(self):
        return ControlCenter()

    def test_breaker_starts_closed(self, control):
        """Test breaker starts allowing requests."""
        assert control.check_breaker("new_service")

    def test_breaker_opens_after_failures(self, control):
        """Test breaker opens after threshold failures."""
        service = "failing_service"

        # Default threshold is 5
        for _ in range(5):
            control.record_failure(service)

        # Should be open now
        assert not control.check_breaker(service)

    def test_breaker_records_success(self, control):
        """Test recording success."""
        service = "test_service"
        control.record_failure(service)
        control.record_success(service)
        assert control.check_breaker(service)


class TestRateGovernors:
    """Test rate governor functionality."""

    @pytest.fixture
    def control(self):
        return ControlCenter()

    def test_rate_under_limit(self, control):
        """Test rate check passes under limit."""
        control.set_rate_limit("api", 100)
        assert control.check_rate("api")

    def test_rate_over_limit(self, control):
        """Test rate check fails over limit."""
        control.set_rate_limit("strict", 2, 60)

        # Make calls
        assert control.check_rate("strict")
        assert control.check_rate("strict")
        assert not control.check_rate("strict")


class TestModuleFunctions:
    """Test module-level convenience functions."""

    def test_get_control_returns_instance(self):
        """Test get_control returns ControlCenter."""
        control = get_control()
        assert isinstance(control, ControlCenter)

    def test_is_enabled_function(self):
        """Test is_enabled function."""
        control = get_control()
        control.set_flag("test", enabled=True)
        assert is_enabled("test")

    def test_check_breaker_function(self):
        """Test check_breaker function."""
        assert check_breaker("some_service")

    def test_check_rate_function(self):
        """Test check_rate function."""
        assert check_rate("some_resource")


class TestControlCenterStatus:
    """Test status reporting."""

    def test_get_status(self):
        """Test status endpoint returns dict."""
        control = ControlCenter()
        status = control.get_status()

        assert "flags" in status
        assert "breakers" in status
        assert "governors" in status


# Run with: pytest backend/tests/test_viral_control.py -v
