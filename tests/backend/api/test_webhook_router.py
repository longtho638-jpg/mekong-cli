from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from fastapi import FastAPI, Request
from fastapi.testclient import TestClient

from backend.api.routers.webhooks.router import router as webhook_router
from backend.api.routers.webhooks.router import verify_github_signature, verify_stripe_signature

# Create a standalone app for testing to bypass global middleware (RateLimit, etc.)
app = FastAPI()
app.include_router(webhook_router, prefix="/api/webhooks")

# Override signature verification dependencies to always pass and return payload
async def mock_verify_stripe(request: Request):
    return await request.body()

async def mock_verify_github(request: Request):
    return await request.body()

app.dependency_overrides[verify_stripe_signature] = mock_verify_stripe
app.dependency_overrides[verify_github_signature] = mock_verify_github

client = TestClient(app)

class TestWebhookRouter:

    @pytest.fixture(autouse=True)
    def mock_dependencies(self):
        # Patch the services that are imported locally inside the router functions
        with patch("backend.services.webhook_receiver.webhook_receiver") as mock_receiver, \
             patch("backend.services.webhook_queue.webhook_queue") as mock_queue:

            self.mock_receiver = mock_receiver
            self.mock_queue = mock_queue

            # Setup receiver mock
            self.mock_receiver.receive_event = AsyncMock()

            # Setup queue mock
            self.mock_queue.enqueue = MagicMock()

            yield

    def test_stripe_webhook_success(self):
        # Setup
        payload = {
            "id": "evt_123",
            "type": "payment_intent.succeeded",
            "data": {"object": {"amount": 1000}}
        }

        # Mock receive_event to return an event dict
        self.mock_receiver.receive_event.return_value = {
            "id": "uuid-event-1",
            "event_id": "evt_123"
        }

        # Execute
        response = client.post(
            "/api/webhooks/stripe",
            json=payload,
            headers={"Stripe-Signature": "t=1,v1=sig"}
        )

        # Verify
        assert response.status_code == 200
        assert response.json() == {"status": "received"}

        # Check receiver called
        self.mock_receiver.receive_event.assert_called_once()
        call_kwargs = self.mock_receiver.receive_event.call_args[1]
        assert call_kwargs["provider"].value == "stripe"
        assert call_kwargs["event_id"] == "evt_123"
        assert call_kwargs["event_type"] == "payment_intent.succeeded"

        # Check queue called
        self.mock_queue.enqueue.assert_called_once_with("uuid-event-1")

    def test_stripe_webhook_invalid_payload(self):
        # Missing id and type
        payload = {"data": {}}

        response = client.post(
            "/api/webhooks/stripe",
            json=payload,
            headers={"Stripe-Signature": "sig"}
        )

        assert response.status_code == 400
        assert "Invalid payload" in response.json()["detail"]

    def test_github_webhook_success(self):
        # Setup
        payload = {"ref": "refs/heads/main"}
        headers = {
            "X-GitHub-Event": "push",
            "X-GitHub-Delivery": "del_123",
            "X-Hub-Signature-256": "sha256=sig"
        }

        self.mock_receiver.receive_event.return_value = {
            "id": "uuid-event-2",
            "event_id": "del_123"
        }

        # Execute
        response = client.post(
            "/api/webhooks/github",
            json=payload,
            headers=headers
        )

        # Verify
        assert response.status_code == 200

        self.mock_receiver.receive_event.assert_called_once()
        call_kwargs = self.mock_receiver.receive_event.call_args[1]
        assert call_kwargs["provider"].value == "github"
        assert call_kwargs["event_id"] == "del_123"
        assert call_kwargs["event_type"] == "push"

        self.mock_queue.enqueue.assert_called_once_with("uuid-event-2")

    def test_github_missing_delivery_id(self):
        payload = {}
        headers = {
            "X-GitHub-Event": "push",
            # Missing Delivery ID
            "X-Hub-Signature-256": "sha256=sig"
        }

        response = client.post(
            "/api/webhooks/github",
            json=payload,
            headers=headers
        )

        assert response.status_code == 400
        assert "Missing delivery ID" in response.json()["detail"]

    def test_paypal_webhook_success(self):
        # Setup
        payload = {
            "id": "evt_pp_123",
            "event_type": "PAYMENT.CAPTURE.COMPLETED",
            "resource": {}
        }

        self.mock_receiver.receive_event.return_value = {
            "id": "uuid-event-3"
        }

        # Execute
        response = client.post(
            "/api/webhooks/paypal",
            json=payload
        )

        # Verify
        assert response.status_code == 200

        self.mock_receiver.receive_event.assert_called_once()
        call_kwargs = self.mock_receiver.receive_event.call_args[1]
        assert call_kwargs["provider"].value == "paypal"

        self.mock_queue.enqueue.assert_called_once_with("uuid-event-3")
