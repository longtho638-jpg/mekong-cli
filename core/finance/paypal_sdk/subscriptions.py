from typing import Dict, Optional

from .base import PayPalBase


class Subscriptions(PayPalBase):
    """
    PayPal Subscriptions API (v1)
    Ref: https://developer.paypal.com/docs/api/subscriptions/v1/
    """

    def create(
        self,
        plan_id: str,
        start_time: str = None,
        custom_id: str = None,
        return_url: str = None,
        cancel_url: str = None,
    ) -> Optional[Dict]:
        """
        Create a subscription.
        """
        payload = {
            "plan_id": plan_id,
            "custom_id": custom_id,
        }

        if start_time:
            payload["start_time"] = start_time

        if return_url or cancel_url:
            payload["application_context"] = {
                "return_url": return_url,
                "cancel_url": cancel_url,
                "user_action": "SUBSCRIBE_NOW",
            }

        return self._api("POST", "/v1/billing/subscriptions", payload)

    def get(self, subscription_id: str) -> Optional[Dict]:
        """
        Show subscription details.
        """
        return self._api("GET", f"/v1/billing/subscriptions/{subscription_id}")

    def activate(self, subscription_id: str, reason: str = "Reactivating subscription") -> Optional[Dict]:
        """
        Activate a suspended subscription.
        """
        payload = {"reason": reason}
        return self._api("POST", f"/v1/billing/subscriptions/{subscription_id}/activate", payload)

    def cancel(self, subscription_id: str, reason: str = "Canceled by user") -> Optional[Dict]:
        """
        Cancel a subscription.
        """
        payload = {"reason": reason}
        return self._api("POST", f"/v1/billing/subscriptions/{subscription_id}/cancel", payload)

    def suspend(self, subscription_id: str, reason: str = "Suspended by system") -> Optional[Dict]:
        """
        Suspend a subscription.
        """
        payload = {"reason": reason}
        return self._api("POST", f"/v1/billing/subscriptions/{subscription_id}/suspend", payload)

    def capture(self, subscription_id: str, note: str = "Charging outstanding balance") -> Optional[Dict]:
        """
        Capture an authorized payment on a subscription.
        (Note: This is for outstanding balances, not regular billing)
        """
        payload = {
            "note": note,
            "capture_type": "OUTSTANDING_BALANCE"
        }
        return self._api("POST", f"/v1/billing/subscriptions/{subscription_id}/capture", payload)

    def list_transactions(
        self, subscription_id: str, start_time: str, end_time: str
    ) -> Optional[Dict]:
        """
        List transactions for a subscription.
        """
        endpoint = (
            f"/v1/billing/subscriptions/{subscription_id}/transactions"
            f"?start_time={start_time}&end_time={end_time}"
        )
        return self._api("GET", endpoint)
