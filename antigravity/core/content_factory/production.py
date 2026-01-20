"""
Content Production Logic.
"""
import logging

from .models import ContentIdea, ContentPiece, ContentType

logger = logging.getLogger(__name__)


class ContentProducer:
    """Hydrates concepts into full content pieces."""

    def __init__(self, niche: str = "Digital Marketing"):
        self.niche = niche

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
            f"✨ Liên hệ ngay để được tư vấn {self.niche} chuyên sâu!",
        ]

        if idea.content_type == ContentType.TIKTOK:
            body_parts.append("\n\n#fyp #viral #xuhuong #agencyos")
        elif idea.content_type == ContentType.FACEBOOK:
            body_parts.append(f"\n\n#marketing #{self.niche.replace(' ', '')}")

        piece = ContentPiece(
            title=idea.title,
            body="".join(body_parts),
            content_type=idea.content_type,
            virality_score=idea.virality_score,
        )

        logger.debug(f"Content piece drafted: {piece.title}")
        return piece
