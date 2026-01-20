from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from typing import List

class AgencyNiche(Enum):
    """Business niches for automated agency setup."""
    SAAS_MARKETING = "saas_marketing"
    ECOMMERCE = "ecommerce"
    LOCAL_BUSINESS = "local_business"
    REAL_ESTATE = "real_estate"
    HEALTHCARE = "healthcare"
    FINANCE = "finance"
    EDUCATION = "education"
    TECH_STARTUP = "tech_startup"

class BrandStyle(Enum):
    """Visual style themes."""
    CYBER = "cyber"  # Matrix green, dark, tech
    MINIMAL = "minimal"  # Clean, white space
    BOLD = "bold"  # Vibrant colors, striking
    PROFESSIONAL = "professional"  # Corporate, trust
    CREATIVE = "creative"  # Playful, colorful

@dataclass
class BrandIdentity:
    """Generated brand identity entity."""
    name: str
    tagline: str
    primary_color: str
    secondary_color: str
    accent_color: str
    font_heading: str
    font_body: str
    style: BrandStyle
    logo_concept: str

@dataclass
class LegalDocument:
    """Generated legal document entity."""
    doc_type: str
    title: str
    content: str
    generated_at: datetime = field(default_factory=datetime.now)

@dataclass
class AgencyConfig:
    """Complete agency configuration record."""
    id: str
    name: str
    niche: AgencyNiche
    brand: BrandIdentity
    agents_activated: List[str]
    legal_docs: List[LegalDocument]
    created_at: datetime
    setup_time_seconds: int
