"""
JWT Refresh Client — Automatic Token Refresh with Exponential Backoff

Handles JWT token refresh for RaaS Gateway authentication:
- Automatic refresh before expiry
- Exponential backoff retry logic
- Token caching and validation
- Integration with mk_ API key auth scheme
"""

from __future__ import annotations

import os
import time
import logging
from dataclasses import dataclass, field
from datetime import datetime, timezone, timedelta
from typing import Optional, Dict, Any
from enum import Enum


from src.core.gateway_client import GatewayClient
from src.core.machine_fingerprint import get_machine_fingerprint_hash


class RefreshStatus(Enum):
    """Token refresh status."""
    SUCCESS = "success"
    FAILED = "failed"
    RETRYING = "retrying"
    NOT_REQUIRED = "not_required"


@dataclass
class RefreshResult:
    """Result of token refresh operation."""

    status: RefreshStatus
    access_token: Optional[str] = None
    refresh_token: Optional[str] = None
    expires_at: Optional[datetime] = None
    error: Optional[str] = None
    retry_after: Optional[float] = None
    attempts: int = 0


@dataclass
class TokenCache:
    """Cached token state."""

    access_token: str
    refresh_token: Optional[str]
    expires_at: datetime
    created_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))
    last_refresh: Optional[datetime] = None
    refresh_attempts: int = 0

    @property
    def is_expired(self) -> bool:
        """Check if token is expired."""
        return datetime.now(timezone.utc) >= self.expires_at

    @property
    def should_refresh(self) -> bool:
        """Check if token should be refreshed (5 min buffer)."""
        buffer = timedelta(minutes=5)
        return datetime.now(timezone.utc) >= (self.expires_at - buffer)

    @property
    def seconds_until_expiry(self) -> int:
        """Get seconds until token expires."""
        delta = self.expires_at - datetime.now(timezone.utc)
        return max(0, int(delta.total_seconds()))

    def to_dict(self) -> Dict[str, Any]:
        """Serialize to dictionary."""
        return {
            "access_token": self.access_token,
            "refresh_token": self.refresh_token,
            "expires_at": self.expires_at.isoformat(),
            "created_at": self.created_at.isoformat(),
            "last_refresh": self.last_refresh.isoformat() if self.last_refresh else None,
            "refresh_attempts": self.refresh_attempts,
        }

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> TokenCache:
        """Deserialize from dictionary."""
        return cls(
            access_token=data["access_token"],
            refresh_token=data.get("refresh_token"),
            expires_at=datetime.fromisoformat(data["expires_at"].replace("Z", "+00:00")),
            created_at=datetime.fromisoformat(data.get("created_at", datetime.now(timezone.utc).isoformat())),
            last_refresh=datetime.fromisoformat(data["last_refresh"].replace("Z", "+00:00")) if data.get("last_refresh") else None,
            refresh_attempts=data.get("refresh_attempts", 0),
        )


class JwtRefreshClient:
    """
    JWT Refresh Client for RaaS Gateway.

    Features:
    - Automatic token refresh with exponential backoff
    - Token caching
    - Machine fingerprint integration
    - Rate limit awareness
    """

    REFRESH_ENDPOINT = "/v2/license/refresh"
    ACTIVATE_ENDPOINT = "/v2/license/activate"
    VERIFY_ENDPOINT = "/v2/license/verify"

    # Exponential backoff config
    MAX_RETRIES = 5
    INITIAL_BACKOFF_MS = 100
    MAX_BACKOFF_MS = 30000
    BACKOFF_MULTIPLIER = 2.0

    def __init__(self, gateway_client: Optional[GatewayClient] = None):
        self.gateway = gateway_client or GatewayClient()
        self._token_cache: Optional[TokenCache] = None
        self._api_key: Optional[str] = None
        self._logger = logging.getLogger(__name__)

    def _get_api_key(self) -> Optional[str]:
        """Get API key from environment or config."""
        if self._api_key:
            return self._api_key

        # Try environment variables
        self._api_key = os.getenv("MK_API_KEY") or os.getenv("RAAS_LICENSE_KEY")

        if not self._api_key:
            # Try loading from secure storage
            try:
                from src.auth.secure_storage import get_secure_storage
                storage = get_secure_storage()
                self._api_key = storage.get_license()
            except Exception:
                pass

        return self._api_key

    def _get_auth_headers(self) -> Dict[str, str]:
        """Get authentication headers."""
        headers = {
            "Content-Type": "application/json",
            "User-Agent": "mekong-cli/jwt-refresh",
        }

        # Add API key header
        api_key = self._get_api_key()
        if api_key:
            headers["X-API-Key"] = api_key

        # Add access token if cached
        if self._token_cache and self._token_cache.access_token:
            headers["Authorization"] = f"Bearer {self._token_cache.access_token}"

        # Add machine fingerprint
        try:
            fingerprint = get_machine_fingerprint_hash()
            headers["X-Machine-Fingerprint"] = fingerprint
        except Exception:
            pass

        return headers

    def activate(self, license_key: Optional[str] = None) -> RefreshResult:
        """
        Activate license and get initial JWT tokens.

        Args:
            license_key: Optional license key (defaults to MK_API_KEY)

        Returns:
            RefreshResult with tokens
        """
        key = license_key or self._get_api_key()

        if not key:
            return RefreshResult(
                status=RefreshStatus.FAILED,
                error="No API key or license key provided"
            )

        payload = {
            "license_key": key,
            "machine_fingerprint": get_machine_fingerprint_hash(),
            "platform": "python-cli",
            "cli_version": self._get_cli_version(),
        }

        try:
            response = self.gateway.post(
                self.ACTIVATE_ENDPOINT,
                json=payload,
                headers=self._get_auth_headers()
            )

            if response.status_code == 200:
                data = response.data
                return self._cache_tokens(data)
            else:
                return RefreshResult(
                    status=RefreshStatus.FAILED,
                    error=f"Activation failed: {response.status_code}"
                )

        except Exception as e:
            self._logger.error(f"Activation error: {e}")
            return RefreshResult(
                status=RefreshStatus.FAILED,
                error=str(e)
            )

    def refresh(self, force: bool = False) -> RefreshResult:
        """
        Refresh JWT token with exponential backoff.

        Args:
            force: Force refresh even if not expired

        Returns:
            RefreshResult with new tokens
        """
        # Check if refresh is needed
        if not force and self._token_cache:
            if not self._token_cache.should_refresh:
                return RefreshResult(
                    status=RefreshStatus.NOT_REQUIRED,
                    access_token=self._token_cache.access_token,
                    expires_at=self._token_cache.expires_at,
                )

        # Check if we have a refresh token
        if not self._token_cache or not self._token_cache.refresh_token:
            # No refresh token - need to activate
            return self.activate()

        # Attempt refresh with exponential backoff
        return self._refresh_with_backoff()

    def _refresh_with_backoff(self) -> RefreshResult:
        """Refresh token with exponential backoff retry."""
        self._token_cache.refresh_attempts += 1

        for attempt in range(1, self.MAX_RETRIES + 1):
            try:
                payload = {
                    "refresh_token": self._token_cache.refresh_token,
                    "machine_fingerprint": get_machine_fingerprint_hash(),
                }

                response = self.gateway.post(
                    self.REFRESH_ENDPOINT,
                    json=payload,
                    headers=self._get_auth_headers()
                )

                if response.status_code == 200:
                    result = self._cache_tokens(response.data)
                    result.attempts = attempt
                    self._token_cache.refresh_attempts = 0  # Reset on success
                    return result

                elif response.status_code == 429:
                    # Rate limited - use backoff
                    retry_after = self._calculate_backoff(attempt)
                    self._logger.warning(f"Rate limited, retrying in {retry_after}ms")
                    time.sleep(retry_after / 1000.0)

                elif response.status_code == 401:
                    # Invalid refresh token - need re-activation
                    self._token_cache = None
                    return self.activate()

                else:
                    self._logger.warning(f"Refresh failed: {response.status_code}")
                    time.sleep(self._calculate_backoff(attempt) / 1000.0)

            except Exception as e:
                self._logger.error(f"Refresh attempt {attempt} failed: {e}")
                if attempt < self.MAX_RETRIES:
                    time.sleep(self._calculate_backoff(attempt) / 1000.0)
                else:
                    return RefreshResult(
                        status=RefreshStatus.FAILED,
                        error=str(e),
                        attempts=attempt,
                    )

        # All retries exhausted
        return RefreshResult(
            status=RefreshStatus.FAILED,
            error="Max retry attempts exceeded",
            attempts=self.MAX_RETRIES,
        )

    def _calculate_backoff(self, attempt: int) -> float:
        """Calculate exponential backoff delay."""
        delay_ms = self.INITIAL_BACKOFF_MS * (self.BACKOFF_MULTIPLIER ** (attempt - 1))
        return min(delay_ms, self.MAX_BACKOFF_MS)

    def _cache_tokens(self, data: Dict[str, Any]) -> RefreshResult:
        """Cache tokens from response."""
        access_token = data.get("access_token")
        refresh_token = data.get("refresh_token")
        expires_in = data.get("expires_in", 3600)  # Default 1 hour

        if not access_token:
            return RefreshResult(
                status=RefreshStatus.FAILED,
                error="No access token in response"
            )

        expires_at = datetime.now(timezone.utc) + timedelta(seconds=expires_in)

        self._token_cache = TokenCache(
            access_token=access_token,
            refresh_token=refresh_token or self._token_cache.refresh_token if self._token_cache else None,
            expires_at=expires_at,
            last_refresh=datetime.now(timezone.utc),
        )

        return RefreshResult(
            status=RefreshStatus.SUCCESS,
            access_token=access_token,
            refresh_token=refresh_token,
            expires_at=expires_at,
        )

    def get_valid_token(self) -> Optional[str]:
        """Get valid access token, refreshing if necessary."""
        if not self._token_cache:
            result = self.activate()
            if result.status != RefreshStatus.SUCCESS:
                return None
            return result.access_token

        if self._token_cache.is_expired:
            result = self.refresh(force=True)
            if result.status not in (RefreshStatus.SUCCESS, RefreshStatus.NOT_REQUIRED):
                return None
            return result.access_token

        if self._token_cache.should_refresh:
            result = self.refresh()
            if result.status != RefreshStatus.SUCCESS:
                # Return cached token even if refresh failed
                return self._token_cache.access_token

        return self._token_cache.access_token

    def verify_token(self) -> bool:
        """Verify current token is still valid."""
        if not self._token_cache or self._token_cache.is_expired:
            return False

        try:
            response = self.gateway.post(
                self.VERIFY_ENDPOINT,
                json={},
                headers=self._get_auth_headers()
            )
            return response.status_code == 200
        except Exception:
            return False

    def get_cache(self) -> Optional[TokenCache]:
        """Get current token cache."""
        return self._token_cache

    def clear_cache(self) -> None:
        """Clear token cache."""
        self._token_cache = None

    def _get_cli_version(self) -> str:
        """Get CLI version."""
        try:
            from importlib.metadata import version
            return version("mekong-cli")
        except Exception:
            return "0.2.0-dev"


# Global instance
_refresh_client: Optional[JwtRefreshClient] = None


def get_refresh_client() -> JwtRefreshClient:
    """Get global JWT refresh client instance."""
    global _refresh_client
    if _refresh_client is None:
        _refresh_client = JwtRefreshClient()
    return _refresh_client


def activate_license(license_key: Optional[str] = None) -> RefreshResult:
    """Activate license and get JWT tokens."""
    return get_refresh_client().activate(license_key)


def refresh_jwt_token(force: bool = False) -> RefreshResult:
    """Refresh JWT token."""
    return get_refresh_client().refresh(force=force)


def get_valid_jwt_token() -> Optional[str]:
    """Get valid JWT token, refreshing if necessary."""
    return get_refresh_client().get_valid_token()
