"""
ContentFactory - Mass content production engine.

Features:
- Content idea generation
- Blog post writing
- Social media posts
- Video script creation

🏯 Binh Pháp: Thế Trận (Momentum) - Continuous flow
"""

import random
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from typing import Dict, List, Optional


class ContentType(Enum):
    """Types of content."""

    BLOG = "blog"
    FACEBOOK = "facebook"
    TIKTOK = "tiktok"
    YOUTUBE = "youtube"
    ZALO = "zalo"
    INSTAGRAM = "instagram"
    EMAIL = "email"


class ContentStatus(Enum):
    """Content production status."""

    IDEA = "idea"
    DRAFT = "draft"
    REVIEW = "review"
    PUBLISHED = "published"
    ARCHIVED = "archived"


@dataclass
class ContentIdea:
    """A content idea."""

    title: str
    topic: str = ""
    content_type: ContentType = ContentType.FACEBOOK
    hook: str = ""
    keywords: List[str] = field(default_factory=list)
    score: int = 0  # 0-100 virality score

    def __str__(self) -> str:
        return f"[{self.content_type.value}] {self.title}"


@dataclass
class ContentPiece:
    """A piece of content."""

    title: str
    body: str = ""
    content_type: ContentType = ContentType.FACEBOOK
    status: ContentStatus = ContentStatus.DRAFT
    score: int = 0
    created_at: datetime = field(default_factory=datetime.now)
    published_at: Optional[datetime] = None


class ContentFactory:
    """
    Mass content production engine.

    Example:
        factory = ContentFactory(niche="Nông sản")
        ideas = factory.generate_ideas(30)
        for idea in ideas[:5]:
            content = factory.create_post(idea)
    """

    def __init__(self, niche: str = "Digital Marketing", tone: str = "friendly"):
        self.niche = niche
        self.tone = tone
        self.ideas: List[ContentIdea] = []
        self.content: List[ContentPiece] = []

    def generate_ideas(self, count: int = 30) -> List[ContentIdea]:
        """Generate content ideas for the niche."""
        # Templates by content type
        templates = {
            ContentType.FACEBOOK: [
                "5 bí quyết {niche} mà chuyên gia không bao giờ tiết lộ",
                "Tại sao {niche} của bạn chưa hiệu quả? (và cách khắc phục)",
                "Câu chuyện thành công: Từ 0 đến 100 triệu với {niche}",
                "{niche} 2026: Xu hướng nào sẽ thống trị?",
                "Sai lầm lớn nhất khi làm {niche} (bạn có mắc không?)",
            ],
            ContentType.TIKTOK: [
                "3 giây để hiểu {niche}! #viral #fyp",
                "POV: Bạn làm {niche} đúng cách 😱",
                "Trend {niche} mà ai cũng phải biết!",
                "{niche} speedrun - từ noob đến pro trong 60s",
                "Sự thật dark về {niche} 🤫",
            ],
            ContentType.YOUTUBE: [
                "Hướng dẫn {niche} cho người mới bắt đầu (A-Z)",
                "Review: Top 5 công cụ {niche} tốt nhất 2026",
                "Vlog: 1 ngày làm chuyên gia {niche}",
                "Case study: Tăng doanh thu 300% với {niche}",
                "Q&A: Giải đáp 10 câu hỏi về {niche}",
            ],
            ContentType.BLOG: [
                "Hướng dẫn đầy đủ: {niche} cho doanh nghiệp nhỏ",
                "10 chiến lược {niche} hiệu quả năm 2026",
                "Phân tích: Thị trường {niche} Việt Nam",
                "So sánh: TOP 5 giải pháp {niche}",
                "Checklist: Tối ưu {niche} trong 30 ngày",
            ],
            ContentType.ZALO: [
                "📢 Tin nhanh {niche}!",
                "💡 Mẹo {niche} hôm nay",
                "🎁 Ưu đãi đặc biệt {niche}",
                "📊 Báo cáo {niche} tuần này",
                "🔥 Hot: Xu hướng {niche} mới",
            ],
        }

        ideas = []
        for i in range(count):
            content_type = random.choice(list(ContentType))
            template_list = templates.get(content_type, templates[ContentType.FACEBOOK])
            template = random.choice(template_list)
            title = template.replace("{niche}", self.niche)

            idea = ContentIdea(
                title=title,
                topic=self.niche,
                content_type=content_type,
                score=random.randint(40, 95),
            )
            ideas.append(idea)
            self.ideas.append(idea)

        # Sort by score (highest first)
        ideas.sort(key=lambda x: x.score, reverse=True)
        return ideas

    def create_post(self, idea: ContentIdea) -> ContentPiece:
        """Create a content piece from an idea."""
        # Simple template-based content generation
        intro = f"🔥 {idea.title}\n\n"

        body_templates = {
            ContentType.FACEBOOK: "Xin chào các bạn! Hôm nay mình sẽ chia sẻ về {topic}.\n\n📌 Điểm quan trọng 1\n📌 Điểm quan trọng 2\n📌 Điểm quan trọng 3\n\n✨ Kết luận: Hãy bắt đầu ngay hôm nay!\n\n#agencyos #{niche}",
            ContentType.TIKTOK: "Hook: {title}\n\nMain Points:\n1. Point 1\n2. Point 2\n3. Point 3\n\nCTA: Follow để xem thêm!\n\n#fyp #{niche}",
            ContentType.YOUTUBE: "Script:\n\n[INTRO 0:00-0:30]\n{title}\n\n[MAIN CONTENT 0:30-5:00]\nSection 1: ...\nSection 2: ...\nSection 3: ...\n\n[OUTRO 5:00-5:30]\nLike, Subscribe, và bấm chuông!\n",
            ContentType.BLOG: "# {title}\n\n## Giới thiệu\n...\n\n## Nội dung chính\n...\n\n## Kết luận\n...\n",
            ContentType.ZALO: "{title}\n\n💡 Thông tin hữu ích về {topic}\n\n👉 Liên hệ ngay!\n",
        }

        template = body_templates.get(idea.content_type, body_templates[ContentType.FACEBOOK])
        body = template.format(title=idea.title, topic=idea.topic, niche=self.niche)

        content = ContentPiece(
            title=idea.title, body=intro + body, content_type=idea.content_type, score=idea.score
        )
        self.content.append(content)
        return content

    def get_calendar(self, days: int = 30) -> List[Dict]:
        """Generate content calendar."""
        calendar = []
        ideas = self.ideas[:days] if len(self.ideas) >= days else self.generate_ideas(days)

        for i, idea in enumerate(ideas[:days]):
            date = datetime.now().replace(hour=10) + __import__("datetime").timedelta(days=i)
            calendar.append(
                {
                    "date": date.strftime("%Y-%m-%d"),
                    "time": "10:00",
                    "title": idea.title,
                    "type": idea.content_type.value,
                    "score": idea.score,
                }
            )

        return calendar

    def get_stats(self) -> Dict:
        """Get factory statistics."""
        return {
            "total_ideas": len(self.ideas),
            "total_content": len(self.content),
            "published": len([c for c in self.content if c.status == ContentStatus.PUBLISHED]),
            "avg_score": sum(i.score for i in self.ideas) / len(self.ideas) if self.ideas else 0,
        }
