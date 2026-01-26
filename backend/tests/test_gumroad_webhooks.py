from unittest.mock import MagicMock, patch

import pytest
from fastapi import Request
from fastapi.testclient import TestClient

from backend.main import app
from backend.services.payment_service import PaymentService

# ========== Dependency Override for Authentication ==========

async def mock_verify_gumroad_webhook_dependency(request: Request):
    """Mock dependency that bypasses signature verification for testing."""
    return b""  # Return empty bytes (signature verified)


@pytest.fixture
def client_with_mocked_auth():
    """TestClient with mocked webhook authentication."""
    from backend.api.routers.gumroad_webhooks import verify_gumroad_webhook

    # Override the dependency
    app.dependency_overrides[verify_gumroad_webhook] = mock_verify_gumroad_webhook_dependency

    client = TestClient(app)
    yield client

    # Cleanup: remove override
    app.dependency_overrides.clear()


@pytest.fixture
def mock_payment_service():
    with patch("backend.api.routers.gumroad_webhooks.payment_service") as mock:
        yield mock


def test_gumroad_webhook_success(client_with_mocked_auth, mock_payment_service):
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

    response = client_with_mocked_auth.post(
        "/webhooks/gumroad/",
        data=payload,
        headers={"Content-Type": "application/x-www-form-urlencoded"},
    )

    assert response.status_code == 200
    assert response.json() == {"status": "processed", "verified": True}

    # Verify PaymentService methods were called
    mock_payment_service.handle_webhook_event.assert_called_once_with(
        provider="gumroad", event=payload
    )


def test_gumroad_webhook_failure(client_with_mocked_auth, mock_payment_service):
    # Mock handle_webhook_event to raise an exception
    mock_payment_service.handle_webhook_event.side_effect = Exception("Processing error")

    payload = {"email": "bad@example.com"}

    response = client_with_mocked_auth.post(
        "/webhooks/gumroad/",
        data=payload,
        headers={"Content-Type": "application/x-www-form-urlencoded"},
    )

    assert response.status_code == 400
    assert "Processing error" in response.json()["detail"]
