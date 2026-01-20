"""
Data models and Enums for Healthcare Marketing.
"""
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from typing import Dict, List, Optional


class ComplianceStatus(Enum):
    """Specific compliance readiness levels."""
    NOT_STARTED = "not_started"
    IN_PROGRESS = "in_progress"
    COMPLIANT = "compliant"
    NEEDS_REVIEW = "needs_review"

class HealthcareVertical(Enum):
    """Specialized healthcare domains."""
    DENTAL = "dental"
    MEDICAL = "medical"
    MENTAL_HEALTH = "mental_health"
    CHIROPRACTIC = "chiropractic"
    WELLNESS = "wellness"
    PHARMACY = "pharmacy"

class CampaignType(Enum):
    """Healthcare-specific marketing strategies."""
    PATIENT_ACQUISITION = "patient_acquisition"
    BRAND_AWARENESS = "brand_awareness"
    SERVICE_PROMOTION = "service_promotion"
    COMMUNITY_OUTREACH = "community_outreach"

@dataclass
class HIPAAChecklist:
    """A HIPAA compliance audit record."""
    id: str
    client_name: str
    items: Dict[str, bool] = field(default_factory=dict)
    status: ComplianceStatus = ComplianceStatus.NOT_STARTED
    last_reviewed: Optional[datetime] = None

@dataclass
class HealthcareClient:
    """A healthcare industry client entity."""
    id: str
    name: str
    vertical: HealthcareVertical
    hipaa_status: ComplianceStatus = ComplianceStatus.NOT_STARTED
    campaigns: List[str] = field(default_factory=list)
    monthly_retainer: float = 0.0

    def __post_init__(self):
        if self.monthly_retainer < 0:
            raise ValueError("Retainer cannot be negative")

@dataclass
class HealthcareCampaign:
    """A healthcare-specific marketing campaign record."""
    id: str
    client_id: str
    name: str
    campaign_type: CampaignType
    hipaa_approved: bool = False
    budget: float = 0.0
    patient_leads: int = 0
    start_date: Optional[datetime] = field(default_factory=datetime.now)
