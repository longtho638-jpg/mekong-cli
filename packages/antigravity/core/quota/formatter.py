import json
from typing import Any, Dict, List

class QuotaFormatter:
    """Handles formatting of quota status for CLI output."""

    @staticmethod
    def format_cli_output(status: Dict[str, Any], format_type: str = "full") -> str:
        """
        Format quota status for CLI output.
        Matches vscode-antigravity-cockpit layout.

        Args:
            status: The status dictionary returned by QuotaEngine.get_current_status()
            format_type: 'full', 'compact', 'table', or 'json'
        """
        if format_type == "json":
            return json.dumps(status, indent=2, default=str)

        lines = []
        lines.append("\n🚀 Antigravity Quota Monitor")
        lines.append("=" * 60)

        # Handle case where models might be empty
        models = status.get("models", [])

        for model in models:
            emoji = model.get("status_emoji", "❓")
            name = model.get("name", "Unknown")
            percent = model.get("remaining_percent", 0.0)
            countdown = model.get("countdown", "--")
            reset_time = model.get("reset_time", "--:--")

            # Create progress bar (20 chars width)
            bar_width = 20
            filled = int((percent / 100) * bar_width)
            bar = "█" * filled + "░" * (bar_width - filled)

            if format_type == "compact":
                # Compact: emoji + name + percent only
                lines.append(f"{emoji} {name:<35} {percent:>6.2f}%")
            elif format_type == "table":
                # Table format matching original extension exactly
                reset_str = f"→ {countdown} ({reset_time})" if countdown != "--" else "→ Unknown"
                lines.append(f"{emoji} {name:<35} {bar} {percent:>6.2f}% {reset_str}")
            else:
                # Full format with all details
                reset_str = f"→ {countdown} ({reset_time})" if countdown != "--" else "→ Unknown"
                lines.append(f"{emoji} {name:<35} {bar} {percent:>6.2f}% {reset_str}")

        lines.append("=" * 60)

        # Status bar summary (bottom bar like original)
        status_models = []
        # Top 3 for status bar
        for model in models[:3]:
            emoji = model.get("status_emoji", "❓")
            name = model.get("name", "Unknown")
            name_short = name.split()[0] if " " in name else name[:10]
            percent = int(model.get("remaining_percent", 0))
            status_models.append(f"{emoji} {name_short}: {percent}%")

        if status_models:
            lines.append(" | ".join(status_models))

        # Alerts
        alerts = status.get("alerts", {})
        criticals = alerts.get("criticals", [])
        warnings = alerts.get("warnings", [])

        if criticals:
            lines.append("\n🔴 CRITICAL: " + ", ".join(criticals))
        if warnings:
            lines.append("🟡 WARNING: " + ", ".join(warnings))

        return "\n".join(lines)
