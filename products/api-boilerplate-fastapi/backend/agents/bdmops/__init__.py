"""
BDMOps Agents Package
Partnership + Opportunity Pipeline
"""

from .partnership_agent import PartnershipAgent, Partner, PartnerType, PartnerStatus
from .opportunity_pipeline_agent import OpportunityPipelineAgent, Opportunity, OpportunityStage, OpportunityType

__all__ = [
    # Partnership
    "PartnershipAgent", "Partner", "PartnerType", "PartnerStatus",
    # Opportunity Pipeline
    "OpportunityPipelineAgent", "Opportunity", "OpportunityStage", "OpportunityType",
]
