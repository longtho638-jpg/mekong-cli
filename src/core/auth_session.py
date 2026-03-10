"""
RaaS Auth Session - Session Management

Session cache persistence, TTL management, and auto-refresh.
"""

from __future__ import annotations

import json
import os
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional

from .auth_types import SessionCache, SessionInfo, TenantContext


class SessionManager:
    """
    Session cache manager with TTL support.

    Manages:
    - Session cache persistence to ~/.mekong/session.json
    - 5-minute TTL with 1-minute refresh buffer
    - Auto-refresh before expiry
    - Atomic cache updates

    Attributes:
        session_cache_path: Path to session cache file
        ttl_seconds: Session TTL in seconds
        refresh_buffer_seconds: Buffer before expiry for refresh
    """

    DEFAULT_TTL_SECONDS = 300  # 5 minutes
    DEFAULT_REFRESH_BUFFER = 60  # 1 minute

    def __init__(
        self,
        cache_path: Optional[str] = None,
        ttl_seconds: Optional[int] = None,
        refresh_buffer: Optional[int] = None,
    ):
        """
        Initialize Session Manager.

        Args:
            cache_path: Path to session cache file (default: ~/.mekong/session.json)
            ttl_seconds: Session TTL in seconds (default: 300)
            refresh_buffer: Refresh buffer in seconds (default: 60)
        """
        self.session_cache_path = Path(
            cache_path or "~/.mekong/session.json"
        ).expanduser()
        self.ttl_seconds = ttl_seconds or self.DEFAULT_TTL_SECONDS
        self.refresh_buffer = refresh_buffer or self.DEFAULT_REFRESH_BUFFER
        self._in_memory_cache: Optional[SessionCache] = None

    def _ensure_cache_dir(self) -> None:
        """Ensure session cache directory exists with secure permissions."""
        self.session_cache_path.parent.mkdir(parents=True, exist_ok=True)
        os.chmod(self.session_cache_path.parent, 0o700)

    def save(self, cache: SessionCache) -> None:
        """
        Save session cache to disk.

        Args:
            cache: SessionCache object to persist
        """
        self._ensure_cache_dir()
        with open(self.session_cache_path, "w") as f:
            json.dump(cache.to_dict(), f, indent=2)
        os.chmod(self.session_cache_path, 0o600)
        self._in_memory_cache = cache

    def load(self) -> Optional[SessionCache]:
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

            # Override TTL with configured value
            data["ttl_seconds"] = self.ttl_seconds
            cache = SessionCache.from_dict(data)

            # Return cache only if still valid
            if cache.is_valid():
                self._in_memory_cache = cache
                return cache
            else:
                # Auto-clear expired cache
                self.clear()
                return None

        except (json.JSONDecodeError, IOError, KeyError, ValueError):
            # Corrupted cache - clear and return None
            self.clear()
            return None

    def clear(self) -> bool:
        """
        Clear session cache file and in-memory cache.

        Returns:
            True if cache was cleared, False if no cache existed
        """
        if self.session_cache_path.exists():
            try:
                os.remove(self.session_cache_path)
                self._in_memory_cache = None
                return True
            except OSError:
                return False

        self._in_memory_cache = None
        return False

    def get_cached(self) -> Optional[SessionCache]:
        """
        Get in-memory cached session.

        Returns:
            SessionCache if available and valid, None otherwise
        """
        if self._in_memory_cache and self._in_memory_cache.is_valid():
            return self._in_memory_cache
        return None

    def should_refresh(self, cache: SessionCache) -> bool:
        """
        Check if session should be refreshed.

        Args:
            cache: SessionCache to check

        Returns:
            True if within refresh buffer of expiry
        """
        return cache.should_refresh()

    def create_from_tenant(
        self,
        tenant: TenantContext,
        token: str,
    ) -> SessionCache:
        """
        Create new SessionCache from TenantContext.

        Args:
            tenant: Validated tenant context
            token: Token used for validation (mk_ key or JWT)

        Returns:
            New SessionCache instance
        """
        return SessionCache(
            tenant_id=tenant.tenant_id,
            tier=tenant.tier,
            role=tenant.role,
            license_key=tenant.license_key or token,
            features=tenant.features,
            expires_at=tenant.expires_at,
            cached_at=datetime.now(timezone.utc),
            ttl_seconds=self.ttl_seconds,
        )

    def to_session_info(
        self,
        cache: SessionCache,
        credentials_path: str,
        gateway_url: str,
        last_validated: Optional[datetime] = None,
        uses_secure_storage: bool = False,
    ) -> SessionInfo:
        """
        Convert SessionCache to SessionInfo.

        Args:
            cache: SessionCache to convert
            credentials_path: Path to credentials file
            gateway_url: Gateway URL
            last_validated: Last validation timestamp
            uses_secure_storage: Whether secure storage is enabled

        Returns:
            SessionInfo for current session
        """
        return SessionInfo(
            tenant_id=cache.tenant_id,
            tier=cache.tier,
            authenticated=True,
            credentials_path=credentials_path,
            last_validated=last_validated,
            gateway_url=gateway_url,
            uses_secure_storage=uses_secure_storage,
        )

    def create_anonymous_session(
        self,
        credentials_path: str,
        gateway_url: str,
        uses_secure_storage: bool = False,
    ) -> SessionInfo:
        """
        Create anonymous session info.

        Args:
            credentials_path: Path to credentials file
            gateway_url: Gateway URL
            uses_secure_storage: Whether secure storage is enabled

        Returns:
            SessionInfo for anonymous session
        """
        return SessionInfo(
            tenant_id="anonymous",
            tier="free",
            authenticated=False,
            credentials_path=credentials_path,
            gateway_url=gateway_url,
            uses_secure_storage=uses_secure_storage,
        )
