import os

import requests


class GumroadClient:
    """Gumroad API client."""

    def __init__(self):
        self.token = os.getenv("GUMROAD_ACCESS_TOKEN", "")
        self.api_url = "https://api.gumroad.com/v2"

    def is_configured(self) -> bool:
        return bool(self.token)

    def get_user(self) -> dict:
        if not self.is_configured():
            return {}
        try:
            resp = requests.get(
                f"{self.api_url}/user",
                params={"access_token": self.token},
                timeout=30,
            )
            if resp.status_code == 200:
                return resp.json().get("user", {})
        except Exception:
            pass
        return {}

    def get_products(self) -> list:
        if not self.is_configured():
            return []
        try:
            resp = requests.get(
                f"{self.api_url}/products",
                params={"access_token": self.token},
                timeout=30,
            )
            if resp.status_code == 200:
                return resp.json().get("products", [])
        except Exception:
            pass
        return []

    def get_sales(self, page: int = 1) -> list:
        if not self.is_configured():
            return []
        try:
            resp = requests.get(
                f"{self.api_url}/sales",
                params={"access_token": self.token, "page": page},
                timeout=30,
            )
            if resp.status_code == 200:
                return resp.json().get("sales", [])
        except Exception:
            pass
        return []
