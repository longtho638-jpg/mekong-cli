"""
🖼️ Graphic Designer - Visual Design
======================================

Create stunning visual assets.
Design that communicates!

Roles:
- Print design
- Social graphics
- Marketing materials
- Brand collateral
"""

from typing import Dict, List, Any, Optional
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from enum import Enum
import uuid


class AssetCategory(Enum):
    """Graphic asset categories."""
    SOCIAL = "social"
    PRINT = "print"
    DIGITAL_AD = "digital_ad"
    BRANDING = "branding"
    PRESENTATION = "presentation"
    PACKAGING = "packaging"


class AssetStatus(Enum):
    """Asset status."""
    QUEUED = "queued"
    DESIGNING = "designing"
    REVIEW = "review"
    APPROVED = "approved"
    DELIVERED = "delivered"


@dataclass
class GraphicAsset:
    """A graphic design asset."""
    id: str
    name: str
    client: str
    category: AssetCategory
    dimensions: str
    status: AssetStatus = AssetStatus.QUEUED
    designer: str = ""
    due_date: datetime = field(default_factory=lambda: datetime.now() + timedelta(days=3))


class GraphicDesigner:
    """
    Graphic Designer System.
    
    Visual asset creation.
    """
    
    def __init__(self, agency_name: str):
        self.agency_name = agency_name
        self.assets: Dict[str, GraphicAsset] = {}
    
    def create_asset(
        self,
        name: str,
        client: str,
        category: AssetCategory,
        dimensions: str,
        designer: str = "",
        due_days: int = 3
    ) -> GraphicAsset:
        """Create a graphic asset."""
        asset = GraphicAsset(
            id=f"GFX-{uuid.uuid4().hex[:6].upper()}",
            name=name,
            client=client,
            category=category,
            dimensions=dimensions,
            designer=designer,
            due_date=datetime.now() + timedelta(days=due_days)
        )
        self.assets[asset.id] = asset
        return asset
    
    def update_status(self, asset: GraphicAsset, status: AssetStatus):
        """Update asset status."""
        asset.status = status
    
    def get_queue(self) -> List[GraphicAsset]:
        """Get design queue."""
        return [a for a in self.assets.values() if a.status in [AssetStatus.QUEUED, AssetStatus.DESIGNING]]
    
    def format_dashboard(self) -> str:
        """Format graphic designer dashboard."""
        queue = len(self.get_queue())
        review = sum(1 for a in self.assets.values() if a.status == AssetStatus.REVIEW)
        
        lines = [
            "╔═══════════════════════════════════════════════════════════╗",
            f"║  🖼️ GRAPHIC DESIGNER                                      ║",
            f"║  {len(self.assets)} assets │ {queue} in queue │ {review} in review       ║",
            "╠═══════════════════════════════════════════════════════════╣",
            "║  📋 DESIGN QUEUE                                          ║",
            "║  ─────────────────────────────────────────────────────── ║",
        ]
        
        cat_icons = {"social": "📱", "print": "🖨️", "digital_ad": "📺", "branding": "🏷️", "presentation": "📊", "packaging": "📦"}
        status_icons = {"queued": "⏳", "designing": "🎨", "review": "👁️", "approved": "✅", "delivered": "📤"}
        
        for asset in list(self.assets.values())[:5]:
            c_icon = cat_icons.get(asset.category.value, "🖼️")
            s_icon = status_icons.get(asset.status.value, "⚪")
            
            lines.append(f"║  {s_icon} {c_icon} {asset.name[:18]:<18} │ {asset.dimensions:<10} │ {asset.client[:8]:<8}  ║")
        
        lines.extend([
            "║                                                           ║",
            "║  📊 BY CATEGORY                                           ║",
            "║  ─────────────────────────────────────────────────────── ║",
        ])
        
        for cat in list(AssetCategory)[:4]:
            count = sum(1 for a in self.assets.values() if a.category == cat)
            icon = cat_icons.get(cat.value, "🖼️")
            lines.append(f"║    {icon} {cat.value.replace('_', ' ').capitalize():<15} │ {count:>2} assets              ║")
        
        lines.extend([
            "║                                                           ║",
            "║  [➕ New Asset]  [🎨 Design]  [📤 Export]                 ║",
            "╠═══════════════════════════════════════════════════════════╣",
            f"║  🏯 {self.agency_name} - Design that communicates!        ║",
            "╚═══════════════════════════════════════════════════════════╝",
        ])
        
        return "\n".join(lines)


# Example usage
if __name__ == "__main__":
    gd = GraphicDesigner("Saigon Digital Hub")
    
    print("🖼️ Graphic Designer")
    print("=" * 60)
    print()
    
    gd.create_asset("FB Cover", "Sunrise Realty", AssetCategory.SOCIAL, "1200x630", "Anna")
    gd.create_asset("IG Post Set", "Coffee Lab", AssetCategory.SOCIAL, "1080x1080", "Tom")
    gd.create_asset("Brochure", "Fashion Brand", AssetCategory.PRINT, "A4", "Anna")
    gd.create_asset("Banner Ads", "Tech Startup", AssetCategory.DIGITAL_AD, "Various", "Tom")
    
    # Update statuses
    gd.update_status(list(gd.assets.values())[0], AssetStatus.DESIGNING)
    gd.update_status(list(gd.assets.values())[1], AssetStatus.REVIEW)
    
    print(gd.format_dashboard())
