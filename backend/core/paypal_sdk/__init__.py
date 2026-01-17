from typing import Dict, Optional
import os
import requests
import base64
from datetime import datetime, timedelta
from pathlib import Path

# Import sub-modules
from .orders import Orders
from .payments import Payments
from .webhooks import Webhooks

def load_env():
    """Load .env file."""
    env_file = Path(".env")
    if env_file.exists():
        for line in env_file.read_text().splitlines():
            if "=" in line and not line.startswith("#"):
                key, val = line.split("=", 1)
                os.environ.setdefault(key.strip(), val.strip())

class PayPalSDK:
    """
    🛡️ PayPal SDK - Modular Edition
    
    Modules:
        - orders: Orders v2
        - payments: Payments v2
        - webhooks: Webhooks
    """

    VERSION = "2.0.0"

    def __init__(self, mode: str = None):
        load_env()
        self.client_id = os.environ.get("PAYPAL_CLIENT_ID")
        self.client_secret = os.environ.get("PAYPAL_CLIENT_SECRET")
        self.mode = mode or os.environ.get("PAYPAL_MODE", "sandbox")

        self.base_url = (
            "https://api-m.paypal.com"
            if self.mode == "live"
            else "https://api-m.sandbox.paypal.com"
        )

        self._access_token = None
        self._token_expiry = None

        # Initialize modules
        self.orders = Orders(self)
        self.payments = Payments(self)
        self.webhooks = Webhooks(self)

    def _get_token(self) -> Optional[str]:
        """Get OAuth access token."""
        if (
            self._access_token
            and self._token_expiry
            and datetime.now() < self._token_expiry
        ):
            return self._access_token

        if not self.client_id or not self.client_secret:
            return None

        auth = base64.b64encode(
            f"{self.client_id}:{self.client_secret}".encode()
        ).decode()

        try:
            response = requests.post(
                f"{self.base_url}/v1/oauth2/token",
                headers={
                    "Authorization": f"Basic {auth}",
                    "Content-Type": "application/x-www-form-urlencoded",
                },
                data="grant_type=client_credentials",
                timeout=10
            )

            if response.status_code == 200:
                data = response.json()
                self._access_token = data["access_token"]
                self._token_expiry = datetime.now() + timedelta(
                    seconds=data.get("expires_in", 3600) - 60
                )
                return self._access_token
        except Exception as e:
            print(f"PayPal Token Error: {e}")
            return None
        return None

    def _api(self, method: str, endpoint: str, data: Dict = None) -> Optional[Dict]:
        """Make authenticated API call."""
        token = self._get_token()
        if not token:
            return None

        headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
        }

        url = f"{self.base_url}{endpoint}"

        try:
            if method == "GET":
                response = requests.get(url, headers=headers, timeout=30)
            elif method == "POST":
                response = requests.post(url, headers=headers, json=data or {}, timeout=30)
            elif method == "PATCH":
                response = requests.patch(url, headers=headers, json=data or [], timeout=30)
            elif method == "DELETE":
                response = requests.delete(url, headers=headers, timeout=30)
            else:
                return None

            if response.status_code in [200, 201, 204]:
                return response.json() if response.text else {"success": True}
            else:
                return {"error": response.status_code, "message": response.text[:300]}
        except Exception as e:
            return {"error": "exception", "message": str(e)}
