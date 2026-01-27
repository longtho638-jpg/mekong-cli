import pytest
from unittest.mock import MagicMock, patch
from backend.core.payments.stripe_client import StripeClient
from backend.core.payments.subscription_manager import SubscriptionManager

@pytest.fixture
def mock_stripe():
    with patch("backend.core.payments.stripe_client.stripe") as mock:
        yield mock

@pytest.fixture
def stripe_client(mock_stripe):
    with patch.dict("os.environ", {"STRIPE_SECRET_KEY": "sk_test_123", "STRIPE_PUBLISHABLE_KEY": "pk_test_123"}):
        return StripeClient()

def test_is_configured(stripe_client):
    assert stripe_client.is_configured() is True

def test_create_checkout_session(stripe_client, mock_stripe):
    mock_stripe.checkout.Session.create.return_value = MagicMock(id="cs_123", url="https://stripe.com/checkout")

    result = stripe_client.create_checkout_session(
        price_id="price_123",
        success_url="https://example.com/success",
        cancel_url="https://example.com/cancel"
    )

    assert result["id"] == "cs_123"
    assert result["url"] == "https://stripe.com/checkout"
    mock_stripe.checkout.Session.create.assert_called_once()

def test_subscription_manager_create_checkout():
    mock_stripe_client = MagicMock()
    mock_stripe_client.price_solo = "price_solo_123"
    mock_stripe_client.create_checkout_session.return_value = {"id": "cs_123"}

    with patch("backend.core.payments.subscription_manager.StripeClient", return_value=mock_stripe_client):
        manager = SubscriptionManager()
        result = manager.create_subscription_checkout(
            tenant_id="tenant_1",
            plan_id="solo",
            customer_email="test@example.com",
            success_url="success",
            cancel_url="cancel"
        )
        assert result["id"] == "cs_123"
        # Check plan mapping logic
        mock_stripe_client.create_checkout_session.assert_called_with(
            price_id="price_solo_123",
            tenant_id="tenant_1",
            customer_email="test@example.com",
            customer_id=None,
            success_url="success",
            cancel_url="cancel",
            mode="subscription",
            trial_days=None
        )
