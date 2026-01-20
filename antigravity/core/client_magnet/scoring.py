"""
Lead scoring logic.
"""
from typing import Optional

from .models import Lead, LeadSource, LeadStatus


class LeadScorer:
    """Heuristic engine for lead qualification."""

    def qualify(self, lead: Lead, budget: float = 0.0, score: Optional[int] = None) -> Lead:
        """Evaluates a lead's potential and sets strategic priority."""
        lead.budget = budget

        # Simple auto-scoring if not provided
        if score is None:
            calculated_score = 50
            if budget > 2000:
                calculated_score += 20
            if lead.email and lead.phone:
                calculated_score += 10
            if lead.source == LeadSource.REFERRAL:
                calculated_score += 15
            score = calculated_score

        lead.score = min(score, 100)
        lead.status = LeadStatus.QUALIFIED
        return lead
