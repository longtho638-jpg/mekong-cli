"""
💰 MoneyMaker Models
===================

Data models, constants, and enums for the Money Maker system.
"""

from dataclasses import dataclass, field
from datetime import datetime
from decimal import Decimal
from enum import Enum
from typing import Any, Dict, List, Optional

from typing_extensions import TypedDict


class ServiceTier(Enum):
    """Client engagement levels based on strategic depth."""

    WARRIOR = "warrior"  # Tier 1: Pre-Seed/Seed
    GENERAL = "general"  # Tier 2: Series A
    TUONG_QUAN = "tuong_quan"  # Tier 3: Venture Studio / Co-Founder


# 13-Chapter Binh Pháp Pricing
BINH_PHAP_SERVICES = {
    1: {"name": "Kế Hoạch", "label": "Strategy Assessment", "price": 5000},
    2: {"name": "Tác Chiến", "label": "Runway Workshop", "price": 3000},
    3: {"name": "Mưu Công", "label": "Win-Without-Fighting", "price": 8000},
    4: {"name": "Hình Thế", "label": "Moat Audit", "price": 5000},
    5: {"name": "Thế Trận", "label": "Growth Consulting", "price": 5000, "recurring": True},
    6: {"name": "Hư Thực", "label": "Anti-Dilution Shield", "price": 10000},
    7: {"name": "Quân Tranh", "label": "Speed Sprint", "price": 15000},
    8: {"name": "Cửu Biến", "label": "Pivot Workshop", "price": 5000},
    9: {"name": "Hành Quân", "label": "OKR Implementation", "price": 3000, "quarterly": True},
    10: {"name": "Địa Hình", "label": "Market Entry", "price": 8000},
    11: {"name": "Cửu Địa", "label": "Crisis Retainer", "price": 5000, "recurring": True},
    12: {"name": "Hỏa Công", "label": "Disruption Strategy", "price": 10000},
    13: {"name": "Dụng Gián", "label": "VC Intelligence", "price": 3000},
}

TIER_PROFILES = {
    ServiceTier.WARRIOR: {"retainer_usd": 2000, "equity_range": (5.0, 8.0), "success_fee_pct": 2.0},
    ServiceTier.GENERAL: {"retainer_usd": 5000, "equity_range": (3.0, 5.0), "success_fee_pct": 1.5},
    ServiceTier.TUONG_QUAN: {
        "retainer_usd": 0,
        "equity_range": (15.0, 30.0),
        "success_fee_pct": 0.0,
    },
}


class BinhPhapServiceEntry(TypedDict):
    """Single service entry in the Binh Phap catalog"""

    name: str
    label: str
    price: int
    recurring: Optional[bool]
    quarterly: Optional[bool]


@dataclass
class Quote:
    """A detailed financial proposal for a client."""

    id: int
    client_name: str
    services: List[BinhPhapServiceEntry]
    tier: ServiceTier
    one_time_total: Decimal
    monthly_retainer: Decimal
    equity_percent: Decimal = Decimal("0")
    success_fee_percent: Decimal = Decimal("0")
    created_at: datetime = field(default_factory=datetime.now)
    status: str = "draft"
    win3_validated: bool = False


@dataclass
class Win3Result:
    """Outcome of the Hiến Pháp WIN-WIN-WIN alignment check."""

    is_valid: bool
    score: int  # 0-100
    details: Dict[str, str]
    warnings: List[str] = field(default_factory=list)
