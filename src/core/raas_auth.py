"""
RaaS Auth Client — Cloud Gateway Authentication

Authentication client for RaaS Gateway (https://raas.agencyos.network)
Supports:
  - mk_ API key authentication
  - JWT (Supabase) authentication
  - Secure credential storage
  - Session management with auto-refresh

Usage:
    from src.core.raas-auth import RaaSAuthClient

    client = RaaSAuthClient()
    result = client.validate_credentials("mk_abc123...")
    if result.valid:
        print(f"Tenant: {result.tenant_id}, Tier: {result.tier}")
"""

from __future__ import annotations

import base64
import json
import os
import time
from dataclasses import dataclass, field
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Optional

import requests


@dataclass
class TenantContext:
    """Tenant context from validated credentials."""

    tenant_id: str
    tier: str
    role: str
    license_key: Optional[str] = None
    expires_at: Optional[datetime] = None
    features: list[str] = field(default_factory=list)


@dataclass
class AuthResult:
    """Result of credential validation."""

    valid: bool
    tenant: Optional[TenantContext] = None
    error: Optional[str] = None
    error_code: Optional[str] = None


@dataclass
class SessionInfo:
    """Current session information."""

    tenant_id: str
    tier: str
    authenticated: bool
    credentials_path: str
    last_validated: Optional[datetime] = None
    gateway_url: Optional[str] = None


class RaaSAuthClient:
    """
    RaaS Gateway Authentication Client.

    Manages:
    - Credential storage (~/.mekong/raas/credentials.json)
    - Validation against RaaS Gateway
    - Session management
    - Token refresh

    Environment variables:
    - RAAS_GATEWAY_URL: Gateway endpoint (default: https://raas.agencyos.network)
    - RAAS_LICENSE_KEY: Default license key
    - RAAS_CREDENTIALS_FILE: Custom credentials file path
    """

    DEFAULT_GATEWAY_URL = "https://raas.agencyos.network"
    CREDENTIALS_FILE = "~/.mekong/raas/credentials.json"

    def __init__(
        self,
        gateway_url: Optional[str] = None,
        credentials_file: Optional[str] = None,
    ):
        """
        Initialize RaaS Auth Client.

        Args:
            gateway_url: RaaS Gateway URL (default: from env or DEFAULT_GATEWAY_URL)
            credentials_file: Path to credentials file (default: ~/.mekong/raas/credentials.json)
        """
        self.gateway_url = gateway_url or os.getenv(
            "RAAS_GATEWAY_URL", self.DEFAULT_GATEWAY_URL
        )
        self.credentials_path = Path(
            credentials_file or os.getenv("RAAS_CREDENTIALS_FILE", self.CREDENTIALS_FILE)
        ).expanduser()
        self._session_cache: Optional[TenantContext] = None
        self._last_validated: Optional[datetime] = None

    def _ensure_credentials_dir(self) -> None:
        """Ensure credentials directory exists."""
        self.credentials_path.parent.mkdir(parents=True, exist_ok=True)
        # Set restrictive permissions (owner read/write only)
        os.chmod(self.credentials_path.parent, 0o700)

    def _load_credentials(self) -> dict[str, Any]:
        """Load credentials from file."""
        if not self.credentials_path.exists():
            return {}
        try:
            with open(self.credentials_path, "r") as f:
                return json.load(f)
        except (json.JSONDecodeError, IOError):
            return {}

    def _save_credentials(self, credentials: dict[str, Any]) -> None:
        """Save credentials to file."""
        self._ensure_credentials_dir()
        with open(self.credentials_path, "w") as f:
            json.dump(credentials, f, indent=2)
        # Set restrictive permissions (owner read/write only)
        os.chmod(self.credentials_path, 0o600)

    def _decode_jwt(self, token: str) -> Optional[dict[str, Any]]:
        """
        Decode JWT payload without signature verification.

        Note: This is for edge-side validation only.
        Full crypto verification happens at gateway.
        """
        try:
            parts = token.split(".")
            if len(parts) != 3:
                return None
            # Base64url decode
            payload_b64 = parts[1]
            # Add padding if needed
            padding = 4 - (len(payload_b64) % 4)
            if padding != 4:
                payload_b64 += "=" * padding
            payload_json = base64.urlsafe_b64decode(payload_b64).decode("utf-8")
            return json.loads(payload_json)
        except Exception:
            return None

    def _validate_jwt_expiry(self, payload: dict[str, Any]) -> bool:
        """Validate JWT expiry timestamp."""
        exp = payload.get("exp")
        if not exp:
            return False
        return exp > time.time()

    def _extract_tenant_from_jwt(self, payload: dict[str, Any]) -> TenantContext:
        """Extract tenant info from JWT payload."""
        # Supabase JWT: sub = user UUID, app_metadata.tenant_id
        tenant_id = (
            payload.get("tenant_id")
            or (payload.get("app_metadata") or {}).get("tenant_id")
            or payload.get("sub")
            or "unknown"
        )
        tier = (
            payload.get("role")
            or (payload.get("app_metadata") or {}).get("role")
            or "free"
        )
        exp = payload.get("exp")
        return TenantContext(
            tenant_id=tenant_id,
            tier=tier,
            role=tier,
            expires_at=datetime.fromtimestamp(exp, tz=timezone.utc) if exp else None,
        )

    def validate_credentials(self, token: Optional[str] = None) -> AuthResult:
        """
        Validate credentials against RaaS Gateway.

        Args:
            token: Bearer token (JWT or mk_ API key).
                   If None, uses stored credentials or RAAS_LICENSE_KEY env.

        Returns:
            AuthResult with validation status and tenant context.
        """
        # Get token from various sources
        if not token:
            # Try stored credentials first
            creds = self._load_credentials()
            token = creds.get("token") or os.getenv("RAAS_LICENSE_KEY")

        if not token:
            return AuthResult(
                valid=False,
                error="No credentials provided",
                error_code="missing_credentials",
            )

        token = token.strip()

        # Validate format
        if token.startswith("mk_"):
            # mk_ API key format
            if len(token) < 8:
                return AuthResult(
                    valid=False,
                    error="Invalid API key format (too short)",
                    error_code="invalid_api_key_format",
                )
        elif "." in token:
            # JWT format - basic validation
            payload = self._decode_jwt(token)
            if not payload:
                return AuthResult(
                    valid=False,
                    error="Invalid JWT format",
                    error_code="invalid_jwt_format",
                )
            if not self._validate_jwt_expiry(payload):
                return AuthResult(
                    valid=False,
                    error="Token expired",
                    error_code="token_expired",
                )
        else:
            return AuthResult(
                valid=False,
                error="Unrecognized credential format",
                error_code="unknown_format",
            )

        # Call gateway validation endpoint
        try:
            response = requests.post(
                f"{self.gateway_url}/v1/auth/validate",
                headers={"Authorization": f"Bearer {token}"},
                timeout=10,
            )

            if response.status_code == 200:
                data = response.json()
                tenant = TenantContext(
                    tenant_id=data.get("tenant_id", "unknown"),
                    tier=data.get("tier", "free"),
                    role=data.get("role", "free"),
                    license_key=token if token.startswith("mk_") else None,
                    features=data.get("features", []),
                )
                self._session_cache = tenant
                self._last_validated = datetime.now(timezone.utc)
                return AuthResult(valid=True, tenant=tenant)

            elif response.status_code == 401:
                return AuthResult(
                    valid=False,
                    error="Invalid credentials",
                    error_code="invalid_credentials",
                )

            elif response.status_code == 403:
                return AuthResult(
                    valid=False,
                    error="Credentials expired or revoked",
                    error_code="credentials_revoked",
                )

            else:
                # Gateway error - fail open for local validation
                return self._local_validate(token)

        except requests.RequestException:
            # Network error - fail open for local validation
            return self._local_validate(token)

    def _local_validate(self, token: str) -> AuthResult:
        """
        Local credential validation (fallback when gateway unavailable).

        Validates format and returns tenant context from stored config.
        """
        if token.startswith("mk_"):
            # Valid API key format - assume free tier
            return AuthResult(
                valid=True,
                tenant=TenantContext(
                    tenant_id="local",
                    tier="free",
                    role="free",
                    license_key=token,
                ),
            )
        elif "." in token:
            payload = self._decode_jwt(token)
            if payload and self._validate_jwt_expiry(payload):
                return AuthResult(
                    valid=True,
                    tenant=self._extract_tenant_from_jwt(payload),
                )
        return AuthResult(
            valid=False,
            error="Local validation failed",
            error_code="local_validation_failed",
        )

    def get_session(self) -> SessionInfo:
        """
        Get current session information.

        Returns:
            SessionInfo with current auth status.
        """
        creds = self._load_credentials()
        token = creds.get("token") or os.getenv("RAAS_LICENSE_KEY")
        is_authenticated = bool(token)

        # Use cached session if available
        if self._session_cache and self._last_validated:
            return SessionInfo(
                tenant_id=self._session_cache.tenant_id,
                tier=self._session_cache.tier,
                authenticated=True,
                credentials_path=str(self.credentials_path),
                last_validated=self._last_validated,
                gateway_url=self.gateway_url,
            )

        # Validate fresh if no cache
        if token:
            result = self.validate_credentials(token)
            if result.valid and result.tenant:
                return SessionInfo(
                    tenant_id=result.tenant.tenant_id,
                    tier=result.tenant.tier,
                    authenticated=True,
                    credentials_path=str(self.credentials_path),
                    last_validated=self._last_validated,
                    gateway_url=self.gateway_url,
                )

        return SessionInfo(
            tenant_id="anonymous",
            tier="free",
            authenticated=False,
            credentials_path=str(self.credentials_path),
            gateway_url=self.gateway_url,
        )

    def login(self, token: str, persist: bool = True) -> AuthResult:
        """
        Login with credentials.

        Args:
            token: Bearer token (JWT or mk_ API key)
            persist: If True, save credentials to file

        Returns:
            AuthResult with validation status.
        """
        result = self.validate_credentials(token)

        if result.valid and persist:
            self._save_credentials({"token": token, "updated_at": time.time()})

        return result

    def logout(self) -> bool:
        """
        Logout and clear stored credentials.

        Returns:
            True if credentials were cleared, False if none existed.
        """
        if self.credentials_path.exists():
            try:
                os.remove(self.credentials_path)
                self._session_cache = None
                self._last_validated = None
                return True
            except OSError:
                return False
        return False

    def rotate_key(self, new_key: str) -> AuthResult:
        """
        Rotate to new API key.

        Args:
            new_key: New mk_ API key

        Returns:
            AuthResult with validation status.
        """
        if not new_key.startswith("mk_"):
            return AuthResult(
                valid=False,
                error="Invalid API key format (must start with mk_)",
                error_code="invalid_api_key_format",
            )

        result = self.validate_credentials(new_key)
        if result.valid:
            self._save_credentials({"token": new_key, "updated_at": time.time()})
        return result

    def get_tenant_context(self) -> Optional[TenantContext]:
        """Get cached tenant context (if available)."""
        return self._session_cache

    def is_authenticated(self) -> bool:
        """Check if currently authenticated."""
        session = self.get_session()
        return session.authenticated

    def sync_to_dashboard(self) -> Dict[str, Any]:
        """
        Sync license state to AgencyOS dashboard.

        Returns:
            Dict with sync status and dashboard URL
        """
        session = self.get_session()

        if not session.authenticated:
            return {
                "synced": False,
                "error": "Not authenticated",
                "dashboard_url": "https://agencyos.network/dashboard",
            }

        # Call gateway to sync with dashboard
        try:
            creds = self._load_credentials()
            token = creds.get("token") or os.getenv("RAAS_LICENSE_KEY")

            if not token:
                return {
                    "synced": False,
                    "error": "No credentials",
                    "dashboard_url": "https://agencyos.network/dashboard",
                }

            response = requests.post(
                f"{self.gateway_url}/v1/auth/validate",
                headers={"Authorization": f"Bearer {token}"},
                timeout=10,
            )

            if response.status_code == 200:
                data = response.json()
                tenant_id = data.get("tenant_id", "unknown")
                return {
                    "synced": True,
                    "tenant_id": tenant_id,
                    "tier": data.get("tier"),
                    "dashboard_url": f"https://agencyos.network/dashboard/{tenant_id}",
                    "features": data.get("features", []),
                    "rate_limit": data.get("rateLimit"),
                    "gateway_version": data.get("gateway", {}).get("version"),
                }
            else:
                return {
                    "synced": False,
                    "error": f"Gateway returned {response.status_code}",
                    "dashboard_url": "https://agencyos.network/dashboard",
                }

        except requests.RequestException as e:
            return {
                "synced": False,
                "error": f"Sync failed: {str(e)}",
                "dashboard_url": "https://agencyos.network/dashboard",
            }

    def get_gateway_health(self) -> Dict[str, Any]:
        """
        Check RaaS Gateway health status.

        Returns:
            Dict with gateway health info
        """
        try:
            response = requests.get(
                f"{self.gateway_url}/health",
                timeout=10,
            )

            if response.status_code == 200:
                data = response.json()
                return {
                    "status": data.get("status"),
                    "version": data.get("version"),
                    "url": self.gateway_url,
                    "healthy": True,
                }
            else:
                return {
                    "healthy": False,
                    "error": f"Gateway returned {response.status_code}",
                    "url": self.gateway_url,
                }

        except requests.RequestException as e:
            return {
                "healthy": False,
                "error": f"Gateway unreachable: {str(e)}",
                "url": self.gateway_url,
            }


# Singleton instance for CLI-wide usage
_auth_client: Optional[RaaSAuthClient] = None


def get_auth_client(gateway_url: Optional[str] = None) -> RaaSAuthClient:
    """
    Get or create RaaS Auth Client singleton.

    Args:
        gateway_url: Optional custom gateway URL

    Returns:
        RaaSAuthClient instance.
    """
    global _auth_client
    if _auth_client is None:
        _auth_client = RaaSAuthClient(gateway_url=gateway_url)
    return _auth_client
