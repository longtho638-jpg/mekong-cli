"""
🎨 ContentFactory Models
========================

Data models and enums for the Content Factory system.
"""

from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from typing import Any, Dict, List, Optional


class ContentType(Enum):
    """Supported distribution channels."""

    BLOG = "blog"
    FACEBOOK = "facebook"
    TIKTOK = "tiktok"
    YOUTUBE = "youtube"
    ZALO = "zalo"
    INSTAGRAM = "instagram"
    EMAIL = "email"
    LINKEDIN = "linkedin"


class ContentStatus(Enum):
    """Workflow states for content pieces."""

    IDEA = "idea"
    DRAFT = "draft"
    REVIEW = "review"
    PUBLISHED = "published"
    ARCHIVED = "archived"


@dataclass
class ContentIdea:
    """A conceptual seed for a future content piece."""

    title: str
    topic: str = ""
    content_type: ContentType = ContentType.FACEBOOK
    hook: str = ""
    keywords: List[str] = field(default_factory=list)
    virality_score: int = 0  # 0-100 predicted performance

    def __str__(self) -> str:
        return f"[{self.content_type.value.upper()}] {self.title} (Score: {self.virality_score})"


@dataclass
class ContentPiece:
    """A drafted or completed content artifact."""

    title: str
    body: str = ""
    content_type: ContentType = ContentType.FACEBOOK
    status: ContentStatus = ContentStatus.DRAFT
    virality_score: int = 0
    created_at: datetime = field(default_factory=datetime.now)
    published_at: Optional[datetime] = None
    metadata: Dict[str, Any] = field(default_factory=dict)
