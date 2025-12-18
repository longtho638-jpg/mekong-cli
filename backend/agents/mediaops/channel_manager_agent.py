"""
Channel Manager Agent - Multi-Platform Distribution
Manages content distribution across multiple channels.
"""

from dataclasses import dataclass, field
from typing import List, Dict, Optional
from datetime import datetime
from enum import Enum
import random


class ChannelType(Enum):
    FACEBOOK = "facebook"
    YOUTUBE = "youtube"
    TIKTOK = "tiktok"
    ZALO = "zalo"
    TELEGRAM = "telegram"
    WEBSITE = "website"


class ChannelStatus(Enum):
    CONNECTED = "connected"
    DISCONNECTED = "disconnected"
    ERROR = "error"


@dataclass
class Channel:
    """Social/media channel"""
    id: str
    name: str
    channel_type: ChannelType
    status: ChannelStatus = ChannelStatus.CONNECTED
    followers: int = 0
    posts_count: int = 0
    engagement_rate: float = 0.0
    connected_at: datetime = None
    
    def __post_init__(self):
        if self.connected_at is None:
            self.connected_at = datetime.now()


@dataclass
class Publication:
    """Published content"""
    id: str
    asset_id: str
    channel_id: str
    caption: str
    url: Optional[str] = None
    views: int = 0
    likes: int = 0
    shares: int = 0
    published_at: datetime = None
    
    def __post_init__(self):
        if self.published_at is None:
            self.published_at = datetime.now()


class ChannelManagerAgent:
    """
    Channel Manager Agent - Phân phối Đa nền tảng
    
    Responsibilities:
    - Connect channels
    - Publish to multiple platforms
    - Track engagement
    - Cross-post content
    """
    
    def __init__(self):
        self.name = "Channel Manager"
        self.status = "ready"
        self.channels: Dict[str, Channel] = {}
        self.publications: Dict[str, Publication] = {}
        
    def connect_channel(
        self,
        name: str,
        channel_type: ChannelType,
        followers: int = 0
    ) -> Channel:
        """Connect a new channel"""
        channel_id = f"channel_{channel_type.value}_{random.randint(100,999)}"
        
        channel = Channel(
            id=channel_id,
            name=name,
            channel_type=channel_type,
            followers=followers
        )
        
        self.channels[channel_id] = channel
        return channel
    
    def publish_to_channel(
        self,
        asset_id: str,
        channel_id: str,
        caption: str
    ) -> Publication:
        """Publish asset to a channel"""
        if channel_id not in self.channels:
            raise ValueError(f"Channel not found: {channel_id}")
            
        channel = self.channels[channel_id]
        channel.posts_count += 1
        
        pub_id = f"pub_{int(datetime.now().timestamp())}_{random.randint(100,999)}"
        
        # Generate mock URL
        url = f"https://{channel.channel_type.value}.com/post/{pub_id}"
        
        pub = Publication(
            id=pub_id,
            asset_id=asset_id,
            channel_id=channel_id,
            caption=caption,
            url=url
        )
        
        self.publications[pub_id] = pub
        return pub
    
    def cross_post(
        self,
        asset_id: str,
        caption: str,
        channel_ids: List[str] = None
    ) -> List[Publication]:
        """Publish to multiple channels"""
        if channel_ids is None:
            channel_ids = list(self.channels.keys())
            
        publications = []
        for channel_id in channel_ids:
            try:
                pub = self.publish_to_channel(asset_id, channel_id, caption)
                publications.append(pub)
            except ValueError:
                continue
                
        return publications
    
    def update_metrics(
        self,
        pub_id: str,
        views: int = 0,
        likes: int = 0,
        shares: int = 0
    ) -> Publication:
        """Update publication metrics"""
        if pub_id not in self.publications:
            raise ValueError(f"Publication not found: {pub_id}")
            
        pub = self.publications[pub_id]
        pub.views += views
        pub.likes += likes
        pub.shares += shares
        
        return pub
    
    def get_channel_stats(self, channel_id: str) -> Dict:
        """Get stats for a channel"""
        if channel_id not in self.channels:
            raise ValueError(f"Channel not found: {channel_id}")
            
        channel = self.channels[channel_id]
        pubs = [p for p in self.publications.values() if p.channel_id == channel_id]
        
        return {
            "channel": channel.name,
            "type": channel.channel_type.value,
            "followers": channel.followers,
            "posts": len(pubs),
            "total_views": sum(p.views for p in pubs),
            "total_likes": sum(p.likes for p in pubs),
            "engagement_rate": f"{channel.engagement_rate}%"
        }
    
    def get_all_stats(self) -> Dict:
        """Get overall stats"""
        pubs = list(self.publications.values())
        
        return {
            "total_channels": len(self.channels),
            "connected": len([c for c in self.channels.values() if c.status == ChannelStatus.CONNECTED]),
            "total_publications": len(pubs),
            "total_reach": sum(c.followers for c in self.channels.values()),
            "by_channel": {
                c.channel_type.value: c.posts_count
                for c in self.channels.values()
            }
        }


# Demo
if __name__ == "__main__":
    agent = ChannelManagerAgent()
    
    print("📺 Channel Manager Agent Demo\n")
    
    # Connect channels
    fb = agent.connect_channel("Mekong CLI", ChannelType.FACEBOOK, followers=5000)
    yt = agent.connect_channel("Mekong CLI", ChannelType.YOUTUBE, followers=2000)
    zalo = agent.connect_channel("Mekong OA", ChannelType.ZALO, followers=10000)
    
    print(f"📱 Connected: {fb.name} ({fb.channel_type.value}) - {fb.followers} followers")
    print(f"📱 Connected: {yt.name} ({yt.channel_type.value}) - {yt.followers} followers")
    print(f"📱 Connected: {zalo.name} ({zalo.channel_type.value}) - {zalo.followers} followers")
    
    # Cross-post
    print("\n🚀 Cross-posting...")
    pubs = agent.cross_post(
        asset_id="asset_001",
        caption="🎉 Mekong-CLI v1.0 ra mắt! Deploy agency trong 15 phút #MekongCLI"
    )
    print(f"   Published to {len(pubs)} channels")
    
    # Update metrics
    agent.update_metrics(pubs[0].id, views=1500, likes=120, shares=25)
    
    # Stats
    print("\n📊 Stats:")
    stats = agent.get_all_stats()
    print(f"   Channels: {stats['total_channels']}")
    print(f"   Total Reach: {stats['total_reach']:,} followers")
    print(f"   Publications: {stats['total_publications']}")
