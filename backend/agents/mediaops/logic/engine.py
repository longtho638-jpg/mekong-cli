"""
Channel Manager engine logic.
"""

import random
from datetime import datetime
from typing import Dict, List

from .models import Channel, ChannelStatus, ChannelType, Publication


class ChannelEngine:
    def __init__(self):
        self.channels: Dict[str, Channel] = {}
        self.publications: Dict[str, Publication] = {}

    def connect_channel(self, name: str, c_type: ChannelType, followers: int = 0) -> Channel:
        cid = f"channel_{c_type.value}_{random.randint(100, 999)}"
        channel = Channel(id=cid, name=name, channel_type=c_type, followers=followers)
        self.channels[cid] = channel
        return channel

    def publish(self, asset_id: str, channel_id: str, caption: str) -> Publication:
        if channel_id not in self.channels:
            raise ValueError("Channel not found")
        pid = f"pub_{int(datetime.now().timestamp())}"
        pub = Publication(
            id=pid,
            asset_id=asset_id,
            channel_id=channel_id,
            caption=caption,
            url=f"https://{self.channels[channel_id].channel_type.value}.com/{pid}",
        )
        self.publications[pid] = pub
        self.channels[channel_id].posts_count += 1
        return pub
