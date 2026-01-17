import os
import base64
import requests
from datetime import datetime, timedelta

class PayPalClient:
    """PayPal REST API client."""

    def __init__(self):
        self.mode = os.getenv("PAYPAL_MODE", "sandbox")
        self.client_id = os.getenv("PAYPAL_CLIENT_ID", "")
        self.client_secret = os.getenv("PAYPAL_CLIENT_SECRET", "")
        self._access_token = None

    @property
    def base_url(self):
        if self.mode == "live":
            return "https://api-m.paypal.com"
        return "https://api-m.sandbox.paypal.com"

    def is_configured(self) -> bool:
        return bool(self.client_id and self.client_secret)

    def _get_token(self) -> str:
        if self._access_token:
            return self._access_token

        auth = base64.b64encode(
            f"{self.client_id}:{self.client_secret}".encode()
        ).decode()

        try:
            resp = requests.post(
                f"{self.base_url}/v1/oauth2/token",
                headers={
                    "Authorization": f"Basic {auth}",
                    "Content-Type": "application/x-www-form-urlencoded",
                },
                data="grant_type=client_credentials",
                timeout=30,
            )

            if resp.status_code == 200:
                self._access_token = resp.json().get("access_token")
                return self._access_token
        except Exception:
            pass
        return ""

    def get_products(self) -> list:
        token = self._get_token()
        if not token:
            return []

        try:
            resp = requests.get(
                f"{self.base_url}/v1/catalogs/products",
                headers={"Authorization": f"Bearer {token}"},
                timeout=30,
            )
            if resp.status_code == 200:
                return resp.json().get("products", [])
        except Exception:
            pass
        return []

    def get_transactions(self, days: int = 30) -> list:
        token = self._get_token()
        if not token:
            return []

        end = datetime.utcnow()
        start = end - timedelta(days=days)

        try:
            resp = requests.get(
                f"{self.base_url}/v1/reporting/transactions",
                headers={"Authorization": f"Bearer {token}"},
                params={
                    "start_date": start.strftime("%Y-%m-%dT%H:%M:%SZ"),
                    "end_date": end.strftime("%Y-%m-%dT%H:%M:%SZ"),
                },
                timeout=30,
            )
            if resp.status_code == 200:
                return resp.json().get("transaction_details", [])
        except Exception:
            pass
        return []
