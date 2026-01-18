"""
RecruiterOps Agents Package
Sourcing + Outreach
"""

from .outreach_agent import OutreachAgent, OutreachCampaign, OutreachStatus, SequenceStep
from .sourcing_agent import CandidateSource, SourcingAgent, TalentProfile, TalentStatus

__all__ = [
    # Sourcing
    "SourcingAgent",
    "TalentProfile",
    "TalentStatus",
    "CandidateSource",
    # Outreach
    "OutreachAgent",
    "OutreachCampaign",
    "OutreachStatus",
    "SequenceStep",
]
