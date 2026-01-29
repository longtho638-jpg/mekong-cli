"""
Payment Orchestrator - Defense in Depth
========================================
Multi-provider payment orchestration with automatic failover.
PayPal = Main Force, Polar = Reserve Force

Architecture:
- IPaymentProvider: Interface for payment providers
- PayPalProvider: Primary payment processor
- PolarProvider: Backup payment processor
- PaymentOrchestrator: Smart routing with failover logic

Failover Strategy:
1. Try PayPal first (primary)
2. On 5xx error or timeout, fallback to Polar
3. Log all provider switches for audit
"""

import logging
import time
from abc import ABC, abstractmethod
from datetime import datetime
from enum import Enum
from typing import Any, Dict, List, Optional

logger = logging.getLogger(__name__)


class PaymentProviderType(str, Enum):
    """Payment provider identifiers"""

    PAYPAL = "paypal"
    POLAR = "polar"


class PaymentError(Exception):
    """Base exception for payment errors"""

    pass


class ProviderUnavailableError(PaymentError):
    """Provider is temporarily unavailable (5xx, timeout)"""

    pass


class PaymentFailedError(PaymentError):
    """Payment failed permanently (4xx, invalid data)"""

    pass


class IPaymentProvider(ABC):
    """
    Interface for payment providers.

    All payment providers must implement this interface
    to be compatible with PaymentOrchestrator.
    """

    @abstractmethod
    def get_name(self) -> str:
        """Return provider name"""
        pass

    @abstractmethod
    def is_available(self) -> bool:
        """Check if provider is configured and available"""
        pass

    @abstractmethod
    def create_checkout_session(
        self,
        amount: float,
        currency: str = "USD",
        price_id: Optional[str] = None,
        success_url: Optional[str] = None,
        cancel_url: Optional[str] = None,
        customer_email: Optional[str] = None,
        tenant_id: Optional[str] = None,
        mode: str = "subscription",
    ) -> Dict[str, Any]:
        """
        Create a checkout session.

        Returns:
            Dict with keys: id, url, status

        Raises:
            ProviderUnavailableError: Provider unreachable (5xx, timeout)
            PaymentFailedError: Invalid request (4xx)
        """
        pass

    @abstractmethod
    def verify_webhook(
        self, headers: Dict[str, str], body: Any, webhook_secret: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Verify webhook signature and return parsed event.

        Raises:
            PaymentError: Invalid signature or malformed webhook
        """
        pass

    @abstractmethod
    def cancel_subscription(
        self, subscription_id: str, reason: Optional[str] = None
    ) -> Dict[str, Any]:
        """Cancel a subscription"""
        pass


class PayPalProvider(IPaymentProvider):
    """PayPal payment provider implementation"""

    def __init__(self):
        from core.finance.paypal_sdk import PayPalSDK

        self.client = PayPalSDK()

    def get_name(self) -> str:
        return PaymentProviderType.PAYPAL.value

    def is_available(self) -> bool:
        """Check if PayPal is configured"""
        try:
            # PayPalSDK should have credentials check
            return bool(self.client)
        except Exception as e:
            logger.warning(f"PayPal availability check failed: {e}")
            return False

    def create_checkout_session(
        self,
        amount: float,
        currency: str = "USD",
        price_id: Optional[str] = None,
        success_url: Optional[str] = None,
        cancel_url: Optional[str] = None,
        customer_email: Optional[str] = None,
        tenant_id: Optional[str] = None,
        mode: str = "subscription",
    ) -> Dict[str, Any]:
        """Create PayPal checkout session"""
        try:
            if mode == "subscription":
                if not price_id:
                    raise PaymentFailedError("PayPal Plan ID required for subscription")

                result = self.client.subscriptions.create(
                    plan_id=price_id,
                    custom_id=tenant_id or customer_email,
                    return_url=success_url,
                    cancel_url=cancel_url,
                )
            else:
                # One-time payment
                result = self.client.orders.create(
                    amount=amount,
                    currency=currency,
                    description=f"Payment for {tenant_id or customer_email or 'User'}",
                    custom_id=tenant_id or customer_email,
                    return_url=success_url,
                    cancel_url=cancel_url,
                )

            if not result or "id" not in result:
                raise ProviderUnavailableError("Invalid PayPal response")

            return result

        except Exception as e:
            error_msg = str(e).lower()

            # Check for 5xx errors or timeouts (retriable)
            if any(x in error_msg for x in ["500", "502", "503", "504", "timeout", "connection"]):
                raise ProviderUnavailableError(f"PayPal unavailable: {e}")

            # 4xx errors are permanent failures
            raise PaymentFailedError(f"PayPal payment failed: {e}")

    def verify_webhook(
        self, headers: Dict[str, str], body: Any, webhook_secret: Optional[str] = None
    ) -> Dict[str, Any]:
        """Verify PayPal webhook"""
        try:
            import json

            if not isinstance(body, dict):
                if isinstance(body, bytes):
                    body = json.loads(body.decode())
                elif isinstance(body, str):
                    body = json.loads(body)

            return self.client.webhooks.verify_signature(
                transmission_id=headers.get("paypal-transmission-id")
                or headers.get("PAYPAL-TRANSMISSION-ID"),
                transmission_time=headers.get("paypal-transmission-time")
                or headers.get("PAYPAL-TRANSMISSION-TIME"),
                cert_url=headers.get("paypal-cert-url") or headers.get("PAYPAL-CERT-URL"),
                auth_algo=headers.get("paypal-auth-algo") or headers.get("PAYPAL-AUTH-ALGO"),
                transmission_sig=headers.get("paypal-transmission-sig")
                or headers.get("PAYPAL-TRANSMISSION-SIG"),
                webhook_id=webhook_secret,
                webhook_event=body,
            )
        except Exception as e:
            raise PaymentError(f"PayPal webhook verification failed: {e}")

    def cancel_subscription(
        self, subscription_id: str, reason: Optional[str] = None
    ) -> Dict[str, Any]:
        """Cancel PayPal subscription"""
        try:
            return self.client.subscriptions.cancel(subscription_id, reason or "Canceled by user")
        except Exception as e:
            raise PaymentError(f"PayPal cancellation failed: {e}")


class PolarProvider(IPaymentProvider):
    """
    Polar payment provider implementation (Backup).

    Polar is a SaaS billing platform optimized for global subscriptions.
    Serves as backup when PayPal is unavailable.
    """

    def __init__(self):
        # TODO: Initialize Polar SDK when available
        # from polar_sdk import PolarClient
        # self.client = PolarClient()
        self.client = None
        logger.info("PolarProvider initialized (SDK integration pending)")

    def get_name(self) -> str:
        return PaymentProviderType.POLAR.value

    def is_available(self) -> bool:
        """Check if Polar is configured"""
        # TODO: Implement Polar availability check
        return self.client is not None

    def create_checkout_session(
        self,
        amount: float,
        currency: str = "USD",
        price_id: Optional[str] = None,
        success_url: Optional[str] = None,
        cancel_url: Optional[str] = None,
        customer_email: Optional[str] = None,
        tenant_id: Optional[str] = None,
        mode: str = "subscription",
    ) -> Dict[str, Any]:
        """Create Polar checkout session"""
        if not self.is_available():
            raise ProviderUnavailableError("Polar is not configured")

        # TODO: Implement Polar checkout creation
        # try:
        #     session = self.client.checkout.create(
        #         price_id=price_id,
        #         success_url=success_url,
        #         cancel_url=cancel_url,
        #         customer_email=customer_email,
        #         metadata={"tenant_id": tenant_id}
        #     )
        #     return {"id": session.id, "url": session.url, "status": "created"}
        # except Exception as e:
        #     raise ProviderUnavailableError(f"Polar unavailable: {e}")

        logger.warning("Polar provider not fully implemented, falling back")
        raise ProviderUnavailableError("Polar provider unavailable")

    def verify_webhook(
        self, headers: Dict[str, str], body: Any, webhook_secret: Optional[str] = None
    ) -> Dict[str, Any]:
        """Verify Polar webhook"""
        if not self.is_available():
            raise PaymentError("Polar is not configured")

        # TODO: Implement Polar webhook verification
        # try:
        #     return self.client.webhooks.verify(
        #         signature=headers.get("polar-signature"),
        #         payload=body,
        #         secret=webhook_secret
        #     )
        # except Exception as e:
        #     raise PaymentError(f"Polar webhook verification failed: {e}")

        logger.warning("Polar webhook verification not implemented")
        raise PaymentError("Polar webhook verification unavailable")

    def cancel_subscription(
        self, subscription_id: str, reason: Optional[str] = None
    ) -> Dict[str, Any]:
        """Cancel Polar subscription"""
        if not self.is_available():
            raise PaymentError("Polar is not configured")

        # TODO: Implement Polar cancellation
        logger.warning("Polar cancellation not implemented")
        raise PaymentError("Polar cancellation unavailable")


class PaymentOrchestrator:
    """
    Payment orchestration with automatic failover.

    Strategy:
    1. Try PayPal first (primary provider)
    2. On 5xx error or timeout, fallback to Polar
    3. Log all provider switches for audit trail

    Configuration:
    - Provider order: paypal -> polar
    - Failover triggers: 5xx errors, timeouts
    - Non-retriable: 4xx errors (permanent failures)
    """

    def __init__(self, provider_order: Optional[List[str]] = None):
        """
        Initialize orchestrator with provider order.

        Args:
            provider_order: List of provider names in priority order
                           Defaults to ["paypal", "polar"]
        """
        self.provider_order = provider_order or ["paypal", "polar"]

        # Initialize providers
        self.providers: Dict[str, IPaymentProvider] = {
            "paypal": PayPalProvider(),
            "polar": PolarProvider(),
        }

        # Failover statistics
        self.stats = {
            "total_requests": 0,
            "failovers": 0,
            "provider_usage": {name: 0 for name in self.providers.keys()},
        }

        logger.info(f"PaymentOrchestrator initialized with order: {self.provider_order}")

    def _get_provider(self, name: str) -> IPaymentProvider:
        """Get provider by name"""
        provider = self.providers.get(name)
        if not provider:
            raise PaymentError(f"Unknown provider: {name}")
        return provider

    def _log_failover(self, from_provider: str, to_provider: str, error: str):
        """Log provider failover event"""
        self.stats["failovers"] += 1
        logger.warning(
            f"PAYMENT FAILOVER: {from_provider} -> {to_provider} | "
            f"Reason: {error} | "
            f"Total failovers: {self.stats['failovers']}"
        )

    def create_checkout_session(
        self,
        amount: float,
        currency: str = "USD",
        price_id: Optional[str] = None,
        success_url: Optional[str] = None,
        cancel_url: Optional[str] = None,
        customer_email: Optional[str] = None,
        tenant_id: Optional[str] = None,
        mode: str = "subscription",
        preferred_provider: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Create checkout session with automatic failover.

        Args:
            amount: Payment amount
            currency: Currency code (default: USD)
            price_id: Provider-specific price/plan ID
            success_url: Redirect URL on success
            cancel_url: Redirect URL on cancellation
            customer_email: Customer email address
            tenant_id: Internal tenant identifier
            mode: "subscription" or "payment"
            preferred_provider: Override provider order (optional)

        Returns:
            Dict with keys: id, url, status, provider

        Raises:
            PaymentError: All providers failed
        """
        self.stats["total_requests"] += 1

        # Determine provider order
        if preferred_provider:
            order = [preferred_provider] + [
                p for p in self.provider_order if p != preferred_provider
            ]
        else:
            order = self.provider_order.copy()

        last_error = None

        for i, provider_name in enumerate(order):
            provider = self._get_provider(provider_name)

            # Skip unavailable providers
            if not provider.is_available():
                logger.info(f"Skipping {provider_name}: not configured")
                continue

            try:
                logger.info(
                    f"Attempting checkout with {provider_name} (attempt {i + 1}/{len(order)})"
                )

                result = provider.create_checkout_session(
                    amount=amount,
                    currency=currency,
                    price_id=price_id,
                    success_url=success_url,
                    cancel_url=cancel_url,
                    customer_email=customer_email,
                    tenant_id=tenant_id,
                    mode=mode,
                )

                # Success!
                self.stats["provider_usage"][provider_name] += 1
                result["provider"] = provider_name

                if i > 0:
                    # Log failover success
                    logger.info(f"Failover successful: using {provider_name}")

                return result

            except ProviderUnavailableError as e:
                # Retriable error - try next provider
                last_error = e

                if i < len(order) - 1:
                    next_provider = order[i + 1]
                    self._log_failover(provider_name, next_provider, str(e))
                else:
                    logger.error(f"All providers exhausted. Last error: {e}")

                continue

            except PaymentFailedError as e:
                # Permanent failure - don't retry
                logger.error(f"Payment failed permanently with {provider_name}: {e}")
                raise

        # All providers failed
        raise PaymentError(f"All payment providers failed. Last error: {last_error}")

    def verify_webhook(
        self,
        provider: str,
        headers: Dict[str, str],
        body: Any,
        webhook_secret: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Verify webhook from specific provider.

        Args:
            provider: Provider name (paypal, polar)
            headers: HTTP headers from webhook request
            body: Webhook payload
            webhook_secret: Provider-specific webhook secret

        Returns:
            Verified webhook event data

        Raises:
            PaymentError: Verification failed
        """
        provider_instance = self._get_provider(provider)
        return provider_instance.verify_webhook(headers, body, webhook_secret)

    def cancel_subscription(
        self, provider: str, subscription_id: str, reason: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Cancel subscription with specific provider.

        Args:
            provider: Provider name
            subscription_id: Provider-specific subscription ID
            reason: Cancellation reason

        Returns:
            Cancellation confirmation
        """
        provider_instance = self._get_provider(provider)
        return provider_instance.cancel_subscription(subscription_id, reason)

    def get_stats(self) -> Dict[str, Any]:
        """Get failover statistics"""
        return {
            **self.stats,
            "failover_rate": (
                self.stats["failovers"] / self.stats["total_requests"]
                if self.stats["total_requests"] > 0
                else 0
            ),
        }
