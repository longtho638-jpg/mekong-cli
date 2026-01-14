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

import uuid
import logging
from typing import Dict, List, Any, Optional
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from enum import Enum

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

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
    """A creative brief entity."""
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
    """A creative review record."""
    id: str
    brief_id: str
    reviewer: str
    status: ReviewStatus
    feedback: str
    reviewed_at: datetime = field(default_factory=datetime.now)


class ArtDirector:
    """
    Art Director System.
    
    Manages creative briefs, reviews, and project direction.
    """
    
    def __init__(self, agency_name: str):
        self.agency_name = agency_name
        self.briefs: Dict[str, CreativeBrief] = {}
        self.reviews: List[CreativeReview] = []
        logger.info(f"Art Director initialized for {agency_name}")
    
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
        if not project_name or not client:
            raise ValueError("Project name and client are required")
        if days_to_deadline <= 0:
            raise ValueError("Deadline must be in the future")

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
        logger.info(f"Creative Brief created: {project_name} for {client} ({project_type.value})")
        return brief
    
    def review_creative(
        self,
        brief: CreativeBrief,
        reviewer: str,
        status: ReviewStatus,
        feedback: str
    ) -> CreativeReview:
        """Review creative work."""
        if not feedback and status in [ReviewStatus.REVISION, ReviewStatus.REJECTED]:
            raise ValueError("Feedback is required for revisions or rejections")

        review = CreativeReview(
            id=f"REV-{uuid.uuid4().hex[:6].upper()}",
            brief_id=brief.id,
            reviewer=reviewer,
            status=status,
            feedback=feedback
        )
        self.reviews.append(review)
        
        old_status = brief.status
        brief.status = status
        
        logger.info(f"Review submitted for {brief.project_name}: {old_status.value} -> {status.value}")
        return review
    
    def get_by_status(self, status: ReviewStatus) -> List[CreativeBrief]:
        """Get briefs by status."""
        return [b for b in self.briefs.values() if b.status == status]
    
    def format_dashboard(self) -> str:
        """Render Art Director Dashboard."""
        pending = len(self.get_by_status(ReviewStatus.PENDING))
        in_review = len(self.get_by_status(ReviewStatus.IN_REVIEW))
        
        lines = [
            "╔═══════════════════════════════════════════════════════════╗",
            f"║  🎨 ART DIRECTOR{' ' * 40}║",
            f"║  {len(self.briefs)} projects │ {pending} pending │ {in_review} in review {' ' * 7}║",
            "╠═══════════════════════════════════════════════════════════╣",
            "║  📋 ACTIVE BRIEFS                                         ║",
            "║  ───────────────────────────────────────────────────────  ║",
        ]
        
        type_icons = {
            ProjectType.BRANDING: "🏷️", 
            ProjectType.CAMPAIGN: "📢", 
            ProjectType.WEBSITE: "🌐", 
            ProjectType.VIDEO: "🎬", 
            ProjectType.PRINT: "🖨️"
        }
        status_icons = {
            ReviewStatus.PENDING: "⏳", 
            ReviewStatus.IN_REVIEW: "👁️", 
            ReviewStatus.APPROVED: "✅", 
            ReviewStatus.REVISION: "🔄", 
            ReviewStatus.REJECTED: "❌"
        }
        
        # Sort by deadline
        sorted_briefs = sorted(self.briefs.values(), key=lambda b: b.deadline)[:5]
        
        for brief in sorted_briefs:
            t_icon = type_icons.get(brief.project_type, "📋")
            s_icon = status_icons.get(brief.status, "⚪")
            days_left = (brief.deadline - datetime.now()).days
            
            lines.append(f"║  {s_icon} {t_icon} {brief.project_name[:18]:<18} │ {brief.client[:12]:<12} │ {days_left:>3}d  ║")
        
        lines.extend([
            "║                                                           ║",
            "║  📊 BY TYPE                                               ║",
            "║  ───────────────────────────────────────────────────────  ║",
        ])
        
        for ptype in ProjectType:
            count = sum(1 for b in self.briefs.values() if b.project_type == ptype)
            icon = type_icons.get(ptype, "📋")
            lines.append(f"║    {icon} {ptype.value.capitalize():<12} │ {count:>2} projects                  ║")
        
        lines.extend([
            "║                                                           ║",
            "║  [📋 New Brief]  [👁️ Review Queue]  [📊 Portfolio]        ║",
            "╠═══════════════════════════════════════════════════════════╣",
            f"║  🏯 {self.agency_name[:40]:<40} - Creative!             ║",
            "╚═══════════════════════════════════════════════════════════╝",
        ])
        
        return "\n".join(lines)


# Example usage
if __name__ == "__main__":
    print("🎨 Initializing Art Director...")
    print("=" * 60)
    
    try:
        ad = ArtDirector("Saigon Digital Hub")
        
        # Create briefs
        b1 = ad.create_brief(
            "Brand Refresh", "Sunrise Realty", ProjectType.BRANDING,
            ["Modern look", "Professional feel"],
            "Real estate buyers 30-50",
            ["Trusted partner", "Premium service"],
            ["Logo", "Brand guide", "Templates"], 21
        )
        
        b2 = ad.create_brief(
            "Summer Campaign", "Coffee Lab", ProjectType.CAMPAIGN,
            ["Increase awareness", "Drive footfall"],
            "Coffee lovers 25-45",
            ["Fresh summer flavors", "Cool down"],
            ["Social posts", "Posters", "Video"], 14
        )
        
        b3 = ad.create_brief(
            "Website Redesign", "Tech Startup", ProjectType.WEBSITE,
            ["Modern SaaS look", "Convert visitors"],
            "B2B tech buyers",
            ["Innovative", "Reliable"],
            ["Homepage", "Product pages", "Blog"], 28
        )
        
        # Simulate Review
        ad.review_creative(b2, "Senior AD", ReviewStatus.IN_REVIEW, "Looks good, check colors.")
        
        print("\n" + ad.format_dashboard())
        
    except Exception as e:
        logger.error(f"Runtime Error: {e}")
