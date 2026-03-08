"""
RaaS Gateway Client — Unified Gateway for CLI Requests

Routes all outbound CLI requests through raas.agencyos.network with:
- JWT/mk_ API key authentication
- Rate limit enforcement
- Usage telemetry
- Centralized license validation

Usage:
    from src.core.gateway_client import GatewayClient

    client = GatewayClient()
    response = client.request("POST", "/v1/cook", json={"goal": "..."})
"""

from __future__ import annotations

import os
import time
from dataclasses import dataclass
from typing import Any, Optional

import requests

from .raas_auth import RaaSAuthClient, get_auth_client
from .rate_limit_client import RateLimitClient
from .telemetry_reporter import TelemetryReporter


@dataclass
class GatewayResponse:
    """Response from gateway request."""

    status_code: int
    data: Any
    headers: dict[str, str]
    elapsed_ms: float
    rate_limit_remaining: Optional[int] = None


class GatewayClient:
    """
    Unified Gateway Client for RaaS.

    All CLI requests to AgencyOS services route through here.
    """

    DEFAULT_GATEWAY_URL = "https://raas.agencyos.network"

    def __init__(
        self,
        gateway_url: Optional[str] = None,
        auth_client: Optional[RaaSAuthClient] = None,
    ):
        """
        Initialize Gateway Client.

        Args:
            gateway_url: RaaS Gateway URL (default: from env or DEFAULT)
            auth_client: Optional auth client instance
        """
        self.gateway_url = gateway_url or os.getenv(
            "RAAS_GATEWAY_URL", self.DEFAULT_GATEWAY_URL
        )
        self.auth = auth_client or get_auth_client()
        self.rate_limit = RateLimitClient()
        self.telemetry = TelemetryReporter()
        self._session = requests.Session()

    def _get_auth_header(self) -> dict[str, str]:
        """Get authorization header from stored credentials."""
        creds = self.auth._load_credentials()
        token = creds.get("token") or os.getenv("RAAS_LICENSE_KEY")
        if token:
            return {"Authorization": f"Bearer {token}"}
        return {}

    def request(
        self,
        method: str,
        path: str,
        headers: Optional[dict[str, str]] = None,
        **kwargs: Any,
    ) -> GatewayResponse:
        """
        Make authenticated request through gateway.

        Args:
            method: HTTP method
            path: API path (e.g., "/v1/cook")
            headers: Optional extra headers
            **kwargs: Passed to requests

        Returns:
            GatewayResponse with status, data, headers

        Raises:
            GatewayError: On gateway errors
        """
        # Check rate limit before request
        if not self.rate_limit.can_proceed():
            self.rate_limit.wait_for_reset()

        # Build request
        url = f"{self.gateway_url}{path}"
        request_headers = {
            "Content-Type": "application/json",
            "X-RaaS-Source": "mekong-cli",
            **self._get_auth_header(),
            **(headers or {}),
        }

        start = time.perf_counter()
        try:
            response = self._session.request(
                method,
                url,
                headers=request_headers,
                timeout=kwargs.pop("timeout", 30),
                **kwargs,
            )
            elapsed_ms = (time.perf_counter() - start) * 1000

            # Handle rate limit response
            if response.status_code == 429:
                self.rate_limit.handle_429(response)
                raise GatewayError("Rate limit exceeded", status_code=429)

            # Parse response
            try:
                data = response.json()
            except ValueError:
                data = {"text": response.text}

            # Extract rate limit headers
            remaining = response.headers.get("X-RateLimit-Remaining")
            rate_limit_remaining = int(remaining) if remaining else None

            # Record telemetry
            self.telemetry.record_call(
                endpoint=path,
                method=method,
                status_code=response.status_code,
                payload_size=len(kwargs.get("json", {})),
            )

            # Raise on error
            if response.status_code >= 400:
                raise GatewayError(
                    data.get("error", "Gateway error"),
                    status_code=response.status_code,
                )

            return GatewayResponse(
                status_code=response.status_code,
                data=data,
                headers=dict(response.headers),
                elapsed_ms=elapsed_ms,
                rate_limit_remaining=rate_limit_remaining,
            )

        except requests.RequestException as e:
            elapsed_ms = (time.perf_counter() - start) * 1000
            self.telemetry.record_call(
                endpoint=path,
                method=method,
                status_code=0,
                payload_size=0,
                error=str(e),
            )
            raise GatewayError(f"Gateway unreachable: {e}", status_code=0) from e

    def get(self, path: str, **kwargs: Any) -> GatewayResponse:
        """GET request."""
        return self.request("GET", path, **kwargs)

    def post(self, path: str, **kwargs: Any) -> GatewayResponse:
        """POST request."""
        return self.request("POST", path, **kwargs)

    def put(self, path: str, **kwargs: Any) -> GatewayResponse:
        """PUT request."""
        return self.request("PUT", path, **kwargs)

    def delete(self, path: str, **kwargs: Any) -> GatewayResponse:
        """DELETE request."""
        return self.request("DELETE", path, **kwargs)

    def health_check(self) -> bool:
        """Check gateway health."""
        try:
            response = self.get("/health")
            return response.status_code == 200
        except Exception:
            return False

    def flush_telemetry(self) -> None:
        """Flush pending telemetry to gateway."""
        self.telemetry.flush()


class GatewayError(Exception):
    """Gateway request error."""

    def __init__(self, message: str, status_code: int = 0):
        super().__init__(message)
        self.status_code = status_code


# Singleton
_gateway_client: Optional[GatewayClient] = None


def get_gateway_client() -> GatewayClient:
    """Get or create gateway client singleton."""
    global _gateway_client
    if _gateway_client is None:
        _gateway_client = GatewayClient()
    return _gateway_client
