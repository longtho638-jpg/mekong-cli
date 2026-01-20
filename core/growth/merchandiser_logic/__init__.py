"""
Digital Merchandiser Facade and Dashboard.
"""
import logging
from typing import Any, Dict

from .engine import MerchandiserEngine
from .models import DisplayStatus, DisplayType, ProductDisplay, StoreTheme

logger = logging.getLogger(__name__)

class DigitalMerchandiser(MerchandiserEngine):
    """
    Digital Merchandiser System.
    Manages the visual presentation, themes, and conversion performance of digital storefronts.
    """

    def __init__(self, agency_name: str):
        super().__init__(agency_name)
        logger.info(f"Digital Merchandiser system initialized for {agency_name}")

    def get_stats(self) -> Dict[str, Any]:
        """Aggregate visual merchandising performance metrics."""
        live = [d for d in self.displays.values() if d.status == DisplayStatus.LIVE]
        return {
            "total_displays": len(self.displays),
            "live": len(live),
            "total_themes": len(self.themes),
        }

    def format_dashboard(self) -> str:
        """Render the Digital Merchandiser Dashboard."""
        stats = self.get_stats()
        live_count = stats["live"]
        total_clicks = sum(d.clicks for d in self.displays.values())
        total_conv = sum(d.conversions for d in self.displays.values())
        avg_cvr = (total_conv / total_clicks * 100) if total_clicks else 0.0

        lines = [
            "╔═══════════════════════════════════════════════════════════╗",
            f"║  🎨 DIGITAL MERCHANDISER DASHBOARD{' ' * 28}║",
            f"║  {len(self.displays)} total displays │ {live_count} live │ {avg_cvr:.1f}% avg conversion{' ' * 10}║",
            "╠═══════════════════════════════════════════════════════════╣",
            "║  🖼️ ACTIVE VISUAL DISPLAYS                                ║",
            "║  ───────────────────────────────────────────────────────  ║",
        ]

        type_icons = {
            DisplayType.HOMEPAGE_HERO: "🏠",
            DisplayType.COLLECTION_BANNER: "📦",
            DisplayType.PRODUCT_FEATURE: "⭐",
            DisplayType.PROMO_POPUP: "🎉",
        }

        for d in list(self.displays.values())[:5]:
            icon = type_icons.get(d.display_type, "🖼️")
            s_icon = "🟢" if d.status == DisplayStatus.LIVE else "⚪"
            name_disp = (d.name[:18] + "..") if len(d.name) > 20 else d.name
            lines.append(
                f"║  {s_icon} {icon} {name_disp:<20} │ {d.clicks:>5} clicks │ {d.conversion_rate:>4.1f}%  ║"
            )

        lines.extend([
            "║                                                           ║",
            "║  [🖼️ Create]  [🎨 Themes]  [📊 Analytics]  [⚙️ Settings]  ║",
            "╠═══════════════════════════════════════════════════════════╣",
            f"║  🏯 {self.agency_name[:40]:<40} - Visual Win!        ║",
            "╚═══════════════════════════════════════════════════════════╝",
        ])
        return "\n".join(lines)
