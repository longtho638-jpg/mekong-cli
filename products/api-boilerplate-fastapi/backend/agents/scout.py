"""
Scout Agent - Intelligence & Research
Collects market trends, competitor data, and content ideas.
"""

from dataclasses import dataclass
from typing import List, Optional
from datetime import datetime
import random

@dataclass
class TrendItem:
    """Trending topic or signal"""
    title: str
    source: str
    score: float  # 0-100 relevance
    url: Optional[str] = None
    timestamp: datetime = None

    def __post_init__(self):
        if self.timestamp is None:
            self.timestamp = datetime.now()


@dataclass
class IntelBrief:
    """Intelligence brief from Scout Agent"""
    topic: str
    trends: List[TrendItem]
    competitors: List[str]
    content_angles: List[str]
    generated_at: datetime = None

    def __post_init__(self):
        if self.generated_at is None:
            self.generated_at = datetime.now()


class ScoutAgent:
    """
    Scout Agent - Thu thập thông tin thị trường
    
    Responsibilities:
    - Web scraping (Product Hunt, X, Reddit)
    - Competitor monitoring
    - Trend analysis
    - Content idea generation
    """

    # Sample trending topics for demo
    SAMPLE_TRENDS = [
        ("AI Agent frameworks", "Product Hunt", 95),
        ("Local-first apps", "Hacker News", 88),
        ("Vietnamese startup ecosystem", "TechInAsia", 82),
        ("No-code automation tools", "Twitter/X", 79),
        ("Mekong Delta agritech", "VnExpress", 75),
    ]

    CONTENT_PILLARS = [
        "Code-to-Cashflow",
        "Solopreneur Mindset",
        "Local AI",
        "Automation Hacks",
        "Agency Life"
    ]

    def __init__(self):
        self.name = "Scout"
        self.status = "ready"

    def research(self, topic: str, depth: str = "quick") -> IntelBrief:
        """
        Research a topic and generate intelligence brief.
        
        Args:
            topic: Topic to research
            depth: "quick" (5 min) or "deep" (30 min)
        """
        # Simulate research (in production: use web scraping)
        trends = []
        for title, source, score in self.SAMPLE_TRENDS:
            if topic.lower() in title.lower() or random.random() > 0.5:
                trends.append(TrendItem(
                    title=title,
                    source=source,
                    score=score + random.randint(-10, 10)
                ))

        # Generate content angles based on pillars
        angles = []
        for pillar in random.sample(self.CONTENT_PILLARS, 3):
            angles.append(f"{pillar}: {topic} angle")

        return IntelBrief(
            topic=topic,
            trends=sorted(trends, key=lambda x: x.score, reverse=True)[:5],
            competitors=["Competitor A", "Competitor B"],
            content_angles=angles
        )

    def get_trending(self, count: int = 5) -> List[TrendItem]:
        """Get current trending topics"""
        return [
            TrendItem(title=t[0], source=t[1], score=t[2])
            for t in self.SAMPLE_TRENDS[:count]
        ]

    def generate_ideas(self, pillar: str, count: int = 10) -> List[str]:
        """Generate content ideas for a pillar"""
        ideas = {
            "Code-to-Cashflow": [
                "Làm sao tôi sa thải chính mình nhờ Mekong-CLI?",
                "Setup Supabase làm CRM miễn phí trọn đời",
                "Google Cloud Run vs AWS: Tại sao chọn Google?",
                "Review kiến trúc Hybrid Agentic",
                "Tiết kiệm $500/tháng tiền API nhờ Router",
            ],
            "Solopreneur Mindset": [
                "Agency 1 người là mô hình bền vững nhất",
                "Đừng bán thời gian, hãy bán sản phẩm",
                "Doanh thu $5k, Chi phí $50",
                "4-Hour Workweek thực tế",
                "Tư duy Hacker: Tìm đường tắt",
            ],
            "Local AI": [
                "Vibe Tuning là gì?",
                "Demo: ChatGPT vs Mekong-CLI giọng miền Tây",
                "Dạy AI hiểu tiếng lóng Việt",
                "AI viết content bán Nem Lai Vung",
                "Phân tích giá nông sản bằng AI",
            ],
        }
        return ideas.get(pillar, ["Idea 1", "Idea 2"])[:count]


# Demo
if __name__ == "__main__":
    scout = ScoutAgent()

    print("🔍 Scout Agent Demo\n")

    # Get trending
    print("📈 Trending Topics:")
    for trend in scout.get_trending(3):
        print(f"   • {trend.title} ({trend.source}) - {trend.score}%")

    # Research
    print("\n📋 Intel Brief for 'AI automation':")
    brief = scout.research("AI automation")
    print(f"   Topic: {brief.topic}")
    print(f"   Trends: {len(brief.trends)}")
    print(f"   Angles: {brief.content_angles}")

    # Ideas
    print("\n💡 Content Ideas (Code-to-Cashflow):")
    for idea in scout.generate_ideas("Code-to-Cashflow", 3):
        print(f"   • {idea}")
