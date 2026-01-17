"""
🏯 Antigravity Quota Engine
============================
Core quota monitoring engine inspired by vscode-antigravity-cockpit.
Implements local process detection and optional remote API quota fetching.

Features:
- 6 status bar formats
- Warning (30%) / Critical (10%) thresholds
- Countdown timer until reset
- Model grouping by quota pool

Usage:
    from packages.antigravity.core.quota_engine import QuotaEngine
    engine = QuotaEngine()
    status = engine.get_current_status()
"""

import json
import subprocess
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from enum import Enum
from pathlib import Path
from typing import Any, Dict, List, Optional


class StatusFormat(Enum):
    """Status bar display formats (6 formats from vscode-antigravity-cockpit)."""

    ROCKET = "rocket"  # 🚀
    DOT = "dot"  # 🟢
    DOT_PERCENT = "dot_percent"  # 🟢 95%
    PERCENT = "percent"  # 95%
    NAME_PERCENT = "name_percent"  # Sonnet: 95%
    FULL = "full"  # 🟢 Sonnet: 95%


class ThresholdLevel(Enum):
    """Quota threshold levels."""

    NORMAL = "normal"  # > 30%
    WARNING = "warning"  # 10-30%
    CRITICAL = "critical"  # < 10%


@dataclass
class QuotaModel:
    """Represents a single AI model's quota status."""

    model_id: str
    model_name: str
    remaining_percent: float
    reset_time: Optional[datetime] = None
    pool_id: Optional[str] = None
    capabilities: List[str] = field(default_factory=list)
    context_window: Optional[int] = None

    @property
    def threshold_level(self) -> ThresholdLevel:
        """Determine threshold level based on remaining percentage."""
        if self.remaining_percent < 10:
            return ThresholdLevel.CRITICAL
        elif self.remaining_percent < 30:
            return ThresholdLevel.WARNING
        return ThresholdLevel.NORMAL

    @property
    def countdown(self) -> str:
        """Format countdown until reset."""
        from datetime import timezone

        if not self.reset_time:
            return "Unknown"

        # Get current time in UTC for comparison with UTC reset time
        now = datetime.now(timezone.utc)

        # Handle timezone-aware datetimes
        reset_time = self.reset_time
        if reset_time.tzinfo is None:
            # Assume UTC if no timezone
            reset_time = reset_time.replace(tzinfo=timezone.utc)

        if reset_time <= now:
            return "Ready"

        delta = reset_time - now
        hours = int(delta.total_seconds() // 3600)
        minutes = int((delta.total_seconds() % 3600) // 60)

        if hours > 0:
            return f"{hours}h {minutes}m"
        return f"{minutes}m"

    @property
    def reset_time_str(self) -> str:
        """Format reset time as HH:MM (local VN time, UTC+7)."""
        if not self.reset_time:
            return "--:--"
        # Convert UTC to local time (+7 for Vietnam)
        local_hour = (self.reset_time.hour + 7) % 24
        return f"{local_hour:02d}:{self.reset_time.minute:02d}"

    def format_status(self, fmt: StatusFormat = StatusFormat.FULL) -> str:
        """Format status according to specified format."""
        emoji = self._get_status_emoji()
        percent = f"{int(self.remaining_percent)}%"

        formats = {
            StatusFormat.ROCKET: "🚀",
            StatusFormat.DOT: emoji,
            StatusFormat.DOT_PERCENT: f"{emoji} {percent}",
            StatusFormat.PERCENT: percent,
            StatusFormat.NAME_PERCENT: f"{self.model_name}: {percent}",
            StatusFormat.FULL: f"{emoji} {self.model_name}: {percent}",
        }
        return formats.get(fmt, formats[StatusFormat.FULL])

    def _get_status_emoji(self) -> str:
        """Get status emoji based on threshold level."""
        return {
            ThresholdLevel.NORMAL: "🟢",
            ThresholdLevel.WARNING: "🟡",
            ThresholdLevel.CRITICAL: "🔴",
        }[self.threshold_level]


@dataclass
class QuotaPool:
    """Group of models sharing the same quota pool."""

    pool_id: str
    pool_name: str
    models: List[QuotaModel] = field(default_factory=list)

    @property
    def aggregate_remaining(self) -> float:
        """Calculate aggregate remaining percentage."""
        if not self.models:
            return 0.0
        return min(m.remaining_percent for m in self.models)

    @property
    def lowest_model(self) -> Optional[QuotaModel]:
        """Get model with lowest remaining quota."""
        if not self.models:
            return None
        return min(self.models, key=lambda m: m.remaining_percent)


class QuotaEngine:
    """
    Main quota monitoring engine.

    Supports:
    - Local process detection (reads from Antigravity client)
    - Remote API fetching (optional, requires authorization)
    """

    DEFAULT_WARNING_THRESHOLD = 30
    DEFAULT_CRITICAL_THRESHOLD = 10

    def __init__(
        self,
        warning_threshold: int = DEFAULT_WARNING_THRESHOLD,
        critical_threshold: int = DEFAULT_CRITICAL_THRESHOLD,
        cache_dir: Optional[Path] = None,
    ):
        self.warning_threshold = warning_threshold
        self.critical_threshold = critical_threshold
        self.cache_dir = cache_dir or Path.home() / ".mekong" / "quota_cache"
        self._models: List[QuotaModel] = []
        self._pools: Dict[str, QuotaPool] = {}
        self._last_fetch: Optional[datetime] = None

        # Antigravity Language Server connection info
        self._connect_port: Optional[int] = None
        self._csrf_token: Optional[str] = None

    # API endpoint from vscode-antigravity-cockpit
    API_ENDPOINT = "/exa.language_server_pb.LanguageServerService/GetUserStatus"

    # Process names by platform (from vscode-antigravity-cockpit)
    PROCESS_NAMES = {
        "darwin_arm": "language_server_macos_arm",
        "darwin_x64": "language_server_macos",
        "linux": "language_server_linux",
    }

    def get_local_quota(self) -> List[QuotaModel]:
        """
        Detect quota from local Antigravity Language Server process.

        This method:
        1. Scans for language_server process
        2. Extracts port and csrf_token from command line args
        3. Calls local HTTPS API to get real quota data
        """
        models = []

        # Try to find Antigravity Language Server process
        try:
            connection_info = self._scan_for_antigravity_process()

            if connection_info:
                self._connect_port = connection_info["port"]
                self._csrf_token = connection_info["csrf_token"]

                # Call the API to get real quota
                quota_data = self._fetch_quota_from_api()
                if quota_data:
                    models = self._parse_quota_data(quota_data)

        except Exception as e:
            # Log error but continue with mock data
            import sys

            print(f"[QuotaEngine] Failed to get real quota: {e}", file=sys.stderr)

        # If no local data, return mock data for testing
        if not models:
            models = self._get_mock_quota()

        self._models = models
        self._last_fetch = datetime.now()
        return models

    def _scan_for_antigravity_process(self) -> Optional[Dict[str, Any]]:
        """
        Scan for Antigravity Language Server process.
        Returns dict with 'port', 'csrf_token', and 'pid' if found.
        """
        import platform
        import re

        # Determine target process name based on platform
        if platform.system() == "Darwin":
            arch = platform.machine()
            target_process = (
                self.PROCESS_NAMES["darwin_arm"]
                if arch == "arm64"
                else self.PROCESS_NAMES["darwin_x64"]
            )
        elif platform.system() == "Linux":
            target_process = self.PROCESS_NAMES["linux"]
        else:
            return None  # Windows not supported in this version

        try:
            # Get process info using ps command
            result = subprocess.run(
                ["ps", "aux"],
                capture_output=True,
                text=True,
                timeout=5,
            )

            for line in result.stdout.split("\n"):
                if target_process in line:
                    # Found the process! Extract PID and csrf_token from args
                    parts = line.split()
                    if len(parts) >= 2:
                        pid = int(parts[1])
                    else:
                        continue

                    token_match = re.search(r"--csrf_token[=\s]+([a-f0-9-]+)", line)

                    if token_match:
                        csrf_token = token_match.group(1)

                        # Get actual listening ports from lsof
                        ports = self._get_listening_ports(pid)

                        if ports:
                            # Find the correct API port by probing
                            for port in ports:
                                if self._verify_api_port(port, csrf_token):
                                    return {
                                        "port": port,
                                        "csrf_token": csrf_token,
                                        "pid": pid,
                                    }

        except (subprocess.TimeoutExpired, FileNotFoundError, ValueError):
            pass

        return None

    def _get_listening_ports(self, pid: int) -> List[int]:
        """Get all listening ports for a process using lsof."""
        import re

        try:
            result = subprocess.run(
                ["lsof", "-i", "-n", "-P"],
                capture_output=True,
                text=True,
                timeout=5,
            )

            ports = []
            for line in result.stdout.split("\n"):
                if str(pid) in line and "LISTEN" in line:
                    # Extract port from "127.0.0.1:58004 (LISTEN)"
                    port_match = re.search(r":(\d+)\s+\(LISTEN\)", line)
                    if port_match:
                        ports.append(int(port_match.group(1)))

            return ports

        except (subprocess.TimeoutExpired, FileNotFoundError):
            return []

    def _verify_api_port(self, port: int, csrf_token: str) -> bool:
        """Verify if a port responds to the API endpoint."""
        import ssl
        import urllib.error
        import urllib.request

        url = f"https://127.0.0.1:{port}{self.API_ENDPOINT}"

        ctx = ssl.create_default_context()
        ctx.check_hostname = False
        ctx.verify_mode = ssl.CERT_NONE

        req = urllib.request.Request(
            url,
            data=json.dumps({}).encode("utf-8"),
            headers={
                "Content-Type": "application/json",
                "Connect-Protocol-Version": "1",
                "X-Codeium-Csrf-Token": csrf_token,
            },
            method="POST",
        )

        try:
            with urllib.request.urlopen(req, timeout=3, context=ctx) as response:
                return response.status == 200
        except:
            return False

    def _fetch_quota_from_api(self) -> Optional[Dict[str, Any]]:
        """
        Fetch quota data from local Antigravity Language Server API.
        Calls: POST https://127.0.0.1:{port}/exa.language_server_pb.LanguageServerService/GetUserStatus
        """
        import ssl
        import urllib.error
        import urllib.request

        if not self._connect_port or not self._csrf_token:
            return None

        url = f"https://127.0.0.1:{self._connect_port}{self.API_ENDPOINT}"

        # Request body (empty object for GetUserStatus)
        data = json.dumps({}).encode("utf-8")

        # Create SSL context that doesn't verify (localhost self-signed cert)
        ctx = ssl.create_default_context()
        ctx.check_hostname = False
        ctx.verify_mode = ssl.CERT_NONE

        # Create request with required headers
        req = urllib.request.Request(
            url,
            data=data,
            headers={
                "Content-Type": "application/json",
                "Connect-Protocol-Version": "1",
                "X-Codeium-Csrf-Token": self._csrf_token,
            },
            method="POST",
        )

        try:
            with urllib.request.urlopen(req, timeout=10, context=ctx) as response:
                body = response.read().decode("utf-8")
                return json.loads(body)
        except (urllib.error.URLError, json.JSONDecodeError) as e:
            import sys

            print(f"[QuotaEngine] API request failed: {e}", file=sys.stderr)
            return None

    def _read_local_quota_file(self) -> Optional[Dict[str, Any]]:
        """Read quota from local cache file if exists."""
        cache_file = self.cache_dir / "current_quota.json"
        if cache_file.exists():
            try:
                with open(cache_file, "r") as f:
                    return json.load(f)
            except (json.JSONDecodeError, OSError):
                pass
        return None

    def _parse_quota_data(self, data: Dict[str, Any]) -> List[QuotaModel]:
        """Parse raw quota data from Antigravity API into QuotaModel objects."""
        models = []

        # Handle Antigravity API response format
        # Structure: userStatus.cascadeModelConfigData.clientModelConfigs
        user_status = data.get("userStatus", {})
        cascade_data = user_status.get("cascadeModelConfigData", {})
        client_configs = cascade_data.get("clientModelConfigs", [])

        # Fallback to old format for compatibility
        if not client_configs:
            client_configs = data.get("models", [])

        for item in client_configs:
            reset_time = None

            # New Antigravity API format
            quota_info = item.get("quotaInfo", {})
            reset_time_str = quota_info.get("resetTime")

            if reset_time_str:
                try:
                    # Handle ISO format with Z suffix
                    if reset_time_str.endswith("Z"):
                        reset_time_str = reset_time_str[:-1] + "+00:00"
                    reset_time = datetime.fromisoformat(reset_time_str)
                except ValueError:
                    pass
            elif item.get("resetAt"):
                # Old format fallback
                reset_time = datetime.fromisoformat(item["resetAt"])

            # Calculate remaining percent
            remaining_fraction = quota_info.get("remainingFraction", 1.0)
            remaining_percent = float(remaining_fraction) * 100.0

            # Or use old format
            if "remaining" in item:
                remaining_percent = float(item.get("remaining", 0))

            # Build capabilities list from supportsX fields
            capabilities = []
            if item.get("supportsImages"):
                capabilities.append("vision")
            if item.get("supportsVideo"):
                capabilities.append("video")
            if item.get("supportsThinking"):
                capabilities.append("thinking")
            capabilities.append("text")
            capabilities.append("code")

            # Determine model ID and name
            model_id = item.get("modelOrAlias", {}).get(
                "model", item.get("id", "unknown")
            )
            model_name = item.get("label", item.get("name", "Unknown Model"))

            models.append(
                QuotaModel(
                    model_id=model_id,
                    model_name=model_name,
                    remaining_percent=remaining_percent,
                    reset_time=reset_time,
                    pool_id=item.get("poolId"),
                    capabilities=capabilities,
                    context_window=item.get("maxTokens") or item.get("contextWindow"),
                )
            )
        return models

    def _get_mock_quota(self) -> List[QuotaModel]:
        """Return full model list matching vscode-antigravity-cockpit."""
        from datetime import timezone

        now = datetime.now(timezone.utc)
        return [
            # Chat sessions
            QuotaModel(
                model_id="chat_20706",
                model_name="chat_20706",
                remaining_percent=100.0,
                reset_time=None,
                pool_id="chat-pool",
                capabilities=["text"],
            ),
            QuotaModel(
                model_id="chat_23310",
                model_name="chat_23310",
                remaining_percent=100.0,
                reset_time=None,
                pool_id="chat-pool",
                capabilities=["text"],
            ),
            # Claude Models
            QuotaModel(
                model_id="claude-opus-4.5-thinking",
                model_name="Claude Opus 4.5 (Thinking)",
                remaining_percent=80.0,
                reset_time=now + timedelta(hours=1, minutes=3),
                pool_id="claude-pool",
                capabilities=["text", "code", "vision", "thinking"],
                context_window=200000,
            ),
            QuotaModel(
                model_id="claude-sonnet-4.5",
                model_name="Claude Sonnet 4.5",
                remaining_percent=80.0,
                reset_time=now + timedelta(hours=1, minutes=3),
                pool_id="claude-pool",
                capabilities=["text", "code", "vision"],
                context_window=200000,
            ),
            QuotaModel(
                model_id="claude-sonnet-4.5-thinking",
                model_name="Claude Sonnet 4.5 (Thinking)",
                remaining_percent=80.0,
                reset_time=now + timedelta(hours=1, minutes=3),
                pool_id="claude-pool",
                capabilities=["text", "code", "vision", "thinking"],
                context_window=200000,
            ),
            # Gemini 2.5 Models
            QuotaModel(
                model_id="gemini-2.5-flash",
                model_name="Gemini 2.5 Flash",
                remaining_percent=100.0,
                reset_time=now + timedelta(hours=1, minutes=24),
                pool_id="gemini-2.5-pool",
                capabilities=["text", "code", "vision"],
                context_window=1000000,
            ),
            QuotaModel(
                model_id="gemini-2.5-flash-thinking",
                model_name="Gemini 2.5 Flash (Thinking)",
                remaining_percent=100.0,
                reset_time=now + timedelta(hours=1, minutes=24),
                pool_id="gemini-2.5-pool",
                capabilities=["text", "code", "vision", "thinking"],
                context_window=1000000,
            ),
            QuotaModel(
                model_id="gemini-2.5-flash-lite",
                model_name="Gemini 2.5 Flash Lite",
                remaining_percent=100.0,
                reset_time=now + timedelta(hours=3, minutes=16),
                pool_id="gemini-2.5-pool",
                capabilities=["text", "code"],
                context_window=128000,
            ),
            QuotaModel(
                model_id="gemini-2.5-pro",
                model_name="Gemini 2.5 Pro",
                remaining_percent=100.0,
                reset_time=now + timedelta(hours=5),
                pool_id="gemini-2.5-pool",
                capabilities=["text", "code", "vision", "video"],
                context_window=1000000,
            ),
            # Gemini 3 Models
            QuotaModel(
                model_id="gemini-3-flash",
                model_name="Gemini 3 Flash",
                remaining_percent=80.0,
                reset_time=now + timedelta(hours=1, minutes=25),
                pool_id="gemini-3-pool",
                capabilities=["text", "code", "vision"],
                context_window=1000000,
            ),
            QuotaModel(
                model_id="gemini-3-pro-high",
                model_name="Gemini 3 Pro (High)",
                remaining_percent=100.0,
                reset_time=now + timedelta(hours=2, minutes=20),
                pool_id="gemini-3-pool",
                capabilities=["text", "code", "vision", "thinking"],
                context_window=2000000,
            ),
            QuotaModel(
                model_id="gemini-3-pro-low",
                model_name="Gemini 3 Pro (Low)",
                remaining_percent=100.0,
                reset_time=now + timedelta(hours=2, minutes=20),
                pool_id="gemini-3-pool",
                capabilities=["text", "code", "vision"],
                context_window=2000000,
            ),
            QuotaModel(
                model_id="gemini-3-pro-image",
                model_name="Gemini 3 Pro Image",
                remaining_percent=100.0,
                reset_time=now + timedelta(hours=5),
                pool_id="gemini-3-pool",
                capabilities=["text", "vision", "image-gen"],
                context_window=1000000,
            ),
            # Other Models
            QuotaModel(
                model_id="gpt-oss-120b-medium",
                model_name="GPT-OSS 120B (Medium)",
                remaining_percent=80.0,
                reset_time=now + timedelta(hours=1, minutes=3),
                pool_id="gpt-pool",
                capabilities=["text", "code"],
                context_window=128000,
            ),
            QuotaModel(
                model_id="rev19-uic3-1p",
                model_name="rev19-uic3-1p",
                remaining_percent=100.0,
                reset_time=now + timedelta(hours=5),
                pool_id="experimental-pool",
                capabilities=["text"],
            ),
            QuotaModel(
                model_id="tab-flash-lite-preview",
                model_name="tab_flash_lite_preview",
                remaining_percent=80.0,
                reset_time=now + timedelta(hours=1, minutes=3),
                pool_id="experimental-pool",
                capabilities=["text", "code"],
            ),
        ]

    def get_current_status(self) -> Dict[str, Any]:
        """
        Get comprehensive quota status.

        Returns:
            Dict with models, pools, alerts, and formatted status.
        """
        if not self._models or self._is_cache_stale():
            self.get_local_quota()

        # Group models by pool
        pools: Dict[str, QuotaPool] = {}
        ungrouped: List[QuotaModel] = []

        for model in self._models:
            if model.pool_id:
                if model.pool_id not in pools:
                    pools[model.pool_id] = QuotaPool(
                        pool_id=model.pool_id,
                        pool_name=model.pool_id.replace("-", " ").title(),
                    )
                pools[model.pool_id].models.append(model)
            else:
                ungrouped.append(model)

        # Find models needing alerts
        warnings = [
            m for m in self._models if m.threshold_level == ThresholdLevel.WARNING
        ]
        criticals = [
            m for m in self._models if m.threshold_level == ThresholdLevel.CRITICAL
        ]

        # Find lowest quota model for status bar
        lowest = (
            min(self._models, key=lambda m: m.remaining_percent)
            if self._models
            else None
        )

        return {
            "models": [self._model_to_dict(m) for m in self._models],
            "pools": {k: self._pool_to_dict(v) for k, v in pools.items()},
            "ungrouped": [self._model_to_dict(m) for m in ungrouped],
            "alerts": {
                "warnings": [m.model_name for m in warnings],
                "criticals": [m.model_name for m in criticals],
            },
            "status_bar": lowest.format_status(StatusFormat.FULL)
            if lowest
            else "No data",
            "last_fetch": self._last_fetch.isoformat() if self._last_fetch else None,
        }

    def _model_to_dict(self, model: QuotaModel) -> Dict[str, Any]:
        """Convert QuotaModel to dictionary."""
        return {
            "id": model.model_id,
            "name": model.model_name,
            "remaining_percent": model.remaining_percent,
            "threshold_level": model.threshold_level.value,
            "countdown": model.countdown,
            "reset_time": model.reset_time_str,
            "status_emoji": model._get_status_emoji(),
            "status_full": model.format_status(StatusFormat.FULL),
            "pool_id": model.pool_id,
            "capabilities": model.capabilities,
            "context_window": model.context_window,
        }

    def _pool_to_dict(self, pool: QuotaPool) -> Dict[str, Any]:
        """Convert QuotaPool to dictionary."""
        return {
            "id": pool.pool_id,
            "name": pool.pool_name,
            "aggregate_remaining": pool.aggregate_remaining,
            "model_count": len(pool.models),
            "lowest_model": pool.lowest_model.model_name if pool.lowest_model else None,
        }

    def _is_cache_stale(self, max_age_seconds: int = 120) -> bool:
        """Check if cached data is stale."""
        if not self._last_fetch:
            return True
        age = (datetime.now() - self._last_fetch).total_seconds()
        return age > max_age_seconds

    def format_cli_output(self, format_type: str = "full") -> str:
        """
        Format quota status for CLI output.
        Matches vscode-antigravity-cockpit layout.

        Args:
            format_type: 'full', 'compact', 'table', or 'json'
        """
        status = self.get_current_status()

        if format_type == "json":
            return json.dumps(status, indent=2, default=str)

        lines = []
        lines.append("\n🚀 Antigravity Quota Monitor")
        lines.append("=" * 60)

        for model in status["models"]:
            emoji = model["status_emoji"]
            name = model["name"]
            percent = model["remaining_percent"]
            countdown = model["countdown"]
            reset_time = model["reset_time"]

            # Create progress bar (20 chars width)
            bar_width = 20
            filled = int((percent / 100) * bar_width)
            bar = "█" * filled + "░" * (bar_width - filled)

            if format_type == "compact":
                # Compact: emoji + name + percent only
                lines.append(f"{emoji} {name:<35} {percent:>6.2f}%")
            elif format_type == "table":
                # Table format matching original extension exactly
                reset_str = (
                    f"→ {countdown} ({reset_time})"
                    if countdown != "--"
                    else "→ Unknown"
                )
                lines.append(f"{emoji} {name:<35} {bar} {percent:>6.2f}% {reset_str}")
            else:
                # Full format with all details
                reset_str = (
                    f"→ {countdown} ({reset_time})"
                    if countdown != "--"
                    else "→ Unknown"
                )
                lines.append(f"{emoji} {name:<35} {bar} {percent:>6.2f}% {reset_str}")

        lines.append("=" * 60)

        # Status bar summary (bottom bar like original)
        status_models = []
        for model in status["models"][:3]:  # Top 3 for status bar
            emoji = model["status_emoji"]
            name_short = (
                model["name"].split()[0] if " " in model["name"] else model["name"][:10]
            )
            percent = int(model["remaining_percent"])
            status_models.append(f"{emoji} {name_short}: {percent}%")

        lines.append(" | ".join(status_models))

        # Alerts
        if status["alerts"]["criticals"]:
            lines.append("\n🔴 CRITICAL: " + ", ".join(status["alerts"]["criticals"]))
        if status["alerts"]["warnings"]:
            lines.append("🟡 WARNING: " + ", ".join(status["alerts"]["warnings"]))

        return "\n".join(lines)


# CLI entry point
if __name__ == "__main__":
    engine = QuotaEngine()
    print(engine.format_cli_output())
