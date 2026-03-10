"""
RaaS Webhook Bridge - Stripe/Polar Billing Integration

Bridges usage metrics from RaaS Gateway to billing providers:
- Stripe Usage Records (for Stripe subscriptions)
- Polar Usage Reports (for Polar benefit tracking)

Supports:
- Webhook event transformation
- Async push to billing providers
- Retry logic with exponential backoff
- Idempotency keys for deduplication

Usage:
    from src.raas.webhook_bridge import WebhookBridge

    bridge = WebhookBridge()
    await bridge.push_to_stripe(tenant_id, usage_data)
    await bridge.push_to_polar(tenant_id, usage_data)
"""

from __future__ import annotations

import hashlib
import json
import logging
import os
import time
from dataclasses import dataclass
from datetime import datetime, timezone
from enum import Enum
from typing import Any, Dict, List, Optional

from .usage_event_schema import WebhookEvent


class BillingProvider(str, Enum):
    """Supported billing providers."""

    STRIPE = "stripe"
    POLAR = "polar"


@dataclass
class WebhookResult:
    """Result of webhook push attempt."""

    success: bool
    provider: BillingProvider
    event_id: str
    status_code: Optional[int] = None
    error: Optional[str] = None
    retries: int = 0
    elapsed_ms: float = 0.0


@dataclass
class WebhookConfig:
    """Configuration for webhook bridge."""

    stripe_api_key: Optional[str] = None
    stripe_api_base: str = "https://api.stripe.com/v1"
    polar_api_key: Optional[str] = None
    polar_api_base: str = "https://api.polar.sh/v1"
    max_retries: int = 3
    retry_delay_ms: int = 1000
    timeout_seconds: int = 30


class WebhookBridge:
    """
    Webhook Bridge for billing provider integration.

    Transforms usage events into provider-specific formats
    and pushes to billing systems asynchronously.

    Attributes:
        config: Webhook configuration
        logger: Logger for audit trail
    """

    def __init__(self, config: Optional[WebhookConfig] = None):
        """
        Initialize webhook bridge.

        Args:
            config: Optional webhook configuration.
                    Loads from environment if not provided.
        """
        self.config = config or self._load_config()
        self.logger = logging.getLogger(__name__)

        # Idempotency cache (in-memory for CLI usage)
        self._idempotency_cache: Dict[str, datetime] = {}

    def _load_config(self) -> WebhookConfig:
        """Load configuration from environment variables."""
        return WebhookConfig(
            stripe_api_key=os.getenv("STRIPE_SECRET_KEY"),
            polar_api_key=os.getenv("POLAR_API_KEY"),
        )

    def build_stripe_event(
        self,
        tenant_id: str,
        usage_data: Dict[str, Any],
    ) -> WebhookEvent:
        """
        Build Stripe Usage Record event.

        Args:
            tenant_id: Tenant/customer identifier
            usage_data: Usage metrics data

        Returns:
            WebhookEvent in Stripe format
        """
        event = WebhookEvent(
            type=BillingProvider.STRIPE.value,
            tenant_id=tenant_id,
            usage_data=usage_data,
        )
        return event

    def build_polar_event(
        self,
        tenant_id: str,
        usage_data: Dict[str, Any],
    ) -> WebhookEvent:
        """
        Build Polar Usage Report event.

        Args:
            tenant_id: Tenant/customer identifier
            usage_data: Usage metrics data

        Returns:
            WebhookEvent in Polar format
        """
        event = WebhookEvent(
            type=BillingProvider.POLAR.value,
            tenant_id=tenant_id,
            usage_data=usage_data,
        )
        return event

    def generate_idempotency_key(self, event: WebhookEvent) -> str:
        """
        Generate idempotency key for event deduplication.

        Args:
            event: WebhookEvent to generate key for

        Returns:
            SHA256 hash of event data
        """
        key_data = json.dumps(
            {
                "type": event.type,
                "tenant_id": event.tenant_id,
                "created_at": event.created_at.isoformat(),
                "usage_hash": hashlib.sha256(
                    json.dumps(event.usage_data, sort_keys=True).encode()
                ).hexdigest(),
            },
            sort_keys=True,
        )
        return hashlib.sha256(key_data.encode("utf-8")).hexdigest()

    def is_duplicate(self, idempotency_key: str) -> bool:
        """
        Check if event is a duplicate.

        Args:
            idempotency_key: Idempotency key to check

        Returns:
            True if duplicate, False otherwise
        """
        from datetime import timedelta

        # Clean old entries (older than 24 hours)
        cutoff = datetime.now(timezone.utc) - timedelta(hours=24)
        self._idempotency_cache = {
            k: v for k, v in self._idempotency_cache.items() if v > cutoff
        }

        return idempotency_key in self._idempotency_cache

    def mark_sent(self, idempotency_key: str) -> None:
        """
        Mark event as sent.

        Args:
            idempotency_key: Idempotency key for the event
        """
        self._idempotency_cache[idempotency_key] = datetime.now(timezone.utc)

    async def push_to_stripe(
        self,
        event: WebhookEvent,
        subscription_item_id: str,
    ) -> WebhookResult:
        """
        Push usage event to Stripe.

        Args:
            event: WebhookEvent to push
            subscription_item_id: Stripe subscription item ID

        Returns:
            WebhookResult with push status
        """
        import requests

        start_time = time.perf_counter()
        idempotency_key = self.generate_idempotency_key(event)

        # Check for duplicates
        if self.is_duplicate(idempotency_key):
            return WebhookResult(
                success=False,
                provider=BillingProvider.STRIPE,
                event_id=event.id,
                error="Duplicate event (idempotency key exists)",
            )

        # Build Stripe API request
        url = f"{self.config.stripe_api_base}/usage_records"
        headers = {
            "Authorization": f"Bearer {self.config.stripe_api_key}",
            "Content-Type": "application/x-www-form-urlencoded",
            "Idempotency-Key": idempotency_key,
        }
        data = {
            "subscription_item": subscription_item_id,
            "quantity": event.usage_data.get("total_tokens", 0),
            "timestamp": int(event.created_at.timestamp()),
            "action": "set",
        }

        # Retry loop with exponential backoff
        last_error = None
        for retry in range(self.config.max_retries):
            try:
                response = requests.post(
                    url,
                    headers=headers,
                    data=data,
                    timeout=self.config.timeout_seconds,
                )

                if response.status_code in (200, 201):
                    self.mark_sent(idempotency_key)
                    return WebhookResult(
                        success=True,
                        provider=BillingProvider.STRIPE,
                        event_id=event.id,
                        status_code=response.status_code,
                        elapsed_ms=(time.perf_counter() - start_time) * 1000,
                    )

                last_error = f"Stripe returned {response.status_code}: {response.text}"

            except requests.RequestException as e:
                last_error = f"Request failed: {str(e)}"

            # Exponential backoff
            if retry < self.config.max_retries - 1:
                delay = self.config.retry_delay_ms * (2**retry) / 1000.0
                time.sleep(delay)

        return WebhookResult(
            success=False,
            provider=BillingProvider.STRIPE,
            event_id=event.id,
            error=last_error,
            retries=self.config.max_retries,
            elapsed_ms=(time.perf_counter() - start_time) * 1000,
        )

    async def push_to_polar(
        self,
        event: WebhookEvent,
        benefit_id: Optional[str] = None,
    ) -> WebhookResult:
        """
        Push usage event to Polar.

        Args:
            event: WebhookEvent to push
            benefit_id: Polar benefit ID (optional)

        Returns:
            WebhookResult with push status
        """
        import requests

        start_time = time.perf_counter()
        idempotency_key = self.generate_idempotency_key(event)

        # Check for duplicates
        if self.is_duplicate(idempotency_key):
            return WebhookResult(
                success=False,
                provider=BillingProvider.POLAR,
                event_id=event.id,
                error="Duplicate event (idempotency key exists)",
            )

        # Build Polar API request
        url = f"{self.config.polar_api_base}/benefits/usage"
        headers = {
            "Authorization": f"Bearer {self.config.polar_api_key}",
            "Content-Type": "application/json",
        }
        payload = {
            "benefit_id": benefit_id or event.usage_data.get("benefit_id"),
            "customer_id": event.tenant_id,
            "used": event.usage_data.get("total_tokens", 0),
            "unit": event.usage_data.get("unit", "tokens"),
            "reported_at": event.created_at.isoformat(),
        }

        # Retry loop with exponential backoff
        last_error = None
        for retry in range(self.config.max_retries):
            try:
                response = requests.post(
                    url,
                    headers=headers,
                    json=payload,
                    timeout=self.config.timeout_seconds,
                )

                if response.status_code in (200, 201):
                    self.mark_sent(idempotency_key)
                    return WebhookResult(
                        success=True,
                        provider=BillingProvider.POLAR,
                        event_id=event.id,
                        status_code=response.status_code,
                        elapsed_ms=(time.perf_counter() - start_time) * 1000,
                    )

                last_error = f"Polar returned {response.status_code}: {response.text}"

            except requests.RequestException as e:
                last_error = f"Request failed: {str(e)}"

            # Exponential backoff
            if retry < self.config.max_retries - 1:
                delay = self.config.retry_delay_ms * (2**retry) / 1000.0
                time.sleep(delay)

        return WebhookResult(
            success=False,
            provider=BillingProvider.POLAR,
            event_id=event.id,
            error=last_error,
            retries=self.config.max_retries,
            elapsed_ms=(time.perf_counter() - start_time) * 1000,
        )

    async def push_to_gateway(
        self,
        events: List[WebhookEvent],
        gateway_url: Optional[str] = None,
    ) -> List[WebhookResult]:
        """
        Push webhook events to RaaS Gateway for relay.

        Args:
            events: List of WebhookEvent to push
            gateway_url: Gateway URL (default: from env)

        Returns:
            List of WebhookResult for each event
        """
        import requests

        gateway_url = gateway_url or os.getenv(
            "RAAS_GATEWAY_URL", "https://raas.agencyos.network"
        )
        url = f"{gateway_url}/v1/billing/webhook-relay"

        # Get auth token
        token = os.getenv("RAAS_LICENSE_KEY")
        if not token:
            return [
                WebhookResult(
                    success=False,
                    provider=BillingProvider.STRIPE,  # Default
                    event_id=e.id,
                    error="No RAAS_LICENSE_KEY for gateway auth",
                )
                for e in events
            ]

        headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
        }
        payload = {
            "events": [e.to_dict() for e in events],
            "count": len(events),
        }

        try:
            response = requests.post(
                url,
                headers=headers,
                json=payload,
                timeout=30,
            )

            if response.status_code in (200, 201):
                return [
                    WebhookResult(
                        success=True,
                        provider=BillingProvider(e.type),
                        event_id=e.id,
                        status_code=response.status_code,
                    )
                    for e in events
                ]
            else:
                return [
                    WebhookResult(
                        success=False,
                        provider=BillingProvider(e.type),
                        event_id=e.id,
                        status_code=response.status_code,
                        error=f"Gateway returned {response.status_code}",
                    )
                    for e in events
                ]

        except requests.RequestException:
            return [
                WebhookResult(
                    success=False,
                    provider=BillingProvider(e.type),
                    event_id=e.id,
                    error=f"Gateway request failed: {str(e)}",
                )
                for e in events
            ]

    def transform_hourly_buckets(
        self,
        buckets: List[Dict[str, Any]],
        provider: BillingProvider,
    ) -> List[WebhookEvent]:
        """
        Transform hourly buckets to webhook events.

        Args:
            buckets: List of hourly bucket dictionaries
            provider: Target billing provider

        Returns:
            List of WebhookEvent ready for push
        """
        events = []
        for bucket in buckets:
            event = WebhookEvent(
                type=provider.value,
                tenant_id=bucket.get("tenant_id", "unknown"),
                usage_data={
                    "hour_bucket": bucket.get("hour_bucket"),
                    "total_tokens": bucket.get("total_tokens", 0),
                    "event_count": bucket.get("event_count", 0),
                    "events_by_type": bucket.get("events_by_type", {}),
                },
            )
            events.append(event)
        return events


# Global instance
_bridge: Optional[WebhookBridge] = None


def get_bridge(config: Optional[WebhookConfig] = None) -> WebhookBridge:
    """Get global webhook bridge instance."""
    global _bridge
    if _bridge is None:
        _bridge = WebhookBridge(config)
    return _bridge


def reset_bridge() -> None:
    """Reset global bridge instance (for testing)."""
    global _bridge
    _bridge = None
