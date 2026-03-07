"""
RaaS Gateway Login Client

Handles authentication flow with the RaaS Gateway:
- POST /v1/auth/verify endpoint
- User-agent identification
- Rate limiting respect
- Timeout handling
"""

import os
import platform
from typing import Optional
from dataclasses import dataclass
import requests
from urllib3.util.retry import Retry
from requests.adapters import HTTPAdapter


# Gateway configuration
DEFAULT_GATEWAY_URL = os.environ.get(
    "RAAS_GATEWAY_URL",
    "https://raas.agencyos.network"
)
REQUEST_TIMEOUT = int(os.environ.get("RAAS_REQUEST_TIMEOUT", "5"))

def _get_version() -> str:
    """Get Mekong CLI version."""
    try:
        import importlib.metadata
        return importlib.metadata.version("mekong-cli")
    except Exception:
        return "3.0.0"

USER_AGENT = f"mekong-cli/{_get_version()}"


@dataclass
class LicenseInfo:
    """License information returned from gateway verification."""
    valid: bool
    tier: Optional[str] = None
    email: Optional[str] = None
    expires_at: Optional[str] = None
    features: Optional[list] = None
    error: Optional[str] = None


@dataclass
class VerifyRequest:
    """Request payload for license verification."""
    license_key: str
    email: Optional[str] = None
    action: str = "verify"


class GatewayClientError(Exception):
    """Error communicating with RaaS Gateway."""
    pass


class GatewayClient:
    """
    Client for RaaS Gateway authentication endpoints.

    Handles:
    - License verification via /v1/auth/verify
    - Rate limiting with exponential backoff
    - User-agent identification
    - Connection pooling
    """

    def __init__(self, gateway_url: str = DEFAULT_GATEWAY_URL):
        self.base_url = gateway_url.rstrip("/")
        self.session = self._create_session()

    def _create_session(self) -> requests.Session:
        """Create configured requests session with retry logic."""
        session = requests.Session()

        # User-agent header
        session.headers.update({
            "User-Agent": USER_AGENT,
            "X-Mekong-CLI-Version": _get_version(),
            "X-Mekong-Platform": platform.system(),
            "X-Mekong-Arch": platform.machine(),
        })

        # Retry strategy with exponential backoff
        retry_strategy = Retry(
            total=3,
            backoff_factor=0.5,
            status_forcelist=[429, 500, 502, 503, 504],
            allowed_methods=["POST", "GET"],
            raise_on_status=False,
        )

        adapter = HTTPAdapter(max_retries=retry_strategy)
        session.mount("http://", adapter)
        session.mount("https://", adapter)

        return session

    def verify_license(self, license_key: str, email: Optional[str] = None) -> LicenseInfo:
        """
        Verify a RaaS license key with the gateway.

        Args:
            license_key: The license key to verify (raas-* or mk_* format)
            email: Optional email associated with the license

        Returns:
            LicenseInfo with validation results

        Raises:
            GatewayClientError: If gateway is unreachable or returns error
        """
        url = f"{self.base_url}/v1/auth/verify"

        payload = {
            "license_key": license_key,
            "action": "verify"
        }
        if email:
            payload["email"] = email

        try:
            response = self.session.post(
                url,
                json=payload,
                timeout=REQUEST_TIMEOUT
            )

            if response.status_code == 429:
                raise GatewayClientError(
                    "Rate limited. Please wait before trying again."
                )

            if response.status_code == 401:
                return LicenseInfo(
                    valid=False,
                    error="Invalid license key"
                )

            if response.status_code == 403:
                return LicenseInfo(
                    valid=False,
                    error="License expired or revoked"
                )

            if response.status_code >= 500:
                raise GatewayClientError(
                    f"Gateway error ({response.status_code}). Please try again later."
                )

            # Parse response
            try:
                data = response.json()
                return LicenseInfo(
                    valid=data.get("valid", False),
                    tier=data.get("tier"),
                    email=data.get("email"),
                    expires_at=data.get("expires_at"),
                    features=data.get("features"),
                    error=data.get("error")
                )
            except ValueError:
                raise GatewayClientError("Invalid response from gateway")

        except requests.exceptions.Timeout:
            raise GatewayClientError(
                f"Gateway timeout after {REQUEST_TIMEOUT}s. Check your connection."
            )
        except requests.exceptions.ConnectionError:
            raise GatewayClientError(
                f"Cannot connect to gateway at {self.base_url}"
            )
        except requests.exceptions.RequestException as e:
            raise GatewayClientError(f"Gateway request failed: {str(e)}")

    def health_check(self) -> bool:
        """
        Check if gateway is reachable.

        Returns:
            True if gateway responds, False otherwise
        """
        try:
            response = self.session.get(
                f"{self.base_url}/health",
                timeout=3
            )
            return response.status_code == 200
        except Exception:
            return False


# Singleton instance
_gateway_client: Optional[GatewayClient] = None


def get_gateway_client() -> GatewayClient:
    """Get or create the global gateway client instance."""
    global _gateway_client
    if _gateway_client is None:
        _gateway_client = GatewayClient()
    return _gateway_client


def verify_license_key(license_key: str, email: Optional[str] = None) -> LicenseInfo:
    """
    Convenience function to verify a license key.

    Args:
        license_key: The license key to verify
        email: Optional email for verification

    Returns:
        LicenseInfo with validation results
    """
    client = get_gateway_client()
    return client.verify_license(license_key, email)
