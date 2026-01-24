from unittest.mock import MagicMock, patch

import pytest
from fastapi.testclient import TestClient

from backend.main import app
from backend.services.payment_service import PaymentService

client = TestClient(app)


@pytest.fixture
def mock_payment_service():
    with patch("backend.api.routers.gumroad_webhooks.payment_service") as mock:
        yield mock


def test_gumroad_webhook_success(mock_payment_service):
    # Mock verify_webhook to return the event data (as it does for Gumroad in our implementation)
    payload = {
        "email": "test@example.com",
        "product_id": "prod_123",
        "product_name": "Test Product",
        "price": "100",
        "currency": "USD",
        "sale_id": "sale_123",
        "license_key": "license_abc",
    }

    mock_payment_service.verify_webhook.return_value = payload

    response = client.post(
        "/webhooks/gumroad/",
        data=payload,
        headers={"Content-Type": "application/x-www-form-urlencoded"},
    )

    assert response.status_code == 200
    assert response.json() == {"status": "processed"}

    # Verify PaymentService methods were called
    mock_payment_service.verify_webhook.assert_called_once()
    mock_payment_service.handle_webhook_event.assert_called_once_with(
        provider="gumroad", event=payload
    )


def test_gumroad_webhook_failure(mock_payment_service):
    # Mock verify_webhook to raise an exception
    mock_payment_service.verify_webhook.side_effect = Exception("Invalid signature")

    payload = {"email": "bad@example.com"}

    response = client.post(
        "/webhooks/gumroad/",
        data=payload,
        headers={"Content-Type": "application/x-www-form-urlencoded"},
    )

    assert response.status_code == 400
    assert "Invalid signature" in response.json()["detail"]
