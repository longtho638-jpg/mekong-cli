"""
KV Store Client — Persistent Rate Limit State

Features:
- Store/retrieve rate limit state from gateway KV
- Sync local state with remote
- Health check endpoint
- TTL-based cache for performance
"""

from __future__ import annotations

import os
import time
from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Any, Optional

from src.core.gateway_client import get_gateway_client, GatewayClient
from src.core.raas_auth import get_auth_client


@dataclass
class RateLimitState:
    """Rate limit state from KV store."""

    remaining: int
    limit: int
    reset_at: datetime
    synced_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))

    @property
    def is_expired(self) -> bool:
        """Check if rate limit state is expired."""
        return datetime.now(timezone.utc) >= self.reset_at

    @property
    def seconds_until_reset(self) -> int:
        """Get seconds until rate limit reset."""
        delta = self.reset_at - datetime.now(timezone.utc)
        return max(0, int(delta.total_seconds()))

    def to_dict(self) -> dict[str, Any]:
        """Serialize to dictionary."""
        return {
            "remaining": self.remaining,
            "limit": self.limit,
            "reset_at": self.reset_at.isoformat(),
            "synced_at": self.synced_at.isoformat(),
        }

    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> RateLimitState:
        """Deserialize from dictionary."""
        return cls(
            remaining=data["remaining"],
            limit=data["limit"],
            reset_at=datetime.fromisoformat(data["reset_at"].replace("Z", "+00:00")),
            synced_at=datetime.fromisoformat(
                data.get("synced_at", datetime.now(timezone.utc).isoformat())
            ),
        )


class KVStoreClient:
    """
    Client for KV store operations.

    Syncs rate limit state with RaaS Gateway KV store.
    """

    KV_ENDPOINT = "/v1/kv/rate-limits"
    CACHE_TTL_SECONDS = 60  # Cache KV state for 1 minute

    def __init__(self, gateway_client: Optional[GatewayClient] = None):
        self.gateway = gateway_client or get_gateway_client()
        self.auth = get_auth_client()
        self._cache: Optional[RateLimitState] = None
        self._cache_time: float = 0.0

    def _is_cache_valid(self) -> bool:
        """Check if cached state is still valid."""
        return (
            self._cache is not None
            and (time.time() - self._cache_time) < self.CACHE_TTL_SECONDS
        )

    def get_rate_limit_state(
        self, force_refresh: bool = False
    ) -> RateLimitState:
        """
        Get rate limit state from KV store.

        Args:
            force_refresh: Force refresh from gateway (skip cache)

        Returns:
            RateLimitState with current limits
        """
        # Return cached state if valid
        if self._is_cache_valid() and not force_refresh:
            return self._cache

        # Fetch from gateway
        try:
            creds = self.auth._load_credentials()
            token = creds.get("token") or os.getenv("RAAS_LICENSE_KEY")

            response = self.gateway.get(
                self.KV_ENDPOINT,
                params={"license_key": token} if token else {},
            )

            self._cache = RateLimitState.from_dict(response.data)
            self._cache_time = time.time()
            return self._cache

        except Exception as e:
            import logging

            logging.debug(f"KV store fetch failed: {e}")
            # Return default state on error
            now = datetime.now(timezone.utc)
            return RateLimitState(
                remaining=1000,  # Default limit
                limit=1000,
                reset_at=now.replace(hour=23, minute=59, second=59),
            )

    def update_rate_limit_state(self, remaining: int) -> bool:
        """
        Update rate limit state in KV store.

        Args:
            remaining: New remaining count

        Returns:
            True if update successful
        """
        try:
            creds = self.auth._load_credentials()
            token = creds.get("token") or os.getenv("RAAS_LICENSE_KEY")

            payload = {
                "license_key": token,
                "remaining": remaining,
                "updated_at": datetime.now(timezone.utc).isoformat(),
            }

            response = self.gateway.put(
                f"{self.KV_ENDPOINT}/update",
                json=payload,
            )

            # Invalidate cache after update
            self._cache = None
            self._cache_time = 0.0

            return response.status_code == 200

        except Exception as e:
            import logging

            logging.debug(f"KV update failed: {e}")
            return False

    def sync_state(self) -> tuple[bool, str]:
        """
        Sync local state with remote KV store.

        Returns:
            Tuple of (success, message)
        """
        try:
            # Get remote state
            remote = self.get_rate_limit_state(force_refresh=True)

            # Compare with local
            local = self._cache
            if local:
                if local.remaining != remote.remaining:
                    # Local differs from remote - sync
                    self._cache = remote
                    return (
                        True,
                        f"Synced: local {local.remaining} → remote {remote.remaining}",
                    )
                return True, "Already in sync"
            else:
                # No local state - use remote
                self._cache = remote
                return True, f"Loaded from KV: {remote.remaining} remaining"

        except Exception as e:
            return False, f"Sync failed: {str(e)}"

    def get_health_status(self) -> dict[str, Any]:
        """
        Get KV store health status.

        Returns:
            Dict with health info
        """
        try:
            response = self.gateway.get(f"{self.KV_ENDPOINT}/health")
            return {
                "healthy": response.status_code == 200,
                "status": response.data.get("status"),
                "latency_ms": response.elapsed_ms,
                "gateway_url": response.gateway_url,
            }
        except Exception as e:
            return {
                "healthy": False,
                "error": str(e),
            }

    def get_usage_state(self) -> dict[str, Any]:
        """
        Get usage metering state from KV store.

        Returns:
            Dict with usage info:
            - cached_count: number of cached events
            - last_sync: timestamp of last sync
            - pending_events: events waiting to be synced
        """
        try:
            response = self.gateway.get(f"{self.KV_ENDPOINT}/usage")
            return {
                "cached_count": response.data.get("cached_count", 0),
                "last_sync": response.data.get("last_sync"),
                "pending_events": response.data.get("pending_events", 0),
            }
        except Exception:
            return {
                "cached_count": 0,
                "last_sync": None,
                "pending_events": 0,
            }

    def clear_rate_limit_state(self) -> bool:
        """
        Clear rate limit state from KV store.

        Returns:
            True if clear successful
        """
        try:
            creds = self.auth._load_credentials()
            token = creds.get("token") or os.getenv("RAAS_LICENSE_KEY")

            response = self.gateway.post(
                f"{self.KV_ENDPOINT}/clear",
                json={"license_key": token},
            )

            # Invalidate local cache
            self._cache = None
            self._cache_time = 0.0

            return response.status_code == 200
        except Exception:
            return False


# Global instance
_kv_client: Optional[KVStoreClient] = None


def get_kv_client() -> KVStoreClient:
    """Get global KV store client."""
    global _kv_client
    if _kv_client is None:
        _kv_client = KVStoreClient()
    return _kv_client


def show_kv_status() -> None:
    """Display KV store status and rate limit state."""
    from rich.console import Console
    from rich.table import Table
    from rich.panel import Panel

    console = Console()
    client = get_kv_client()

    console.print("[bold cyan]📊 KV Store Status[/bold cyan]\n")

    # Health status
    health = client.get_health_status()
    if health["healthy"]:
        console.print("[green]✓ KV Store Healthy[/green]\n")
    else:
        error = health.get("error", "Unknown error")
        console.print(f"[red]✗ KV Store Unhealthy: {error}[/red]\n")

    # Rate limit state
    state = client.get_rate_limit_state()

    table = Table(title="Rate Limit State")
    table.add_column("Property", style="cyan")
    table.add_column("Value", style="green")

    table.add_row("Remaining", str(state.remaining))
    table.add_row("Limit", str(state.limit))
    table.add_row("Reset In", f"{state.seconds_until_reset}s")
    table.add_row("Synced At", state.synced_at.strftime("%H:%M:%S"))

    console.print(table)

    # Usage bar
    bar_width = 40
    usage_percent = 1.0 - (state.remaining / state.limit) if state.limit > 0 else 0
    filled = int(usage_percent * bar_width)
    bar = "█" * filled + "░" * (bar_width - filled)

    color = "green" if usage_percent < 0.5 else ("yellow" if usage_percent < 0.8 else "red")

    console.print()
    console.print(
        Panel(
            f"[{color}]{bar}[/{color}]\n"
            f"[dim]{usage_percent * 100:.1f}% of {state.limit} daily limit[/dim]\n"
            f"[bold]{state.remaining}[/bold] commands remaining",
            title="Usage",
            border_style=color,
        )
    )


__all__ = [
    "RateLimitState",
    "KVStoreClient",
    "get_kv_client",
    "show_kv_status",
]
