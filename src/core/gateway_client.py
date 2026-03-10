"""
RaaS Gateway Client — Unified Gateway for CLI Requests

Routes all outbound CLI requests through raas.agencyos.network with:
- JWT/mk_ API key authentication
- JWT-bound usage attribution (Phase 6)
- Rate limit enforcement
- Usage telemetry
- Centralized license validation
- Audit logging integration

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
from .raas_audit_logger import get_audit_logger
from .rate_limit_client import RateLimitClient
from .telemetry_reporter import TelemetryReporter


# Multi-gateway URLs with failover priority
GATEWAY_URLS = [
    os.getenv("RAAS_GATEWAY_URL", "https://raas.agencyos.network"),
    os.getenv("RAAS_GATEWAY_URL_SECONDARY", "https://raas-backup.agencyos.network"),
    os.getenv("RAAS_GATEWAY_URL_TERTIARY"),  # Optional tertiary fallback
]

# Circuit breaker configuration
CIRCUIT_FAILURE_THRESHOLD = 3  # Trip after 3 consecutive failures
CIRCUIT_RECOVERY_TIMEOUT = 60  # 60 seconds before retry


@dataclass
class GatewayResponse:
    """Response from gateway request."""

    status_code: int
    data: Any
    headers: dict[str, str]
    elapsed_ms: float
    rate_limit_remaining: Optional[int] = None
    gateway_url: Optional[str] = None  # Track which gateway responded


@dataclass
class CircuitState:
    """Circuit breaker state for a single gateway."""
    failure_count: int = 0
    circuit_open: bool = False
    last_failure_time: float = 0.0
    success_count: int = 0  # For half-open recovery


class GatewayClient:
    """
    Unified Gateway Client for RaaS with Circuit Breaker Pattern.

    All CLI requests to AgencyOS services route through here.
    Features:
    - Multi-gateway failover (primary → secondary → tertiary)
    - Circuit breaker with automatic trip/recovery
    - JWT-bound usage attribution and audit logging
    - Rate limit enforcement and telemetry

    Circuit Breaker States:
    - CLOSED: Normal operation, failures increment counter
    - OPEN: Gateway disabled, skip to next available
    - HALF-OPEN: Testing recovery after timeout
    """

    DEFAULT_GATEWAY_URL = "https://raas.agencyos.network"

    def __init__(
        self,
        gateway_url: Optional[str] = None,
        auth_client: Optional[RaaSAuthClient] = None,
    ):
        """
        Initialize Gateway Client with Circuit Breaker.

        Phase 6.3: Local test mode via RAAS_LOCAL_TEST environment variable.

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
        self.audit = get_audit_logger()
        self._session = requests.Session()
        # Phase 6.3: Local test mode
        self.local_test_mode = os.getenv("RAAS_LOCAL_TEST", "").lower() == "true"

        # Circuit breaker state for each gateway
        self._circuit_states: dict[str, CircuitState] = {}
        self._current_gateway_idx: int = 0  # Current gateway index

        # Initialize circuit states for all gateways
        for url in GATEWAY_URLS:
            if url:
                self._circuit_states[url] = CircuitState()

    def _get_available_gateway(self) -> Optional[tuple[int, str]]:
        """
        Get next available gateway using circuit breaker pattern.

        Returns:
            Tuple of (gateway_index, gateway_url) or None if all circuits open

        Circuit Breaker Logic:
        - Skip gateways with open circuits (trip threshold reached)
        - Allow retry after recovery timeout (half-open state)
        - Round-robin through available gateways
        """
        now = time.time()

        for i, url in enumerate(GATEWAY_URLS):
            if not url:
                continue

            state = self._circuit_states.get(url)
            if not state:
                continue

            # Circuit is open - check if recovery timeout passed
            if state.circuit_open:
                elapsed = now - state.last_failure_time
                if elapsed < CIRCUIT_RECOVERY_TIMEOUT:
                    continue  # Still in timeout, skip this gateway
                # Recovery timeout passed - allow half-open retry
                state.circuit_open = False  # Transition to half-open

            return (i, url)

        return None  # All circuits open - no gateway available

    def _record_failure(self, gateway_idx: int, gateway_url: str) -> None:
        """
        Record a gateway failure and trip circuit if threshold reached.

        Args:
            gateway_idx: Index of failed gateway
            gateway_url: URL of failed gateway
        """
        state = self._circuit_states.setdefault(gateway_url, CircuitState())
        state.failure_count += 1
        state.last_failure_time = time.time()
        state.success_count = 0

        # Trip circuit if threshold reached
        if state.failure_count >= CIRCUIT_FAILURE_THRESHOLD:
            state.circuit_open = True
            import logging
            logging.warning(
                "CIRCUIT OPEN: Gateway %s (%d consecutive failures)",
                gateway_url,
                state.failure_count,
            )

    def _record_success(self, gateway_idx: int, gateway_url: str) -> None:
        """
        Record a gateway success and reset circuit state.

        Args:
            gateway_idx: Index of successful gateway
            gateway_url: URL of successful gateway
        """
        state = self._circuit_states.setdefault(gateway_url, CircuitState())

        if state.circuit_open or state.failure_count > 0:
            # Recover from half-open or closed with failures
            state.failure_count = 0
            state.circuit_open = False
            state.success_count += 1

            if state.success_count >= 2:
                # Full recovery after 2 successes
                state.success_count = 0

    def _get_auth_header(self) -> tuple[dict[str, str], Optional[str]]:
        """
        Get authorization header with JWT-bound usage attribution.

        Returns:
            Tuple of (headers dict, tenant_id)
        """
        creds = self.auth._load_credentials()
        token = creds.get("token") or os.getenv("RAAS_LICENSE_KEY")

        tenant_id = None
        if token:
            # Validate to get tenant info
            result = self.auth.validate_credentials(token)
            if result.valid and result.tenant:
                tenant_id = result.tenant.tenant_id

        headers = {
            "Content-Type": "application/json",
            "X-RaaS-Source": "mekong-cli",
            "X-RaaS-Phase": "6",
        }

        if token:
            headers["Authorization"] = f"Bearer {token}"
            # Add JWT attribution header for usage tracking
            if "." in token:
                headers["X-JWT-Attribution"] = token[:100]  # First 100 chars for tracing
            elif tenant_id:
                headers["X-RaaS-Tenant-ID"] = tenant_id

        return headers, tenant_id

    def request(
        self,
        method: str,
        path: str,
        headers: Optional[dict[str, str]] = None,
        **kwargs: Any,
    ) -> GatewayResponse:
        """
        Make authenticated request through gateway with circuit breaker failover.

        Phase 6.3: If RAAS_LOCAL_TEST=true, return mock responses for offline testing.
        Phase 6: Enhanced with JWT-bound usage attribution and audit logging.
        Circuit Breaker: Auto-failover to secondary/tertiary gateways on failures.

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
        # Phase 6.3: Local test mode - return mock response
        if self.local_test_mode:
            return self._mock_request(method, path)

        # Check rate limit before request
        if not self.rate_limit.can_proceed():
            self.rate_limit.wait_for_reset()

        # Get available gateway using circuit breaker
        gateway_info = self._get_available_gateway()
        if gateway_info:
            gateway_idx, current_url = gateway_info
            self._current_gateway_idx = gateway_idx
        else:
            # All circuits open - use primary as last resort
            current_url = self.gateway_url
            gateway_idx = 0

        # Build request with JWT attribution
        url = f"{current_url}{path}"
        request_headers, tenant_id = self._get_auth_header()
        request_headers = {
            **request_headers,
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

            # Record success for circuit breaker
            self._record_success(gateway_idx, current_url)

            # Record telemetry with tenant attribution
            self.telemetry.record_call(
                endpoint=path,
                method=method,
                status_code=response.status_code,
                payload_size=len(kwargs.get("json", {})),
                tenant_id=tenant_id,
                gateway_url=current_url,
            )

            # Log audit event for compliance (Phase 6)
            self.audit.log_event(
                event="gateway_call",
                metadata={
                    "endpoint": path,
                    "method": method,
                    "status_code": response.status_code,
                    "tenant_id": tenant_id,
                    "gateway_url": current_url,
                },
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
                gateway_url=current_url,
            )

        except requests.RequestException as e:
            elapsed_ms = (time.perf_counter() - start) * 1000

            # Record failure for circuit breaker
            self._record_failure(gateway_idx, current_url)

            # Try failover to next available gateway
            failover_info = self._get_available_gateway()
            if failover_info and failover_info[0] != gateway_idx:
                import logging
                logging.warning(
                    "FAILOVER: %s → %s (error: %s)",
                    current_url,
                    failover_info[1],
                    str(e),
                )
                # Retry with failover gateway
                return self._retry_with_gateway(
                    failover_info[0], failover_info[1],
                    method, path, request_headers, tenant_id,
                    start, **kwargs
                )

            self.telemetry.record_call(
                endpoint=path,
                method=method,
                status_code=0,
                payload_size=0,
                error=str(e),
                tenant_id=tenant_id,
                gateway_url=current_url,
            )
            raise GatewayError(f"Gateway unreachable: {e}", status_code=0) from e

    def _retry_with_gateway(
        self,
        gateway_idx: int,
        gateway_url: str,
        method: str,
        path: str,
        headers: dict[str, str],
        tenant_id: Optional[str],
        start_time: float,
        **kwargs: Any,
    ) -> GatewayResponse:
        """
        Retry request with a different gateway.

        Args:
            gateway_idx: Index of failover gateway
            gateway_url: URL of failover gateway
            method: HTTP method
            path: API path
            headers: Request headers
            tenant_id: Tenant ID for telemetry
            start_time: Original start time
            **kwargs: Request kwargs

        Returns:
            GatewayResponse from failover gateway
        """
        url = f"{gateway_url}{path}"

        try:
            response = self._session.request(
                method,
                url,
                headers=headers,
                timeout=kwargs.pop("timeout", 30),
                **kwargs,
            )
            elapsed_ms = (time.perf_counter() - start_time) * 1000

            # Handle rate limit
            if response.status_code == 429:
                self.rate_limit.handle_429(response)
                raise GatewayError("Rate limit exceeded", status_code=429)

            # Parse response
            try:
                data = response.json()
            except ValueError:
                data = {"text": response.text}

            remaining = response.headers.get("X-RateLimit-Remaining")
            rate_limit_remaining = int(remaining) if remaining else None

            # Record success
            self._record_success(gateway_idx, gateway_url)

            # Telemetry
            self.telemetry.record_call(
                endpoint=path,
                method=method,
                status_code=response.status_code,
                payload_size=len(kwargs.get("json", {})),
                tenant_id=tenant_id,
                gateway_url=gateway_url,
            )

            # Audit log
            self.audit.log_event(
                event="gateway_call",
                metadata={
                    "endpoint": path,
                    "method": method,
                    "status_code": response.status_code,
                    "tenant_id": tenant_id,
                    "gateway_url": gateway_url,
                },
            )

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
                gateway_url=gateway_url,
            )

        except requests.RequestException as e:
            self._record_failure(gateway_idx, gateway_url)
            raise GatewayError(f"Gateway failover failed: {e}", status_code=0) from e

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
        """Check gateway health using circuit breaker."""
        try:
            gateway_info = self._get_available_gateway()
            if gateway_info:
                _, url = gateway_info
            else:
                url = self.gateway_url

            response = self.get(f"{url}/health")
            return response.status_code == 200
        except Exception as e:
            import logging
            logging.debug(f"Gateway health check failed: {e}")
            return False

    def get_circuit_status(self) -> dict[str, Any]:
        """
        Get circuit breaker status for all gateways.

        Returns:
            Dict with circuit status for each gateway
        """
        status = {}
        for url, state in self._circuit_states.items():
            status[url] = {
                "state": "open" if state.circuit_open else ("half-open" if state.failure_count > 0 else "closed"),
                "failure_count": state.failure_count,
                "last_failure": state.last_failure_time,
                "recovery_allowed": not state.circuit_open or (time.time() - state.last_failure_time >= CIRCUIT_RECOVERY_TIMEOUT),
            }
        return status

    def reset_circuits(self) -> None:
        """Reset all circuit breakers (manual override)."""
        for state in self._circuit_states.values():
            state.failure_count = 0
            state.circuit_open = False
            state.last_failure_time = 0.0
            state.success_count = 0

    def flush_telemetry(self) -> None:
        """Flush pending telemetry to gateway."""
        self.telemetry.flush()

    def _mock_request(self, method: str, path: str) -> GatewayResponse:
        """
        Phase 6.3: Return mock response for local testing.

        Returns mock data for common endpoints without calling gateway.
        """
        import random
        from datetime import datetime

        # Mock response for /v1/usage endpoint
        if "/v1/usage" in path:
            mock_data = {
                "license_key": "mk_mock_key",
                "tenant_id": "local_mock",
                "metrics": [
                    {
                        "license_key": "mk_mock_key",
                        "tenant_id": "local_mock",
                        "tier": "pro",
                        "endpoint": "/v1/cook",
                        "method": "POST",
                        "request_count": random.randint(10, 100),
                        "payload_size": random.randint(100, 1000),
                        "timestamp": datetime.now().isoformat(),
                        "hour_bucket": datetime.now().strftime("%Y-%m-%d-%H"),
                        "metric_name": "api_calls",
                        "quantity": random.randint(10, 100),
                        "unit": "calls",
                    }
                    for _ in range(random.randint(1, 5))
                ],
                "pagination": {
                    "limit": 100,
                    "offset": 0,
                    "total": random.randint(10, 50),
                    "has_more": False,
                },
                "summary": {
                    "total_requests": random.randint(100, 1000),
                    "total_payload_size": random.randint(10000, 100000),
                    "total_hours": random.randint(10, 50),
                },
            }

            return GatewayResponse(
                status_code=200,
                data=mock_data,
                headers={"X-RateLimit-Remaining": str(random.randint(100, 500))},
                elapsed_ms=random.uniform(1, 10),
                rate_limit_remaining=random.randint(100, 500),
                gateway_url="local_mock",
            )

        # Mock response for other endpoints
        return GatewayResponse(
            status_code=200,
            data={
                "status": "ok",
                "mock": True,
                "local_test_mode": True,
            },
            headers={"X-RateLimit-Remaining": "500"},
            elapsed_ms=random.uniform(1, 5),
            rate_limit_remaining=500,
            gateway_url="local_mock",
        )


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
