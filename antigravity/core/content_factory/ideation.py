"""
Content Ideation Logic.
"""
import logging
import random
from typing import List

from .models import ContentIdea, ContentType

logger = logging.getLogger(__name__)


class ContentIdeator:
    """Brainstorms new content concepts using specialized templates."""

    def __init__(self, niche: str = "Digital Marketing"):
        self.niche = niche

    def generate_ideas(self, count: int = 10) -> List[ContentIdea]:
        """Brainstorms new content concepts using specialized templates."""
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
                "Sự thật dark về {niche} 🤫",
                "Tips {niche} cực xịn cho người bận rộn",
            ],
            ContentType.ZALO: [
                "📢 [TIN NHANH] Cập nhật thị trường {niche}",
                "💡 Mẹo nhỏ {niche} hôm nay cho bà con",
                "🎁 Quà tặng đặc biệt: Cẩm nang {niche}",
                "🔥 Cơ hội cuối cùng để sở hữu gói {niche}",
            ],
        }

        new_ideas = []
        for _ in range(count):
            c_type = random.choice(
                [ContentType.FACEBOOK, ContentType.TIKTOK, ContentType.ZALO, ContentType.BLOG]
            )
            template_list = templates.get(c_type, templates[ContentType.FACEBOOK])

            title = random.choice(template_list).format(niche=self.niche)
            idea = ContentIdea(
                title=title,
                topic=self.niche,
                content_type=c_type,
                virality_score=random.randint(60, 98),
            )
            new_ideas.append(idea)

        # Prioritize by predicted virality
        new_ideas.sort(key=lambda x: x.virality_score, reverse=True)
        logger.info(f"Generated {count} new content ideas for niche: {self.niche}")
        return new_ideas
