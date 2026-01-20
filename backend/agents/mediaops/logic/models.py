"""
Channel Manager Data Models.
"""
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from typing import Dict, List, Optional


class ChannelType(Enum):
    FACEBOOK = "facebook"
    YOUTUBE = "youtube"
    TIKTOK = "tiktok"
    ZALO = "zalo"

class ChannelStatus(Enum):
    CONNECTED = "connected"
    DISCONNECTED = "disconnected"

@dataclass
class Channel:
    id: str
    name: str
    channel_type: ChannelType
    status: ChannelStatus = ChannelStatus.CONNECTED
    followers: int = 0
    posts_count: int = 0
    connected_at: datetime = field(default_factory=datetime.now)

@dataclass
class Publication:
    id: str
    asset_id: str
    channel_id: str
    caption: str
    url: Optional[str] = None
    views: int = 0
    published_at: datetime = field(default_factory=datetime.now)
