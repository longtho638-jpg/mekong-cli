from enum import Enum

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
