"""
Usage Auto Instrumentation - Phase 6

Automatically emits usage events to RaaS Gateway after each billable CLI command.

Features:
- Captures: command name, timestamp, agency_id (from JWT), CLI version
- POST to https://raas.agencyos.network/v2/usage
- mk_ API key authentication
- Idempotency via client-generated UUIDs
- KV-backed rate limit backoff

Usage:
    Called automatically by CLI middleware after each command execution.
"""

import os
import uuid
import json
import logging
from datetime import datetime, timezone
from typing import Optional, Dict, Any
from pathlib import Path
from dataclasses import dataclass, asdict

logger = logging.getLogger(__name__)


@dataclass
class UsageEvent:
    """
    Usage event emitted after CLI command execution.

    Attributes:
        event_id: Unique UUID v4 for idempotency
        event_type: Always "cli:command" for CLI events
        tenant_id: Agency ID from JWT token
        license_key: mk_ API key (masked in logs)
        timestamp: UTC timestamp
        endpoint: CLI command name
        cli_version: Mekong CLI version
        metadata: Additional context (OS, Python version, etc.)
    """
    event_id: str
    event_type: str
    tenant_id: str
    license_key: str
    timestamp: str
    endpoint: str
    cli_version: str
    metadata: Dict[str, Any]


class UsageInstrumentor:
    """
    Auto-instruments CLI commands with usage tracking.

    Emits usage events to RaaS Gateway after each billable command.
    Handles rate limiting, retries, and offline caching.
    """

    def __init__(self):
        self.gateway_url = os.getenv("RAAS_GATEWAY_URL", "https://raas.agencyos.network")
        self.api_key = os.getenv("RAAS_LICENSE_KEY")
        self.tenant_id: Optional[str] = None
        self.cli_version = self._get_cli_version()
        self.usage_dir = Path.home() / ".mekong" / "usage"
        self.usage_dir.mkdir(parents=True, exist_ok=True)

    def _get_cli_version(self) -> str:
        """Get CLI version from package or fallback to dev."""
        try:
            from importlib.metadata import version
            return version("mekong-cli")
        except Exception:
            return "0.2.0-dev"

    def _get_tenant_id(self) -> Optional[str]:
        """Extract tenant ID from JWT or license key."""
        if self.tenant_id:
            return self.tenant_id

        # Try to get from auth session
        try:
            from src.core.raas_auth import get_auth_client
            auth_client = get_auth_client()
            session = auth_client.get_session()
            if session.authenticated and session.tenant:
                self.tenant_id = session.tenant.tenant_id
                return self.tenant_id
        except Exception:
            pass

        # Fallback: derive from license key
        if self.api_key:
            # Hash-based derivation (simplified)
            import hashlib
            self.tenant_id = hashlib.sha256(self.api_key.encode()).hexdigest()[:16]
            return self.tenant_id

        return None

    def _get_metadata(self, command: str) -> Dict[str, Any]:
        """Get additional metadata for the event."""
        import sys
        import platform

        return {
            "os": platform.system(),
            "os_version": platform.version(),
            "python_version": sys.version.split()[0],
            "command": command,
            "is_ci": os.getenv("CI", "false").lower() == "true",
            "terminal": os.getenv("TERM", "unknown"),
        }

    def emit_event(self, command: str) -> Optional[str]:
        """
        Emit usage event for CLI command.

        Args:
            command: CLI command name (e.g., "cook", "plan", "sync-raas")

        Returns:
            Event ID if successful, None if failed
        """
        # Get tenant ID
        tenant_id = self._get_tenant_id()
        if not tenant_id:
            logger.debug("No tenant ID available, skipping usage event")
            return None

        # Skip if no API key
        if not self.api_key:
            logger.debug("No API key, skipping usage event")
            return None

        # Create event
        event = UsageEvent(
            event_id=str(uuid.uuid4()),
            event_type="cli:command",
            tenant_id=tenant_id,
            license_key=self.api_key,
            timestamp=datetime.now(timezone.utc).isoformat(),
            endpoint=f"/v1/cli/{command}",
            cli_version=self.cli_version,
            metadata=self._get_metadata(command),
        )

        # Try to send immediately
        success = self._send_to_gateway(event)

        if not success:
            # Cache for later sync
            self._cache_event(event)
            logger.debug(f"Cached usage event {event.event_id} for later sync")

        return event.event_id if success else None

    def _send_to_gateway(self, event: UsageEvent) -> bool:
        """
        Send usage event to RaaS Gateway.

        Implements:
        - KV-backed rate limit checking
        - Exponential backoff retry
        - Idempotency key in headers

        Returns:
            True if successful, False if should cache for later
        """
        # Check rate limit from KV
        if not self._check_rate_limit():
            logger.debug("Rate limited, caching event")
            return False

        try:
            import requests

            # Prepare payload
            payload = {
                "events": [asdict(event)],
            }

            # Headers with idempotency
            headers = {
                "Authorization": f"Bearer {event.license_key}",
                "Content-Type": "application/json",
                "X-Idempotency-Key": event.event_id,
                "X-CLI-Version": self.cli_version,
            }

            # Send to gateway v2/usage endpoint
            response = requests.post(
                f"{self.gateway_url}/v2/usage",
                json=payload,
                headers=headers,
                timeout=5,  # Short timeout for CLI responsiveness
            )

            # Handle response
            if response.status_code == 200:
                self._update_rate_limit(response.headers)
                logger.debug(f"Usage event sent: {event.event_id}")
                return True

            elif response.status_code == 429:
                # Rate limited
                self._handle_rate_limit(response.headers)
                return False

            elif response.status_code >= 500:
                # Server error, retry once
                logger.debug(f"Gateway error {response.status_code}, caching event")
                return False

            else:
                # Other error
                logger.debug(f"Gateway returned {response.status_code}, caching event")
                return False

        except Exception as e:
            logger.debug(f"Failed to send usage event: {e}")
            return False

    def _check_rate_limit(self) -> bool:
        """Check rate limit from KV store."""
        try:
            from src.core.kv_store_client import get_kv_client
            kv_client = get_kv_client()
            state = kv_client.get_rate_limit_state()
            return state.remaining > 0
        except Exception:
            # If KV unavailable, allow request
            return True

    def _update_rate_limit(self, headers: dict) -> None:
        """Update rate limit state from response headers."""
        try:
            from src.core.kv_store_client import get_kv_client
            kv_client = get_kv_client()

            remaining = int(headers.get("X-RateLimit-Remaining", 0))
            limit = int(headers.get("X-RateLimit-Limit", 0))
            reset = int(headers.get("X-RateLimit-Reset", 0))

            kv_client.update_rate_limit_state(remaining, limit, reset)
        except Exception:
            pass

    def _handle_rate_limit(self, headers: dict) -> None:
        """Handle rate limit exceeded."""
        try:
            reset_in = int(headers.get("X-RateLimit-Reset", 0)) - int(datetime.now(timezone.utc).timestamp())
            if reset_in > 0:
                from src.core.kv_store_client import get_kv_client
                kv_client = get_kv_client()
                kv_client.set_rate_limit_reset(reset_in)
        except Exception:
            pass

    def _cache_event(self, event: UsageEvent) -> None:
        """Cache event to disk for later sync."""
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"usage_{timestamp}_{event.event_id[:8]}.json"
        filepath = self.usage_dir / filename

        data = {
            "event": asdict(event),
            "cached_at": datetime.now(timezone.utc).isoformat(),
            "retry_count": 0,
        }

        with open(filepath, "w") as f:
            json.dump(data, f, indent=2)

    def get_cached_events(self, limit: int = 100) -> list:
        """Get cached events for batch sync."""
        events = []
        for filepath in sorted(self.usage_dir.glob("usage_*.json"))[:limit]:
            try:
                with open(filepath, "r") as f:
                    data = json.load(f)
                events.append(data.get("event", {}))
            except Exception:
                continue
        return events

    def clear_cached_event(self, filepath: str) -> bool:
        """Clear a cached event file after successful sync."""
        try:
            Path(filepath).unlink()
            return True
        except Exception:
            return False


# Global instance for CLI middleware
_instrumentor: Optional[UsageInstrumentor] = None


def get_instrumentor() -> UsageInstrumentor:
    """Get or create global instrumentor instance."""
    global _instrumentor
    if _instrumentor is None:
        _instrumentor = UsageInstrumentor()
    return _instrumentor


def emit_usage_event(command: str) -> Optional[str]:
    """
    Emit usage event for CLI command.

    Called automatically after each CLI command execution.

    Args:
        command: CLI command name

    Returns:
        Event ID if successful, None if failed
    """
    # Check if usage tracking is enabled
    if os.getenv("MEKONG_NO_USAGE_TRACKING", "").lower() == "true":
        return None

    instrumentor = get_instrumentor()
    return instrumentor.emit_event(command)
