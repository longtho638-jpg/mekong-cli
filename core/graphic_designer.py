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

import uuid
import logging
from typing import Dict, List, Any, Optional, Union
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from enum import Enum

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class AssetCategory(Enum):
    """Types of graphic design deliverables."""
    SOCIAL = "social"
    PRINT = "print"
    DIGITAL_AD = "digital_ad"
    BRANDING = "branding"
    PRESENTATION = "presentation"
    PACKAGING = "packaging"


class AssetStatus(Enum):
    """Current state of a graphic asset project."""
    QUEUED = "queued"
    DESIGNING = "designing"
    REVIEW = "review"
    APPROVED = "approved"
    DELIVERED = "delivered"


@dataclass
class GraphicAsset:
    """A graphic design asset record entity."""
    id: str
    name: str
    client: str
    category: AssetCategory
    dimensions: str
    status: AssetStatus = AssetStatus.QUEUED
    designer: str = ""
    due_date: datetime = field(default_factory=lambda: datetime.now() + timedelta(days=3))

    def __post_init__(self):
        if not self.name or not self.client:
            raise ValueError("Name and client are required")


class GraphicDesigner:
    """
    Graphic Designer System.
    
    Orchestrates the visual design workflow, from queuing requests to final delivery.
    """
    
    def __init__(self, agency_name: str):
        self.agency_name = agency_name
        self.assets: Dict[str, GraphicAsset] = {}
        logger.info(f"Graphic Designer system initialized for {agency_name}")
    
    def create_asset(
        self,
        name: str,
        client: str,
        category: AssetCategory,
        dimensions: str,
        designer: str = "Designer AI",
        due_days: int = 3
    ) -> GraphicAsset:
        """Register a new design asset request."""
        asset = GraphicAsset(
            id=f"GFX-{uuid.uuid4().hex[:6].upper()}",
            name=name, client=client, category=category,
            dimensions=dimensions, designer=designer,
            due_date=datetime.now() + timedelta(days=due_days)
        )
        self.assets[asset.id] = asset
        logger.info(f"Design asset created: {name} for {client}")
        return asset
    
    def update_status(self, asset_id: str, status: AssetStatus) -> bool:
        """Advance the production status of an asset."""
        if asset_id not in self.assets:
            logger.error(f"Asset ID {asset_id} not found")
            return False
            
        a = self.assets[asset_id]
        old = a.status
        a.status = status
        logger.info(f"Asset {asset_id} status updated: {old.value} -> {status.value}")
        return True
    
    def get_active_queue(self) -> List[GraphicAsset]:
        """Filter list of assets currently in production."""
        return [a for a in self.assets.values() if a.status in [AssetStatus.QUEUED, AssetStatus.DESIGNING]]
    
    def format_dashboard(self) -> str:
        """Render the Graphic Designer Dashboard."""
        active = self.get_active_queue()
        review = sum(1 for a in self.assets.values() if a.status == AssetStatus.REVIEW)
        
        lines = [
            "╔═══════════════════════════════════════════════════════════╗",
            f"║  🖼️ GRAPHIC DESIGNER DASHBOARD{' ' * 32}║",
            f"║  {len(self.assets)} total assets │ {len(active)} in queue │ {review} pending review{' ' * 10}║",
            "╠═══════════════════════════════════════════════════════════╣",
            "║  🎨 PRODUCTION QUEUE                                      ║",
            "║  ───────────────────────────────────────────────────────  ║",
        ]
        
        cat_icons = {
            AssetCategory.SOCIAL: "📱", AssetCategory.PRINT: "🖨️", 
            AssetCategory.DIGITAL_AD: "📺", AssetCategory.BRANDING: "🏷️"
        }
        
        # Display latest 5 active assets
        for a in sorted(active, key=lambda x: x.due_date)[:5]:
            icon = cat_icons.get(a.category, "🖼️")
            s_icon = "🎨" if a.status == AssetStatus.DESIGNING else "⏳"
            name_disp = (a.name[:18] + '..') if len(a.name) > 20 else a.name
            lines.append(f"║  {s_icon} {icon} {name_disp:<20} │ {a.dimensions:<10} │ {a.client[:8]:<8}  ║")
        
        lines.extend([
            "║                                                           ║",
            "║  [➕ New Request]  [🎨 Design]  [📤 Export]  [⚙️ Settings] ║",
            "╠═══════════════════════════════════════════════════════════╣",
            f"║  🏯 {self.agency_name[:40]:<40} - Visual Excellence! ║",
            "╚═══════════════════════════════════════════════════════════╝",
        ])
        
        return "\n".join(lines)


# Example usage
if __name__ == "__main__":
    print("🖼️ Initializing Graphic Designer...")
    print("=" * 60)
    
    try:
        designer_system = GraphicDesigner("Saigon Digital Hub")
        
        # Seed
        a1 = designer_system.create_asset("Logo v1", "Sunrise", AssetCategory.BRANDING, "Vector")
        designer_system.update_status(a1.id, AssetStatus.DESIGNING)
        
        print("\n" + designer_system.format_dashboard())
        
    except Exception as e:
        logger.error(f"Designer Error: {e}")
