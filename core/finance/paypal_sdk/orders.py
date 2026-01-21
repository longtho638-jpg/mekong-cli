from typing import Dict, List, Optional

from .base import PayPalBase


class Orders(PayPalBase):
    """Orders API v2 - /v2/checkout/orders"""

    def create(
        self,
        amount: float,
        currency: str = "USD",
        description: str = None,
        intent: str = "CAPTURE",
        custom_id: str = None,
        return_url: str = None,
        cancel_url: str = None,
    ) -> Optional[Dict]:
        """
        Create order.
        
        Args:
            amount: The amount to charge.
            currency: Three-letter ISO 4217 currency code.
            description: Description of the purchase.
            intent: CAPTURE or AUTHORIZE.
            custom_id: Custom identifier (e.g., tenant_id) to be returned in webhooks.
            return_url: Redirect URL after approval.
            cancel_url: Redirect URL if cancelled.
        """
        data = {
            "intent": intent,
            "purchase_units": [
                {
                    "amount": {"currency_code": currency, "value": str(amount)},
                    "description": description,
                }
            ],
        }
        
        if custom_id:
            data["purchase_units"][0]["custom_id"] = custom_id
            
        if return_url or cancel_url:
            data["application_context"] = {}
            if return_url:
                data["application_context"]["return_url"] = return_url
            if cancel_url:
                data["application_context"]["cancel_url"] = cancel_url
                
        return self._api("POST", "/v2/checkout/orders", data)

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
