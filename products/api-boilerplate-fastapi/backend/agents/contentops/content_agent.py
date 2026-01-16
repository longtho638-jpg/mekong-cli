"""
Content Agent - Content Creation & Ideation
Manages content drafts, ideas, and assets.
"""

from dataclasses import dataclass, field
from typing import List, Dict
from datetime import datetime
from enum import Enum
import random


class ContentStatus(Enum):
    IDEA = "idea"
    DRAFT = "draft"
    IN_REVIEW = "in_review"
    APPROVED = "approved"
    PUBLISHED = "published"
    ARCHIVED = "archived"


class ContentType(Enum):
    BLOG = "blog"
    VIDEO = "video"
    SOCIAL = "social"
    EMAIL = "email"
    PODCAST = "podcast"
    INFOGRAPHIC = "infographic"


@dataclass
class Content:
    """Content piece"""
    id: str
    title: str
    content_type: ContentType
    status: ContentStatus = ContentStatus.IDEA
    author: str = ""
    description: str = ""
    tags: List[str] = field(default_factory=list)
    version: int = 1
    created_at: datetime = None
    updated_at: datetime = None
    
    def __post_init__(self):
        if self.created_at is None:
            self.created_at = datetime.now()
        self.updated_at = self.created_at


class ContentAgent:
    """
    Content Agent - Quản lý Nội dung
    
    Responsibilities:
    - Content ideation
    - Draft management
    - Asset library
    - Version control
    """
    
    def __init__(self):
        self.name = "Content"
        self.status = "ready"
        self.content: Dict[str, Content] = {}
        
    def create_content(
        self,
        title: str,
        content_type: ContentType,
        author: str,
        description: str = "",
        tags: List[str] = None
    ) -> Content:
        """Create content piece"""
        content_id = f"content_{int(datetime.now().timestamp())}_{random.randint(100,999)}"
        
        content = Content(
            id=content_id,
            title=title,
            content_type=content_type,
            author=author,
            description=description,
            tags=tags or []
        )
        
        self.content[content_id] = content
        return content
    
    def update_status(self, content_id: str, status: ContentStatus) -> Content:
        """Update content status"""
        if content_id not in self.content:
            raise ValueError(f"Content not found: {content_id}")
            
        content = self.content[content_id]
        content.status = status
        content.updated_at = datetime.now()
        
        return content
    
    def create_version(self, content_id: str) -> Content:
        """Create new version"""
        if content_id not in self.content:
            raise ValueError(f"Content not found: {content_id}")
            
        content = self.content[content_id]
        content.version += 1
        content.updated_at = datetime.now()
        
        return content
    
    def get_by_status(self, status: ContentStatus) -> List[Content]:
        """Get content by status"""
        return [c for c in self.content.values() if c.status == status]
    
    def get_stats(self) -> Dict:
        """Get content statistics"""
        content = list(self.content.values())
        
        return {
            "total_content": len(content),
            "ideas": len(self.get_by_status(ContentStatus.IDEA)),
            "drafts": len(self.get_by_status(ContentStatus.DRAFT)),
            "published": len(self.get_by_status(ContentStatus.PUBLISHED)),
            "by_type": {t.value: len([c for c in content if c.content_type == t]) for t in ContentType}
        }


# Demo
if __name__ == "__main__":
    agent = ContentAgent()
    
    print("🎨 Content Agent Demo\n")
    
    # Create content
    c1 = agent.create_content(
        "10 Tips for Productivity",
        ContentType.BLOG,
        "Nguyen A",
        "Helpful tips for remote workers",
        ["productivity", "work-from-home"]
    )
    c2 = agent.create_content(
        "Product Demo Video",
        ContentType.VIDEO,
        "Tran B",
        "Showcase new features"
    )
    c3 = agent.create_content(
        "Weekly Newsletter",
        ContentType.EMAIL,
        "Le C"
    )
    
    print(f"📝 Content: {c1.title}")
    print(f"   Type: {c1.content_type.value}")
    print(f"   Author: {c1.author}")
    print(f"   Status: {c1.status.value}")
    
    # Progress
    agent.update_status(c1.id, ContentStatus.DRAFT)
    agent.update_status(c1.id, ContentStatus.APPROVED)
    agent.create_version(c1.id)
    
    print(f"\n✅ Updated: {c1.status.value} (v{c1.version})")
    
    # Stats
    print("\n📊 Stats:")
    stats = agent.get_stats()
    print(f"   Total: {stats['total_content']}")
    print(f"   Drafts: {stats['drafts']}")
