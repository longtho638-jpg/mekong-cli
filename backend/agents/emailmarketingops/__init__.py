"""
EmailMarketingOps Agents Package
Email + Automation
"""

from .automation_agent import Automation, AutomationAgent, AutomationStatus, EmailStep, TriggerType
from .email_agent import CampaignStatus, EmailAgent, EmailCampaign, EmailList

__all__ = [
    # Email
    "EmailAgent",
    "EmailCampaign",
    "EmailList",
    "CampaignStatus",
    # Automation
    "AutomationAgent",
    "Automation",
    "EmailStep",
    "TriggerType",
    "AutomationStatus",
]
