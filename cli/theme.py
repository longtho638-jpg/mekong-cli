"""
🎨 AgencyOS CLI Theme (Material Design 3)
=========================================

Maps the CSS Design Tokens to Rich Terminal Styles.
Ensures the CLI feels like the Web Dashboard.
"""

from rich.theme import Theme
from rich.style import Style

# M3 Color Mapping (Approximation for Terminal)
# Primary: Emerald 500 (#10b981)
# Secondary: Teal 500 (#14b8a6)
# Surface: Neutral 900 (#171717)
# Error: Red 400 (#f87171)

AGENCY_THEME = Theme({
    "primary": Style(color="#10b981", bold=True),       # Emerald
    "secondary": Style(color="#14b8a6"),                # Teal
    "surface": Style(color="#ffffff", bgcolor="#171717"),
    "panel.border": Style(color="#34d399"),             # Emerald 400
    "panel.title": Style(color="#ffffff", bold=True),
    "success": Style(color="#34d399"),
    "warning": Style(color="#fbbf24"),
    "error": Style(color="#f87171"),
    "info": Style(color="#60a5fa"),
    "dim": Style(color="#737373"),                      # Neutral 500
    "highlight": Style(color="#facc15", bold=True),     # Yellow/Gold
    "command": Style(color="#a78bfa", italic=True),     # Purple
})

def get_theme():
    return AGENCY_THEME
