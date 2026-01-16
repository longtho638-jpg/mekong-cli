"""
Community Agent - Distribution & Engagement
Handles scheduling, publishing, and community interaction.
"""

from dataclasses import dataclass, field
from typing import List, Optional, Dict
from datetime import datetime, timedelta
from enum import Enum


class Platform(Enum):
    FACEBOOK = "facebook"
    ZALO = "zalo"
    TIKTOK = "tiktok"
    YOUTUBE = "youtube"
    TWITTER = "twitter"


@dataclass
class ScheduledPost:
    """Scheduled content post"""
    id: str
    content: str
    platform: Platform
    scheduled_at: datetime
    published_at: Optional[datetime] = None
    status: str = "scheduled"  # scheduled, publishing, published, failed
    engagement: Dict = field(default_factory=dict)


@dataclass
class WeeklySchedule:
    """Weekly content schedule"""
    week_start: datetime
    posts: List[ScheduledPost]
    platforms: List[Platform]


class CommunityAgent:
    """
    Community Agent - Đăng bài & Tương tác
    
    Responsibilities:
    - Schedule posts
    - Publish to platforms
    - Track engagement
    - Auto-reply comments
    """
    
    # Optimal posting times by platform (Vietnam timezone)
    BEST_TIMES = {
        Platform.FACEBOOK: [8, 12, 19, 21],  # Hours
        Platform.ZALO: [7, 12, 18, 20],
        Platform.TIKTOK: [12, 17, 21, 23],
        Platform.YOUTUBE: [14, 18, 20],
        Platform.TWITTER: [9, 13, 17, 21],
    }
    
    # Rate limits (posts per day)
    RATE_LIMITS = {
        Platform.FACEBOOK: 3,
        Platform.ZALO: 5,
        Platform.TIKTOK: 3,
        Platform.YOUTUBE: 1,
        Platform.TWITTER: 10,
    }
    
    def __init__(self):
        self.name = "Community"
        self.status = "ready"
        self.scheduled_posts: List[ScheduledPost] = []
        
    def schedule_post(
        self, 
        content: str, 
        platform: Platform,
        scheduled_at: Optional[datetime] = None
    ) -> ScheduledPost:
        """
        Schedule a post for publishing.
        
        Args:
            content: Post content
            platform: Target platform
            scheduled_at: When to publish (auto-selects optimal time if None)
        """
        if scheduled_at is None:
            # Find next optimal time
            now = datetime.now()
            best_hours = self.BEST_TIMES.get(platform, [12, 18])
            
            for hour in best_hours:
                potential = now.replace(hour=hour, minute=0, second=0)
                if potential > now:
                    scheduled_at = potential
                    break
            else:
                # Next day
                scheduled_at = (now + timedelta(days=1)).replace(
                    hour=best_hours[0], minute=0, second=0
                )
        
        post = ScheduledPost(
            id=f"post_{len(self.scheduled_posts)+1}_{int(datetime.now().timestamp())}",
            content=content,
            platform=platform,
            scheduled_at=scheduled_at
        )
        
        self.scheduled_posts.append(post)
        return post
    
    def create_weekly_schedule(
        self, 
        contents: List[str],
        platforms: List[Platform] = None
    ) -> WeeklySchedule:
        """
        Create a week's worth of scheduled posts.
        
        Args:
            contents: List of content pieces
            platforms: Target platforms (defaults to FB + Zalo)
        """
        if platforms is None:
            platforms = [Platform.FACEBOOK, Platform.ZALO]
            
        posts = []
        now = datetime.now()
        week_start = now - timedelta(days=now.weekday())
        
        content_idx = 0
        for day in range(7):
            date = week_start + timedelta(days=day)
            
            for platform in platforms:
                if content_idx >= len(contents):
                    break
                    
                # Get best time for this platform
                best_hour = self.BEST_TIMES[platform][0]
                scheduled_at = date.replace(hour=best_hour, minute=0, second=0)
                
                if scheduled_at > now:
                    post = self.schedule_post(
                        content=contents[content_idx],
                        platform=platform,
                        scheduled_at=scheduled_at
                    )
                    posts.append(post)
                    content_idx += 1
        
        return WeeklySchedule(
            week_start=week_start,
            posts=posts,
            platforms=platforms
        )
    
    def publish(self, post: ScheduledPost) -> bool:
        """
        Publish a post to its platform.
        In production: calls platform APIs
        """
        post.status = "publishing"
        
        # Simulate API call
        try:
            # In production: call Facebook/Zalo/TikTok API
            post.published_at = datetime.now()
            post.status = "published"
            return True
        except Exception:
            post.status = "failed"
            return False
    
    def get_pending(self) -> List[ScheduledPost]:
        """Get all pending posts"""
        now = datetime.now()
        return [
            p for p in self.scheduled_posts 
            if p.status == "scheduled" and p.scheduled_at <= now
        ]
    
    def get_analytics(self) -> Dict:
        """Get engagement analytics summary"""
        published = [p for p in self.scheduled_posts if p.status == "published"]
        
        return {
            "total_scheduled": len(self.scheduled_posts),
            "total_published": len(published),
            "pending": len([p for p in self.scheduled_posts if p.status == "scheduled"]),
            "by_platform": {
                platform.value: len([p for p in published if p.platform == platform])
                for platform in Platform
            }
        }


# Demo
if __name__ == "__main__":
    community = CommunityAgent()
    
    print("🤝 Community Agent Demo\n")
    
    # Schedule single post
    post = community.schedule_post(
        content="🚀 Mekong-CLI ra mắt! Deploy agency trong 15 phút #MekongCLI",
        platform=Platform.FACEBOOK
    )
    print(f"📅 Scheduled: {post.content[:50]}...")
    print(f"   Platform: {post.platform.value}")
    print(f"   Time: {post.scheduled_at}")
    
    # Create weekly schedule
    print("\n📆 Weekly Schedule:")
    contents = [
        "Post 1: Giới thiệu Mekong-CLI",
        "Post 2: Demo Hybrid Router",
        "Post 3: Vibe Tuning tutorial",
        "Post 4: Case study khách hàng",
        "Post 5: Tips automation",
    ]
    
    schedule = community.create_weekly_schedule(contents)
    print(f"   Week start: {schedule.week_start.date()}")
    print(f"   Posts scheduled: {len(schedule.posts)}")
    
    for p in schedule.posts[:3]:
        print(f"   • {p.scheduled_at.strftime('%a %H:%M')} [{p.platform.value}]: {p.content[:30]}...")
    
    # Analytics
    print("\n📊 Analytics:")
    analytics = community.get_analytics()
    print(f"   Total: {analytics['total_scheduled']} posts")
    print(f"   Pending: {analytics['pending']}")
