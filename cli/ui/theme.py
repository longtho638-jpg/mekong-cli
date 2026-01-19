"""
Theme management for CLI.
Provides consistent styling and colors.
"""

from rich.theme import Theme


def get_theme() -> Theme:
    """Get the AgencyOS theme."""
    return Theme(
        {
            "primary": "#00D9FF",
            "secondary": "#FF6B35",
            "success": "#00FF88",
            "warning": "#FFB800",
            "error": "#FF3366",
            "info": "#8B5CF6",
            "white": "#FFFFFF",
            "dim": "#6B7280",
            "command": "#00D9FF bold",
            "panel.border": "#374151",
        }
    )
