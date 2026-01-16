"""
Publishing Agent - Content Scheduling & Distribution
Manages content calendar and multi-platform publishing.
"""

from dataclasses import dataclass, field
from typing import List, Dict, Optional
from datetime import datetime, timedelta
from enum import Enum
import random


class PublishStatus(Enum):
    SCHEDULED = "scheduled"
    PUBLISHING = "publishing"
    PUBLISHED = "published"
    FAILED = "failed"


class Platform(Enum):
    WEBSITE = "website"
    TWITTER = "twitter"
    LINKEDIN = "linkedin"
    FACEBOOK = "facebook"
    INSTAGRAM = "instagram"
    YOUTUBE = "youtube"
    TIKTOK = "tiktok"


@dataclass
class ScheduledPost:
    """Scheduled content post"""
    id: str
    content_id: str
    content_title: str
    platform: Platform
    scheduled_at: datetime
    status: PublishStatus = PublishStatus.SCHEDULED
    published_at: Optional[datetime] = None
    engagement: Dict[str, int] = field(default_factory=dict)
    
    @property
    def is_due(self) -> bool:
        return datetime.now() >= self.scheduled_at and self.status == PublishStatus.SCHEDULED


class PublishingAgent:
    """
    Publishing Agent - Xuất bản Nội dung
    
    Responsibilities:
    - Content calendar
    - Multi-platform publishing
    - Scheduling
    - Analytics tracking
    """
    
    def __init__(self):
        self.name = "Publishing"
        self.status = "ready"
        self.posts: Dict[str, ScheduledPost] = {}
        
    def schedule(
        self,
        content_id: str,
        content_title: str,
        platform: Platform,
        scheduled_at: datetime
    ) -> ScheduledPost:
        """Schedule content for publishing"""
        post_id = f"post_{int(datetime.now().timestamp())}_{random.randint(100,999)}"
        
        post = ScheduledPost(
            id=post_id,
            content_id=content_id,
            content_title=content_title,
            platform=platform,
            scheduled_at=scheduled_at
        )
        
        self.posts[post_id] = post
        return post
    
    def publish(self, post_id: str) -> ScheduledPost:
        """Publish scheduled post"""
        if post_id not in self.posts:
            raise ValueError(f"Post not found: {post_id}")
            
        post = self.posts[post_id]
        post.status = PublishStatus.PUBLISHED
        post.published_at = datetime.now()
        
        # Simulate engagement
        post.engagement = {
            "views": random.randint(100, 5000),
            "likes": random.randint(10, 500),
            "shares": random.randint(5, 100),
            "comments": random.randint(2, 50)
        }
        
        return post
    
    def get_calendar(self, days: int = 7) -> List[ScheduledPost]:
        """Get upcoming scheduled posts"""
        now = datetime.now()
        end = now + timedelta(days=days)
        
        return sorted(
            [p for p in self.posts.values() 
             if p.status == PublishStatus.SCHEDULED and p.scheduled_at <= end],
            key=lambda x: x.scheduled_at
        )
    
    def get_stats(self) -> Dict:
        """Get publishing statistics"""
        posts = list(self.posts.values())
        published = [p for p in posts if p.status == PublishStatus.PUBLISHED]
        
        total_engagement = sum(sum(p.engagement.values()) for p in published)
        
        return {
            "total_scheduled": len(posts),
            "published": len(published),
            "pending": len([p for p in posts if p.status == PublishStatus.SCHEDULED]),
            "total_engagement": total_engagement,
            "avg_engagement": total_engagement / len(published) if published else 0,
            "by_platform": {p.value: len([post for post in posts if post.platform == p]) for p in Platform}
        }


# Demo
if __name__ == "__main__":
    agent = PublishingAgent()
    
    print("📅 Publishing Agent Demo\n")
    
    # Schedule posts
    p1 = agent.schedule("C001", "10 Tips for Productivity", Platform.LINKEDIN, datetime.now() + timedelta(hours=2))
    p2 = agent.schedule("C001", "10 Tips for Productivity", Platform.TWITTER, datetime.now() + timedelta(hours=3))
    p3 = agent.schedule("C002", "Product Demo", Platform.YOUTUBE, datetime.now() + timedelta(days=1))
    
    print(f"📋 Scheduled: {p1.content_title}")
    print(f"   Platform: {p1.platform.value}")
    print(f"   At: {p1.scheduled_at}")
    
    # Publish
    agent.publish(p1.id)
    agent.publish(p2.id)
    
    print(f"\n✅ Published: {p1.status.value}")
    print(f"   Engagement: {sum(p1.engagement.values())}")
    
    # Calendar
    print("\n📅 Upcoming:")
    for post in agent.get_calendar():
        print(f"   {post.content_title} → {post.platform.value}")
    
    # Stats
    print("\n📊 Stats:")
    stats = agent.get_stats()
    print(f"   Published: {stats['published']}")
    print(f"   Total Engagement: {stats['total_engagement']}")
