"""
✍️ Content Writer - Professional Writing
===========================================

Create compelling written content.
Words that convert!

Roles:
- Blog posts
- Website copy
- Social captions
- Email content
"""

import uuid
import logging
from typing import Dict, List, Any, Optional
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from enum import Enum

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class ContentType(Enum):
    """Content types."""
    BLOG_POST = "blog_post"
    WEBSITE_COPY = "website_copy"
    SOCIAL_POST = "social_post"
    EMAIL = "email"
    LANDING_PAGE = "landing_page"
    NEWSLETTER = "newsletter"
    CASE_STUDY = "case_study"


class ContentStatus(Enum):
    """Content status lifecycle."""
    DRAFT = "draft"
    WRITING = "writing"
    EDITING = "editing"
    REVIEW = "review"
    APPROVED = "approved"
    PUBLISHED = "published"


@dataclass
class ContentPiece:
    """A content piece record entity."""
    id: str
    title: str
    client: str
    content_type: ContentType
    word_count: int
    status: ContentStatus = ContentStatus.DRAFT
    writer: str = ""
    keywords: List[str] = field(default_factory=list)
    deadline: datetime = field(default_factory=lambda: datetime.now() + timedelta(days=5))

    def __post_init__(self):
        if self.word_count < 0:
            raise ValueError("Word count cannot be negative")


class ContentWriter:
    """
    Content Writer System.
    
    Professional writing workflow for agency content production.
    """
    
    def __init__(self, agency_name: str):
        self.agency_name = agency_name
        self.content: Dict[str, ContentPiece] = {}
        logger.info(f"Content Writer system initialized for {agency_name}")
    
    def create_content(
        self,
        title: str,
        client: str,
        content_type: ContentType,
        word_count: int,
        writer: str = "",
        keywords: Optional[List[str]] = None,
        due_days: int = 5
    ) -> ContentPiece:
        """Initialize a new content piece in the queue."""
        if not title or not client:
            raise ValueError("Title and client name are required")

        piece = ContentPiece(
            id=f"CNT-{uuid.uuid4().hex[:6].upper()}",
            title=title,
            client=client,
            content_type=content_type,
            word_count=word_count,
            writer=writer,
            keywords=keywords or [],
            deadline=datetime.now() + timedelta(days=due_days)
        )
        self.content[piece.id] = piece
        logger.info(f"Content piece created: {title} ({content_type.value})")
        return piece
    
    def update_status(self, piece_id: str, status: ContentStatus) -> bool:
        """Advance the status of a content piece."""
        if piece_id not in self.content:
            logger.error(f"Piece ID {piece_id} not found")
            return False
            
        piece = self.content[piece_id]
        old_status = piece.status
        piece.status = status
        logger.info(f"Piece '{piece.title}' status: {old_status.value} -> {status.value}")
        return True
    
    def get_queue_stats(self) -> Dict[str, Any]:
        """Aggregate stats for the current writing queue."""
        in_progress = [c for c in self.content.values() 
                      if c.status not in [ContentStatus.APPROVED, ContentStatus.PUBLISHED]]
        total_words = sum(c.word_count for c in self.content.values())
        
        return {
            "total_pieces": len(self.content),
            "in_progress_count": len(in_progress),
            "total_word_count": total_words
        }
    
    def format_dashboard(self) -> str:
        """Render the Content Writer Dashboard."""
        stats = self.get_queue_stats()
        
        lines = [
            "╔═══════════════════════════════════════════════════════════╗",
            f"║  ✍️ CONTENT WRITER DASHBOARD{' ' * 31}║",
            f"║  {stats['total_pieces']} pieces │ {stats['in_progress_count']} in progress │ {stats['total_word_count']:,} words{' ' * 13}║",
            "╠═══════════════════════════════════════════════════════════╣",
            "║  📝 CURRENT QUEUE                                         ║",
            "║  ───────────────────────────────────────────────────────  ║",
        ]
        
        type_icons = {
            ContentType.BLOG_POST: "📝", ContentType.WEBSITE_COPY: "🌐", 
            ContentType.SOCIAL_POST: "📱", ContentType.EMAIL: "📧", 
            ContentType.LANDING_PAGE: "📄", ContentType.NEWSLETTER: "📰", 
            ContentType.CASE_STUDY: "📊"
        }
        status_icons = {
            ContentStatus.DRAFT: "📋", ContentStatus.WRITING: "✏️", 
            ContentStatus.EDITING: "🔧", ContentStatus.REVIEW: "👁️", 
            ContentStatus.APPROVED: "✅", ContentStatus.PUBLISHED: "🚀"
        }
        
        # Display latest 5 pieces
        sorted_content = sorted(self.content.values(), key=lambda x: x.deadline)[:5]
        for p in sorted_content:
            t_icon = type_icons.get(p.content_type, "📝")
            s_icon = status_icons.get(p.status, "⚪")
            title_display = (p.title[:20] + '..') if len(p.title) > 22 else p.title
            
            lines.append(f"║  {s_icon} {t_icon} {title_display:<22} │ {p.word_count:>5} words │ {p.client[:8]:<8}  ║")
        
        lines.extend([
            "║                                                           ║",
            "║  [✏️ Write]  [🔧 Edit]  [📊 Workflow]  [⚙️ Settings]      ║",
            "╠═══════════════════════════════════════════════════════════╣",
            f"║  🏯 {self.agency_name[:40]:<40} - Words That Convert! ║",
            "╚═══════════════════════════════════════════════════════════╝",
        ])
        
        return "\n".join(lines)


# Example usage
if __name__ == "__main__":
    print("✍️ Initializing Content Writer...")
    print("=" * 60)
    
    try:
        writer_system = ContentWriter("Saigon Digital Hub")
        
        # Create pieces
        p1 = writer_system.create_content("10 Real Estate Tips", "Sunrise", ContentType.BLOG_POST, 1500)
        p2 = writer_system.create_content("Landing Page v1", "CoffeeCo", ContentType.LANDING_PAGE, 800)
        
        # Progress status
        writer_system.update_status(p1.id, ContentStatus.WRITING)
        writer_system.update_status(p2.id, ContentStatus.REVIEW)
        
        print("\n" + writer_system.format_dashboard())
        
    except Exception as e:
        logger.error(f"System Error: {e}")
