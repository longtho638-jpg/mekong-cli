"""
Data models and Enums for Business Plan Generation.
"""
import uuid
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from typing import Dict


class PlanSection(Enum):
    """13 Business Plan sections."""
    CUSTOMER_PROFILE = "customer_profile"
    BUSINESS_PLAN = "business_plan"
    MARKET_RESEARCH = "market_research"
    BRAND_IDENTITY = "brand_identity"
    MARKETING_MESSAGE = "marketing_message"
    MARKETING_PLAN = "marketing_plan"
    MARKETING_CONTENT = "marketing_content"
    SOCIAL_MEDIA = "social_media"
    SALES_STRATEGY = "sales_strategy"
    PR_PLAN = "pr_plan"
    GROWTH_PLAN = "growth_plan"
    RAISING_CAPITAL = "raising_capital"
    FOUNDER_WISDOM = "founder_wisdom"

@dataclass
class AgencyDNA:
    """The Agency DNA - core identity from Q&A."""
    agency_name: str
    location: str
    niche: str
    target_audience: str
    dream_revenue: str
    unique_skill: str
    local_vibe: str
    language: str
    currency: str
    id: str = field(default_factory=lambda: f"DNA-{uuid.uuid4().hex[:6].upper()}")
    created_at: datetime = field(default_factory=datetime.now)
    sections: Dict[str, str] = field(default_factory=dict)
