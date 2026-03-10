"""
Telemetry Hooks — Usage Event Emission to RaaS Gateway

Emits anonymized usage events to RaaS Gateway telemetry endpoint:
- Command invoked (name, args hash)
- Success/failure status
- Duration
- Machine fingerprint
- CLI version

All events respect KV-based rate limiting and use mk_ API key + JWT auth.
"""

from __future__ import annotations

import os
import time
import uuid
import logging
from dataclasses import dataclass, field, asdict
from datetime import datetime, timezone
from enum import Enum
from typing import Optional, Dict, Any, List
from pathlib import Path
import json

from src.core.gateway_client import GatewayClient
from src.core.machine_fingerprint import get_machine_fingerprint_hash


class EventStatus(Enum):
    """Event status."""
    SUCCESS = "success"
    FAILURE = "failure"
    ERROR = "error"
    TIMEOUT = "timeout"


@dataclass
class TelemetryEvent:
    """
    Telemetry event data structure.

    Anonymized usage event for RaaS Gateway metering.
    """

    event_id: str
    event_type: str  # cli:command, cli:error, llm:call, etc.
    timestamp: str
    tenant_id: Optional[str]
    license_key: Optional[str]  # Hashed, not plain text

    # Command info
    command_name: Optional[str] = None
    command_args_hash: Optional[str] = None
    subcommand: Optional[str] = None

    # Execution info
    status: Optional[str] = None
    duration_ms: Optional[float] = None
    exit_code: Optional[int] = None
    error_type: Optional[str] = None
    error_message: Optional[str] = None

    # Machine info
    machine_fingerprint: Optional[str] = None
    platform: str = field(default_factory=lambda: __import__('platform').system())
    cli_version: str = field(default_factory=lambda: "0.2.0")

    # Rate limit info
    rate_limit_remaining: Optional[int] = None
    rate_limit_limit: Optional[int] = None

    def to_dict(self) -> Dict[str, Any]:
        """Serialize to dictionary."""
        return asdict(self)

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> TelemetryEvent:
        """Deserialize from dictionary."""
        return cls(**data)


class TelemetryConfig:
    """Telemetry configuration."""

    # Gateway endpoint
    TELEMETRY_ENDPOINT = "/v1/telemetry"

    # Batch settings
    BATCH_SIZE = 10
    FLUSH_INTERVAL_SECONDS = 30

    # Retry settings
    MAX_RETRIES = 3
    RETRY_DELAY_MS = 100

    # Local storage
    CACHE_DIR = Path.home() / ".mekong" / "telemetry"
    CACHE_FILE = "pending_events.json"

    # Opt-out
    OPT_OUT_ENV_VAR = "MEKONG_NO_TELEMETRY"


class TelemetryHooks:
    """
    Telemetry hooks for RaaS Gateway.

    Emits usage events with automatic batching, caching, and retry.
    """

    def __init__(self, gateway_client: Optional[GatewayClient] = None):
        self.gateway = gateway_client or GatewayClient()
        self._event_queue: List[TelemetryEvent] = []
        self._logger = logging.getLogger(__name__)
        self._last_flush = time.time()
        self._config = TelemetryConfig()

        # Ensure cache directory exists
        self._config.CACHE_DIR.mkdir(parents=True, exist_ok=True)

    def is_opted_out(self) -> bool:
        """Check if user opted out of telemetry."""
        return bool(os.getenv(self._config.OPT_OUT_ENV_VAR))

    def emit_event(
        self,
        event_type: str,
        command_name: Optional[str] = None,
        status: Optional[EventStatus] = None,
        duration_ms: Optional[float] = None,
        exit_code: Optional[int] = None,
        error_message: Optional[str] = None,
        error_type: Optional[str] = None,
        subcommand: Optional[str] = None,
        command_args_hash: Optional[str] = None,
    ) -> Optional[str]:
        """
        Emit telemetry event.

        Args:
            event_type: Type of event (cli:command, cli:error, etc.)
            command_name: Command name
            status: Event status
            duration_ms: Duration in milliseconds
            exit_code: Exit code
            error_message: Error message
            error_type: Error type (exception class)
            subcommand: Subcommand name
            command_args_hash: Hash of command args

        Returns:
            Event ID if emitted, None if failed/opted-out
        """
        if self.is_opted_out():
            self._logger.debug("Telemetry opted out")
            return None

        # Get machine fingerprint
        try:
            fingerprint = get_machine_fingerprint_hash()
        except Exception:
            fingerprint = None

        # Get API key (hashed)
        api_key = os.getenv("MK_API_KEY") or os.getenv("RAAS_LICENSE_KEY")
        license_key_hash = None
        if api_key:
            import hashlib
            license_key_hash = hashlib.sha256(api_key.encode()).hexdigest()[:16]

        # Create event
        event = TelemetryEvent(
            event_id=str(uuid.uuid4()),
            event_type=event_type,
            timestamp=datetime.now(timezone.utc).isoformat(),
            tenant_id=None,  # Populated by gateway
            license_key=license_key_hash,
            command_name=command_name,
            command_args_hash=command_args_hash,
            subcommand=subcommand,
            status=status.value if status else None,
            duration_ms=duration_ms,
            exit_code=exit_code,
            error_type=error_type,
            error_message=error_message,
            machine_fingerprint=fingerprint,
            cli_version=self._get_cli_version(),
        )

        # Add to queue
        self._event_queue.append(event)

        # Flush if batch is full or interval elapsed
        if (len(self._event_queue) >= self._config.BATCH_SIZE or
                time.time() - self._last_flush > self._config.FLUSH_INTERVAL_SECONDS):
            self.flush()

        return event.event_id

    def flush(self) -> int:
        """
        Flush event queue to gateway.

        Returns:
            Number of events successfully sent
        """
        if not self._event_queue:
            return 0

        events_to_send = self._event_queue.copy()
        self._event_queue.clear()
        self._last_flush = time.time()

        # Try to send
        success_count = 0
        for event in events_to_send:
            if self._send_event(event):
                success_count += 1
            else:
                # Cache for later retry
                self._cache_event(event)

        self._logger.debug(f"Flushed {success_count}/{len(events_to_send)} events")
        return success_count

    def _send_event(self, event: TelemetryEvent) -> bool:
        """Send single event to gateway."""
        try:
            headers = self._get_auth_headers()
            payload = event.to_dict()

            response = self.gateway.post(
                self._config.TELEMETRY_ENDPOINT,
                json=payload,
                headers=headers
            )

            if response.status_code == 200:
                return True
            elif response.status_code == 429:
                # Rate limited - cache for retry
                self._logger.debug("Rate limited, caching event")
                return False
            else:
                self._logger.warning(f"Telemetry send failed: {response.status_code}")
                return False

        except Exception as e:
            self._logger.debug(f"Telemetry send error: {e}")
            return False

    def _get_auth_headers(self) -> Dict[str, str]:
        """Get authentication headers."""
        headers = {
            "Content-Type": "application/json",
            "User-Agent": f"mekong-cli/{self._get_cli_version()}",
        }

        # Add API key
        api_key = os.getenv("MK_API_KEY") or os.getenv("RAAS_LICENSE_KEY")
        if api_key:
            headers["X-API-Key"] = api_key

        # Add machine fingerprint
        try:
            fingerprint = get_machine_fingerprint_hash()
            headers["X-Machine-Fingerprint"] = fingerprint
        except Exception:
            pass

        return headers

    def _cache_event(self, event: TelemetryEvent) -> None:
        """Cache event for later retry."""
        cache_path = self._config.CACHE_DIR / self._config.CACHE_FILE

        # Load existing events
        events = self._load_cached_events()
        events.append(event.to_dict())

        # Save (keep only last 100 events)
        events = events[-100:]
        try:
            with open(cache_path, "w") as f:
                json.dump(events, f, indent=2)
        except Exception as e:
            self._logger.debug(f"Failed to cache event: {e}")

    def _load_cached_events(self) -> List[Dict[str, Any]]:
        """Load cached events from disk."""
        cache_path = self._config.CACHE_DIR / self._config.CACHE_FILE

        if not cache_path.exists():
            return []

        try:
            with open(cache_path, "r") as f:
                return json.load(f)
        except Exception:
            return []

    def flush_cached_events(self) -> int:
        """Flush cached events to gateway."""
        events = self._load_cached_events()
        if not events:
            return 0

        success_count = 0
        remaining_events = []

        for event_dict in events:
            try:
                event = TelemetryEvent.from_dict(event_dict)
                if self._send_event(event):
                    success_count += 1
                else:
                    remaining_events.append(event_dict)
            except Exception:
                remaining_events.append(event_dict)

        # Update cache file
        cache_path = self._config.CACHE_DIR / self._config.CACHE_FILE
        if remaining_events:
            try:
                with open(cache_path, "w") as f:
                    json.dump(remaining_events, f, indent=2)
            except Exception:
                pass
        else:
            try:
                cache_path.unlink()
            except Exception:
                pass

        return success_count

    def command_hook(
        self,
        command_name: str,
        subcommand: Optional[str] = None,
        start_time: Optional[float] = None,
        status: Optional[EventStatus] = None,
        exit_code: Optional[int] = None,
        error_message: Optional[str] = None,
    ) -> Optional[str]:
        """
        Hook for CLI command execution.

        Args:
            command_name: Command name
            subcommand: Subcommand name
            start_time: Command start time (for duration calc)
            status: Command status
            exit_code: Exit code
            error_message: Error message if failed

        Returns:
            Event ID
        """
        duration_ms = None
        if start_time:
            duration_ms = (time.time() - start_time) * 1000

        return self.emit_event(
            event_type="cli:command",
            command_name=command_name,
            subcommand=subcommand,
            status=status,
            duration_ms=duration_ms,
            exit_code=exit_code,
            error_message=error_message,
        )

    def error_hook(
        self,
        error_type: str,
        error_message: str,
        command_name: Optional[str] = None,
    ) -> Optional[str]:
        """
        Hook for error events.

        Args:
            error_type: Exception type name
            error_message: Error message
            command_name: Command that caused error

        Returns:
            Event ID
        """
        return self.emit_event(
            event_type="cli:error",
            command_name=command_name,
            status=EventStatus.ERROR,
            error_type=error_type,
            error_message=error_message,
        )

    def _get_cli_version(self) -> str:
        """Get CLI version."""
        try:
            from importlib.metadata import version
            return version("mekong-cli")
        except Exception:
            return "0.2.0-dev"


# Global instance
_telemetry_hooks: Optional[TelemetryHooks] = None


def get_telemetry_hooks() -> TelemetryHooks:
    """Get global telemetry hooks instance."""
    global _telemetry_hooks
    if _telemetry_hooks is None:
        _telemetry_hooks = TelemetryHooks()
    return _telemetry_hooks


def emit_telemetry_event(
    event_type: str,
    command_name: Optional[str] = None,
    status: Optional[EventStatus] = None,
    duration_ms: Optional[float] = None,
    **kwargs
) -> Optional[str]:
    """Emit telemetry event."""
    return get_telemetry_hooks().emit_event(
        event_type=event_type,
        command_name=command_name,
        status=status,
        duration_ms=duration_ms,
        **kwargs
    )


def emit_command_event(
    command_name: str,
    subcommand: Optional[str] = None,
    start_time: Optional[float] = None,
    status: Optional[EventStatus] = None,
    exit_code: Optional[int] = None,
    **kwargs
) -> Optional[str]:
    """Emit command event."""
    return get_telemetry_hooks().command_hook(
        command_name=command_name,
        subcommand=subcommand,
        start_time=start_time,
        status=status,
        exit_code=exit_code,
        **kwargs
    )


def emit_error_event(
    error_type: str,
    error_message: str,
    command_name: Optional[str] = None,
) -> Optional[str]:
    """Emit error event."""
    return get_telemetry_hooks().error_hook(
        error_type=error_type,
        error_message=error_message,
        command_name=command_name,
    )


def flush_telemetry() -> int:
    """Flush telemetry queue."""
    return get_telemetry_hooks().flush()


def flush_cached_telemetry() -> int:
    """Flush cached telemetry events."""
    return get_telemetry_hooks().flush_cached_events()
