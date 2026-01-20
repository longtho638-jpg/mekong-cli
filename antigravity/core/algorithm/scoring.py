"""
Lead scoring logic (BANT).
"""
from typing import Dict

from .types import LeadData, LeadScore

# BANT thresholds
BANT_THRESHOLDS = {
    "A": 80,  # Hot lead
    "B": 60,  # Warm lead
    "C": 40,  # Nurture
    "D": 0,  # Cold
}


def score_lead_logic(lead_data: LeadData) -> LeadScore:
    """
    Score lead using BANT methodology.

    B(udget) + A(uthority) + N(eed) + T(imeline) = Score
    """
    # Weighted BANT scoring
    budget_score = min(lead_data.budget / 1000, 10) * 2.5  # Max 25
    authority_score = lead_data.authority * 2.5  # Max 25
    need_score = lead_data.need * 2.5  # Max 25
    timeline_score = lead_data.timeline * 2.5  # Max 25

    total = int(budget_score + authority_score + need_score + timeline_score)

    # Determine grade
    grade = "D"
    for g, threshold in BANT_THRESHOLDS.items():
        if total >= threshold:
            grade = g
            break

    # Determine next action
    next_actions = {
        "A": "Schedule demo call immediately",
        "B": "Send case study + follow up in 2 days",
        "C": "Add to nurture sequence",
        "D": "Low priority - automated follow up only",
    }

    return LeadScore(
        total=total,
        grade=grade,
        qualified=grade in ["A", "B"],
        next_action=next_actions[grade],
    )
