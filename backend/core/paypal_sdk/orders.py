from typing import Dict, Optional, List
from .base import PayPalBase

class Orders(PayPalBase):
    """Orders API v2 - /v2/checkout/orders"""

    def create(
        self,
        amount: float,
        currency: str = "USD",
        description: str = None,
        intent: str = "CAPTURE",
    ) -> Optional[Dict]:
        """Create order."""
        return self._api(
            "POST",
            "/v2/checkout/orders",
            {
                "intent": intent,
                "purchase_units": [
                    {
                        "amount": {"currency_code": currency, "value": str(amount)},
                        "description": description,
                    }
                ],
            },
        )

    def get(self, order_id: str) -> Optional[Dict]:
        """Get order details."""
        return self._api("GET", f"/v2/checkout/orders/{order_id}")

    def capture(self, order_id: str) -> Optional[Dict]:
        """Capture authorized order."""
        return self._api("POST", f"/v2/checkout/orders/{order_id}/capture", {})

    def authorize(self, order_id: str) -> Optional[Dict]:
        """Authorize order."""
        return self._api("POST", f"/v2/checkout/orders/{order_id}/authorize", {})

    def update(self, order_id: str, operations: List[Dict]) -> Optional[Dict]:
        """Update order."""
        return self._api("PATCH", f"/v2/checkout/orders/{order_id}", operations)
