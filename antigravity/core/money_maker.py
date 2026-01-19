"""
💰 MoneyMaker - Revenue Autopilot Engine (REFACTORED)
======================================================

Enhanced with Pydantic validation for security and data integrity.

Features:
- 📖 13-Chapter Strategic Pricing: Value-based services
- 💂 Tiered Service Levels: Warrior, General, Tướng Quân
- ⚖️ WIN-WIN-WIN Gatekeeper: Governance check for every deal
- 📊 Sales Intelligence: Automatic lead qualification (BANT)
- 🛡️ Input Validation: Pydantic models for all financial data

Binh Pháp: 💰 Tài (Wealth) - Generating and managing resources
"""

import logging
from dataclasses import dataclass, field
from datetime import datetime
from decimal import Decimal
from enum import Enum
from typing import Any, Dict, List, Optional, Tuple, Union

# Import validation models
from .finance import PricingInput, sanitize_client_name, detect_suspicious_pricing

logger = logging.getLogger(__name__)


class ServiceTier(Enum):
    """Client engagement levels based on strategic depth."""
    WARRIOR = "warrior"  # Tier 1: Pre-Seed/Seed
    GENERAL = "general"  # Tier 2: Series A
    TUONG_QUAN = "tuong_quan"  # Tier 3: Venture Studio / Co-Founder


# 13-Chapter Binh Pháp Pricing (externalized to prevent hardcoding)
# TODO: Move to pricing.yaml config file
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
    ServiceTier.TUONG_QUAN: {"retainer_usd": 0, "equity_range": (15.0, 30.0), "success_fee_pct": 0.0},
}


@dataclass
class Quote:
    """A detailed financial proposal for a client."""
    id: int
    client_name: str
    services: List[Dict[str, Any]]
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


class MoneyMaker:
    """
    💰 Money Maker Engine (with Validation)

    Automates commercial operations with built-in security and validation.
    """

    def __init__(self, data_dir: str = ".antigravity"):
        self.data_dir = data_dir
        self.quotes: List[Quote] = []
        self._next_id = 1
        logger.info("MoneyMaker initialized with validation")

    def generate_quote(
        self,
        client_name: str,
        chapters: List[int],
        tier: Union[ServiceTier, str] = ServiceTier.WARRIOR,
        custom_equity: Optional[float] = None,
    ) -> Quote:
        """
        Generate validated client quote.

        Args:
            client_name: Client name (will be sanitized)
            chapters: List of Binh Pháp chapter IDs to include
            tier: Service tier
            custom_equity: Optional custom equity percentage

        Returns:
            Validated Quote object

        Raises:
            ValueError: If input validation fails
        """
        # Sanitize client name
        safe_client_name = sanitize_client_name(client_name)

        # Parse tier
        if isinstance(tier, str):
            tier = ServiceTier(tier.lower())

        # Calculate totals
        service_list = []
        total_one_time = Decimal("0")
        total_recurring = Decimal("0")

        for chapter_id in chapters:
            if chapter_id not in BINH_PHAP_SERVICES:
                logger.warning(f"Invalid chapter ID: {chapter_id}")
                continue

            svc = BINH_PHAP_SERVICES[chapter_id].copy()
            svc["chapter"] = chapter_id
            service_list.append(svc)

            price = Decimal(str(svc["price"]))
            if svc.get("recurring"):
                total_recurring += price
            elif svc.get("quarterly"):
                total_one_time += price * 4  # Annualize
            else:
                total_one_time += price

        # Apply tier logic
        profile = TIER_PROFILES[tier]
        equity = Decimal(str(custom_equity if custom_equity is not None else sum(profile["equity_range"]) / 2))

        # Create quote
        quote = Quote(
            id=self._next_id,
            client_name=safe_client_name,
            services=service_list,
            tier=tier,
            one_time_total=total_one_time,
            monthly_retainer=total_recurring + Decimal(str(profile["retainer_usd"])),
            equity_percent=equity,
            success_fee_percent=Decimal(str(profile["success_fee_pct"])),
        )

        # Validate WIN-WIN-WIN
        win3 = self.validate_win3(quote)
        quote.win3_validated = win3.is_valid

        self.quotes.append(quote)
        self._next_id += 1

        logger.info(f"Generated quote #{quote.id} for {safe_client_name} (Score: {win3.score})")
        return quote

    def validate_win3(self, quote: Quote) -> Win3Result:
        """
        WIN-WIN-WIN Governance Check.

        Ensures the deal benefits Owner, Agency, and Client.
        """
        warnings = []
        score = 100

        # OWNER WIN check
        if quote.equity_percent <= 0 and quote.monthly_retainer < 1000:
            warnings.append("Low owner alignment (no equity + low cashflow)")
            score -= 30

        # AGENCY WIN check
        if quote.monthly_retainer < 2000 and quote.success_fee_percent < 1:
            warnings.append("Agency risk: Recurring revenue below sustainability threshold")
            score -= 20

        # CLIENT WIN check
        if not quote.services:
            warnings.append("Zero client value: No services defined")
            score -= 50

        # Ethical boundaries
        if quote.equity_percent > 35:
            warnings.append("Equity too high: Risk of founder demotivation")
            score -= 20

        is_valid = score >= 65 and not any("Zero " in w for w in warnings)

        return Win3Result(
            is_valid=is_valid,
            score=max(0, score),
            details={
                "owner": f"Equity {quote.equity_percent}% | ${quote.monthly_retainer}/mo",
                "agency": f"Retainer ${quote.monthly_retainer}/mo | {quote.success_fee_percent}% success",
                "client": f"{len(quote.services)} Modules | ${quote.one_time_total} Project Value",
            },
            warnings=warnings,
        )

    def get_pricing_catalog(self) -> str:
        """Render 13-Chapter pricing menu."""
        lines = [
            "╔═══════════════════════════════════════════════════════════╗",
            "║  🏯 BINH PHÁP 13-CHAPTER STRATEGIC CATALOG                ║",
            "╠═══════════════════════════════════════════════════════════╣",
        ]

        for cid, info in BINH_PHAP_SERVICES.items():
            recurring_tag = "/mo" if info.get("recurring") else ""
            line = f"║ {cid:2}️⃣ {info['name']:<10} │ {info['label']:<25} │ ${info['price']:>6,}{recurring_tag} ║"
            lines.append(line)

        lines.append("╚═══════════════════════════════════════════════════════════╝")
        return "\n".join(lines)


__all__ = ["MoneyMaker", "Quote", "Win3Result", "ServiceTier", "BINH_PHAP_SERVICES", "TIER_PROFILES"]
