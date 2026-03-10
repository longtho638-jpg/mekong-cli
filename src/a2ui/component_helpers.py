"""A2UI Component Helpers — Shared utilities for component factories.

Contains data-binding resolution, layout helpers, and the icon map.
These are internal utilities; consumers should import from components.py.
"""

from typing import Any

from rich.console import RenderableType


# ---------------------------------------------------------------------------
# Icon / emoji mapping
# ---------------------------------------------------------------------------

ICON_MAP: dict[str, str] = {
    "home": "🏠", "search": "🔍", "settings": "⚙️", "user": "👤",
    "check": "✅", "error": "❌", "warning": "⚠️", "info": "i",
    "star": "⭐", "heart": "❤️", "arrow_right": "→", "arrow_left": "←",
    "plus": "+", "minus": "-", "edit": "✏️", "delete": "🗑️",
    "download": "⬇️", "upload": "⬆️", "refresh": "🔄", "link": "🔗",
    "lock": "🔒", "unlock": "🔓", "mail": "📧", "phone": "📞",
    "calendar": "📅", "clock": "🕐", "folder": "📁", "file": "📄",
    "chart": "📊", "money": "💰", "cart": "🛒", "bell": "🔔",
}


# ---------------------------------------------------------------------------
# Data binding resolver
# ---------------------------------------------------------------------------

def _resolve_binding(value: Any, data_context: dict[str, Any]) -> Any:
    """Resolve data bindings of the form '$data.key.subkey' from context.

    Args:
        value: Raw value from the A2UI component dict.
        data_context: Shared renderer data dict.

    Returns:
        Resolved value if binding matched; original value otherwise.
    """
    if not isinstance(value, str) or not value.startswith("$data."):
        return value
    path = value[len("$data."):]
    node: Any = data_context
    for part in path.split("."):
        if not isinstance(node, dict):
            return value
        node = node.get(part, value)
    return node


# ---------------------------------------------------------------------------
# Layout group helper
# ---------------------------------------------------------------------------

class _Group:
    """Minimal Rich renderable that stacks items vertically.

    Rich's built-in Group (rich.console.Group) requires the items to be
    passed as positional args; this class accepts a list for convenience.
    """

    def __init__(self, renderables: list[RenderableType]) -> None:
        self._items = renderables

    def __rich_console__(self, console: Any, options: Any):  # type: ignore[override]
        for item in self._items:
            yield item


def _render_group(parts: list[RenderableType]) -> RenderableType:
    """Wrap a list of renderables into a vertically stacked group.

    Args:
        parts: List of Rich renderables.

    Returns:
        A single renderable that prints each item on its own line.
    """
    return _Group(parts)  # type: ignore[return-value]


__all__ = ["ICON_MAP", "_resolve_binding", "_Group", "_render_group"]
