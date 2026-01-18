import os
from typing import Dict, List, Optional

from .base import PayPalBase


class Webhooks(PayPalBase):
    """Webhooks API - /v1/notifications/webhooks"""

    COMMON_EVENTS = [
        "PAYMENT.CAPTURE.COMPLETED",
        "PAYMENT.CAPTURE.DENIED",
        "CHECKOUT.ORDER.APPROVED",
        "BILLING.SUBSCRIPTION.CREATED",
        "BILLING.SUBSCRIPTION.CANCELLED",
        "CUSTOMER.DISPUTE.CREATED",
    ]

    def list(self) -> Optional[Dict]:
        """List webhooks."""
        return self._api("GET", "/v1/notifications/webhooks")

    def create(self, url: str, events: List[str] = None) -> Optional[Dict]:
        """Create webhook."""
        if events is None:
            events = self.COMMON_EVENTS
        return self._api(
            "POST",
            "/v1/notifications/webhooks",
            {"url": url, "event_types": [{"name": e} for e in events]},
        )

    def get(self, webhook_id: str) -> Optional[Dict]:
        """Get webhook details."""
        return self._api("GET", f"/v1/notifications/webhooks/{webhook_id}")

    def delete(self, webhook_id: str) -> Optional[Dict]:
        """Delete webhook."""
        return self._api("DELETE", f"/v1/notifications/webhooks/{webhook_id}")

    def verify_signature(
        self,
        transmission_id: str,
        transmission_time: str,
        cert_url: str,
        auth_algo: str,
        transmission_sig: str,
        webhook_id: str,
        webhook_event: Dict,
    ) -> Optional[Dict]:
        """Verify webhook signature."""
        return self._api(
            "POST",
            "/v1/notifications/verify-webhook-signature",
            {
                "transmission_id": transmission_id,
                "transmission_time": transmission_time,
                "cert_url": cert_url,
                "auth_algo": auth_algo,
                "transmission_sig": transmission_sig,
                "webhook_id": webhook_id,
                "webhook_event": webhook_event,
            },
        )

    def simulate(self, event_type: str = "PAYMENT.CAPTURE.COMPLETED") -> Optional[Dict]:
        """Simulate webhook event (sandbox only)."""
        webhook_id = os.environ.get("PAYPAL_WEBHOOK_ID")
        if not webhook_id:
            return None
        return self._api(
            "POST",
            "/v1/notifications/simulate-event",
            {"webhook_id": webhook_id, "event_type": event_type},
        )
