"""
🎨 Art Director - Creative Leadership
========================================

Lead creative vision and direction.
Inspiring visual excellence!

Roles:
- Brand direction
- Creative concepts
- Team oversight
- Quality standards
"""

from typing import Dict, List, Any, Optional
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from enum import Enum
import uuid


class ProjectType(Enum):
    """Creative project types."""
    BRANDING = "branding"
    CAMPAIGN = "campaign"
    WEBSITE = "website"
    VIDEO = "video"
    PRINT = "print"


class ReviewStatus(Enum):
    """Creative review status."""
    PENDING = "pending"
    IN_REVIEW = "in_review"
    APPROVED = "approved"
    REVISION = "revision"
    REJECTED = "rejected"


@dataclass
class CreativeBrief:
    """A creative brief."""
    id: str
    project_name: str
    client: str
    project_type: ProjectType
    objectives: List[str]
    target_audience: str
    key_messages: List[str]
    deliverables: List[str]
    deadline: datetime
    status: ReviewStatus = ReviewStatus.PENDING


@dataclass
class CreativeReview:
    """A creative review."""
    id: str
    brief_id: str
    reviewer: str
    status: ReviewStatus
    feedback: str
    reviewed_at: datetime = field(default_factory=datetime.now)


class ArtDirector:
    """
    Art Director System.
    
    Lead creative vision.
    """
    
    def __init__(self, agency_name: str):
        self.agency_name = agency_name
        self.briefs: Dict[str, CreativeBrief] = {}
        self.reviews: List[CreativeReview] = []
    
    def create_brief(
        self,
        project_name: str,
        client: str,
        project_type: ProjectType,
        objectives: List[str],
        target_audience: str,
        key_messages: List[str],
        deliverables: List[str],
        days_to_deadline: int = 14
    ) -> CreativeBrief:
        """Create a creative brief."""
        brief = CreativeBrief(
            id=f"BRF-{uuid.uuid4().hex[:6].upper()}",
            project_name=project_name,
            client=client,
            project_type=project_type,
            objectives=objectives,
            target_audience=target_audience,
            key_messages=key_messages,
            deliverables=deliverables,
            deadline=datetime.now() + timedelta(days=days_to_deadline)
        )
        self.briefs[brief.id] = brief
        return brief
    
    def review_creative(
        self,
        brief: CreativeBrief,
        reviewer: str,
        status: ReviewStatus,
        feedback: str
    ) -> CreativeReview:
        """Review creative work."""
        review = CreativeReview(
            id=f"REV-{uuid.uuid4().hex[:6].upper()}",
            brief_id=brief.id,
            reviewer=reviewer,
            status=status,
            feedback=feedback
        )
        self.reviews.append(review)
        brief.status = status
        return review
    
    def get_by_status(self, status: ReviewStatus) -> List[CreativeBrief]:
        """Get briefs by status."""
        return [b for b in self.briefs.values() if b.status == status]
    
    def format_dashboard(self) -> str:
        """Format art director dashboard."""
        pending = len(self.get_by_status(ReviewStatus.PENDING))
        in_review = len(self.get_by_status(ReviewStatus.IN_REVIEW))
        
        lines = [
            "╔═══════════════════════════════════════════════════════════╗",
            f"║  🎨 ART DIRECTOR                                          ║",
            f"║  {len(self.briefs)} projects │ {pending} pending │ {in_review} in review      ║",
            "╠═══════════════════════════════════════════════════════════╣",
            "║  📋 ACTIVE BRIEFS                                         ║",
            "║  ─────────────────────────────────────────────────────── ║",
        ]
        
        type_icons = {"branding": "🏷️", "campaign": "📢", "website": "🌐", "video": "🎬", "print": "🖨️"}
        status_icons = {"pending": "⏳", "in_review": "👁️", "approved": "✅", "revision": "🔄", "rejected": "❌"}
        
        for brief in list(self.briefs.values())[:5]:
            t_icon = type_icons.get(brief.project_type.value, "📋")
            s_icon = status_icons.get(brief.status.value, "⚪")
            days_left = (brief.deadline - datetime.now()).days
            
            lines.append(f"║  {s_icon} {t_icon} {brief.project_name[:18]:<18} │ {brief.client[:12]:<12} │ {days_left}d  ║")
        
        lines.extend([
            "║                                                           ║",
            "║  📊 BY TYPE                                               ║",
            "║  ─────────────────────────────────────────────────────── ║",
        ])
        
        for ptype in ProjectType:
            count = sum(1 for b in self.briefs.values() if b.project_type == ptype)
            icon = type_icons.get(ptype.value, "📋")
            lines.append(f"║    {icon} {ptype.value.capitalize():<12} │ {count:>2} projects                  ║")
        
        lines.extend([
            "║                                                           ║",
            "║  [📋 New Brief]  [👁️ Review Queue]  [📊 Portfolio]        ║",
            "╠═══════════════════════════════════════════════════════════╣",
            f"║  🏯 {self.agency_name} - Creative excellence!             ║",
            "╚═══════════════════════════════════════════════════════════╝",
        ])
        
        return "\n".join(lines)


# Example usage
if __name__ == "__main__":
    ad = ArtDirector("Saigon Digital Hub")
    
    print("🎨 Art Director")
    print("=" * 60)
    print()
    
    # Create briefs
    ad.create_brief(
        "Brand Refresh", "Sunrise Realty", ProjectType.BRANDING,
        ["Modern look", "Professional feel"],
        "Real estate buyers 30-50",
        ["Trusted partner", "Premium service"],
        ["Logo", "Brand guide", "Templates"], 21
    )
    
    ad.create_brief(
        "Summer Campaign", "Coffee Lab", ProjectType.CAMPAIGN,
        ["Increase awareness", "Drive footfall"],
        "Coffee lovers 25-45",
        ["Fresh summer flavors", "Cool down"],
        ["Social posts", "Posters", "Video"], 14
    )
    
    ad.create_brief(
        "Website Redesign", "Tech Startup", ProjectType.WEBSITE,
        ["Modern SaaS look", "Convert visitors"],
        "B2B tech buyers",
        ["Innovative", "Reliable"],
        ["Homepage", "Product pages", "Blog"], 28
    )
    
    print(ad.format_dashboard())
