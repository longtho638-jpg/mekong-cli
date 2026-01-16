"""
EmailMarketingOps Agents Package
Email + Automation
"""

from .email_agent import EmailAgent, EmailCampaign, EmailList, CampaignStatus
from .automation_agent import AutomationAgent, Automation, EmailStep, TriggerType, AutomationStatus

__all__ = [
    # Email
    "EmailAgent", "EmailCampaign", "EmailList", "CampaignStatus",
    # Automation
    "AutomationAgent", "Automation", "EmailStep", "TriggerType", "AutomationStatus",
]
