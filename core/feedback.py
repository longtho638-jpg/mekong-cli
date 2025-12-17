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

from typing import Dict, List, Any, Optional
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
import uuid


class FeedbackCategory(Enum):
    """Feedback categories."""
    COMMUNICATION = "communication"
    QUALITY = "quality"
    TIMELINESS = "timeliness"
    VALUE = "value"
    SUPPORT = "support"


class NPSCategory(Enum):
    """NPS score categories."""
    DETRACTOR = "detractor"      # 0-6
    PASSIVE = "passive"          # 7-8
    PROMOTER = "promoter"        # 9-10


@dataclass
class Feedback:
    """A client feedback entry."""
    id: str
    client_name: str
    client_company: str
    project_name: str
    nps_score: int  # 0-10
    category_scores: Dict[FeedbackCategory, int]  # 1-5
    comments: str
    would_recommend: bool
    created_at: datetime = field(default_factory=datetime.now)
    
    @property
    def nps_category(self) -> NPSCategory:
        if self.nps_score <= 6:
            return NPSCategory.DETRACTOR
        elif self.nps_score <= 8:
            return NPSCategory.PASSIVE
        else:
            return NPSCategory.PROMOTER
    
    @property
    def avg_satisfaction(self) -> float:
        if not self.category_scores:
            return 0
        return sum(self.category_scores.values()) / len(self.category_scores)


class FeedbackSystem:
    """
    Feedback System.
    
    Collect and analyze client feedback.
    """
    
    def __init__(self, agency_name: str):
        self.agency_name = agency_name
        self.feedbacks: List[Feedback] = []
    
    def collect_feedback(
        self,
        client_name: str,
        client_company: str,
        project_name: str,
        nps_score: int,
        category_scores: Dict[FeedbackCategory, int],
        comments: str = "",
        would_recommend: bool = True
    ) -> Feedback:
        """Collect new feedback."""
        feedback = Feedback(
            id=f"FB-{uuid.uuid4().hex[:6].upper()}",
            client_name=client_name,
            client_company=client_company,
            project_name=project_name,
            nps_score=nps_score,
            category_scores=category_scores,
            comments=comments,
            would_recommend=would_recommend
        )
        
        self.feedbacks.append(feedback)
        return feedback
    
    def calculate_nps(self) -> float:
        """Calculate Net Promoter Score."""
        if not self.feedbacks:
            return 0
        
        promoters = sum(1 for f in self.feedbacks if f.nps_category == NPSCategory.PROMOTER)
        detractors = sum(1 for f in self.feedbacks if f.nps_category == NPSCategory.DETRACTOR)
        total = len(self.feedbacks)
        
        return ((promoters - detractors) / total) * 100
    
    def get_category_averages(self) -> Dict[FeedbackCategory, float]:
        """Get average scores by category."""
        if not self.feedbacks:
            return {}
        
        category_totals = {cat: [] for cat in FeedbackCategory}
        
        for feedback in self.feedbacks:
            for cat, score in feedback.category_scores.items():
                category_totals[cat].append(score)
        
        return {
            cat: sum(scores) / len(scores) if scores else 0
            for cat, scores in category_totals.items()
        }
    
    def format_feedback(self, feedback: Feedback) -> str:
        """Format single feedback."""
        nps_icons = {
            NPSCategory.DETRACTOR: "🔴",
            NPSCategory.PASSIVE: "🟡",
            NPSCategory.PROMOTER: "🟢"
        }
        
        lines = [
            "╔═══════════════════════════════════════════════════════════╗",
            f"║  💬 FEEDBACK: {feedback.id:<39}  ║",
            "╠═══════════════════════════════════════════════════════════╣",
            f"║  Client: {feedback.client_name} ({feedback.client_company[:20]})         ║",
            f"║  Project: {feedback.project_name:<43}  ║",
            "║                                                           ║",
            f"║  📊 NPS Score: {feedback.nps_score}/10 {nps_icons[feedback.nps_category]} {feedback.nps_category.value.upper():<30}  ║",
            "║                                                           ║",
            "║  📋 CATEGORY SCORES (1-5):                                ║",
        ]
        
        cat_icons = {
            FeedbackCategory.COMMUNICATION: "📞",
            FeedbackCategory.QUALITY: "⭐",
            FeedbackCategory.TIMELINESS: "⏰",
            FeedbackCategory.VALUE: "💰",
            FeedbackCategory.SUPPORT: "🤝"
        }
        
        for cat, score in feedback.category_scores.items():
            stars = "★" * score + "☆" * (5 - score)
            lines.append(f"║    {cat_icons[cat]} {cat.value.capitalize():<14}: {stars}        ║")
        
        if feedback.comments:
            lines.extend([
                "║                                                           ║",
                f"║  💬 \"{feedback.comments[:45]}\"  ║",
            ])
        
        lines.extend([
            "╠═══════════════════════════════════════════════════════════╣",
            f"║  🏯 {self.agency_name}                                    ║",
            "╚═══════════════════════════════════════════════════════════╝",
        ])
        
        return "\n".join(lines)
    
    def format_dashboard(self) -> str:
        """Format feedback dashboard."""
        nps = self.calculate_nps()
        category_avgs = self.get_category_averages()
        
        promoters = sum(1 for f in self.feedbacks if f.nps_category == NPSCategory.PROMOTER)
        passives = sum(1 for f in self.feedbacks if f.nps_category == NPSCategory.PASSIVE)
        detractors = sum(1 for f in self.feedbacks if f.nps_category == NPSCategory.DETRACTOR)
        
        # NPS rating
        if nps >= 70:
            nps_rating = "🔥 WORLD CLASS!"
        elif nps >= 50:
            nps_rating = "✅ EXCELLENT"
        elif nps >= 0:
            nps_rating = "🟡 GOOD"
        else:
            nps_rating = "🔴 NEEDS WORK"
        
        lines = [
            "╔═══════════════════════════════════════════════════════════╗",
            f"║  📊 FEEDBACK DASHBOARD                                    ║",
            f"║  Total Responses: {len(self.feedbacks):<35}  ║",
            "╠═══════════════════════════════════════════════════════════╣",
            "║  🎯 NET PROMOTER SCORE (NPS)                              ║",
            "║  ─────────────────────────────────────────────────────── ║",
        ]
        
        # NPS display
        nps_bar_pos = int(30 * (nps + 100) / 200)  # -100 to +100
        nps_bar = "░" * nps_bar_pos + "█" + "░" * (30 - nps_bar_pos)
        
        lines.extend([
            f"║    [{nps_bar}]      ║",
            f"║    NPS: {nps:>+.0f}  {nps_rating:<35}  ║",
            "║                                                           ║",
            f"║    🟢 Promoters: {promoters:<3} │ 🟡 Passives: {passives:<3} │ 🔴 Detractors: {detractors:<2} ║",
            "║                                                           ║",
            "║  📋 CATEGORY PERFORMANCE                                  ║",
            "║  ─────────────────────────────────────────────────────── ║",
        ])
        
        cat_icons = {"communication": "📞", "quality": "⭐", "timeliness": "⏰", "value": "💰", "support": "🤝"}
        
        for cat, avg in category_avgs.items():
            icon = cat_icons[cat.value]
            bar_filled = int(20 * avg / 5)
            bar = "█" * bar_filled + "░" * (20 - bar_filled)
            lines.append(f"║    {icon} {cat.value.capitalize():<12} [{bar}] {avg:.1f}/5  ║")
        
        lines.extend([
            "╠═══════════════════════════════════════════════════════════╣",
            f"║  🏯 {self.agency_name} - Keep improving!                  ║",
            "╚═══════════════════════════════════════════════════════════╝",
        ])
        
        return "\n".join(lines)


# Example usage
if __name__ == "__main__":
    system = FeedbackSystem("Saigon Digital Hub")
    
    print("💬 Feedback System")
    print("=" * 60)
    print()
    
    # Collect sample feedback
    system.collect_feedback(
        client_name="Mr. Hoang",
        client_company="Sunrise Realty",
        project_name="Website Redesign",
        nps_score=9,
        category_scores={
            FeedbackCategory.COMMUNICATION: 5,
            FeedbackCategory.QUALITY: 5,
            FeedbackCategory.TIMELINESS: 4,
            FeedbackCategory.VALUE: 5,
            FeedbackCategory.SUPPORT: 5
        },
        comments="Excellent work! Very professional team."
    )
    
    system.collect_feedback(
        client_name="Ms. Linh",
        client_company="Coffee Lab",
        project_name="SEO Campaign",
        nps_score=10,
        category_scores={
            FeedbackCategory.COMMUNICATION: 5,
            FeedbackCategory.QUALITY: 5,
            FeedbackCategory.TIMELINESS: 5,
            FeedbackCategory.VALUE: 4,
            FeedbackCategory.SUPPORT: 5
        },
        comments="Amazing results! Our traffic doubled."
    )
    
    system.collect_feedback(
        client_name="Dr. Pham",
        client_company="Dental Plus",
        project_name="Social Media",
        nps_score=8,
        category_scores={
            FeedbackCategory.COMMUNICATION: 4,
            FeedbackCategory.QUALITY: 4,
            FeedbackCategory.TIMELINESS: 4,
            FeedbackCategory.VALUE: 4,
            FeedbackCategory.SUPPORT: 4
        },
        comments="Good overall, some minor delays."
    )
    
    print(system.format_dashboard())
    print()
    print(system.format_feedback(system.feedbacks[0]))
