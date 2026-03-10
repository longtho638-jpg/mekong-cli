"""
CLI Update Checker — RaaS Gateway Version Check

Silent background version check with caching (24h TTL).
Opt-out via MEKONG_NO_UPDATE_CHECK env var.

Features:
- Non-blocking async check on CLI startup
- Cache results for 24 hours
- Notify user only when update available
- Integration with RaaS Gateway /v1/cli/version endpoint

Usage:
    from src.cli.update_checker import UpdateChecker

    checker = UpdateChecker()
    if checker.should_check():
        update_info = await checker.check_version()
        checker.notify_if_available(update_info)
"""

from __future__ import annotations

import asyncio
import json
import os
from dataclasses import dataclass
from datetime import datetime, timezone, timedelta
from pathlib import Path
from typing import Any, Optional

from rich.console import Console

from src.core.gateway_client import get_gateway_client, GatewayClient

console = Console()

CACHE_FILE = "~/.mekong/update_check.json"
CACHE_TTL_HOURS = 24
CHECK_TIMEOUT_SECONDS = 2


@dataclass
class UpdateAvailable:
    """Update available info."""
    current_version: str
    latest_version: str
    download_url: str
    checksum_url: str
    signature_url: str
    is_critical: bool
    is_security_update: bool
    release_notes: str
    released_at: str
    changelog_url: str


@dataclass
class UpdateCache:
    """Cached update check result."""
    checked_at: datetime
    latest_version: Optional[str] = None
    update_available: bool = False
    update_info: Optional[dict[str, Any]] = None
    last_notified_version: Optional[str] = None

    @property
    def is_expired(self) -> bool:
        """Check if cache is expired (older than 24h)."""
        expiry = self.checked_at + timedelta(hours=CACHE_TTL_HOURS)
        return datetime.now(timezone.utc) > expiry

    @property
    def should_check(self) -> bool:
        """Check if we should run version check."""
        return not self.checked_at or self.is_expired

    def to_dict(self) -> dict[str, Any]:
        """Serialize to dict."""
        return {
            "checked_at": self.checked_at.isoformat(),
            "latest_version": self.latest_version,
            "update_available": self.update_available,
            "update_info": self.update_info,
            "last_notified_version": self.last_notified_version,
        }

    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> "UpdateCache":
        """Deserialize from dict."""
        return cls(
            checked_at=datetime.fromisoformat(data["checked_at"]),
            latest_version=data.get("latest_version"),
            update_available=data.get("update_available", False),
            update_info=data.get("update_info"),
            last_notified_version=data.get("last_notified_version"),
        )


class UpdateChecker:
    """Background update checker with caching."""

    def __init__(self, gateway_client: Optional[GatewayClient] = None):
        """
        Initialize UpdateChecker.

        Args:
            gateway_client: Optional GatewayClient instance
        """
        self.gateway = gateway_client or get_gateway_client()
        self.cache_path = Path(CACHE_FILE).expanduser()
        self.cache = self._load_cache()

    def _ensure_cache_dir(self) -> None:
        """Ensure cache directory exists."""
        self.cache_path.parent.mkdir(parents=True, exist_ok=True)
        os.chmod(self.cache_path.parent, 0o700)

    def _load_cache(self) -> UpdateCache:
        """Load cache from disk."""
        if not self.cache_path.exists():
            return UpdateCache(checked_at=datetime.min.replace(tzinfo=timezone.utc))

        try:
            with open(self.cache_path, "r") as f:
                data = json.load(f)
            cache = UpdateCache.from_dict(data)
            return cache
        except (json.JSONDecodeError, IOError, KeyError):
            # Corrupted cache - return fresh
            return UpdateCache(checked_at=datetime.min.replace(tzinfo=timezone.utc))

    def _save_cache(self, cache: UpdateCache) -> None:
        """Save cache to disk."""
        self._ensure_cache_dir()
        with open(self.cache_path, "w") as f:
            json.dump(cache.to_dict(), f, indent=2)
        os.chmod(self.cache_path, 0o600)

    def should_check(self) -> bool:
        """Check if we should run version check."""
        # Skip if env var set
        if os.getenv("MEKONG_NO_UPDATE_CHECK"):
            return False

        # Check cache TTL
        return self.cache.should_check

    async def check_version(self) -> Optional[UpdateAvailable]:
        """
        Check RaaS Gateway for latest version.

        Returns:
            UpdateAvailable if update available, None otherwise
        """
        try:
            # Get current version from package
            import importlib.metadata
            current_version = importlib.metadata.version("mekong-cli")
        except importlib.metadata.PackageNotFoundError:
            current_version = "0.0.0"

        try:
            # Call gateway with timeout
            response = await asyncio.wait_for(
                asyncio.to_thread(
                    self.gateway.get, "/v1/cli/version"
                ),
                timeout=CHECK_TIMEOUT_SECONDS
            )

            data = response.data
            latest_version = data.get("latest_version", current_version)

            # Update cache
            self.cache = UpdateCache(
                checked_at=datetime.now(timezone.utc),
                latest_version=latest_version,
                update_info=data,
            )
            self._save_cache(self.cache)

            # Compare versions
            if self._is_newer_version(latest_version, current_version):
                return UpdateAvailable(
                    current_version=current_version,
                    latest_version=latest_version,
                    download_url=data.get("download_url", ""),
                    checksum_url=data.get("checksum_url", ""),
                    signature_url=data.get("signature_url", ""),
                    is_critical=data.get("is_critical", False),
                    is_security_update=data.get("is_security_update", False),
                    release_notes=data.get("release_notes", ""),
                    released_at=data.get("released_at", ""),
                    changelog_url=data.get("changelog_url", ""),
                )

            return None

        except asyncio.TimeoutError:
            # Gateway timeout - fail silently
            return None
        except Exception:
            # Gateway error - fail silently
            return None

    def check_version_sync(self) -> Optional[UpdateAvailable]:
        """
        Synchronous version check for use in blocking contexts.

        Returns:
            UpdateAvailable if update available, None otherwise
        """
        try:
            loop = asyncio.get_event_loop()
        except RuntimeError:
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
        return loop.run_until_complete(self.check_version())

    def check_critical_update(self) -> Optional[UpdateAvailable]:
        """
        Check for critical update and return if blocking required.

        Returns:
            UpdateAvailable if critical update pending, None otherwise
        """
        update = self.check_version_sync()

        if update and update.is_critical:
            # Store critical update info for enforcement
            self._mark_critical_update_pending(update)
            return update

        return None

    def _mark_critical_update_pending(self, update: UpdateAvailable) -> None:
        """Mark critical update as pending for enforcement."""
        self.cache.update_info = {
            **(self.cache.update_info or {}),
            "is_critical": True,
            "critical_pending": True,
            "critical_version": update.latest_version,
        }
        self._save_cache(self.cache)

    def should_block_execution(self) -> bool:
        """
        Check if CLI execution should be blocked due to critical update.

        Returns:
            True if current version has critical issues requiring update
        """
        if not self.cache.update_info:
            return False

        # Check if critical update is pending
        if self.cache.update_info.get("critical_pending"):
            return True

        # Check if current version is in critical list
        critical_versions = self.cache.update_info.get("critical_versions", [])
        current_version = self.get_current_version()

        return current_version in critical_versions

    def get_critical_update_info(self) -> Optional[UpdateAvailable]:
        """Get pending critical update info."""
        if not self.cache.update_info:
            return None

        # Check if we have cached update info
        if self.cache.update_info.get("critical_pending"):
            return UpdateAvailable(
                current_version=self.get_current_version(),
                latest_version=self.cache.update_info.get("critical_version", ""),
                download_url=self.cache.update_info.get("download_url", ""),
                checksum_url=self.cache.update_info.get("checksum_url", ""),
                signature_url=self.cache.update_info.get("signature_url", ""),
                is_critical=True,
                is_security_update=self.cache.update_info.get("is_security_update", False),
                release_notes=self.cache.update_info.get("release_notes", ""),
                released_at=self.cache.update_info.get("released_at", ""),
                changelog_url=self.cache.update_info.get("changelog_url", ""),
            )
        return None

    def get_current_version(self) -> str:
        """Get current CLI version."""
        try:
            import importlib.metadata
            return importlib.metadata.version("mekong-cli")
        except importlib.metadata.PackageNotFoundError:
            return "0.0.0"

    def _is_newer_version(self, latest: str, current: str) -> bool:
        """Compare version strings (semver-like)."""
        try:
            def parse_version(v: str) -> tuple[int, ...]:
                # Remove 'v' prefix if present
                v = v.lstrip('v')
                return tuple(map(int, v.split('.')[:3]))

            return parse_version(latest) > parse_version(current)
        except (ValueError, IndexError):
            return False

    def notify_if_available(self, update: Optional[UpdateAvailable]) -> None:
        """
        Show notification if update available.

        Only shows notification once per version (tracked in cache).
        """
        if not update:
            return

        # Skip if already notified for this version
        if self.cache.last_notified_version == update.latest_version:
            return

        # Build notification message
        msg_type = "🚨 CRITICAL" if update.is_critical else (
            "🔒 SECURITY" if update.is_security_update else "📦 UPDATE"
        )

        console.print(f"\n[{self._get_color(update)}]{msg_type}[/]: "
                     f"mekong-cli {update.current_version} → {update.latest_version}")

        if update.release_notes:
            console.print(f"  {update.release_notes}")

        console.print("  Run: [bold]mekong update install[/bold] to upgrade")
        console.print(f"  Changelog: {update.changelog_url}\n")

        # Mark as notified
        self.cache.last_notified_version = update.latest_version
        self._save_cache(self.cache)

    def _get_color(self, update: UpdateAvailable) -> str:
        """Get notification color based on update type."""
        if update.is_critical:
            return "bold red"
        elif update.is_security_update:
            return "bold yellow"
        else:
            return "bold blue"

    def get_cache_status(self) -> dict[str, Any]:
        """Get cache status for debugging."""
        return {
            "cache_exists": self.cache_path.exists(),
            "checked_at": self.cache.checked_at.isoformat() if self.cache.checked_at else None,
            "is_expired": self.cache.is_expired,
            "should_check": self.should_check(),
            "latest_version": self.cache.latest_version,
            "update_available": self.cache.update_available,
        }


# Singleton instance
_checker: Optional[UpdateChecker] = None


def get_update_checker() -> UpdateChecker:
    """Get or create UpdateChecker singleton."""
    global _checker
    if _checker is None:
        _checker = UpdateChecker()
    return _checker


async def check_for_updates_async() -> Optional[UpdateAvailable]:
    """
    Async wrapper for checking updates.

    Usage in main.py:
        if not os.getenv("MEKONG_NO_UPDATE_CHECK"):
            asyncio.create_task(check_for_updates_async())
    """
    checker = get_update_checker()
    if not checker.should_check():
        return None

    return await checker.check_version()


def notify_update_available(update: Optional[UpdateAvailable]) -> None:
    """Notify user if update available."""
    if update:
        checker = get_update_checker()
        checker.notify_if_available(update)
