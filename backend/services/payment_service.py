from typing import Dict

from core.finance.paypal_sdk.base import PayPalSDK


class PaymentService:
    """
    Unified Payment Service
    Uses Core PayPal SDK.
    """

    def __init__(self):
        self.sdk = PayPalSDK()

    def create_order(self, amount: float, currency: str = "USD", description: str = None) -> Dict:
        """Create a payment order."""
        return self.sdk.orders.create(amount=amount, currency=currency, description=description)

    def capture_order(self, order_id: str) -> Dict:
        """Capture a payment order."""
        return self.sdk.orders.capture(order_id)

    def get_order(self, order_id: str) -> Dict:
        """Get order details."""
        return self.sdk.orders.get(order_id)

    def refund_payment(self, capture_id: str, amount: float = None) -> Dict:
        """Refund a payment."""
        return self.sdk.payments.refund_capture(capture_id, amount=amount)
