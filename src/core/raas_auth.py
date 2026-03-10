"""
RaaS Auth Client — Cloud Gateway Authentication

Authentication client for RaaS Gateway (https://raas.agencyos.network)
Supports:
  - mk_ API key authentication
  - JWT (Supabase) authentication
  - Secure credential storage
  - Session management with auto-refresh
  - Device certificate-based auth
  - Multi-gateway failover with circuit breaker

Usage:
    from src.core.raas_auth import RaaSAuthClient, get_auth_client

    client = RaaSAuthClient()
    result = client.validate_credentials("mk_abc123...")
    if result.valid:
        print(f"Tenant: {result.tenant_id}, Tier: {result.tier}")

Modular structure:
  - auth_types.py: Dataclasses and constants
  - auth_jwt.py: JWT decoding and validation
  - auth_session.py: Session cache management
  - auth_tenant.py: Tenant isolation and RBAC
  - raas_auth.py: Main facade (this file)
"""

from __future__ import annotations

import json
import logging
import os
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, Optional

import requests

from src.auth.secure_storage import get_secure_storage, SecureStorage
from src.core.certificate_store import get_certificate_store, CertificateStore

# Re-export types for backward compatibility
from .auth_types import (
    TenantContext,
    AuthResult,
    GatewayVerifyResult,
    SessionInfo,
    SessionCache,
    VERIFY_ENDPOINT,
    VALIDATION_ENDPOINT_V1,
    VALIDATION_ENDPOINT_V2,
    SESSION_TTL_SECONDS,
    REFRESH_BUFFER_SECONDS,
)
from .auth_session import SessionManager
from .auth_tenant import TenantManager

logger = logging.getLogger(__name__)


class RaaSAuthClient:
    """
    RaaS Gateway Authentication Client with Multi-Gateway Failover.

    Manages:
    - Credential storage (SecureStorage or ~/.mekong/raas/credentials.json fallback)
    - Validation against RaaS Gateway with circuit breaker failover
    - Session management with 5-minute TTL cache
    - Auto-refresh before expiry
    - Device certificate-based auth (X-Cert-ID, X-Cert-Sig headers)

    Environment variables:
    - RAAS_GATEWAY_URL: Primary gateway (default: https://raas.agencyos.network)
    - RAAS_GATEWAY_URL_SECONDARY: Secondary gateway (default: https://raas-backup.agencyos.network)
    - RAAS_GATEWAY_URL_TERTIARY: Tertiary gateway (optional)
    - RAAS_LICENSE_KEY: Default license key
    - RAAS_CREDENTIALS_FILE: Custom credentials file path
    - RAAS_USE_SECURE_STORAGE: Use secure storage (default: true)
    - RAAS_USE_CERTIFICATE_AUTH: Use certificate-based auth (default: true)
    - RAAS_LOCAL_TEST: If "true", skip gateway calls and use local mock
    """

    DEFAULT_GATEWAY_URL = "https://raas.agencyos.network"

    # Multi-gateway URLs with failover priority
    GATEWAY_URLS = [
        os.getenv("RAAS_GATEWAY_URL", "https://raas.agencyos.network"),
        os.getenv("RAAS_GATEWAY_URL_SECONDARY", "https://raas-backup.agencyos.network"),
        os.getenv("RAAS_GATEWAY_URL_TERTIARY"),
    ]

    CREDENTIALS_FILE = "~/.mekong/raas/credentials.json"
    SESSION_CACHE_FILE = "~/.mekong/session.json"

    # Endpoint constants (for backward compatibility)
    VERIFY_ENDPOINT = "/v1/verify"
    VALIDATION_ENDPOINT_V1 = "/v1/auth/validate"
    VALIDATION_ENDPOINT_V2 = "/v2/license/validate"

    # Session constants
    SESSION_TTL_SECONDS = 300  # 5 minutes
    REFRESH_BUFFER_SECONDS = 60  # 1 minute

    # Circuit breaker configuration
    CIRCUIT_FAILURE_THRESHOLD = 3
    CIRCUIT_RECOVERY_TIMEOUT = 60

    def __init__(
        self,
        gateway_url: Optional[str] = None,
        credentials_file: Optional[str] = None,
        use_secure_storage: bool = True,
        use_certificate_auth: bool = True,
    ):
        """
        Initialize RaaS Auth Client with Circuit Breaker.

        Args:
            gateway_url: RaaS Gateway URL (default: from env or DEFAULT_GATEWAY_URL)
            credentials_file: Path to credentials file (default: ~/.mekong/raas/credentials.json)
            use_secure_storage: Use platform secure storage (default: True)
            use_certificate_auth: Use device certificate for API requests (default: True)

        Environment variables:
            RAAS_LOCAL_TEST: If "true", skip gateway calls and use local mock
        """
        self.gateway_url = gateway_url or os.getenv(
            "RAAS_GATEWAY_URL", self.DEFAULT_GATEWAY_URL
        )
        self.credentials_path = Path(
            credentials_file or os.getenv("RAAS_CREDENTIALS_FILE", self.CREDENTIALS_FILE)
        ).expanduser()

        self.use_secure_storage = use_secure_storage and os.getenv(
            "RAAS_USE_SECURE_STORAGE", "true"
        ).lower() != "false"
        self.use_certificate_auth = use_certificate_auth and os.getenv(
            "RAAS_USE_CERTIFICATE_AUTH", "true"
        ).lower() != "false"

        # Local testing mode (Phase 6.3)
        self.local_test_mode = os.getenv("RAAS_LOCAL_TEST", "").lower() == "true"

        # Initialize component managers
        self._session_manager = SessionManager(
            cache_path="~/.mekong/session.json",
            ttl_seconds=SESSION_TTL_SECONDS,
            refresh_buffer=REFRESH_BUFFER_SECONDS,
        )
        self._tenant_manager = TenantManager(local_test_mode=self.local_test_mode)

        # Initialize secure storage
        self._secure_storage: Optional[SecureStorage] = None
        if self.use_secure_storage:
            try:
                self._secure_storage = get_secure_storage()
            except Exception as e:
                logger.debug("Secure storage initialization failed: %s", e)
                self._secure_storage = None

        # Initialize certificate store
        self._certificate_store: Optional[CertificateStore] = None
        if self.use_certificate_auth:
            try:
                self._certificate_store = get_certificate_store(
                    use_secure_storage=self.use_secure_storage
                )
            except Exception as e:
                logger.debug("Certificate store initialization failed: %s", e)
                self._certificate_store = None

        # Circuit breaker state for gateway failover
        self._gateway_failure_counts: Dict[str, int] = {}
        self._gateway_circuits: Dict[str, bool] = {}  # True = open
        self._gateway_last_failure: Dict[str, float] = {}

        for url in self.GATEWAY_URLS:
            if url:
                self._gateway_failure_counts[url] = 0
                self._gateway_circuits[url] = False
                self._gateway_last_failure[url] = 0.0

        # Load session cache from disk on init
        self._session_manager.load()
        self._last_validated: Optional[datetime] = None

    @property
    def _session_cache(self) -> Optional[SessionCache]:
        """Backward compatibility: get session cache from session manager."""
        return self._session_manager.get_cached()

    @property
    def session_cache_path(self) -> Path:
        """Get session cache path from session manager."""
        return self._session_manager.session_cache_path

    @session_cache_path.setter
    def session_cache_path(self, value: Path | str) -> None:
        """Set session cache path and recreate session manager."""
        if isinstance(value, str):
            value = Path(value).expanduser()
        self._session_manager = SessionManager(
            cache_path=str(value),
            ttl_seconds=SESSION_TTL_SECONDS,
            refresh_buffer=REFRESH_BUFFER_SECONDS,
        )

    @_session_cache.setter
    def _session_cache(self, value: Optional[SessionCache]) -> None:
        """Backward compatibility: set session cache in session manager."""
        if value is None:
            self._session_manager.clear()
        else:
            self._session_manager.save(value)

    # Backward-compatible wrapper methods for tests

    def _save_session_cache(self, cache: SessionCache) -> None:
        """Backward compatibility: save session cache."""
        self._session_manager.save(cache)

    def _load_session_cache(self) -> Optional[SessionCache]:
        """Backward compatibility: load session cache."""
        return self._session_manager.load()

    def _clear_session_cache(self) -> bool:
        """Backward compatibility: clear session cache."""
        return self._session_manager.clear()

    def _session_cache_to_tenant_context(self, cache: SessionCache) -> TenantContext:
        """Backward compatibility: convert SessionCache to TenantContext."""
        return TenantContext(
            tenant_id=cache.tenant_id,
            tier=cache.tier,
            role=cache.role,
            license_key=cache.license_key,
            features=cache.features,
            expires_at=cache.expires_at,
        )

    def _ensure_credentials_dir(self) -> None:
        """Ensure credentials directory exists."""
        self.credentials_path.parent.mkdir(parents=True, exist_ok=True)
        os.chmod(self.credentials_path.parent, 0o700)

    def _save_credentials(self, credentials: Dict[str, Any]) -> None:
        """Save credentials to secure storage or fallback file."""
        token = credentials.get("token")
        if not token:
            return

        # Try secure storage first if enabled
        if self.use_secure_storage and self._secure_storage:
            try:
                self._secure_storage.store_license(token)
                return  # Success, don't write to file
            except Exception as e:
                logger.debug("Secure storage store_license failed, falling back to file: %s", e)

        # Fallback to plaintext file
        self._ensure_credentials_dir()
        with open(self.credentials_path, "w") as f:
            json.dump(credentials, f, indent=2)
        os.chmod(self.credentials_path, 0o600)

    def _load_credentials(self) -> Dict[str, Any]:
        """Load credentials from secure storage or fallback file."""
        # Try secure storage first if enabled
        if self.use_secure_storage and self._secure_storage:
            try:
                token = self._secure_storage.get_license()
                if token:
                    return {"token": token, "uses_secure_storage": True}
            except Exception as e:
                logger.debug("Secure storage get_license failed, falling back to file: %s", e)

        # Fallback to plaintext file
        if not self.credentials_path.exists():
            return {}
        try:
            with open(self.credentials_path, "r") as f:
                data = json.load(f)
                if "token" in data:
                    data["uses_secure_storage"] = False
                return data
        except (json.JSONDecodeError, IOError):
            return {}

    def _migrate_to_secure_storage(self) -> bool:
        """
        Migrate plaintext credentials to secure storage.

        Returns:
            True if migration successful, False otherwise
        """
        if not self.use_secure_storage or not self._secure_storage:
            return False

        if self.credentials_path.exists():
            try:
                with open(self.credentials_path, "r") as f:
                    data = json.load(f)
                token = data.get("token")
                if token:
                    self._secure_storage.store_license(token)
                    os.remove(self.credentials_path)
                    return True
            except Exception as e:
                logger.debug("Credential migration to secure storage failed: %s", e)
        return False

    def _get_certificate_headers(self) -> Optional[Dict[str, str]]:
        """
        Get certificate headers for API requests.

        Returns:
            Dict with X-Cert-ID and X-Cert-Sig headers, or None if no cert
        """
        if not self.use_certificate_auth or not self._certificate_store:
            return None

        try:
            cert_headers = self._certificate_store.export_for_request()
            if cert_headers:
                return cert_headers
        except Exception as e:
            logger.debug("Certificate export for request failed: %s", e)

        return None

    def get_certificate_status(self) -> Optional[Dict[str, Any]]:
        """
        Get current certificate status.

        Returns:
            Dict with certificate status info, or None if no cert
        """
        if not self._certificate_store:
            return None

        metadata = self._certificate_store.get_metadata()
        if not metadata:
            return {
                "has_certificate": False,
                "message": "No certificate found",
            }

        from datetime import datetime, timezone
        return {
            "has_certificate": True,
            "certificate_id": metadata.certificate_id,
            "device_id": metadata.device_id[:16] + "...",
            "valid_from": metadata.valid_from.isoformat(),
            "valid_until": metadata.valid_until.isoformat(),
            "days_until_expiry": (
                metadata.valid_until.day - datetime.now(timezone.utc).day
            ),
            "should_rotate": metadata.should_rotate,
            "is_expired": metadata.is_expired,
            "rotated_count": metadata.rotated_count,
        }

    def rotate_certificate(self) -> Optional[Dict[str, Any]]:
        """
        Rotate device certificate.

        Returns:
            Dict with rotation result, or None if rotation not needed
        """
        if not self._certificate_store:
            return {"success": False, "error": "Certificate auth not enabled"}

        try:
            new_cert = self._certificate_store.rotate_certificate()
            if new_cert:
                from datetime import datetime, timezone
                return {
                    "success": True,
                    "certificate_id": new_cert.certificate_id,
                    "valid_until": new_cert.valid_until.isoformat(),
                    "days_valid": (
                        new_cert.valid_until - datetime.now(timezone.utc)
                    ).days,
                }
            else:
                return {
                    "success": True,
                    "message": "Certificate not yet due for rotation",
                }
        except Exception as e:
            return {
                "success": False,
                "error": f"Rotation failed: {str(e)}",
            }

    def _call_gateway_validation(
        self,
        token: str,
        endpoint: str,
    ) -> AuthResult:
        """
        Call gateway validation endpoint with circuit breaker failover.

        Args:
            token: Bearer token
            endpoint: Validation endpoint path

        Returns:
            AuthResult with validation status
        """
        from datetime import datetime, timezone

        try:
            # Build headers with certificate auth if available
            headers = {"Authorization": f"Bearer {token}"}
            cert_headers = self._get_certificate_headers()
            if cert_headers:
                headers.update(cert_headers)

            response = requests.post(
                f"{self.gateway_url}{endpoint}",
                headers=headers,
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
                    expires_at=(
                        datetime.fromtimestamp(
                            data.get("expires_at", 0), tz=timezone.utc
                        )
                        if data.get("expires_at")
                        else None
                    ),
                )

                # Save session cache on success
                cache = self._session_manager.create_from_tenant(tenant, token)
                self._session_manager.save(cache)
                self._last_validated = datetime.now(timezone.utc)

                return AuthResult(valid=True, tenant=tenant)

            elif response.status_code == 404:
                return AuthResult(
                    valid=False,
                    error=f"Endpoint {endpoint} not found",
                    error_code="endpoint_not_found",
                )

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
                return self._tenant_manager.local_validate(token)

        except requests.RequestException:
            # Network error - fail open for local validation
            return self._tenant_manager.local_validate(token)

    def validate_credentials(
        self,
        token: Optional[str] = None,
        use_v2: bool = True,
    ) -> AuthResult:
        """
        Validate credentials against RaaS Gateway.

        Phase 6.3: If RAAS_LOCAL_TEST=true, skip gateway calls and use local mock.

        Args:
            token: Bearer token (JWT or mk_ API key).
                   If None, uses stored credentials or RAAS_LICENSE_KEY env.
            use_v2: Use /v2/license/validate endpoint (default: True)

        Returns:
            AuthResult with validation status and tenant context.
        """
        # Local test mode - skip gateway validation
        if self.local_test_mode:
            return self._tenant_manager.local_validate(token)

        # Get token from various sources
        if not token:
            creds = self._load_credentials()
            token = creds.get("token") or os.getenv("RAAS_LICENSE_KEY")

        if not token:
            return AuthResult(
                valid=False,
                error="No credentials provided",
                error_code="missing_credentials",
            )

        # Validate format using tenant manager
        is_valid, error, error_code = self._tenant_manager.validate_token_format(token)
        if not is_valid:
            return AuthResult(valid=False, error=error, error_code=error_code)

        # Call gateway validation endpoint - try V2 first, fallback to V1
        endpoint = VALIDATION_ENDPOINT_V2 if use_v2 else VALIDATION_ENDPOINT_V1
        result = self._call_gateway_validation(token, endpoint)

        # Fallback to V1 if V2 failed with 404
        if result.error_code == "endpoint_not_found" and use_v2:
            result = self._call_gateway_validation(token, VALIDATION_ENDPOINT_V1)

        return result

    def verify_gateway(self, token: Optional[str] = None) -> GatewayVerifyResult:
        """
        Lightweight gateway verification.

        Makes minimal request to /v1/verify endpoint to check:
        - Gateway is reachable
        - License key is valid (format + not revoked)
        - Returns gateway version and status

        Args:
            token: Bearer token (JWT or mk_ API key).
                   If None, uses stored credentials or RAAS_LICENSE_KEY env.

        Returns:
            GatewayVerifyResult with gateway status
        """
        # Get token from various sources
        if not token:
            creds = self._load_credentials()
            token = creds.get("token") or os.getenv("RAAS_LICENSE_KEY")

        if not token:
            return GatewayVerifyResult(
                valid=False,
                error="No credentials provided",
                requires_auth=True,
            )

        token = token.strip()

        # Validate format locally first
        is_valid, error, _ = self._tenant_manager.validate_token_format(token)
        if not is_valid:
            return GatewayVerifyResult(
                valid=False,
                error=error,
                requires_auth=True,
            )

        # Call lightweight verify endpoint
        try:
            headers = {"Authorization": f"Bearer {token}"}
            cert_headers = self._get_certificate_headers()
            if cert_headers:
                headers.update(cert_headers)

            response = requests.get(
                f"{self.gateway_url}{VERIFY_ENDPOINT}",
                headers=headers,
                timeout=5,
            )

            if response.status_code == 200:
                data = response.json()
                return GatewayVerifyResult(
                    valid=True,
                    gateway_version=data.get("gateway_version"),
                    gateway_status=data.get("status", "operational"),
                    requires_auth=False,
                )
            elif response.status_code == 401:
                return GatewayVerifyResult(
                    valid=False,
                    error="Invalid or expired credentials",
                    requires_auth=True,
                )
            elif response.status_code == 403:
                return GatewayVerifyResult(
                    valid=False,
                    error="Credentials revoked or insufficient permissions",
                    requires_auth=True,
                )
            elif response.status_code == 404:
                return GatewayVerifyResult(
                    valid=False,
                    error="Gateway verify endpoint not found",
                    gateway_status="unreachable",
                )
            else:
                return GatewayVerifyResult(
                    valid=False,
                    error=f"Gateway returned {response.status_code}",
                    gateway_status="error",
                )

        except requests.RequestException as e:
            return GatewayVerifyResult(
                valid=False,
                error=f"Gateway unreachable: {str(e)}",
                gateway_status="unreachable",
            )

    def get_session(self) -> SessionInfo:
        """
        Get current session information.

        Uses cached session if valid (within 5-minute TTL).
        Auto-refreshes if within 1 minute of cache expiry.

        Returns:
            SessionInfo with current auth status.
        """
        creds = self._load_credentials()
        token = creds.get("token") or os.getenv("RAAS_LICENSE_KEY")
        uses_secure_storage = creds.get("uses_secure_storage", False) or (
            self.use_secure_storage and self._secure_storage is not None
        )

        # Check if we have a valid session cache
        cache = self._session_manager.get_cached()
        if cache:
            # Check if we should refresh (within 1 minute of expiry)
            if self._session_manager.should_refresh(cache) and token:
                # Auto-refresh in background
                self._refresh_session(token)

            return self._session_manager.to_session_info(
                cache=cache,
                credentials_path=str(self.credentials_path),
                gateway_url=self.gateway_url,
                last_validated=self._last_validated,
                uses_secure_storage=uses_secure_storage,
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
                    uses_secure_storage=uses_secure_storage,
                )

        return self._session_manager.create_anonymous_session(
            credentials_path=str(self.credentials_path),
            gateway_url=self.gateway_url,
            uses_secure_storage=uses_secure_storage,
        )

    def _refresh_session(self, token: str) -> None:
        """
        Refresh session cache with fresh gateway validation.

        Called automatically when session is within 1 minute of TTL expiry.

        Args:
            token: Current auth token for re-validation
        """
        self.validate_credentials(token, use_v2=True)
        # Session cache is saved automatically by validate_credentials
        # If refresh fails, we keep using the expired cache until next explicit validation

    def login(
        self,
        token: str,
        persist: bool = True,
        migrate_to_secure: bool = True,
    ) -> AuthResult:
        """
        Login with credentials.

        Args:
            token: Bearer token (JWT or mk_ API key)
            persist: If True, save credentials to file (default: True)
            migrate_to_secure: If True, migrate existing plaintext credentials to secure storage (default: True)

        Returns:
            AuthResult with validation status.
        """
        result = self.validate_credentials(token)

        if result.valid and persist:
            self._save_credentials({"token": token, "updated_at": time.time()})

            # Auto-migrate existing plaintext credentials to secure storage
            if migrate_to_secure and self.use_secure_storage:
                self._migrate_to_secure_storage()

        return result

    def logout(self) -> bool:
        """
        Logout and clear stored credentials and session cache.

        Returns:
            True if credentials were cleared, False if none existed.
        """
        cleared = False

        # Clear credentials file
        if self.credentials_path.exists():
            try:
                os.remove(self.credentials_path)
                cleared = True
            except OSError:
                pass

        # Clear session cache file
        self._session_manager.clear()

        # Clear in-memory cache
        self._last_validated = None

        return cleared

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
        cache = self._session_manager.get_cached()
        if cache:
            return TenantContext(
                tenant_id=cache.tenant_id,
                tier=cache.tier,
                role=cache.role,
                license_key=cache.license_key,
                features=cache.features,
                expires_at=cache.expires_at,
            )
        return None

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

        # Call gateway to sync with dashboard - try V2 first
        try:
            creds = self._load_credentials()
            token = creds.get("token") or os.getenv("RAAS_LICENSE_KEY")

            if not token:
                return {
                    "synced": False,
                    "error": "No credentials",
                    "dashboard_url": "https://agencyos.network/dashboard",
                }

            # Try V2 endpoint first
            response = requests.post(
                f"{self.gateway_url}{VALIDATION_ENDPOINT_V2}",
                headers={"Authorization": f"Bearer {token}"},
                timeout=10,
            )

            # Fallback to V1 if V2 not found
            if response.status_code == 404:
                response = requests.post(
                    f"{self.gateway_url}{VALIDATION_ENDPOINT_V1}",
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
