"""
CLI Health Reporter — Phase 6 Telemetry

Reports anonymized health metrics to RaaS Gateway:
- Command success/failure rates
- CLI version, OS info
- License validation status
- Rate limit hits
- Error categories (anonymized)

Compliance:
- Opt-in via ConsentManager
- JWT + mk_ API key auth
- Respects KV rate limiting
- Syncs with AgencyOS dashboard
"""

from __future__ import annotations

import json
import os
import platform
import time
from dataclasses import dataclass, asdict
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Optional
import logging

import requests

from .telemetry_consent import ConsentManager, get_consent_manager
from .raas_auth import RaaSAuthClient

logger = logging.getLogger(__name__)


@dataclass
class HealthMetrics:
    """Health metrics snapshot."""
    cli_version: str
    os_type: str
    os_version: str
    python_version: str
    session_id: str
    commands_executed: int = 0
    commands_succeeded: int = 0
    commands_failed: int = 0
    rate_limit_hits: int = 0
    license_validation_failures: int = 0
    avg_command_duration_ms: float = 0.0
    error_categories: dict[str, int] = None

    def __post_init__(self):
        if self.error_categories is None:
            self.error_categories = {}


@dataclass
class HealthReport:
    """Report to send to gateway."""
    metrics: HealthMetrics
    timestamp: str
    report_type: str = "health_metrics"
    schema_version: str = "1.0"


class HealthReporter:
    """
    Report CLI health metrics to RaaS Gateway.

    Storage: ~/.mekong/health_metrics.json
    Upload: POST /v2/telemetry/health to gateway
    """

    METRICS_FILE = "~/.mekong/health_metrics.json"
    REPORT_INTERVAL = 300  # 5 minutes
    GATEWAY_ENDPOINT = "/v2/telemetry/health"

    def __init__(
        self,
        consent_manager: Optional[ConsentManager] = None,
        auth_client: Optional[RaaSAuthClient] = None,
        gateway_url: Optional[str] = None,
    ):
        self.consent_manager = consent_manager or get_consent_manager()
        self.auth_client = auth_client or RaaSAuthClient()
        self.gateway_url = gateway_url or os.getenv(
            "RAAS_GATEWAY_URL", "https://raas.agencyos.network"
        )
        self.metrics_path = Path(self.METRICS_FILE).expanduser()
        self._metrics: Optional[HealthMetrics] = None
        self._last_report = 0.0

    def _ensure_metrics_dir(self) -> None:
        """Ensure metrics directory exists."""
        self.metrics_path.parent.mkdir(parents=True, exist_ok=True)

    def _load_metrics(self) -> Optional[HealthMetrics]:
        """Load metrics from file."""
        if self._metrics:
            return self._metrics

        if not self.metrics_path.exists():
            return None

        try:
            with open(self.metrics_path, "r") as f:
                data = json.load(f)
                # Handle nested metrics structure
                if "metrics" in data:
                    data = data["metrics"]
                self._metrics = HealthMetrics(**data)
                return self._metrics
        except (json.JSONDecodeError, KeyError, TypeError) as e:
            logger.debug(f"Failed to load metrics: {e}")
            return None

    def _save_metrics(self, metrics: HealthMetrics) -> None:
        """Save metrics to file."""
        self._ensure_metrics_dir()
        with open(self.metrics_path, "w") as f:
            json.dump(asdict(metrics), f, indent=2)
        self._metrics = metrics

    def get_or_create_metrics(self) -> HealthMetrics:
        """Get or create health metrics."""
        metrics = self._load_metrics()
        if not metrics:
            metrics = HealthMetrics(
                cli_version=self._get_cli_version(),
                os_type=platform.system(),
                os_version=platform.version(),
                python_version=platform.python_version(),
                session_id=self._get_session_id(),
            )
            self._save_metrics(metrics)
        return metrics

    def _get_cli_version(self) -> str:
        """Get CLI version."""
        try:
            version_file = Path(__file__).parent.parent / "VERSION"
            if version_file.exists():
                return version_file.read_text().strip()
        except Exception:
            pass
        return os.getenv("MEKONG_VERSION", "unknown")

    def _get_session_id(self) -> str:
        """Generate session ID."""
        import uuid
        return str(uuid.uuid4())[:8]

    def record_command(
        self,
        command: str,
        success: bool,
        duration_ms: float,
        error_category: Optional[str] = None,
    ) -> None:
        """
        Record command execution.

        Args:
            command: Command name (e.g., "cook", "plan")
            success: Whether command succeeded
            duration_ms: Execution duration in milliseconds
            error_category: Optional error category (e.g., "auth", "rate_limit", "network")
        """
        if not self.consent_manager.has_consent():
            return

        metrics = self.get_or_create_metrics()
        metrics.commands_executed += 1

        if success:
            metrics.commands_succeeded += 1
        else:
            metrics.commands_failed += 1
            if error_category:
                metrics.error_categories[error_category] = (
                    metrics.error_categories.get(error_category, 0) + 1
                )

        # Update average duration
        total = metrics.commands_executed
        metrics.avg_command_duration_ms = (
            (metrics.avg_command_duration_ms * (total - 1) + duration_ms) / total
        )

        self._save_metrics(metrics)

    def record_rate_limit_hit(self) -> None:
        """Record rate limit hit."""
        if not self.consent_manager.has_consent():
            return

        metrics = self.get_or_create_metrics()
        metrics.rate_limit_hits += 1
        self._save_metrics(metrics)

    def record_license_validation_failure(self) -> None:
        """Record license validation failure."""
        if not self.consent_manager.has_consent():
            return

        metrics = self.get_or_create_metrics()
        metrics.license_validation_failures += 1
        self._save_metrics(metrics)

    def should_report(self) -> bool:
        """Check if should report to gateway."""
        if not self.consent_manager.has_consent():
            return False

        return time.time() - self._last_report >= self.REPORT_INTERVAL

    def report_to_gateway(self) -> bool:
        """
        Report health metrics to RaaS Gateway.

        Returns:
            True if report was sent successfully
        """
        if not self.should_report():
            return False

        metrics = self.get_or_create_metrics()
        if not metrics:
            return False

        report = HealthReport(
            metrics=metrics,
            timestamp=datetime.now(timezone.utc).isoformat(),
        )

        try:
            # Get auth headers
            headers = self._get_auth_headers()
            if not headers:
                logger.debug("No auth headers for health report")
                return False

            # Send report
            response = requests.post(
                f"{self.gateway_url}{self.GATEWAY_ENDPOINT}",
                headers=headers,
                json=asdict(report),
                timeout=10,
            )

            if response.status_code == 200:
                self._last_report = time.time()
                # Reset counters after successful report
                self._reset_counters()
                logger.info("Health metrics reported to gateway")
                return True
            else:
                logger.debug(f"Gateway returned {response.status_code}")
                return False

        except requests.RequestException as e:
            logger.debug(f"Failed to report health metrics: {e}")
            return False

    def _get_auth_headers(self) -> dict[str, str]:
        """Get authenticated headers."""
        try:
            # Try to get license key
            license_key = os.getenv("RAAS_LICENSE_KEY")
            if not license_key:
                # Try loading from credentials
                creds_path = Path.home() / ".mekong" / "raas" / "credentials.json"
                if creds_path.exists():
                    with open(creds_path) as f:
                        license_key = json.load(f).get("token")

            if not license_key:
                return {}

            # Extract mk_ API key if present
            if license_key.startswith("mk_"):
                api_key = license_key
            else:
                api_key = license_key

            return {
                "Content-Type": "application/json",
                "Authorization": f"Bearer {api_key}",
                "X-RaaS-Source": "mekong-cli",
                "X-RaaS-Version": self._get_cli_version(),
            }
        except Exception as e:
            logger.debug(f"Failed to get auth headers: {e}")
            return {}

    def _reset_counters(self) -> None:
        """Reset counters after successful report."""
        metrics = self.get_or_create_metrics()
        metrics.commands_executed = 0
        metrics.commands_succeeded = 0
        metrics.commands_failed = 0
        metrics.rate_limit_hits = 0
        metrics.license_validation_failures = 0
        metrics.error_categories = {}
        metrics.session_id = self._get_session_id()  # New session
        self._save_metrics(metrics)

    def get_status(self) -> dict[str, Any]:
        """Get health reporter status."""
        metrics = self.get_or_create_metrics()
        if not metrics:
            return {"status": "no_metrics"}

        return {
            "status": "active" if self.consent_manager.has_consent() else "inactive",
            "cli_version": metrics.cli_version,
            "os": f"{metrics.os_type} {metrics.os_version}",
            "python_version": metrics.python_version,
            "session_id": metrics.session_id,
            "commands_executed": metrics.commands_executed,
            "commands_succeeded": metrics.commands_succeeded,
            "commands_failed": metrics.commands_failed,
            "success_rate": (
                metrics.commands_succeeded / metrics.commands_executed
                if metrics.commands_executed > 0
                else 0
            ),
            "rate_limit_hits": metrics.rate_limit_hits,
            "last_report": (
                datetime.fromtimestamp(self._last_report, tz=timezone.utc).isoformat()
                if self._last_report > 0
                else "never"
            ),
        }


# Singleton
_health_reporter: Optional[HealthReporter] = None


def get_health_reporter() -> HealthReporter:
    """Get or create HealthReporter singleton."""
    global _health_reporter
    if _health_reporter is None:
        _health_reporter = HealthReporter()
    return _health_reporter


def record_command(
    command: str,
    success: bool,
    duration_ms: float,
    error_category: Optional[str] = None,
) -> None:
    """Record command execution."""
    reporter = get_health_reporter()
    reporter.record_command(command, success, duration_ms, error_category)


def report_health() -> bool:
    """Report health metrics to gateway."""
    reporter = get_health_reporter()
    return reporter.report_to_gateway()
