"""
Influencer Discovery Agent - Search & Vetting
Manages influencer discovery and audience analysis.
"""

from dataclasses import dataclass
from typing import List, Dict
from datetime import datetime
from enum import Enum
import random


class Platform(Enum):
    INSTAGRAM = "instagram"
    TIKTOK = "tiktok"
    YOUTUBE = "youtube"
    TWITTER = "twitter"
    LINKEDIN = "linkedin"


class InfluencerTier(Enum):
    NANO = "nano"           # 1K-10K
    MICRO = "micro"         # 10K-50K
    MID = "mid"             # 50K-500K
    MACRO = "macro"         # 500K-1M
    MEGA = "mega"           # 1M+


@dataclass
class Influencer:
    """Influencer profile"""
    id: str
    name: str
    handle: str
    platform: Platform
    tier: InfluencerTier
    followers: int
    engagement_rate: float = 0
    niche: str = ""
    verified: bool = False
    score: int = 0
    created_at: datetime = None

    def __post_init__(self):
        if self.created_at is None:
            self.created_at = datetime.now()


class InfluencerDiscoveryAgent:
    """
    Influencer Discovery Agent - Tìm kiếm Influencer
    
    Responsibilities:
    - Influencer search
    - Audience analysis
    - Engagement metrics
    - Vetting & scoring
    """

    def __init__(self):
        self.name = "Influencer Discovery"
        self.status = "ready"
        self.influencers: Dict[str, Influencer] = {}

    def discover(
        self,
        platform: Platform,
        niche: str,
        min_followers: int = 1000
    ) -> List[Influencer]:
        """Discover influencers"""
        discovered = []

        # Simulate discovery
        for i in range(random.randint(5, 10)):
            followers = random.randint(min_followers, min_followers * 100)

            tier = InfluencerTier.NANO
            if followers >= 1000000:
                tier = InfluencerTier.MEGA
            elif followers >= 500000:
                tier = InfluencerTier.MACRO
            elif followers >= 50000:
                tier = InfluencerTier.MID
            elif followers >= 10000:
                tier = InfluencerTier.MICRO

            influencer = Influencer(
                id=f"inf_{random.randint(1000,9999)}",
                name=f"Influencer {i+1}",
                handle=f"@influencer_{i+1}",
                platform=platform,
                tier=tier,
                followers=followers,
                engagement_rate=random.uniform(1.0, 8.0),
                niche=niche
            )

            self.influencers[influencer.id] = influencer
            discovered.append(influencer)

        return discovered

    def vet_influencer(self, influencer_id: str) -> Influencer:
        """Vet and score influencer"""
        if influencer_id not in self.influencers:
            raise ValueError(f"Influencer not found: {influencer_id}")

        influencer = self.influencers[influencer_id]

        # Calculate score based on engagement and followers
        base_score = min(50, int(influencer.engagement_rate * 10))
        follower_score = min(30, int(influencer.followers / 50000))

        influencer.score = base_score + follower_score + random.randint(10, 20)
        influencer.verified = influencer.score > 70

        return influencer

    def get_by_tier(self, tier: InfluencerTier) -> List[Influencer]:
        """Get influencers by tier"""
        return [i for i in self.influencers.values() if i.tier == tier]

    def get_stats(self) -> Dict:
        """Get discovery statistics"""
        influencers = list(self.influencers.values())
        verified = [i for i in influencers if i.verified]

        return {
            "total_influencers": len(influencers),
            "verified": len(verified),
            "avg_engagement": sum(i.engagement_rate for i in influencers) / len(influencers) if influencers else 0,
            "avg_score": sum(i.score for i in influencers) / len(influencers) if influencers else 0
        }


# Demo
if __name__ == "__main__":
    agent = InfluencerDiscoveryAgent()

    print("🌟 Influencer Discovery Agent Demo\n")

    # Discover influencers
    found = agent.discover(Platform.INSTAGRAM, "Tech", 10000)

    print(f"📋 Discovered: {len(found)} influencers")

    # Vet top one
    if found:
        inf = found[0]
        agent.vet_influencer(inf.id)

        print(f"\n🌟 Influencer: {inf.name}")
        print(f"   Handle: {inf.handle}")
        print(f"   Platform: {inf.platform.value}")
        print(f"   Tier: {inf.tier.value}")
        print(f"   Followers: {inf.followers:,}")
        print(f"   Engagement: {inf.engagement_rate:.1f}%")
        print(f"\n✅ Verified: {inf.verified}")
        print(f"   Score: {inf.score}")
