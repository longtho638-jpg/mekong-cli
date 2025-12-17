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

from typing import Dict, List, Any, Optional
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from enum import Enum
import uuid


class DisplayType(Enum):
    """Display types."""
    HOMEPAGE_HERO = "homepage_hero"
    COLLECTION_BANNER = "collection_banner"
    PRODUCT_FEATURE = "product_feature"
    PROMO_POPUP = "promo_popup"
    CATEGORY_BANNER = "category_banner"


class DisplayStatus(Enum):
    """Display status."""
    DRAFT = "draft"
    SCHEDULED = "scheduled"
    LIVE = "live"
    EXPIRED = "expired"


@dataclass
class ProductDisplay:
    """A product display/banner."""
    id: str
    store_id: str
    name: str
    display_type: DisplayType
    status: DisplayStatus = DisplayStatus.DRAFT
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    clicks: int = 0
    conversions: int = 0


@dataclass
class StoreTheme:
    """Store theme configuration."""
    id: str
    store_id: str
    name: str
    primary_color: str
    font_family: str
    layout: str = "standard"  # standard, minimal, bold


class DigitalMerchandiser:
    """
    Digital Merchandiser.
    
    Create compelling displays.
    """
    
    def __init__(self, agency_name: str):
        self.agency_name = agency_name
        self.displays: Dict[str, ProductDisplay] = {}
        self.themes: Dict[str, StoreTheme] = {}
    
    def create_display(
        self,
        store_id: str,
        name: str,
        display_type: DisplayType,
        days_active: int = 7
    ) -> ProductDisplay:
        """Create a product display."""
        display = ProductDisplay(
            id=f"DSP-{uuid.uuid4().hex[:6].upper()}",
            store_id=store_id,
            name=name,
            display_type=display_type,
            start_date=datetime.now(),
            end_date=datetime.now() + timedelta(days=days_active)
        )
        self.displays[display.id] = display
        return display
    
    def launch_display(self, display: ProductDisplay):
        """Launch a display."""
        display.status = DisplayStatus.LIVE
        display.start_date = datetime.now()
    
    def record_engagement(self, display: ProductDisplay, clicks: int, conversions: int):
        """Record display engagement."""
        display.clicks += clicks
        display.conversions += conversions
    
    def create_theme(
        self,
        store_id: str,
        name: str,
        primary_color: str,
        font_family: str,
        layout: str = "standard"
    ) -> StoreTheme:
        """Create store theme."""
        theme = StoreTheme(
            id=f"THM-{uuid.uuid4().hex[:6].upper()}",
            store_id=store_id,
            name=name,
            primary_color=primary_color,
            font_family=font_family,
            layout=layout
        )
        self.themes[theme.id] = theme
        return theme
    
    def get_stats(self) -> Dict[str, Any]:
        """Get merchandising stats."""
        live = sum(1 for d in self.displays.values() if d.status == DisplayStatus.LIVE)
        total_clicks = sum(d.clicks for d in self.displays.values())
        total_conversions = sum(d.conversions for d in self.displays.values())
        ctr = (total_conversions / total_clicks * 100) if total_clicks else 0
        
        return {
            "total_displays": len(self.displays),
            "live": live,
            "total_clicks": total_clicks,
            "total_conversions": total_conversions,
            "conversion_rate": ctr
        }
    
    def format_dashboard(self) -> str:
        """Format merchandiser dashboard."""
        stats = self.get_stats()
        
        lines = [
            "╔═══════════════════════════════════════════════════════════╗",
            f"║  🎨 DIGITAL MERCHANDISER                                  ║",
            f"║  {stats['total_displays']} displays │ {stats['live']} live │ {stats['conversion_rate']:.1f}% CVR     ║",
            "╠═══════════════════════════════════════════════════════════╣",
            "║  🖼️ ACTIVE DISPLAYS                                       ║",
            "║  ─────────────────────────────────────────────────────── ║",
        ]
        
        type_icons = {"homepage_hero": "🏠", "collection_banner": "📦", "product_feature": "⭐",
                     "promo_popup": "🎉", "category_banner": "📂"}
        status_icons = {"draft": "📝", "scheduled": "⏰", "live": "🟢", "expired": "⏸️"}
        
        for display in list(self.displays.values())[:5]:
            t_icon = type_icons.get(display.display_type.value, "🖼️")
            s_icon = status_icons.get(display.status.value, "⚪")
            ctr = (display.conversions / display.clicks * 100) if display.clicks else 0
            
            lines.append(f"║  {s_icon} {t_icon} {display.name[:18]:<18} │ {display.clicks:>5} clicks │ {ctr:>4.1f}%  ║")
        
        lines.extend([
            "║                                                           ║",
            "║  📊 BY TYPE                                               ║",
            "║  ─────────────────────────────────────────────────────── ║",
        ])
        
        for dtype in list(DisplayType)[:4]:
            count = sum(1 for d in self.displays.values() if d.display_type == dtype)
            clicks = sum(d.clicks for d in self.displays.values() if d.display_type == dtype)
            icon = type_icons.get(dtype.value, "🖼️")
            lines.append(f"║    {icon} {dtype.value.replace('_', ' ').title():<18} │ {count:>2} │ {clicks:>6} clicks  ║")
        
        lines.extend([
            "║                                                           ║",
            "║  🎨 STORE THEMES                                          ║",
            "║  ─────────────────────────────────────────────────────── ║",
        ])
        
        for theme in list(self.themes.values())[:3]:
            lines.append(f"║    🎨 {theme.name[:15]:<15} │ {theme.primary_color:<8} │ {theme.layout:<10}  ║")
        
        lines.extend([
            "║                                                           ║",
            "║  [🖼️ New Display]  [🎨 Themes]  [📊 Analytics]            ║",
            "╠═══════════════════════════════════════════════════════════╣",
            f"║  🏯 {self.agency_name} - Visuals that convert!            ║",
            "╚═══════════════════════════════════════════════════════════╝",
        ])
        
        return "\n".join(lines)


# Example usage
if __name__ == "__main__":
    merch = DigitalMerchandiser("Saigon Digital Hub")
    
    print("🎨 Digital Merchandiser")
    print("=" * 60)
    print()
    
    d1 = merch.create_display("STR-001", "Summer Sale Hero", DisplayType.HOMEPAGE_HERO, 14)
    d2 = merch.create_display("STR-001", "New Arrivals", DisplayType.COLLECTION_BANNER, 30)
    d3 = merch.create_display("STR-002", "Flash Sale Popup", DisplayType.PROMO_POPUP, 3)
    
    merch.launch_display(d1)
    merch.launch_display(d2)
    
    merch.record_engagement(d1, 5000, 150)
    merch.record_engagement(d2, 3000, 90)
    
    merch.create_theme("STR-001", "Modern Dark", "#1a1a2e", "Inter", "minimal")
    merch.create_theme("STR-002", "Fresh Light", "#f5f5f5", "Poppins", "bold")
    
    print(merch.format_dashboard())
