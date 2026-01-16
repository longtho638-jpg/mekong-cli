"""
RecruiterOps Agents Package
Sourcing + Outreach
"""

from .sourcing_agent import SourcingAgent, TalentProfile, TalentStatus, CandidateSource
from .outreach_agent import OutreachAgent, OutreachCampaign, OutreachStatus, SequenceStep

__all__ = [
    # Sourcing
    "SourcingAgent", "TalentProfile", "TalentStatus", "CandidateSource",
    # Outreach
    "OutreachAgent", "OutreachCampaign", "OutreachStatus", "SequenceStep",
]
