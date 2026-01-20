"""
Money Maker Quoting Logic.
"""
import logging
from decimal import Decimal
from typing import List, Optional, Union

from antigravity.core.finance import sanitize_client_name

from .governance import Win3Governance
from .models import (
    BINH_PHAP_SERVICES,
    TIER_PROFILES,
    Quote,
    ServiceTier,
)

logger = logging.getLogger(__name__)


class QuoteGenerator:
    """Generates detailed financial proposals."""

    def __init__(self):
        self.governance = Win3Governance()

    def generate_quote(
        self,
        quote_id: int,
        client_name: str,
        chapters: List[int],
        tier: Union[ServiceTier, str] = ServiceTier.WARRIOR,
        custom_equity: Optional[float] = None,
    ) -> Quote:
        """
        Generate validated client quote.

        Args:
            quote_id: Unique ID for the quote
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
        equity = Decimal(
            str(custom_equity if custom_equity is not None else sum(profile["equity_range"]) / 2)
        )

        # Create quote
        quote = Quote(
            id=quote_id,
            client_name=safe_client_name,
            services=service_list,
            tier=tier,
            one_time_total=total_one_time,
            monthly_retainer=total_recurring + Decimal(str(profile["retainer_usd"])),
            equity_percent=equity,
            success_fee_percent=Decimal(str(profile["success_fee_pct"])),
        )

        # Validate WIN-WIN-WIN
        win3 = self.governance.validate(quote)
        quote.win3_validated = win3.is_valid

        # Log score for context (though not stored on quote object directly unless we added a field)
        logger.info(f"Generated quote #{quote.id} for {safe_client_name} (Score: {win3.score})")

        return quote

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
