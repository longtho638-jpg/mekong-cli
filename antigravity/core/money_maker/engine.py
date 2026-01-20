"""
💰 Money Maker Engine Logic
===========================

Automates commercial operations with built-in security and validation.
Features:
- 📖 13-Chapter Strategic Pricing
- 💂 Tiered Service Levels
- ⚖️ WIN-WIN-WIN Gatekeeper
- 📊 Sales Intelligence
- 🛡️ Input Validation
"""

import logging
from decimal import Decimal
from typing import List, Optional, Union

# Import validation models from core finance package
from antigravity.core.finance import sanitize_client_name

from .models import (
    BINH_PHAP_SERVICES,
    TIER_PROFILES,
    Quote,
    ServiceTier,
    Win3Result,
)

logger = logging.getLogger(__name__)


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

    def auto_qualify_lead(
        self, budget: float, authority: int, need: int, urgency: int
    ) -> tuple[float, str, ServiceTier]:
        """
        Auto-qualify a lead based on BANT scoring.

        Weights:
        - Budget: Dynamic based on value (max 35)
        - Authority: 20% (max 20)
        - Need: 25% (max 25)
        - Urgency: 20% (max 20)

        Returns:
            (score, action_recommendation, suggested_tier)
        """
        # Calculate Budget Score (Max 35)
        # Logarithmic-ish scaling: 10k -> 35, 5k -> 25, 1k -> 10
        if budget >= 10000:
            b_score = 35
        elif budget >= 5000:
            b_score = 25
        elif budget >= 1000:
            b_score = 15
        else:
            b_score = 5

        # Calculate Authority Score (Max 20)
        a_score = (authority / 100) * 20

        # Calculate Need Score (Max 25)
        n_score = (need / 100) * 25

        # Calculate Urgency/Timeline Score (Max 20)
        t_score = (urgency / 100) * 20

        total_score = b_score + a_score + n_score + t_score

        # Determine Tier & Action
        if total_score >= 80:
            action = "CRITICAL: Close immediately. Founder intervention required."
            tier = ServiceTier.GENERAL  # High value
        elif total_score >= 60:
            action = "PRIORITY: Schedule strategy session within 24h."
            tier = ServiceTier.WARRIOR
        else:
            action = "NURTURE: Send automated Binh Phap sequence."
            tier = ServiceTier.WARRIOR

        return total_score, action, tier
