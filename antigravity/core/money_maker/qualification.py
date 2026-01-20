"""
Money Maker Qualification Logic.
"""
from typing import Tuple

from .models import ServiceTier


class LeadQualifier:
    """
    Auto-qualify leads based on BANT scoring.
    """

    def auto_qualify_lead(
        self, budget: float, authority: int, need: int, urgency: int
    ) -> Tuple[float, str, ServiceTier]:
        """
        Auto-qualify a lead based on BANT scoring.

        Weights:
        - Budget: Dynamic based on value (max 35)
        - Authority: 20% (max 20)
        - Need: 25% (max 25)
        - Urgency: 20% (max 20)

        Returns:
            (score, action_recommendation, suggested_tier)
        """
        # Calculate Budget Score (Max 35)
        # Logarithmic-ish scaling: 10k -> 35, 5k -> 25, 1k -> 10
        if budget >= 10000:
            b_score = 35
        elif budget >= 5000:
            b_score = 25
        elif budget >= 1000:
            b_score = 15
        else:
            b_score = 5

        # Calculate Authority Score (Max 20)
        a_score = (authority / 100) * 20

        # Calculate Need Score (Max 25)
        n_score = (need / 100) * 25

        # Calculate Urgency/Timeline Score (Max 20)
        t_score = (urgency / 100) * 20

        total_score = b_score + a_score + n_score + t_score

        # Determine Tier & Action
        if total_score >= 80:
            action = "CRITICAL: Close immediately. Founder intervention required."
            tier = ServiceTier.GENERAL  # High value
        elif total_score >= 60:
            action = "PRIORITY: Schedule strategy session within 24h."
            tier = ServiceTier.WARRIOR
        else:
            action = "NURTURE: Send automated Binh Phap sequence."
            tier = ServiceTier.WARRIOR

        return total_score, action, tier
