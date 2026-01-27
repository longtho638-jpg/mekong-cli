from unittest.mock import MagicMock, patch

import pytest

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

def test_invoice_manager_list_invoices():
    mock_stripe_client = MagicMock()
    mock_invoice = MagicMock()
    mock_invoice.id = "inv_123"
    mock_invoice.amount_due = 1000
    mock_invoice.created = 1600000000
    mock_stripe_client.list_invoices.return_value = [mock_invoice]

    with patch("backend.core.payments.invoice_manager.StripeClient", return_value=mock_stripe_client):
        from backend.core.payments.invoice_manager import InvoiceManager
        manager = InvoiceManager()
        invoices = manager.list_customer_invoices("cus_123")
        assert len(invoices) == 1
        assert invoices[0]["id"] == "inv_123"
        assert invoices[0]["amount_due"] == 10.0  # Converted from cents

def test_webhook_handler_checkout_completed():
    mock_stripe_client = MagicMock()
    mock_stripe_client.construct_event.return_value = {
        "id": "evt_123",
        "type": "checkout.session.completed",
        "data": {
            "object": {
                "metadata": {"tenant_id": "tenant_1"},
                "customer_details": {"email": "test@example.com"},
                "customer": "cus_123",
                "subscription": "sub_123",
                "mode": "subscription"
            }
        }
    }

    mock_provisioning = MagicMock()
    mock_licensing = MagicMock()

    with patch("backend.core.payments.webhook_handler.StripeClient", return_value=mock_stripe_client), \
         patch("backend.core.payments.webhook_handler.ProvisioningService", return_value=mock_provisioning), \
         patch("backend.core.payments.webhook_handler.LicenseGenerator", return_value=mock_licensing):

        from backend.core.payments.webhook_handler import WebhookHandler
        handler = WebhookHandler()

        result = handler.verify_and_process_stripe(b"payload", "sig_header")

        assert result["status"] == "processed"
        assert result["type"] == "checkout.session.completed"

        # Verify provisioning called
        mock_provisioning.activate_subscription.assert_called_with(
            tenant_id="tenant_1",
            plan="PRO",
            provider="stripe",
            subscription_id="sub_123",
            customer_id="cus_123"
        )

        # Verify license generated
        mock_licensing.generate.assert_called()
