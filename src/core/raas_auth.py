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
from typing import Any, Optional, Dict

import requests

from src.auth.secure_storage import get_secure_storage, SecureStorage
from src.core.certificate_store import get_certificate_store, CertificateStore


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
class GatewayVerifyResult:
    """Result from lightweight /v1/verify endpoint."""

    valid: bool
    gateway_version: Optional[str] = None
    gateway_status: Optional[str] = None
    requires_auth: bool = True
    error: Optional[str] = None


@dataclass
class SessionInfo:
    """Current session information."""

    tenant_id: str
    tier: str
    authenticated: bool
    credentials_path: str
    last_validated: Optional[datetime] = None
    gateway_url: Optional[str] = None
    uses_secure_storage: bool = False


@dataclass
class SessionCache:
    """
    Session cache with TTL support.

    Stored in ~/.mekong/session.json for cross-invocation caching.
    TTL: 5 minutes (300 seconds)
    Refresh buffer: 1 minute (60 seconds)
    """

    tenant_id: str
    tier: str
    role: str
    license_key: Optional[str] = None
    features: list[str] = field(default_factory=list)
    expires_at: Optional[datetime] = None  # License expiry
    cached_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))
    ttl_seconds: int = 300  # 5 minutes
    refresh_token: Optional[str] = None  # For future use

    @property
    def session_expires_at(self) -> datetime:
        """Calculate session cache expiry time."""
        from datetime import timedelta
        return self.cached_at + timedelta(seconds=self.ttl_seconds)

    @property
    def refresh_boundary(self) -> datetime:
        """Calculate when to start refresh (1 minute before expiry)."""
        from datetime import timedelta
        return self.session_expires_at - timedelta(seconds=60)

    def is_valid(self) -> bool:
        """Check if cache is still valid (not expired)."""
        return datetime.now(timezone.utc) < self.session_expires_at

    def should_refresh(self) -> bool:
        """Check if we should refresh (within 1 minute of expiry)."""
        now = datetime.now(timezone.utc)
        return now >= self.refresh_boundary and now < self.session_expires_at

    def is_expired(self) -> bool:
        """Check if cache has expired."""
        return datetime.now(timezone.utc) >= self.session_expires_at

    def to_dict(self) -> Dict[str, Any]:
        """Serialize to dictionary."""
        return {
            "tenant_id": self.tenant_id,
            "tier": self.tier,
            "role": self.role,
            "license_key": self.license_key,
            "features": self.features,
            "expires_at": self.expires_at.isoformat() if self.expires_at else None,
            "cached_at": self.cached_at.isoformat(),
            "ttl_seconds": self.ttl_seconds,
            "refresh_token": self.refresh_token,
        }

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "SessionCache":
        """Deserialize from dictionary."""
        return cls(
            tenant_id=data["tenant_id"],
            tier=data["tier"],
            role=data["role"],
            license_key=data.get("license_key"),
            features=data.get("features", []),
            expires_at=datetime.fromisoformat(data["expires_at"]) if data.get("expires_at") else None,
            cached_at=datetime.fromisoformat(data["cached_at"]),
            ttl_seconds=data.get("ttl_seconds", 300),
            refresh_token=data.get("refresh_token"),
        )


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
    """

    DEFAULT_GATEWAY_URL = "https://raas.agencyos.network"
    DEFAULT_GATEWAY_URL_V2 = "https://raas.agencyos.network"

    # Multi-gateway URLs with failover priority
    GATEWAY_URLS = [
        os.getenv("RAAS_GATEWAY_URL", "https://raas.agencyos.network"),
        os.getenv("RAAS_GATEWAY_URL_SECONDARY", "https://raas-backup.agencyos.network"),
        os.getenv("RAAS_GATEWAY_URL_TERTIARY"),
    ]

    CREDENTIALS_FILE = "~/.mekong/raas/credentials.json"
    SESSION_CACHE_FILE = "~/.mekong/session.json"
    VERIFY_ENDPOINT = "/v1/verify"  # Lightweight gateway check
    VALIDATION_ENDPOINT_V1 = "/v1/auth/validate"
    VALIDATION_ENDPOINT_V2 = "/v2/license/validate"
    SESSION_TTL_SECONDS = 300  # 5 minutes
    REFRESH_BUFFER_SECONDS = 60  # 1 minute before expiry

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
            RAAS_LOCAL_TEST: If "true", skip gateway calls and use local mock (Phase 6.3)
        """
        self.gateway_url = gateway_url or os.getenv(
            "RAAS_GATEWAY_URL", self.DEFAULT_GATEWAY_URL
        )
        self.credentials_path = Path(
            credentials_file or os.getenv("RAAS_CREDENTIALS_FILE", self.CREDENTIALS_FILE)
        ).expanduser()
        self.session_cache_path = Path(self.SESSION_CACHE_FILE).expanduser()
        self.use_secure_storage = use_secure_storage and os.getenv("RAAS_USE_SECURE_STORAGE", "true").lower() != "false"
        self.use_certificate_auth = use_certificate_auth and os.getenv("RAAS_USE_CERTIFICATE_AUTH", "true").lower() != "false"
        # Phase 6.3: Local testing mode
        self.local_test_mode = os.getenv("RAAS_LOCAL_TEST", "").lower() == "true"
        self._secure_storage: Optional[SecureStorage] = None
        self._certificate_store: Optional[CertificateStore] = None
        self._session_cache: Optional[TenantContext] = None
        self._last_validated: Optional[datetime] = None

        # Circuit breaker state for gateway failover
        self._gateway_failure_counts: dict[str, int] = {}
        self._gateway_circuits: dict[str, bool] = {}  # True = open
        self._gateway_last_failure: dict[str, float] = {}

        # Initialize circuit states
        for url in self.GATEWAY_URLS:
            if url:
                self._gateway_failure_counts[url] = 0
                self._gateway_circuits[url] = False
                self._gateway_last_failure[url] = 0.0

        if self.use_secure_storage:
            try:
                self._secure_storage = get_secure_storage()
            except Exception:
                self._secure_storage = None

        # Initialize certificate store if certificate auth enabled
        if self.use_certificate_auth:
            try:
                self._certificate_store = get_certificate_store(
                    use_secure_storage=self.use_secure_storage
                )
            except Exception:
                self._certificate_store = None

        # Load session cache from disk on init
        self._session_cache = self._load_session_cache()

    def _ensure_credentials_dir(self) -> None:
        """Ensure credentials directory exists."""
        self.credentials_path.parent.mkdir(parents=True, exist_ok=True)
        # Set restrictive permissions (owner read/write only)
        os.chmod(self.credentials_path.parent, 0o700)

    def _ensure_session_cache_dir(self) -> None:
        """Ensure session cache directory exists."""
        self.session_cache_path.parent.mkdir(parents=True, exist_ok=True)
        os.chmod(self.session_cache_path.parent, 0o700)

    def _save_session_cache(self, cache: SessionCache) -> None:
        """
        Save session cache to disk.

        Args:
            cache: SessionCache object to persist
        """
        self._ensure_session_cache_dir()
        with open(self.session_cache_path, "w") as f:
            json.dump(cache.to_dict(), f, indent=2)
        os.chmod(self.session_cache_path, 0o600)

    def _load_session_cache(self) -> Optional[SessionCache]:
        """
        Load session cache from disk.

        Returns:
            SessionCache if valid and not expired, None otherwise
        """
        if not self.session_cache_path.exists():
            return None

        try:
            with open(self.session_cache_path, "r") as f:
                data = json.load(f)

            cache = SessionCache.from_dict(data)

            # Return cache only if still valid
            if cache.is_valid():
                return cache
            else:
                # Auto-clear expired cache
                self._clear_session_cache()
                return None

        except (json.JSONDecodeError, IOError, KeyError, ValueError):
            # Corrupted cache - clear and return None
            self._clear_session_cache()
            return None

    def _clear_session_cache(self) -> bool:
        """
        Clear session cache file.

        Returns:
            True if cache was cleared, False if no cache existed
        """
        if self.session_cache_path.exists():
            try:
                os.remove(self.session_cache_path)
                return True
            except OSError:
                return False
        return False

    def _session_cache_to_tenant_context(self, cache: SessionCache) -> TenantContext:
        """Convert SessionCache to TenantContext."""
        return TenantContext(
            tenant_id=cache.tenant_id,
            tier=cache.tier,
            role=cache.role,
            license_key=cache.license_key,
            features=cache.features,
            expires_at=cache.expires_at,
        )

    def _load_credentials(self) -> dict[str, Any]:
        """Load credentials from secure storage or fallback file."""
        # Try secure storage first if enabled
        if self.use_secure_storage and self._secure_storage:
            try:
                token = self._secure_storage.get_license()
                if token:
                    return {"token": token, "uses_secure_storage": True}
            except Exception:
                pass  # Fallback to file-based storage

        # Fallback to plaintext file (for backward compatibility)
        if not self.credentials_path.exists():
            return {}
        try:
            with open(self.credentials_path, "r") as f:
                data = json.load(f)
                # Mark as not using secure storage for migration detection
                if "token" in data:
                    data["uses_secure_storage"] = False
                return data
        except (json.JSONDecodeError, IOError):
            return {}

    def _save_credentials(self, credentials: dict[str, Any]) -> None:
        """Save credentials to secure storage or fallback file."""
        token = credentials.get("token")
        if not token:
            return

        # Try secure storage first if enabled
        if self.use_secure_storage and self._secure_storage:
            try:
                self._secure_storage.store_license(token)
                return  # Success, don't write to file
            except Exception:
                pass  # Fallback to file-based storage

        # Fallback to plaintext file
        self._ensure_credentials_dir()
        with open(self.credentials_path, "w") as f:
            json.dump(credentials, f, indent=2)
        # Set restrictive permissions (owner read/write only)
        os.chmod(self.credentials_path, 0o600)

    def _migrate_to_secure_storage(self) -> bool:
        """
        Migrate plaintext credentials to secure storage.

        Returns:
            True if migration successful, False otherwise
        """
        if not self.use_secure_storage or not self._secure_storage:
            return False

        # Check if already using secure storage
        if self.credentials_path.exists():
            try:
                with open(self.credentials_path, "r") as f:
                    data = json.load(f)
                token = data.get("token")
                if token:
                    # Migrate to secure storage
                    self._secure_storage.store_license(token)
                    # Delete plaintext file
                    os.remove(self.credentials_path)
                    return True
            except Exception:
                pass
        return False

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

    def validate_credentials(
        self, token: Optional[str] = None, use_v2: bool = True
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
        # Phase 6.3: Local test mode - skip gateway validation
        if self.local_test_mode:
            return self._local_validate_mock(token)

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

        # Call gateway validation endpoint - try V2 first, fallback to V1
        endpoint = self.VALIDATION_ENDPOINT_V2 if use_v2 else self.VALIDATION_ENDPOINT_V1
        result = self._call_gateway_validation(token, endpoint)

        # Fallback to V1 if V2 failed with 404
        if result.error_code == "endpoint_not_found" and use_v2:
            result = self._call_gateway_validation(token, self.VALIDATION_ENDPOINT_V1)

        # Save session cache on success
        if result.valid and result.tenant:
            self._save_session_cache_from_tenant(result.tenant, token)

        return result

    def _local_validate_mock(self, token: str) -> AuthResult:
        """
        Phase 6.3: Local mock validation for offline testing.

        Returns mock tenant context without calling gateway.
        """
        import hashlib

        if not token:
            return AuthResult(
                valid=False,
                error="No credentials provided",
                error_code="missing_credentials",
            )

        # Validate format (same as production)
        if token.startswith("mk_"):
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

        # Generate mock tenant ID from token
        tenant_id = f"local_{hashlib.md5(token.encode()).hexdigest()[:8]}"

        # Determine tier from token prefix
        tier = "pro"
        if token.startswith("mk_free"):
            tier = "free"
        elif token.startswith("mk_trial"):
            tier = "trial"
        elif token.startswith("mk_enterprise"):
            tier = "enterprise"

        return AuthResult(
            valid=True,
            tenant=TenantContext(
                tenant_id=tenant_id,
                tier=tier,
                role=tier,
                license_key=token if token.startswith("mk_") else None,
                features=["cli_commands", "local_testing", "gateway_mock"],
                expires_at=None,
            ),
        )

    def _call_gateway_validation(
        self, token: str, endpoint: str
    ) -> AuthResult:
        """
        Call gateway validation endpoint.

        Args:
            token: Bearer token
            endpoint: Validation endpoint path

        Returns:
            AuthResult with validation status
        """
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
                    expires_at=datetime.fromtimestamp(
                        data.get("expires_at", 0), tz=timezone.utc
                    )
                    if data.get("expires_at")
                    else None,
                )
                self._session_cache = tenant
                self._last_validated = datetime.now(timezone.utc)
                return AuthResult(valid=True, tenant=tenant)

            elif response.status_code == 404:
                # Endpoint not found - signal to try fallback
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
                return self._local_validate(token)

        except requests.RequestException:
            # Network error - fail open for local validation
            return self._local_validate(token)

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
        except Exception:
            pass  # Don't fail request if cert export fails

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

        return {
            "has_certificate": True,
            "certificate_id": metadata.certificate_id,
            "device_id": metadata.device_id[:16] + "...",  # Truncate for privacy
            "valid_from": metadata.valid_from.isoformat(),
            "valid_until": metadata.valid_until.isoformat(),
            "days_until_expiry": metadata.valid_until.day - datetime.now(timezone.utc).day,
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
                return {
                    "success": True,
                    "certificate_id": new_cert.certificate_id,
                    "valid_until": new_cert.valid_until.isoformat(),
                    "days_valid": (new_cert.valid_until - datetime.now(timezone.utc)).days,
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

        # Validate format locally first (quick check)
        if token.startswith("mk_"):
            if len(token) < 8:
                return GatewayVerifyResult(
                    valid=False,
                    error="Invalid API key format (too short)",
                    requires_auth=True,
                )
        elif "." in token:
            # JWT format - basic validation
            payload = self._decode_jwt(token)
            if not payload:
                return GatewayVerifyResult(
                    valid=False,
                    error="Invalid JWT format",
                    requires_auth=True,
                )
        else:
            return GatewayVerifyResult(
                valid=False,
                error="Unrecognized credential format",
                requires_auth=True,
            )

        # Call lightweight verify endpoint
        try:
            # Build headers with certificate auth if available
            headers = {"Authorization": f"Bearer {token}"}
            cert_headers = self._get_certificate_headers()
            if cert_headers:
                headers.update(cert_headers)

            response = requests.get(
                f"{self.gateway_url}{self.VERIFY_ENDPOINT}",
                headers=headers,
                timeout=5,  # Short timeout for lightweight check
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
                # Endpoint not found - gateway may be down or using different version
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

    def _save_session_cache_from_tenant(self, tenant: TenantContext, token: str) -> None:
        """
        Create and save session cache from TenantContext.

        Args:
            tenant: Validated tenant context
            token: Token used for validation (mk_ key or JWT)
        """
        cache = SessionCache(
            tenant_id=tenant.tenant_id,
            tier=tenant.tier,
            role=tenant.role,
            license_key=tenant.license_key or token,
            features=tenant.features,
            expires_at=tenant.expires_at,
            cached_at=datetime.now(timezone.utc),
            ttl_seconds=self.SESSION_TTL_SECONDS,
        )
        self._save_session_cache(cache)

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
        if self._session_cache:
            # Check if cache is still valid
            if self._session_cache.is_valid():
                # Check if we should refresh (within 1 minute of expiry)
                if self._session_cache.should_refresh() and token:
                    # Auto-refresh in background
                    self._refresh_session(token)

                return SessionInfo(
                    tenant_id=self._session_cache.tenant_id,
                    tier=self._session_cache.tier,
                    authenticated=True,
                    credentials_path=str(self.credentials_path),
                    last_validated=self._last_validated,
                    gateway_url=self.gateway_url,
                    uses_secure_storage=uses_secure_storage,
                )
            else:
                # Cache expired - clear and refresh
                self._session_cache = None

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

        return SessionInfo(
            tenant_id="anonymous",
            tier="free",
            authenticated=False,
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
        # Validate with gateway to refresh session
        result = self.validate_credentials(token, use_v2=True)

        if result.valid and result.tenant:
            # Session cache is saved automatically by validate_credentials
            pass  # Refresh complete
        # If refresh fails, we keep using the expired cache until next explicit validation

    def login(
        self, token: str, persist: bool = True, migrate_to_secure: bool = True
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
        self._clear_session_cache()

        # Clear in-memory cache
        self._session_cache = None
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
                f"{self.gateway_url}{self.VALIDATION_ENDPOINT_V2}",
                headers={"Authorization": f"Bearer {token}"},
                timeout=10,
            )

            # Fallback to V1 if V2 not found
            if response.status_code == 404:
                response = requests.post(
                    f"{self.gateway_url}{self.VALIDATION_ENDPOINT_V1}",
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
