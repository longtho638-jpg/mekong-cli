from typing import Dict, Optional
from .base import PayPalBase

class Payments(PayPalBase):
    """Payments API v2 - /v2/payments"""

    def get_capture(self, capture_id: str) -> Optional[Dict]:
        """Get capture details."""
        return self._api("GET", f"/v2/payments/captures/{capture_id}")

    def refund_capture(
        self,
        capture_id: str,
        amount: float = None,
        currency: str = "USD",
    ) -> Optional[Dict]:
        """Refund a captured payment."""
        data = {}
        if amount:
            data["amount"] = {"currency_code": currency, "value": str(amount)}
        return self._api("POST", f"/v2/payments/captures/{capture_id}/refund", data)

    def get_refund(self, refund_id: str) -> Optional[Dict]:
        """Get refund details."""
        return self._api("GET", f"/v2/payments/refunds/{refund_id}")

    def get_authorization(self, authorization_id: str) -> Optional[Dict]:
        """Get authorization details."""
        return self._api("GET", f"/v2/payments/authorizations/{authorization_id}")

    def void_authorization(self, authorization_id: str) -> Optional[Dict]:
        """Void an authorization."""
        return self._api(
            "POST", f"/v2/payments/authorizations/{authorization_id}/void", {}
        )

    def capture_authorization(
        self,
        authorization_id: str,
        amount: float = None,
        currency: str = "USD",
    ) -> Optional[Dict]:
        """Capture an authorization."""
        data = {}
        if amount:
            data["amount"] = {"currency_code": currency, "value": str(amount)}
        return self._api(
            "POST", f"/v2/payments/authorizations/{authorization_id}/capture", data
        )
