"""
Content Library Agent - Media Asset Management
Manages images, videos, and content assets.
"""

from dataclasses import dataclass, field
from typing import List, Dict, Optional
from datetime import datetime
from enum import Enum
import random


class AssetType(Enum):
    IMAGE = "image"
    VIDEO = "video"
    AUDIO = "audio"
    DOCUMENT = "document"


class AssetStatus(Enum):
    DRAFT = "draft"
    READY = "ready"
    PUBLISHED = "published"
    ARCHIVED = "archived"


@dataclass
class Asset:
    """Media asset"""
    id: str
    name: str
    asset_type: AssetType
    url: str
    thumbnail_url: Optional[str] = None
    tags: List[str] = field(default_factory=list)
    size_bytes: int = 0
    status: AssetStatus = AssetStatus.DRAFT
    usage_count: int = 0
    created_at: datetime = None

    def __post_init__(self):
        if self.created_at is None:
            self.created_at = datetime.now()


class ContentLibraryAgent:
    """
    Content Library Agent - Quản lý Media
    
    Responsibilities:
    - Upload and store assets
    - Tag and categorize
    - Track usage
    - Version control
    """

    def __init__(self):
        self.name = "Content Library"
        self.status = "ready"
        self.assets: Dict[str, Asset] = {}

    def upload(
        self,
        name: str,
        asset_type: AssetType,
        url: str,
        tags: List[str] = None,
        size_bytes: int = 0
    ) -> Asset:
        """Upload new asset"""
        asset_id = f"asset_{int(datetime.now().timestamp())}_{random.randint(100,999)}"

        asset = Asset(
            id=asset_id,
            name=name,
            asset_type=asset_type,
            url=url,
            thumbnail_url=f"{url.rsplit('.', 1)[0]}_thumb.jpg" if '.' in url else None,
            tags=tags or [],
            size_bytes=size_bytes,
            status=AssetStatus.READY
        )

        self.assets[asset_id] = asset
        return asset

    def add_tags(self, asset_id: str, tags: List[str]) -> Asset:
        """Add tags to asset"""
        if asset_id not in self.assets:
            raise ValueError(f"Asset not found: {asset_id}")

        asset = self.assets[asset_id]
        asset.tags.extend(tags)
        asset.tags = list(set(asset.tags))  # Dedupe

        return asset

    def search_by_tag(self, tag: str) -> List[Asset]:
        """Search assets by tag"""
        return [a for a in self.assets.values() if tag.lower() in [t.lower() for t in a.tags]]

    def search_by_type(self, asset_type: AssetType) -> List[Asset]:
        """Search assets by type"""
        return [a for a in self.assets.values() if a.asset_type == asset_type]

    def record_usage(self, asset_id: str) -> Asset:
        """Record asset usage"""
        if asset_id not in self.assets:
            raise ValueError(f"Asset not found: {asset_id}")

        asset = self.assets[asset_id]
        asset.usage_count += 1

        return asset

    def archive(self, asset_id: str) -> Asset:
        """Archive asset"""
        if asset_id not in self.assets:
            raise ValueError(f"Asset not found: {asset_id}")

        asset = self.assets[asset_id]
        asset.status = AssetStatus.ARCHIVED

        return asset

    def get_stats(self) -> Dict:
        """Get library statistics"""
        assets = list(self.assets.values())

        return {
            "total": len(assets),
            "total_size_mb": sum(a.size_bytes for a in assets) / (1024 * 1024),
            "by_type": {
                at.value: len([a for a in assets if a.asset_type == at])
                for at in AssetType
            },
            "most_used": sorted(assets, key=lambda a: a.usage_count, reverse=True)[:5]
        }


# Demo
if __name__ == "__main__":
    agent = ContentLibraryAgent()

    print("📚 Content Library Agent Demo\n")

    # Upload assets
    img1 = agent.upload(
        name="hero_banner.jpg",
        asset_type=AssetType.IMAGE,
        url="https://storage.mekong-cli.com/hero_banner.jpg",
        tags=["landing", "hero", "marketing"],
        size_bytes=1024 * 500
    )

    vid1 = agent.upload(
        name="demo_video.mp4",
        asset_type=AssetType.VIDEO,
        url="https://storage.mekong-cli.com/demo_video.mp4",
        tags=["demo", "tutorial"],
        size_bytes=1024 * 1024 * 25
    )

    print(f"📷 Uploaded: {img1.name}")
    print(f"   Tags: {', '.join(img1.tags)}")

    print(f"\n🎬 Uploaded: {vid1.name}")
    print(f"   Size: {vid1.size_bytes / (1024*1024):.1f} MB")

    # Record usage
    agent.record_usage(img1.id)
    agent.record_usage(img1.id)
    agent.record_usage(vid1.id)

    # Search
    marketing = agent.search_by_tag("marketing")
    print(f"\n🔍 Marketing assets: {len(marketing)}")

    # Stats
    print("\n📊 Stats:")
    stats = agent.get_stats()
    print(f"   Total: {stats['total']} assets")
    print(f"   Size: {stats['total_size_mb']:.1f} MB")
