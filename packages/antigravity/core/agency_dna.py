"""
AgencyDNA - Your agency's unique identity.

This module defines the core identity of your agency:
- Niche specialization
- Location/region
- Brand tone and voice
- Service offerings
- Pricing structure

🏯 Binh Pháp: Đạo (Way) - Alignment
"""

from dataclasses import dataclass, field
from enum import Enum
from typing import Dict, List


class Tone(Enum):
    """Brand voice tones."""

    PROFESSIONAL = "professional"
    FRIENDLY = "friendly"
    MIEN_TAY = "mien_tay"  # Miền Tây - Southern Vietnam
    MIEN_BAC = "mien_bac"  # Miền Bắc - Northern Vietnam
    MIEN_TRUNG = "mien_trung"  # Miền Trung - Central Vietnam


class PricingTier(Enum):
    """Pricing tiers."""

    STARTER = "starter"  # $0-500/project
    GROWTH = "growth"  # $500-2000/project
    PROFESSIONAL = "professional"  # $2000-5000/project
    ENTERPRISE = "enterprise"  # $5000+/project


@dataclass
class Service:
    """A service offering."""

    name: str
    description: str
    price_usd: float
    price_vnd: int = 0
    duration_days: int = 7

    def __post_init__(self):
        # Auto-convert USD to VND (1 USD = 24,500 VND)
        if self.price_vnd == 0:
            self.price_vnd = int(self.price_usd * 24500)


@dataclass
class AgencyDNA:
    """
    Your agency's unique identity.

    Example:
        dna = AgencyDNA(
            name="Nova Digital",
            niche="Nông sản",
            location="Cần Thơ",
            tone=Tone.MIEN_TAY
        )
    """

    name: str = "My Agency"
    niche: str = "Digital Marketing"
    location: str = "Vietnam"
    tone: Tone = Tone.FRIENDLY
    tier: PricingTier = PricingTier.STARTER

    # Services
    services: List[Service] = field(default_factory=list)

    # Contact
    email: str = ""
    phone: str = ""
    website: str = ""

    # Social
    facebook: str = ""
    zalo: str = ""
    telegram: str = ""

    def add_service(self, name: str, description: str, price_usd: float) -> Service:
        """Add a service offering."""
        service = Service(name=name, description=description, price_usd=price_usd)
        self.services.append(service)
        return service

    def get_tagline(self) -> str:
        """Generate agency tagline based on niche and tone."""
        taglines = {
            Tone.MIEN_TAY: f"Chuyên gia {self.niche} - Đậm chất Miền Tây",
            Tone.MIEN_BAC: f"Chuyên gia {self.niche} - Chất lượng Hà Nội",
            Tone.MIEN_TRUNG: f"Chuyên gia {self.niche} - Đẳng cấp Miền Trung",
            Tone.FRIENDLY: f"Your Partner in {self.niche}",
            Tone.PROFESSIONAL: f"Professional {self.niche} Solutions",
        }
        return taglines.get(self.tone, f"Expert in {self.niche}")

    def to_dict(self) -> Dict:
        """Export DNA as dictionary."""
        return {
            "name": self.name,
            "niche": self.niche,
            "location": self.location,
            "tone": self.tone.value,
            "tier": self.tier.value,
            "services": [
                {"name": s.name, "price_usd": s.price_usd, "price_vnd": s.price_vnd}
                for s in self.services
            ],
            "contact": {"email": self.email, "phone": self.phone, "website": self.website},
            "tagline": self.get_tagline(),
        }
