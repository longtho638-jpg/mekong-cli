"""
Asset Agent - Digital Asset Management
Manages brand assets, versioning, and usage tracking.
"""

from dataclasses import dataclass, field
from typing import List, Dict
from datetime import datetime
from enum import Enum
import random


class AssetType(Enum):
    LOGO = "logo"
    ICON = "icon"
    IMAGE = "image"
    DOCUMENT = "document"
    TEMPLATE = "template"
    VIDEO = "video"


class AssetStatus(Enum):
    DRAFT = "draft"
    APPROVED = "approved"
    ARCHIVED = "archived"


@dataclass
class Asset:
    """Brand asset"""
    id: str
    name: str
    asset_type: AssetType
    file_path: str
    version: str = "1.0"
    status: AssetStatus = AssetStatus.DRAFT
    usage_count: int = 0
    created_at: datetime = None
    updated_at: datetime = None
    tags: List[str] = field(default_factory=list)
    
    def __post_init__(self):
        if self.created_at is None:
            self.created_at = datetime.now()
        if self.updated_at is None:
            self.updated_at = datetime.now()


class AssetAgent:
    """
    Asset Agent - Quản lý Tài sản Thương hiệu
    
    Responsibilities:
    - Asset library
    - Version control
    - Usage tracking
    - Brand compliance
    """
    
    def __init__(self):
        self.name = "Asset"
        self.status = "ready"
        self.assets: Dict[str, Asset] = {}
        
    def add_asset(
        self,
        name: str,
        asset_type: AssetType,
        file_path: str,
        tags: List[str] = None
    ) -> Asset:
        """Add asset to library"""
        asset_id = f"asset_{int(datetime.now().timestamp())}_{random.randint(100,999)}"
        
        asset = Asset(
            id=asset_id,
            name=name,
            asset_type=asset_type,
            file_path=file_path,
            tags=tags or []
        )
        
        self.assets[asset_id] = asset
        return asset
    
    def approve(self, asset_id: str) -> Asset:
        """Approve asset"""
        if asset_id not in self.assets:
            raise ValueError(f"Asset not found: {asset_id}")
            
        self.assets[asset_id].status = AssetStatus.APPROVED
        return self.assets[asset_id]
    
    def update_version(self, asset_id: str, new_version: str) -> Asset:
        """Update asset version"""
        if asset_id not in self.assets:
            raise ValueError(f"Asset not found: {asset_id}")
            
        asset = self.assets[asset_id]
        asset.version = new_version
        asset.updated_at = datetime.now()
        
        return asset
    
    def record_usage(self, asset_id: str, count: int = 1) -> Asset:
        """Record asset usage"""
        if asset_id not in self.assets:
            raise ValueError(f"Asset not found: {asset_id}")
            
        self.assets[asset_id].usage_count += count
        return self.assets[asset_id]
    
    def search_by_type(self, asset_type: AssetType) -> List[Asset]:
        """Search assets by type"""
        return [a for a in self.assets.values() if a.asset_type == asset_type]
    
    def search_by_tag(self, tag: str) -> List[Asset]:
        """Search assets by tag"""
        return [a for a in self.assets.values() if tag in a.tags]
    
    def get_stats(self) -> Dict:
        """Get asset statistics"""
        assets = list(self.assets.values())
        approved = [a for a in assets if a.status == AssetStatus.APPROVED]
        
        return {
            "total_assets": len(assets),
            "approved": len(approved),
            "total_usage": sum(a.usage_count for a in assets),
            "by_type": {t.value: len(self.search_by_type(t)) for t in AssetType}
        }


# Demo
if __name__ == "__main__":
    agent = AssetAgent()
    
    print("📂 Asset Agent Demo\n")
    
    # Add assets
    a1 = agent.add_asset("Primary Logo", AssetType.LOGO, "/assets/logo-primary.svg", ["logo", "primary"])
    a2 = agent.add_asset("Icon Set", AssetType.ICON, "/assets/icons.svg", ["icons", "ui"])
    a3 = agent.add_asset("Email Template", AssetType.TEMPLATE, "/assets/email-template.html", ["email", "template"])
    a4 = agent.add_asset("Product Hero", AssetType.IMAGE, "/assets/hero.png", ["product", "hero"])
    
    print(f"📋 Asset: {a1.name}")
    print(f"   Type: {a1.asset_type.value}")
    print(f"   Version: {a1.version}")
    
    # Approve
    agent.approve(a1.id)
    agent.approve(a2.id)
    
    # Record usage
    agent.record_usage(a1.id, 50)
    agent.record_usage(a2.id, 120)
    
    print(f"\n✅ Status: {a1.status.value}")
    print(f"   Usage: {a1.usage_count}")
    
    # Stats
    print("\n📊 Stats:")
    stats = agent.get_stats()
    print(f"   Total: {stats['total_assets']}")
    print(f"   Approved: {stats['approved']}")
    print(f"   Total Usage: {stats['total_usage']}")
