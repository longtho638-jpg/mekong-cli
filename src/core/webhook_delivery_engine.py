"""Mekong CLI - Webhook Delivery Engine.

Outbound webhook/callback delivery for Mekong orchestration events.
Inspired by Cal.com's webhook system: HMAC-signed payloads, retry with
exponential backoff, per-endpoint event filtering.
"""

import hashlib
import hmac
import json
import time
from dataclasses import dataclass, field
from enum import Enum
from typing import Any

import requests  # type: ignore[import-untyped]


class WebhookEvent(str, Enum):
    """Events that can be delivered to webhook endpoints."""

    TASK_CREATED = "task.created"
    TASK_COMPLETED = "task.completed"
    TASK_FAILED = "task.failed"
    AGENT_SPAWNED = "agent.spawned"
    AGENT_CRASHED = "agent.crashed"
    BUILD_SUCCESS = "build.success"
    BUILD_FAILED = "build.failed"


@dataclass
class WebhookEndpoint:
    """A registered webhook endpoint."""

    url: str
    secret: str
    events: list[WebhookEvent]
    active: bool = True
    created_at: float = field(default_factory=time.time)


@dataclass
class WebhookPayload:
    """Signed payload sent to a webhook endpoint."""

    event: WebhookEvent
    timestamp: float
    data: dict[str, Any]
    signature: str = ""


class WebhookDeliveryEngine:
    """Delivers signed webhook payloads to registered endpoints.

    Supports HMAC-SHA256 payload signing and automatic retry
    with exponential backoff on delivery failure.
    """

    def __init__(self, timeout: int = 10) -> None:
        """Initialize the delivery engine.

        Args:
            timeout: HTTP request timeout in seconds.

        """
        self._endpoints: dict[str, WebhookEndpoint] = {}
        self._timeout = timeout

    def register(
        self,
        url: str,
        secret: str,
        events: list[WebhookEvent],
    ) -> WebhookEndpoint:
        """Register a new webhook endpoint.

        Args:
            url: The destination URL to POST events to.
            secret: Shared secret for HMAC-SHA256 signing.
            events: List of event types to deliver to this endpoint.

        Returns:
            The newly registered WebhookEndpoint.

        """
        endpoint = WebhookEndpoint(url=url, secret=secret, events=events)
        self._endpoints[url] = endpoint
        return endpoint

    def unregister(self, url: str) -> None:
        """Remove a registered webhook endpoint.

        Args:
            url: The URL of the endpoint to remove.

        """
        self._endpoints.pop(url, None)

    def deliver(self, event: WebhookEvent, data: dict[str, Any]) -> None:
        """Deliver an event to all matching active endpoints.

        Filters endpoints by subscribed event types and delivers
        a signed payload to each. Retries on failure.

        Args:
            event: The event type being delivered.
            data: Arbitrary event data to include in the payload.

        """
        timestamp = time.time()
        for endpoint in list(self._endpoints.values()):
            if not endpoint.active or event not in endpoint.events:
                continue
            body = json.dumps(
                {"event": event.value, "timestamp": timestamp, "data": data},
                separators=(",", ":"),
            )
            signature = self._sign_payload(body, endpoint.secret)
            payload = WebhookPayload(
                event=event,
                timestamp=timestamp,
                data=data,
                signature=signature,
            )
            self._retry_delivery(endpoint, payload, body, signature)

    def _sign_payload(self, body: str, secret: str) -> str:
        """Generate HMAC-SHA256 signature for a payload body.

        Args:
            body: JSON-serialised payload string.
            secret: Shared secret for signing.

        Returns:
            Hex-encoded HMAC-SHA256 digest prefixed with 'sha256='.

        """
        digest = hmac.new(
            secret.encode("utf-8"),
            body.encode("utf-8"),
            hashlib.sha256,
        ).hexdigest()
        return f"sha256={digest}"

    def _retry_delivery(
        self,
        endpoint: WebhookEndpoint,
        payload: WebhookPayload,
        body: str,
        signature: str,
        max_retries: int = 3,
    ) -> bool:
        """Deliver payload with exponential backoff retry.

        Args:
            endpoint: The target webhook endpoint.
            payload: Structured payload (for reference).
            body: Pre-serialised JSON body string.
            signature: HMAC signature header value.
            max_retries: Maximum number of delivery attempts.

        Returns:
            True if delivery succeeded, False if all retries exhausted.

        """
        headers = {
            "Content-Type": "application/json",
            "X-Mekong-Signature": signature,
            "X-Mekong-Event": payload.event.value,
        }
        for attempt in range(max_retries):
            try:
                resp = requests.post(
                    endpoint.url,
                    data=body,
                    headers=headers,
                    timeout=self._timeout,
                )
                if resp.status_code < 300:
                    return True
            except requests.RequestException:
                pass
            if attempt < max_retries - 1:
                time.sleep(2 ** attempt)
        return False

    def list_endpoints(self) -> list[WebhookEndpoint]:
        """Return all registered webhook endpoints.

        Returns:
            List of all registered WebhookEndpoint instances.

        """
        return list(self._endpoints.values())


__all__ = [
    "WebhookDeliveryEngine",
    "WebhookEndpoint",
    "WebhookEvent",
    "WebhookPayload",
]
