"""
Content Writer models and Enums.
"""
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from enum import Enum


class ContentType(Enum):
    BLOG_POST = "blog_post"
    WEBSITE_COPY = "website_copy"
    SOCIAL_POST = "social_post"
    EMAIL = "email"

class ContentStatus(Enum):
    DRAFT = "draft"
    WRITING = "writing"
    EDITING = "editing"
    REVIEW = "review"
    APPROVED = "approved"
    PUBLISHED = "published"

@dataclass
class ContentPiece:
    id: str
    title: str
    client: str
    content_type: ContentType
    word_count: int
    status: ContentStatus = ContentStatus.DRAFT
    writer: str = ""
    deadline: datetime = field(default_factory=lambda: datetime.now() + timedelta(days=5))
