"""
Unit Tests for Payment Orchestrator
====================================
Tests failover behavior, provider switching, and error handling.

Test Scenarios:
1. PayPal success (no failover)
2. PayPal 5xx error -> Polar failover success
3. PayPal timeout -> Polar failover success
4. PayPal 4xx error (no failover, permanent failure)
5. Both providers fail
6. Provider statistics tracking
"""

import pytest
from unittest.mock import Mock, patch, MagicMock

from backend.services.payment_orchestrator import (
    PaymentOrchestrator,
    IPaymentProvider,
    PayPalProvider,
    PolarProvider,
    ProviderUnavailableError,
    PaymentFailedError,
    PaymentError
)


class MockPayPalProvider(IPaymentProvider):
    """Mock PayPal provider for testing"""

    def __init__(self, should_fail: bool = False, fail_type: str = "unavailable"):
        self.should_fail = should_fail
        self.fail_type = fail_type
        self.calls = 0

    def get_name(self) -> str:
        return "paypal"

    def is_available(self) -> bool:
        return True

    def create_checkout_session(self, **kwargs):
        self.calls += 1

        if self.should_fail:
            if self.fail_type == "unavailable":
                raise ProviderUnavailableError("PayPal 503 Service Unavailable")
            elif self.fail_type == "timeout":
                raise ProviderUnavailableError("PayPal connection timeout")
            elif self.fail_type == "permanent":
                raise PaymentFailedError("PayPal 400 Bad Request - Invalid plan ID")

        return {
            "id": "PAYPAL123",
            "url": "https://paypal.com/checkout/PAYPAL123",
            "status": "created"
        }

    def verify_webhook(self, headers, body, webhook_secret=None):
        return {"event_type": "PAYMENT.CAPTURE.COMPLETED", "resource": {}}

    def cancel_subscription(self, subscription_id, reason=None):
        return {"status": "cancelled"}


class MockPolarProvider(IPaymentProvider):
    """Mock Polar provider for testing"""

    def __init__(self, should_fail: bool = False):
        self.should_fail = should_fail
        self.calls = 0

    def get_name(self) -> str:
        return "polar"

    def is_available(self) -> bool:
        return True

    def create_checkout_session(self, **kwargs):
        self.calls += 1

        if self.should_fail:
            raise ProviderUnavailableError("Polar 500 Internal Server Error")

        return {
            "id": "POLAR456",
            "url": "https://polar.sh/checkout/POLAR456",
            "status": "created"
        }

    def verify_webhook(self, headers, body, webhook_secret=None):
        return {"type": "payment.succeeded", "data": {}}

    def cancel_subscription(self, subscription_id, reason=None):
        return {"status": "cancelled"}


class TestPaymentOrchestrator:
    """Test suite for PaymentOrchestrator"""

    def test_paypal_success_no_failover(self):
        """Test successful PayPal payment (no failover needed)"""
        # Setup
        paypal_mock = MockPayPalProvider(should_fail=False)
        polar_mock = MockPolarProvider()

        orchestrator = PaymentOrchestrator(provider_order=["paypal", "polar"])
        orchestrator.providers = {
            "paypal": paypal_mock,
            "polar": polar_mock
        }

        # Execute
        result = orchestrator.create_checkout_session(
            amount=99.99,
            currency="USD",
            mode="subscription"
        )

        # Assert
        assert result["id"] == "PAYPAL123"
        assert result["provider"] == "paypal"
        assert paypal_mock.calls == 1
        assert polar_mock.calls == 0  # Polar never called
        assert orchestrator.stats["failovers"] == 0

    def test_paypal_5xx_fallback_to_polar(self):
        """Test PayPal 5xx error triggers Polar failover"""
        # Setup
        paypal_mock = MockPayPalProvider(should_fail=True, fail_type="unavailable")
        polar_mock = MockPolarProvider(should_fail=False)

        orchestrator = PaymentOrchestrator(provider_order=["paypal", "polar"])
        orchestrator.providers = {
            "paypal": paypal_mock,
            "polar": polar_mock
        }

        # Execute
        result = orchestrator.create_checkout_session(
            amount=99.99,
            currency="USD",
            mode="subscription"
        )

        # Assert
        assert result["id"] == "POLAR456"
        assert result["provider"] == "polar"
        assert paypal_mock.calls == 1  # PayPal tried first
        assert polar_mock.calls == 1   # Polar used as fallback
        assert orchestrator.stats["failovers"] == 1

    def test_paypal_timeout_fallback_to_polar(self):
        """Test PayPal timeout triggers Polar failover"""
        # Setup
        paypal_mock = MockPayPalProvider(should_fail=True, fail_type="timeout")
        polar_mock = MockPolarProvider(should_fail=False)

        orchestrator = PaymentOrchestrator(provider_order=["paypal", "polar"])
        orchestrator.providers = {
            "paypal": paypal_mock,
            "polar": polar_mock
        }

        # Execute
        result = orchestrator.create_checkout_session(
            amount=99.99,
            currency="USD",
            mode="subscription"
        )

        # Assert
        assert result["provider"] == "polar"
        assert orchestrator.stats["failovers"] == 1

    def test_paypal_4xx_no_failover(self):
        """Test PayPal 4xx error does NOT trigger failover (permanent failure)"""
        # Setup
        paypal_mock = MockPayPalProvider(should_fail=True, fail_type="permanent")
        polar_mock = MockPolarProvider(should_fail=False)

        orchestrator = PaymentOrchestrator(provider_order=["paypal", "polar"])
        orchestrator.providers = {
            "paypal": paypal_mock,
            "polar": polar_mock
        }

        # Execute & Assert
        with pytest.raises(PaymentFailedError):
            orchestrator.create_checkout_session(
                amount=99.99,
                currency="USD",
                mode="subscription"
            )

        # Polar should NOT be called (4xx is permanent)
        assert paypal_mock.calls == 1
        assert polar_mock.calls == 0
        assert orchestrator.stats["failovers"] == 0

    def test_all_providers_fail(self):
        """Test all providers fail"""
        # Setup
        paypal_mock = MockPayPalProvider(should_fail=True, fail_type="unavailable")
        polar_mock = MockPolarProvider(should_fail=True)

        orchestrator = PaymentOrchestrator(provider_order=["paypal", "polar"])
        orchestrator.providers = {
            "paypal": paypal_mock,
            "polar": polar_mock
        }

        # Execute & Assert
        with pytest.raises(PaymentError, match="All payment providers failed"):
            orchestrator.create_checkout_session(
                amount=99.99,
                currency="USD",
                mode="subscription"
            )

        assert paypal_mock.calls == 1
        assert polar_mock.calls == 1
        assert orchestrator.stats["failovers"] == 1  # Attempted failover

    def test_provider_statistics(self):
        """Test provider usage statistics tracking"""
        # Setup
        paypal_mock = MockPayPalProvider(should_fail=False)
        polar_mock = MockPolarProvider(should_fail=False)

        orchestrator = PaymentOrchestrator(provider_order=["paypal", "polar"])
        orchestrator.providers = {
            "paypal": paypal_mock,
            "polar": polar_mock
        }

        # Execute multiple requests
        for _ in range(3):
            orchestrator.create_checkout_session(amount=99.99)

        # Assert
        stats = orchestrator.get_stats()
        assert stats["total_requests"] == 3
        assert stats["provider_usage"]["paypal"] == 3
        assert stats["provider_usage"]["polar"] == 0
        assert stats["failovers"] == 0
        assert stats["failover_rate"] == 0.0

    def test_preferred_provider_override(self):
        """Test preferred_provider parameter overrides default order"""
        # Setup
        paypal_mock = MockPayPalProvider(should_fail=False)
        polar_mock = MockPolarProvider(should_fail=False)

        orchestrator = PaymentOrchestrator(provider_order=["paypal", "polar"])
        orchestrator.providers = {
            "paypal": paypal_mock,
            "polar": polar_mock
        }

        # Execute with preferred_provider=polar
        result = orchestrator.create_checkout_session(
            amount=99.99,
            preferred_provider="polar"
        )

        # Assert
        assert result["provider"] == "polar"
        assert paypal_mock.calls == 0  # PayPal skipped
        assert polar_mock.calls == 1

    def test_webhook_verification_routing(self):
        """Test webhook verification routes to correct provider"""
        # Setup
        paypal_mock = MockPayPalProvider()
        polar_mock = MockPolarProvider()

        orchestrator = PaymentOrchestrator()
        orchestrator.providers = {
            "paypal": paypal_mock,
            "polar": polar_mock
        }

        # Test PayPal webhook
        event = orchestrator.verify_webhook(
            provider="paypal",
            headers={"paypal-transmission-id": "123"},
            body={"event_type": "PAYMENT.CAPTURE.COMPLETED"}
        )
        assert "event_type" in event

        # Test Polar webhook
        event = orchestrator.verify_webhook(
            provider="polar",
            headers={"polar-signature": "abc"},
            body={"type": "payment.succeeded"}
        )
        assert "type" in event

    def test_cancel_subscription_routing(self):
        """Test subscription cancellation routes to correct provider"""
        # Setup
        paypal_mock = MockPayPalProvider()
        polar_mock = MockPolarProvider()

        orchestrator = PaymentOrchestrator()
        orchestrator.providers = {
            "paypal": paypal_mock,
            "polar": polar_mock
        }

        # Test PayPal cancellation
        result = orchestrator.cancel_subscription(
            provider="paypal",
            subscription_id="SUB123",
            reason="Customer request"
        )
        assert result["status"] == "cancelled"


# Integration test fixtures
@pytest.fixture
def mock_paypal_sdk():
    """Mock PayPalSDK for integration tests"""
    with patch("backend.services.payment_orchestrator.PayPalSDK") as mock:
        sdk_instance = MagicMock()
        sdk_instance.subscriptions.create.return_value = {
            "id": "I-REAL123",
            "status": "APPROVAL_PENDING",
            "links": [{"rel": "approve", "href": "https://paypal.com/approve"}]
        }
        mock.return_value = sdk_instance
        yield mock


@pytest.fixture
def orchestrator():
    """Provide PaymentOrchestrator instance"""
    return PaymentOrchestrator(provider_order=["paypal", "polar"])


# Run tests
if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
