"""
Content Scheduler Agent - Multi-Platform Scheduling
Manages content calendar and posting across social platforms.
"""

import random
from dataclasses import dataclass, field
from datetime import date, datetime
from enum import Enum
from typing import Dict, List


class SocialPlatform(Enum):
    TWITTER = "twitter"
    LINKEDIN = "linkedin"
    FACEBOOK = "facebook"
    INSTAGRAM = "instagram"
    TIKTOK = "tiktok"


class PostStatus(Enum):
    DRAFT = "draft"
    SCHEDULED = "scheduled"
    PUBLISHED = "published"
    FAILED = "failed"


@dataclass
class SocialPost:
    """Social media post"""

    id: str
    content: str
    platforms: List[SocialPlatform]
    scheduled_time: datetime
    status: PostStatus = PostStatus.DRAFT
    media_urls: List[str] = field(default_factory=list)
    hashtags: List[str] = field(default_factory=list)
    engagement_score: float = 0
    likes: int = 0
    shares: int = 0
    comments: int = 0

    @property
    def platform_names(self) -> List[str]:
        return [p.value for p in self.platforms]


class ContentSchedulerAgent:
    """
    Content Scheduler Agent - Lên lịch nội dung

    Responsibilities:
    - Multi-platform scheduling
    - Content calendar management
    - Auto-formatting & hashtags
    - Approval workflows
    """

    def __init__(self):
        self.name = "Content Scheduler"
        self.status = "ready"
        self.posts: Dict[str, SocialPost] = {}

    def schedule_post(
        self,
        content: str,
        platforms: List[SocialPlatform],
        scheduled_time: datetime,
        media_urls: List[str] = None,
    ) -> SocialPost:
        """Schedule a new post"""
        post_id = f"post_{random.randint(1000, 9999)}"

        # Auto-generate hashtags based on content (simulated)
        hashtags = []
        if "launch" in content.lower():
            hashtags.append("#NewLaunch")
        if "tech" in content.lower():
            hashtags.append("#TechNews")
        if "mekong" in content.lower():
            hashtags.append("#MekongCLI")

        post = SocialPost(
            id=post_id,
            content=content,
            platforms=platforms,
            scheduled_time=scheduled_time,
            status=PostStatus.SCHEDULED,
            media_urls=media_urls or [],
            hashtags=hashtags,
        )

        self.posts[post_id] = post
        return post

    def get_calendar(self, start_date: date, end_date: date) -> List[SocialPost]:
        """Get posts within date range"""
        calendar_posts = []
        for post in self.posts.values():
            if start_date <= post.scheduled_time.date() <= end_date:
                calendar_posts.append(post)
        return sorted(calendar_posts, key=lambda p: p.scheduled_time)

    def simulate_publishing(self, post_id: str) -> SocialPost:
        """Simulate post publishing and initial engagement"""
        if post_id not in self.posts:
            raise ValueError(f"Post not found: {post_id}")

        post = self.posts[post_id]
        post.status = PostStatus.PUBLISHED

        # Simulate engagement
        base_likes = random.randint(10, 500)
        multiplier = len(post.platforms)

        post.likes = base_likes * multiplier
        post.shares = int(post.likes * random.uniform(0.1, 0.3))
        post.comments = int(post.likes * random.uniform(0.05, 0.15))

        # Calculate score (weighted)
        post.engagement_score = (post.likes * 1) + (post.comments * 2) + (post.shares * 3)

        return post

    def get_stats(self) -> Dict:
        """Get scheduling statistics"""
        posts = list(self.posts.values())
        scheduled = [p for p in posts if p.status == PostStatus.SCHEDULED]
        published = [p for p in posts if p.status == PostStatus.PUBLISHED]

        return {
            "total_posts": len(posts),
            "scheduled": len(scheduled),
            "published": len(published),
            "total_engagement": sum(p.engagement_score for p in published),
        }


# Demo
if __name__ == "__main__":
    from datetime import timedelta

    agent = ContentSchedulerAgent()

    print("📅 Content Scheduler Agent Demo\n")

    # Schedule post
    now = datetime.now()
    p1 = agent.schedule_post(
        "Excited to announce the new Mekong CLI update! 🚀 #DevTools",
        [SocialPlatform.TWITTER, SocialPlatform.LINKEDIN],
        now + timedelta(hours=2),
    )

    print(f"📋 Post: {p1.content}")
    print(f"   Platforms: {', '.join(p1.platform_names)}")
    print(f"   Time: {p1.scheduled_time}")
    print(f"   Status: {p1.status.value}")
    print(f"   Hashtags: {p1.hashtags}")

    # Simulate publish
    print("\n🚀 Publishing...")
    agent.simulate_publishing(p1.id)

    print(f"   Status: {p1.status.value}")
    print(f"   Likes: {p1.likes}")
    print(f"   Shares: {p1.shares}")
    print(f"   Score: {p1.engagement_score}")
