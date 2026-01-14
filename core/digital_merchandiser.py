"""
🎨 Digital Merchandiser - Visual & UX
=======================================

Design compelling product displays.
Visuals that convert!

Roles:
- Product photography
- Store layout
- Banner design
- Promotion displays
"""

import uuid
import logging
from typing import Dict, List, Any, Optional, Union
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from enum import Enum

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class DisplayType(Enum):
    """Types of visual display components."""
    HOMEPAGE_HERO = "homepage_hero"
    COLLECTION_BANNER = "collection_banner"
    PRODUCT_FEATURE = "product_feature"
    PROMO_POPUP = "promo_popup"
    CATEGORY_BANNER = "category_banner"


class DisplayStatus(Enum):
    """Current state of a display item."""
    DRAFT = "draft"
    SCHEDULED = "scheduled"
    LIVE = "live"
    EXPIRED = "expired"


@dataclass
class ProductDisplay:
    """A visual product display entity."""
    id: str
    store_id: str
    name: str
    display_type: DisplayType
    status: DisplayStatus = DisplayStatus.DRAFT
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    clicks: int = 0
    conversions: int = 0

    def __post_init__(self):
        if self.clicks < 0 or self.conversions < 0:
            raise ValueError("Engagement metrics cannot be negative")

    @property
    def conversion_rate(self) -> float:
        """Calculate CVR based on recorded engagement."""
        if self.clicks <= 0: return 0.0
        return (self.conversions / self.clicks) * 100.0


@dataclass
class StoreTheme:
    """Store theme configuration record."""
    id: str
    store_id: str
    name: str
    primary_color: str
    font_family: str
    layout: str = "standard"  # standard, minimal, bold


class DigitalMerchandiser:
    """
    Digital Merchandiser System.
    
    Manages the visual presentation, themes, and conversion performance of digital storefronts.
    """
    
    def __init__(self, agency_name: str):
        self.agency_name = agency_name
        self.displays: Dict[str, ProductDisplay] = {}
        self.themes: Dict[str, StoreTheme] = {}
        logger.info(f"Digital Merchandiser system initialized for {agency_name}")
    
    def create_display(
        self,
        store_id: str,
        name: str,
        display_type: DisplayType,
        days_active: int = 7
    ) -> ProductDisplay:
        """Create a new visual display record."""
        if not store_id or not name:
            raise ValueError("Store ID and Name are required")

        display = ProductDisplay(
            id=f"DSP-{uuid.uuid4().hex[:6].upper()}",
            store_id=store_id,
            name=name,
            display_type=display_type,
            start_date=datetime.now(),
            end_date=datetime.now() + timedelta(days=days_active)
        )
        self.displays[display.id] = display
        logger.info(f"Created display: {name} for store {store_id}")
        return display
    
    def launch_display(self, display_id: str) -> bool:
        """Mark a display as live."""
        if display_id not in self.displays:
            return False
        
        d = self.displays[display_id]
        d.status = DisplayStatus.LIVE
        d.start_date = datetime.now()
        logger.info(f"Display {display_id} is now LIVE")
        return True
    
    def register_theme(
        self,
        store_id: str,
        name: str,
        color: str,
        font: str,
        layout: str = "standard"
    ) -> StoreTheme:
        """Define a new visual theme for a storefront."""
        theme = StoreTheme(
            id=f"THM-{uuid.uuid4().hex[:6].upper()}",
            store_id=store_id, name=name,
            primary_color=color, font_family=font, layout=layout
        )
        self.themes[theme.id] = theme
        logger.info(f"Theme registered: {name} ({color})")
        return theme
    
    def get_stats(self) -> Dict[str, Any]:
        """Aggregate visual merchandising performance metrics."""
        live = [d for d in self.displays.values() if d.status == DisplayStatus.LIVE]
        return {
            "total_displays": len(self.displays),
            "live": len(live),
            "total_themes": len(self.themes)
        }
    
    def format_dashboard(self) -> str:
        """Render the Digital Merchandiser Dashboard."""
        live_count = sum(1 for d in self.displays.values() if d.status == DisplayStatus.LIVE)
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
            DisplayType.HOMEPAGE_HERO: "🏠", DisplayType.COLLECTION_BANNER: "📦", 
            DisplayType.PRODUCT_FEATURE: "⭐", DisplayType.PROMO_POPUP: "🎉"
        }
        
        for d in list(self.displays.values())[:5]:
            icon = type_icons.get(d.display_type, "🖼️")
            s_icon = "🟢" if d.status == DisplayStatus.LIVE else "⚪"
            name_disp = (d.name[:18] + '..') if len(d.name) > 20 else d.name
            lines.append(f"║  {s_icon} {icon} {name_disp:<20} │ {d.clicks:>5} clicks │ {d.conversion_rate:>4.1f}%  ║")
        
        lines.extend([
            "║                                                           ║",
            "║  🎨 REGISTERED THEMES                                     ║",
            "║  ───────────────────────────────────────────────────────  ║",
        ])
        
        for t in list(self.themes.values())[:3]:
            name_disp = (t.name[:15] + '..') if len(t.name) > 17 else t.name
            lines.append(f"║    🎨 {name_disp:<17} │ {t.primary_color:<8} │ {t.layout:<10}  ║")
        
        lines.extend([
            "║                                                           ║",
            "║  [🖼️ Create]  [🎨 Themes]  [📊 Analytics]  [⚙️ Settings]  ║",
            "╠═══════════════════════════════════════════════════════════╣",
            f"║  🏯 {self.agency_name[:40]:<40} - Visual Win!        ║",
            "╚═══════════════════════════════════════════════════════════╝",
        ])
        
        return "\n".join(lines)


# Example usage
if __name__ == "__main__":
    print("🎨 Initializing Merchandiser...")
    print("=" * 60)
    
    try:
        merch = DigitalMerchandiser("Saigon Digital Hub")
        
        # Seed
        d1 = merch.create_display("STORE-1", "Spring Hero", DisplayType.HOMEPAGE_HERO)
        merch.launch_display(d1.id)
        d1.clicks = 1000
        d1.conversions = 50
        
        merch.register_theme("STORE-1", "Minimal Dark", "#000", "Inter")
        
        print("\n" + merch.format_dashboard())
        
    except Exception as e:
        logger.error(f"Merch Error: {e}")
