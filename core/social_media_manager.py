"""
📱 Social Media Manager - Social Presence
===========================================

Manage social media presence across platforms.
Engage and grow!

Roles:
- Content scheduling
- Platform management
- Engagement tracking
- Community management
"""

from typing import Dict, List, Any, Optional
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from enum import Enum
import uuid


class Platform(Enum):
    """Social media platforms."""
    FACEBOOK = "facebook"
    INSTAGRAM = "instagram"
    LINKEDIN = "linkedin"
    TWITTER = "twitter"
    TIKTOK = "tiktok"
    YOUTUBE = "youtube"


class PostType(Enum):
    """Post types."""
    IMAGE = "image"
    VIDEO = "video"
    CAROUSEL = "carousel"
    STORY = "story"
    REEL = "reel"
    TEXT = "text"


class PostStatus(Enum):
    """Post status."""
    DRAFT = "draft"
    SCHEDULED = "scheduled"
    PUBLISHED = "published"
    FAILED = "failed"


@dataclass
class SocialPost:
    """A social media post."""
    id: str
    platform: Platform
    post_type: PostType
    caption: str
    status: PostStatus = PostStatus.DRAFT
    scheduled_at: Optional[datetime] = None
    published_at: Optional[datetime] = None
    likes: int = 0
    comments: int = 0
    shares: int = 0
    reach: int = 0


@dataclass
class PlatformAccount:
    """A social media account."""
    id: str
    platform: Platform
    handle: str
    followers: int = 0
    following: int = 0
    posts_count: int = 0
    engagement_rate: float = 0


class SocialMediaManager:
    """
    Social Media Manager.
    
    Grow social presence.
    """
    
    def __init__(self, agency_name: str):
        self.agency_name = agency_name
        self.posts: Dict[str, SocialPost] = {}
        self.accounts: Dict[str, PlatformAccount] = {}
    
    def add_account(
        self,
        platform: Platform,
        handle: str,
        followers: int = 0
    ) -> PlatformAccount:
        """Add a social media account."""
        account = PlatformAccount(
            id=f"ACC-{uuid.uuid4().hex[:6].upper()}",
            platform=platform,
            handle=handle,
            followers=followers
        )
        self.accounts[account.id] = account
        return account
    
    def create_post(
        self,
        platform: Platform,
        post_type: PostType,
        caption: str
    ) -> SocialPost:
        """Create a new post."""
        post = SocialPost(
            id=f"PST-{uuid.uuid4().hex[:6].upper()}",
            platform=platform,
            post_type=post_type,
            caption=caption
        )
        self.posts[post.id] = post
        return post
    
    def schedule_post(self, post: SocialPost, schedule_time: datetime):
        """Schedule a post."""
        post.scheduled_at = schedule_time
        post.status = PostStatus.SCHEDULED
    
    def publish_post(self, post: SocialPost):
        """Publish a post."""
        post.published_at = datetime.now()
        post.status = PostStatus.PUBLISHED
    
    def update_engagement(
        self,
        post: SocialPost,
        likes: int = 0,
        comments: int = 0,
        shares: int = 0,
        reach: int = 0
    ):
        """Update post engagement."""
        post.likes = likes
        post.comments = comments
        post.shares = shares
        post.reach = reach
    
    def get_stats(self) -> Dict[str, Any]:
        """Get social media statistics."""
        total_followers = sum(a.followers for a in self.accounts.values())
        published = sum(1 for p in self.posts.values() if p.status == PostStatus.PUBLISHED)
        total_engagement = sum(p.likes + p.comments + p.shares for p in self.posts.values())
        total_reach = sum(p.reach for p in self.posts.values())
        
        return {
            "accounts": len(self.accounts),
            "followers": total_followers,
            "posts": len(self.posts),
            "published": published,
            "engagement": total_engagement,
            "reach": total_reach
        }
    
    def format_dashboard(self) -> str:
        """Format social media dashboard."""
        stats = self.get_stats()
        
        lines = [
            "╔═══════════════════════════════════════════════════════════╗",
            f"║  📱 SOCIAL MEDIA MANAGER                                  ║",
            f"║  {stats['accounts']} accounts │ {stats['followers']:,} followers │ {stats['engagement']:,} eng  ║",
            "╠═══════════════════════════════════════════════════════════╣",
            "║  📊 ACCOUNTS                                              ║",
            "║  ─────────────────────────────────────────────────────── ║",
        ]
        
        platform_icons = {"facebook": "📘", "instagram": "📸", "linkedin": "💼",
                        "twitter": "🐦", "tiktok": "🎵", "youtube": "📺"}
        
        for account in list(self.accounts.values())[:4]:
            icon = platform_icons.get(account.platform.value, "📱")
            lines.append(f"║  {icon} @{account.handle[:15]:<15} │ {account.followers:>8,} followers     ║")
        
        lines.extend([
            "║                                                           ║",
            "║  📝 RECENT POSTS                                          ║",
            "║  ─────────────────────────────────────────────────────── ║",
        ])
        
        status_icons = {"draft": "📝", "scheduled": "⏰", "published": "✅", "failed": "❌"}
        type_icons = {"image": "🖼️", "video": "🎬", "carousel": "📊",
                     "story": "📱", "reel": "🎞️", "text": "✍️"}
        
        for post in list(self.posts.values())[-4:]:
            s_icon = status_icons.get(post.status.value, "⚪")
            t_icon = type_icons.get(post.post_type.value, "📝")
            p_icon = platform_icons.get(post.platform.value, "📱")
            engagement = post.likes + post.comments + post.shares
            
            lines.append(f"║  {s_icon} {p_icon} {t_icon} {post.caption[:18]:<18} │ {engagement:>6,} eng  ║")
        
        lines.extend([
            "║                                                           ║",
            "║  📈 ENGAGEMENT OVERVIEW                                   ║",
            "║  ─────────────────────────────────────────────────────── ║",
            f"║    👍 Total Likes:        {sum(p.likes for p in self.posts.values()):>12,}              ║",
            f"║    💬 Total Comments:     {sum(p.comments for p in self.posts.values()):>12,}              ║",
            f"║    🔄 Total Shares:       {sum(p.shares for p in self.posts.values()):>12,}              ║",
            f"║    👁️ Total Reach:        {stats['reach']:>12,}              ║",
            "║                                                           ║",
            "║  [➕ Post]  [📅 Schedule]  [📊 Analytics]                 ║",
            "╠═══════════════════════════════════════════════════════════╣",
            f"║  🏯 {self.agency_name} - Engage and grow!                 ║",
            "╚═══════════════════════════════════════════════════════════╝",
        ])
        
        return "\n".join(lines)


# Example usage
if __name__ == "__main__":
    smm = SocialMediaManager("Saigon Digital Hub")
    
    print("📱 Social Media Manager")
    print("=" * 60)
    print()
    
    smm.add_account(Platform.INSTAGRAM, "saigon_digital", 15000)
    smm.add_account(Platform.FACEBOOK, "saigondigitalhub", 8000)
    smm.add_account(Platform.LINKEDIN, "saigon-digital-hub", 5000)
    
    p1 = smm.create_post(Platform.INSTAGRAM, PostType.REEL, "Behind the scenes 🎬")
    p2 = smm.create_post(Platform.FACEBOOK, PostType.IMAGE, "New case study launch!")
    p3 = smm.create_post(Platform.LINKEDIN, PostType.TEXT, "Hiring: Senior Developer")
    
    smm.publish_post(p1)
    smm.publish_post(p2)
    smm.schedule_post(p3, datetime.now() + timedelta(hours=2))
    
    smm.update_engagement(p1, 1500, 85, 120, 25000)
    smm.update_engagement(p2, 350, 25, 40, 8000)
    
    print(smm.format_dashboard())
