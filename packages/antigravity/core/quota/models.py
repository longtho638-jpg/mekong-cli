from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import List, Optional, Dict

from .enums import StatusFormat, ThresholdLevel

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
