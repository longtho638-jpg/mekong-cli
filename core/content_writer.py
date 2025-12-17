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

from typing import Dict, List, Any, Optional
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from enum import Enum
import uuid


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
    """Content status."""
    DRAFT = "draft"
    WRITING = "writing"
    EDITING = "editing"
    REVIEW = "review"
    APPROVED = "approved"
    PUBLISHED = "published"


@dataclass
class ContentPiece:
    """A content piece."""
    id: str
    title: str
    client: str
    content_type: ContentType
    word_count: int
    status: ContentStatus = ContentStatus.DRAFT
    writer: str = ""
    keywords: List[str] = field(default_factory=list)
    deadline: datetime = field(default_factory=lambda: datetime.now() + timedelta(days=5))


class ContentWriter:
    """
    Content Writer System.
    
    Professional writing workflow.
    """
    
    def __init__(self, agency_name: str):
        self.agency_name = agency_name
        self.content: Dict[str, ContentPiece] = {}
    
    def create_content(
        self,
        title: str,
        client: str,
        content_type: ContentType,
        word_count: int,
        writer: str = "",
        keywords: List[str] = None,
        due_days: int = 5
    ) -> ContentPiece:
        """Create a content piece."""
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
        return piece
    
    def update_status(self, piece: ContentPiece, status: ContentStatus):
        """Update content status."""
        piece.status = status
    
    def get_in_progress(self) -> List[ContentPiece]:
        """Get in-progress content."""
        return [c for c in self.content.values() 
                if c.status not in [ContentStatus.APPROVED, ContentStatus.PUBLISHED]]
    
    def format_dashboard(self) -> str:
        """Format content writer dashboard."""
        in_progress = len(self.get_in_progress())
        total_words = sum(c.word_count for c in self.content.values())
        
        lines = [
            "╔═══════════════════════════════════════════════════════════╗",
            f"║  ✍️ CONTENT WRITER                                        ║",
            f"║  {len(self.content)} pieces │ {in_progress} in progress │ {total_words:,} words    ║",
            "╠═══════════════════════════════════════════════════════════╣",
            "║  📝 CONTENT QUEUE                                         ║",
            "║  ─────────────────────────────────────────────────────── ║",
        ]
        
        type_icons = {"blog_post": "📝", "website_copy": "🌐", "social_post": "📱", 
                     "email": "📧", "landing_page": "📄", "newsletter": "📰", "case_study": "📊"}
        status_icons = {"draft": "📋", "writing": "✏️", "editing": "🔧", 
                       "review": "👁️", "approved": "✅", "published": "🚀"}
        
        for piece in list(self.content.values())[:5]:
            t_icon = type_icons.get(piece.content_type.value, "📝")
            s_icon = status_icons.get(piece.status.value, "⚪")
            
            lines.append(f"║  {s_icon} {t_icon} {piece.title[:20]:<20} │ {piece.word_count:>5} words │ {piece.client[:8]:<8}  ║")
        
        lines.extend([
            "║                                                           ║",
            "║  📊 BY TYPE                                               ║",
            "║  ─────────────────────────────────────────────────────── ║",
        ])
        
        for ctype in list(ContentType)[:4]:
            count = sum(1 for c in self.content.values() if c.content_type == ctype)
            words = sum(c.word_count for c in self.content.values() if c.content_type == ctype)
            icon = type_icons.get(ctype.value, "📝")
            lines.append(f"║    {icon} {ctype.value.replace('_', ' ').title():<15} │ {count:>2} │ {words:>6} words  ║")
        
        lines.extend([
            "║                                                           ║",
            "║  [✏️ Write]  [🔧 Edit]  [📊 Analytics]                    ║",
            "╠═══════════════════════════════════════════════════════════╣",
            f"║  🏯 {self.agency_name} - Words that convert!              ║",
            "╚═══════════════════════════════════════════════════════════╝",
        ])
        
        return "\n".join(lines)


# Example usage
if __name__ == "__main__":
    writer = ContentWriter("Saigon Digital Hub")
    
    print("✍️ Content Writer")
    print("=" * 60)
    print()
    
    writer.create_content("10 Real Estate Tips", "Sunrise Realty", ContentType.BLOG_POST, 1500, "Sarah", ["real estate", "tips"])
    writer.create_content("About Us Page", "Coffee Lab", ContentType.WEBSITE_COPY, 500, "Mike")
    writer.create_content("Product Launch Email", "Tech Startup", ContentType.EMAIL, 300, "Sarah")
    writer.create_content("Instagram Captions Pack", "Fashion Brand", ContentType.SOCIAL_POST, 200, "Mike")
    
    # Update statuses
    writer.update_status(list(writer.content.values())[0], ContentStatus.WRITING)
    writer.update_status(list(writer.content.values())[1], ContentStatus.REVIEW)
    
    print(writer.format_dashboard())
