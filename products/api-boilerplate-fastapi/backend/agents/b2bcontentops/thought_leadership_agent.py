"""
Thought Leadership Agent - B2B Content & Insights
Manages whitepapers, reports, and gated content.
"""

from dataclasses import dataclass
from typing import Dict
from datetime import datetime
from enum import Enum
import random


class ContentType(Enum):
    WHITEPAPER = "whitepaper"
    EBOOK = "ebook"
    REPORT = "report"
    GUIDE = "guide"
    RESEARCH = "research"


class ContentStatus(Enum):
    DRAFT = "draft"
    REVIEW = "review"
    PUBLISHED = "published"
    ARCHIVED = "archived"


@dataclass
class ThoughtLeadershipContent:
    """B2B thought leadership content"""
    id: str
    title: str
    content_type: ContentType
    topic: str
    status: ContentStatus = ContentStatus.DRAFT
    author: str = ""
    downloads: int = 0
    leads_generated: int = 0
    gated: bool = True
    created_at: datetime = None
    published_at: datetime = None

    def __post_init__(self):
        if self.created_at is None:
            self.created_at = datetime.now()

    @property
    def conversion_rate(self) -> float:
        return (self.leads_generated / self.downloads * 100) if self.downloads > 0 else 0


class ThoughtLeadershipAgent:
    """
    Thought Leadership Agent - Nội dung B2B
    
    Responsibilities:
    - Whitepapers
    - Industry reports
    - Expert insights
    - Gated content
    """

    def __init__(self):
        self.name = "Thought Leadership"
        self.status = "ready"
        self.content: Dict[str, ThoughtLeadershipContent] = {}

    def create_content(
        self,
        title: str,
        content_type: ContentType,
        topic: str,
        author: str = "",
        gated: bool = True
    ) -> ThoughtLeadershipContent:
        """Create thought leadership content"""
        content_id = f"tl_{random.randint(100,999)}"

        content = ThoughtLeadershipContent(
            id=content_id,
            title=title,
            content_type=content_type,
            topic=topic,
            author=author,
            gated=gated
        )

        self.content[content_id] = content
        return content

    def publish(self, content_id: str) -> ThoughtLeadershipContent:
        """Publish content"""
        if content_id not in self.content:
            raise ValueError(f"Content not found: {content_id}")

        self.content[content_id].status = ContentStatus.PUBLISHED
        self.content[content_id].published_at = datetime.now()
        return self.content[content_id]

    def record_download(self, content_id: str, is_lead: bool = True) -> ThoughtLeadershipContent:
        """Record download"""
        if content_id not in self.content:
            raise ValueError(f"Content not found: {content_id}")

        self.content[content_id].downloads += 1
        if is_lead:
            self.content[content_id].leads_generated += 1

        return self.content[content_id]

    def get_stats(self) -> Dict:
        """Get content statistics"""
        contents = list(self.content.values())
        published = [c for c in contents if c.status == ContentStatus.PUBLISHED]

        return {
            "total_content": len(contents),
            "published": len(published),
            "total_downloads": sum(c.downloads for c in contents),
            "total_leads": sum(c.leads_generated for c in contents),
            "avg_conversion": sum(c.conversion_rate for c in published) / len(published) if published else 0
        }


# Demo
if __name__ == "__main__":
    agent = ThoughtLeadershipAgent()

    print("📚 Thought Leadership Agent Demo\n")

    # Create content
    c1 = agent.create_content(
        "2024 State of B2B Marketing",
        ContentType.REPORT,
        "Marketing Trends",
        author="Marketing Team"
    )

    c2 = agent.create_content(
        "Ultimate Guide to ABM",
        ContentType.GUIDE,
        "Account-Based Marketing"
    )

    print(f"📋 Content: {c1.title}")
    print(f"   Type: {c1.content_type.value}")
    print(f"   Topic: {c1.topic}")
    print(f"   Gated: {c1.gated}")

    # Publish and generate leads
    agent.publish(c1.id)
    for _ in range(50):
        agent.record_download(c1.id, is_lead=random.random() > 0.3)

    print("\n📈 Performance:")
    print(f"   Downloads: {c1.downloads}")
    print(f"   Leads: {c1.leads_generated}")
    print(f"   Conversion: {c1.conversion_rate:.0f}%")
