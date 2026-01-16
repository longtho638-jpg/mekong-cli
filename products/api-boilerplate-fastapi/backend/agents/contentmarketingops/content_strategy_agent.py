"""
Content Strategy Agent - Content Planning & Analytics
Manages content strategy, topic clusters, and performance.
"""

from dataclasses import dataclass, field
from typing import List, Dict
from datetime import datetime, date
from enum import Enum
import random


class ContentFormat(Enum):
    BLOG = "blog"
    VIDEO = "video"
    INFOGRAPHIC = "infographic"
    PODCAST = "podcast"
    EBOOK = "ebook"
    WEBINAR = "webinar"


class ContentStage(Enum):
    IDEATION = "ideation"
    PRODUCTION = "production"
    REVIEW = "review"
    PUBLISHED = "published"


@dataclass
class ContentPiece:
    """Content piece in strategy"""
    id: str
    title: str
    format: ContentFormat
    topic_cluster: str
    stage: ContentStage = ContentStage.IDEATION
    target_keywords: List[str] = field(default_factory=list)
    publish_date: date = None
    traffic: int = 0
    leads: int = 0
    content_score: float = 0

    @property
    def conversion_rate(self) -> float:
        return (self.leads / self.traffic * 100) if self.traffic > 0 else 0


@dataclass
class TopicCluster:
    """Topic cluster"""
    id: str
    name: str
    pillar_page: str
    cluster_pages: List[str] = field(default_factory=list)
    total_traffic: int = 0


class ContentStrategyAgent:
    """
    Content Strategy Agent - Chiến lược Nội dung
    
    Responsibilities:
    - Content planning
    - Topic clusters
    - Performance analytics
    - Content scoring
    """

    def __init__(self):
        self.name = "Content Strategy"
        self.status = "ready"
        self.content: Dict[str, ContentPiece] = {}
        self.clusters: Dict[str, TopicCluster] = {}

    def create_cluster(self, name: str, pillar_page: str) -> TopicCluster:
        """Create topic cluster"""
        cluster_id = f"cluster_{random.randint(100,999)}"

        cluster = TopicCluster(
            id=cluster_id,
            name=name,
            pillar_page=pillar_page
        )

        self.clusters[cluster_id] = cluster
        return cluster

    def add_content(
        self,
        title: str,
        content_format: ContentFormat,
        topic_cluster: str,
        target_keywords: List[str] = None,
        publish_date: date = None
    ) -> ContentPiece:
        """Add content to strategy"""
        content_id = f"content_{int(datetime.now().timestamp())}_{random.randint(100,999)}"

        content = ContentPiece(
            id=content_id,
            title=title,
            format=content_format,
            topic_cluster=topic_cluster,
            target_keywords=target_keywords or [],
            publish_date=publish_date
        )

        self.content[content_id] = content
        return content

    def update_stage(self, content_id: str, stage: ContentStage) -> ContentPiece:
        """Update content stage"""
        if content_id not in self.content:
            raise ValueError(f"Content not found: {content_id}")

        self.content[content_id].stage = stage
        return self.content[content_id]

    def record_performance(
        self,
        content_id: str,
        traffic: int,
        leads: int = 0,
        content_score: float = 0
    ) -> ContentPiece:
        """Record content performance"""
        if content_id not in self.content:
            raise ValueError(f"Content not found: {content_id}")

        content = self.content[content_id]
        content.traffic = traffic
        content.leads = leads
        content.content_score = content_score

        return content

    def get_by_stage(self, stage: ContentStage) -> List[ContentPiece]:
        """Get content by stage"""
        return [c for c in self.content.values() if c.stage == stage]

    def get_stats(self) -> Dict:
        """Get content strategy statistics"""
        content = list(self.content.values())
        published = self.get_by_stage(ContentStage.PUBLISHED)

        return {
            "total_content": len(content),
            "published": len(published),
            "in_production": len(self.get_by_stage(ContentStage.PRODUCTION)),
            "total_traffic": sum(c.traffic for c in published),
            "total_leads": sum(c.leads for c in published),
            "avg_score": sum(c.content_score for c in published) / len(published) if published else 0,
            "clusters": len(self.clusters)
        }


# Demo
if __name__ == "__main__":
    agent = ContentStrategyAgent()

    print("📈 Content Strategy Agent Demo\n")

    # Create cluster
    cluster = agent.create_cluster("Content Marketing", "/guides/content-marketing")

    print(f"📚 Cluster: {cluster.name}")
    print(f"   Pillar: {cluster.pillar_page}")

    # Add content
    c1 = agent.add_content(
        "Ultimate Guide to Content Marketing",
        ContentFormat.BLOG,
        cluster.name,
        ["content marketing", "content strategy"],
        date.today()
    )
    c2 = agent.add_content(
        "Content Marketing Tutorial",
        ContentFormat.VIDEO,
        cluster.name,
        ["content marketing tutorial"]
    )

    print(f"\n📝 Content: {c1.title}")
    print(f"   Format: {c1.format.value}")

    # Update and track
    agent.update_stage(c1.id, ContentStage.PUBLISHED)
    agent.record_performance(c1.id, traffic=5000, leads=150, content_score=85)

    print("\n📊 Performance:")
    print(f"   Traffic: {c1.traffic}")
    print(f"   Leads: {c1.leads}")
    print(f"   CVR: {c1.conversion_rate:.1f}%")
    print(f"   Score: {c1.content_score}")
