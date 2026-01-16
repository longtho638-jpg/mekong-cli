"""
🎨 ContentFactory - High-Velocity Production Engine
===================================================

Automates the generation of strategic, localized content for multiple channels.
Bridges the gap between raw data and audience engagement by applying 
specialized templates and regional tones.

Capabilities:
- Viral Idea Ingestion: Niche-specific brainstorming.
- Multi-Platform Mapping: FB, TikTok, Zalo, Blog, Email.
- Script & Copywriting: Template-driven drafting.
- Publishing Orchestration: Calendar scheduling.

Binh Pháp: ⚡ Thế Trận (Momentum) - Maintaining a continuous flow of influence.
"""

import logging
import random
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from typing import List, Dict, Optional, Any
from enum import Enum

# Configure logging
logger = logging.getLogger(__name__)

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


class ContentFactory:
    """
    🎨 Content Production Engine
    
    Powers the 'Content Machine' crew. Turns agency niches into localized 
    stories that drive engagement and leads.
    """

    def __init__(self, niche: str = "Digital Marketing", tone: str = "friendly"):
        self.niche = niche
        self.tone = tone
        self.ideas: List[ContentIdea] = []
        self.content_archive: List[ContentPiece] = []

    def generate_ideas(self, count: int = 10) -> List[ContentIdea]:
        """Brainstorms new content concepts using specialized templates."""
        templates = {
            ContentType.FACEBOOK: [
                "5 bí quyết {niche} mà chuyên gia không bao giờ tiết lộ",
                "Tại sao {niche} của bạn chưa hiệu quả? (và cách khắc phục)",
                "Câu chuyện thành công: Từ 0 đến 100 triệu với {niche}",
                "{niche} 2026: Xu hướng nào sẽ thống trị?",
                "Sai lầm lớn nhất khi làm {niche} (bạn có mắc không?)"
            ],
            ContentType.TIKTOK: [
                "3 giây để hiểu {niche}! #viral #fyp",
                "POV: Bạn làm {niche} đúng cách 😱",
                "Trend {niche} mà ai cũng phải biết!",
                "Sự thật dark về {niche} 🤫",
                "Tips {niche} cực xịn cho người bận rộn"
            ],
            ContentType.ZALO: [
                "📢 [TIN NHANH] Cập nhật thị trường {niche}",
                "💡 Mẹo nhỏ {niche} hôm nay cho bà con",
                "🎁 Quà tặng đặc biệt: Cẩm nang {niche}",
                "🔥 Cơ hội cuối cùng để sở hữu gói {niche}"
            ]
        }

        new_ideas = []
        for _ in range(count):
            c_type = random.choice([ContentType.FACEBOOK, ContentType.TIKTOK, ContentType.ZALO, ContentType.BLOG])
            template_list = templates.get(c_type, templates[ContentType.FACEBOOK])

            title = random.choice(template_list).format(niche=self.niche)
            idea = ContentIdea(
                title=title,
                topic=self.niche,
                content_type=c_type,
                virality_score=random.randint(60, 98)
            )
            new_ideas.append(idea)
            self.ideas.append(idea)

        # Prioritize by predicted virality
        new_ideas.sort(key=lambda x: x.virality_score, reverse=True)
        logger.info(f"Generated {count} new content ideas for niche: {self.niche}")
        return new_ideas

    def create_post(self, idea: ContentIdea) -> ContentPiece:
        """Hydrates a concept into a full content piece based on platform standards."""
        # Visual/Structure templates
        body_parts = [
            f"🔥 {idea.title.upper()} 🔥\n",
            f"📍 Chủ đề: {idea.topic}\n\n",
            "Nội dung đang được tối ưu bởi AI Agent...\n",
            "• Điểm nhấn 1: Giá trị cốt lõi\n",
            "• Điểm nhấn 2: Lợi ích khách hàng\n",
            "• Điểm nhấn 3: Kêu gọi hành động (CTA)\n\n",
            f"✨ Liên hệ ngay để được tư vấn {self.niche} chuyên sâu!"
        ]

        if idea.content_type == ContentType.TIKTOK:
            body_parts.append("\n\n#fyp #viral #xuhuong #agencyos")
        elif idea.content_type == ContentType.FACEBOOK:
            body_parts.append(f"\n\n#marketing #{self.niche.replace(' ', '')}")

        piece = ContentPiece(
            title=idea.title,
            body="".join(body_parts),
            content_type=idea.content_type,
            virality_score=idea.virality_score
        )

        self.content_archive.append(piece)
        logger.debug(f"Content piece drafted: {piece.title}")
        return piece

    def get_calendar(self, days: int = 7) -> List[Dict[str, Any]]:
        """Generates a scheduled posting timeline."""
        calendar = []
        start_date = datetime.now()

        # Ensure we have enough ideas
        if len(self.ideas) < days:
            self.generate_ideas(days - len(self.ideas) + 5)

        for i in range(days):
            idea = self.ideas[i]
            post_date = start_date + timedelta(days=i)
            calendar.append({
                "id": i + 1,
                "date": post_date.strftime("%Y-%m-%d"),
                "time": "09:00 AM",
                "title": idea.title,
                "type": idea.content_type.value,
                "virality": f"{idea.virality_score}%"
            })

        return calendar

    def get_stats(self) -> Dict[str, Any]:
        """Summarizes production performance."""
        return {
            "inventory": {
                "total_ideas": len(self.ideas),
                "drafts_completed": len(self.content_archive)
            },
            "quality": {
                "avg_virality": sum(i.virality_score for i in self.ideas) / len(self.ideas) if self.ideas else 0
            }
        }


# Global Interface
content_factory = ContentFactory()
