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

import uuid
import logging
from typing import Dict, List, Any, Optional, Union
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from enum import Enum

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class Platform(Enum):
    """Supported social media platforms."""
    FACEBOOK = "facebook"
    INSTAGRAM = "instagram"
    LINKEDIN = "linkedin"
    TWITTER = "twitter"
    TIKTOK = "tiktok"
    YOUTUBE = "youtube"


class PostType(Enum):
    """Categories of social content."""
    IMAGE = "image"
    VIDEO = "video"
    CAROUSEL = "carousel"
    STORY = "story"
    REEL = "reel"
    TEXT = "text"


class PostStatus(Enum):
    """Lifecycle status of a social post."""
    DRAFT = "draft"
    SCHEDULED = "scheduled"
    PUBLISHED = "published"
    FAILED = "failed"


@dataclass
class SocialPost:
    """A social media post entity record."""
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

    def __post_init__(self):
        if not self.caption:
            raise ValueError("Post caption cannot be empty")


@dataclass
class PlatformAccount:
    """A social media account entity record."""
    id: str
    platform: Platform
    handle: str
    followers: int = 0
    following: int = 0
    posts_count: int = 0
    engagement_rate: float = 0.0


class SocialMediaManager:
    """
    Social Media Management System.
    
    Orchestrates cross-platform content delivery, engagement tracking, and audience growth analytics.
    """
    
    def __init__(self, agency_name: str):
        self.agency_name = agency_name
        self.posts: Dict[str, SocialPost] = {}
        self.accounts: Dict[str, PlatformAccount] = {}
        logger.info(f"Social Media Manager initialized for {agency_name}")
    
    def register_account(
        self,
        platform: Platform,
        handle: str,
        followers: int = 0
    ) -> PlatformAccount:
        """Connect a new social platform handle to the system."""
        acc = PlatformAccount(
            id=f"ACC-{uuid.uuid4().hex[:6].upper()}",
            platform=platform, handle=handle, followers=followers
        )
        self.accounts[acc.id] = acc
        logger.info(f"Account registered: @{handle} on {platform.value}")
        return acc
    
    def draft_post(
        self,
        platform: Platform,
        p_type: PostType,
        caption: str
    ) -> SocialPost:
        """Initialize a new content draft."""
        post = SocialPost(
            id=f"PST-{uuid.uuid4().hex[:6].upper()}",
            platform=platform, post_type=p_type, caption=caption
        )
        self.posts[post.id] = post
        logger.info(f"Post drafted for {platform.value}: {caption[:30]}...")
        return post
    
    def get_stats(self) -> Dict[str, Any]:
        """Aggregate cross-platform audience and engagement metrics."""
        total_f = sum(a.followers for a in self.accounts.values())
        done = [p for p in self.posts.values() if p.status == PostStatus.PUBLISHED]
        total_eng = sum(p.likes + p.comments + p.shares for p in done)
        
        return {
            "account_count": len(self.accounts),
            "total_followers": total_f,
            "total_engagement": total_eng,
            "published_count": len(done)
        }
    
    def format_dashboard(self) -> str:
        """Render the Social Media Management Dashboard."""
        s = self.get_stats()
        
        lines = [
            "╔═══════════════════════════════════════════════════════════╗",
            f"║  📱 SOCIAL MEDIA DASHBOARD{' ' * 32}║",
            f"║  {s['account_count']} accounts │ {s['total_followers']:,} followers │ {s['total_engagement']:,} engagement{' ' * 6}║",
            "╠═══════════════════════════════════════════════════════════╣",
            "║  📊 CONNECTED ACCOUNTS                                    ║",
            "║  ───────────────────────────────────────────────────────  ║",
        ]
        
        p_icons = {"instagram": "📸", "linkedin": "💼", "facebook": "📘", "tiktok": "🎵"}
        
        for acc in list(self.accounts.values())[:4]:
            icon = p_icons.get(acc.platform.value, "📱")
            lines.append(f"║  {icon} @{acc.handle[:15]:<15} │ {acc.followers:>10,} followers {' ' * 13} ║")
            
        lines.extend([
            "║                                                           ║",
            "║  📝 RECENT CONTENT QUEUE                                  ║",
            "║  ───────────────────────────────────────────────────────  ║",
        ])
        
        for p in list(self.posts.values())[-3:]:
            st_icon = "✅" if p.status == PostStatus.PUBLISHED else "⏰"
            lines.append(f"║  {st_icon} {p.platform.value[:10]:<10} │ {p.caption[:30]:<30} │ {p.likes:>5} L ║")
            
        lines.extend([
            "║                                                           ║",
            "║  [➕ New Post]  [📅 Schedule]  [📊 Insights]  [⚙️ Setup]  ║",
            "╠═══════════════════════════════════════════════════════════╣",
            f"║  🏯 {self.agency_name[:40]:<40} - Social Win!      ║",
            "╚═══════════════════════════════════════════════════════════╝",
        ])
        return "\n".join(lines)


# Example usage
if __name__ == "__main__":
    print("📱 Initializing Social System...")
    print("=" * 60)
    
    try:
        smm_system = SocialMediaManager("Saigon Digital Hub")
        # Seed
        smm_system.register_account(Platform.INSTAGRAM, "saigon_digital", 15000)
        p = smm_system.draft_post(Platform.INSTAGRAM, PostType.REEL, "Refactoring Core!")
        p.status = PostStatus.PUBLISHED
        p.likes = 150
        
        print("\n" + smm_system.format_dashboard())
        
    except Exception as e:
        logger.error(f"SMM Error: {e}")
