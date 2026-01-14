"""
💬 Feedback System - Collect Client Feedback
==============================================

Collect and analyze client feedback with NPS.
Improve service and retain clients!

Features:
- NPS (Net Promoter Score) surveys
- Satisfaction tracking
- Feedback categories
- Improvement insights
"""

import uuid
import logging
from typing import Dict, List, Any, Optional, Union
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class FeedbackCategory(Enum):
    """Specific areas of agency performance."""
    COMMUNICATION = "communication"
    QUALITY = "quality"
    TIMELINESS = "timeliness"
    VALUE = "value"
    SUPPORT = "support"


class NPSCategory(Enum):
    """NPS loyalty segments."""
    DETRACTOR = "detractor"      # 0-6
    PASSIVE = "passive"          # 7-8
    PROMOTER = "promoter"        # 9-10


@dataclass
class Feedback:
    """A client feedback record entity."""
    id: str
    client_name: str
    client_company: str
    project_name: str
    nps_score: int  # 0-10
    category_scores: Dict[FeedbackCategory, int]  # 1-5
    comments: str = ""
    would_recommend: bool = True
    created_at: datetime = field(default_factory=datetime.now)
    
    def __post_init__(self):
        if not 0 <= self.nps_score <= 10:
            raise ValueError("NPS score must be 0-10")
        for score in self.category_scores.values():
            if not 1 <= score <= 5:
                raise ValueError("Category score must be 1-5")

    @property
    def nps_category(self) -> NPSCategory:
        """Categorize responder based on NPS score."""
        if self.nps_score <= 6: return NPSCategory.DETRACTOR
        if self.nps_score <= 8: return NPSCategory.PASSIVE
        return NPSCategory.PROMOTER


class FeedbackSystem:
    """
    Feedback System.
    
    Tracks Net Promoter Score and multi-factor satisfaction metrics.
    """
    
    def __init__(self, agency_name: str):
        self.agency_name = agency_name
        self.feedbacks: List[Feedback] = []
        logger.info(f"Feedback System initialized for {agency_name}")
    
    def collect_feedback(
        self,
        client_name: str,
        client_company: str,
        project_name: str,
        nps_score: int,
        category_scores: Dict[FeedbackCategory, int],
        comments: str = ""
    ) -> Feedback:
        """Register a new piece of client feedback."""
        fb = Feedback(
            id=f"FB-{uuid.uuid4().hex[:6].upper()}",
            client_name=client_name, client_company=client_company,
            project_name=project_name, nps_score=nps_score,
            category_scores=category_scores, comments=comments
        )
        self.feedbacks.append(fb)
        logger.info(f"Feedback collected from {client_name} ({client_company})")
        return fb
    
    def calculate_nps(self) -> float:
        """Calculate aggregate Net Promoter Score."""
        if not self.feedbacks: return 0.0
        
        promoters = sum(1 for f in self.feedbacks if f.nps_category == NPSCategory.PROMOTER)
        detractors = sum(1 for f in self.feedbacks if f.nps_category == NPSCategory.DETRACTOR)
        return ((promoters - detractors) / len(self.feedbacks)) * 100.0
    
    def format_dashboard(self) -> str:
        """Render the Feedback Dashboard."""
        nps = self.calculate_nps()
        total = len(self.feedbacks)
        
        lines = [
            "╔═══════════════════════════════════════════════════════════╗",
            f"║  📊 FEEDBACK DASHBOARD{' ' * 36}║",
            f"║  {total} total responses │ Aggregate NPS: {nps:>+4.0f}{' ' * 23}║",
            "╠═══════════════════════════════════════════════════════════╣",
            "║  🎯 LOYALTY SEGMENTS                                      ║",
            "║  ───────────────────────────────────────────────────────  ║",
        ]
        
        for cat, icon in [(NPSCategory.PROMOTER, "🟢"), (NPSCategory.PASSIVE, "🟡"), (NPSCategory.DETRACTOR, "🔴")]:
            count = sum(1 for f in self.feedbacks if f.nps_category == cat)
            pct = (count / total * 100) if total else 0
            bar = "█" * int(pct / 10) + "░" * (10 - int(pct / 10))
            lines.append(f"║  {icon} {cat.value.capitalize():<12} │ {bar} │ {count:>3} clients ({pct:>3.0f}%)  ║")
            
        lines.extend([
            "║                                                           ║",
            "║  📝 RECENT COMMENTS                                       ║",
            "║  ───────────────────────────────────────────────────────  ║",
        ])
        
        for f in self.feedbacks[-2:]:
            com = (f.comments[:50] + '..') if len(f.comments) > 52 else f.comments
            lines.append(f"║  💬 \"{com:<53}\" ║")
            
        lines.extend([
            "║                                                           ║",
            "║  [📊 Full Report]  [📝 Send Survey]  [⚙️ Settings]        ║",
            "╠═══════════════════════════════════════════════════════════╣",
            f"║  🏯 {self.agency_name[:40]:<40} - Feedback!          ║",
            "╚═══════════════════════════════════════════════════════════╝",
        ])
        return "\n".join(lines)


# Example usage
if __name__ == "__main__":
    print("💬 Initializing Feedback System...")
    print("=" * 60)
    
    try:
        f_system = FeedbackSystem("Saigon Digital Hub")
        f_system.collect_feedback("Hoang", "Sunrise", "Web", 10, {FeedbackCategory.QUALITY: 5}, "Great!")
        f_system.collect_feedback("Linh", "CoffeeCo", "SEO", 8, {FeedbackCategory.QUALITY: 4}, "Good work.")
        
        print("\n" + f_system.format_dashboard())
        
    except Exception as e:
        logger.error(f"Feedback Error: {e}")
