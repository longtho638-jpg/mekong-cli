"""
💰 MoneyMaker - Revenue Autopilot Engine
========================================

The primary commercial engine of Agency OS. Implements the 13-Chapter 
Binh Pháp pricing model and ensures all deals adhere to the 
mandatory WIN-WIN-WIN alignment framework.

Features:
- 📖 13-Chapter Strategic Pricing: Value-based services.
- 💂 Tiered Service Levels: Warrior, General, Tướng Quân.
- ⚖️ WIN-WIN-WIN Gatekeeper: Governance check for every deal.
- 📊 Sales Intelligence: Automatic lead qualification (BANT).

Binh Pháp: 💰 Tài (Wealth) - Generating and managing resources.
"""

import logging
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from typing import Dict, List, Optional, Tuple, Any, Union

from .base import BaseEngine

# Configure logging
logger = logging.getLogger(__name__)

class ServiceTier(Enum):
    """Client engagement levels based on strategic depth."""
    WARRIOR = "warrior"        # Tier 1: Pre-Seed/Seed
    GENERAL = "general"        # Tier 2: Series A
    TUONG_QUAN = "tuong_quan"  # Tier 3: Venture Studio / Co-Founder


# 13-Chapter Binh Pháp Pricing Table (2026 Standards)
BINH_PHAP_SERVICES = {
    1:  {"name": "Kế Hoạch", "label": "Strategy Assessment", "price": 5000},
    2:  {"name": "Tác Chiến", "label": "Runway Workshop", "price": 3000},
    3:  {"name": "Mưu Công", "label": "Win-Without-Fighting", "price": 8000},
    4:  {"name": "Hình Thế", "label": "Moat Audit", "price": 5000},
    5:  {"name": "Thế Trận", "label": "Growth Consulting", "price": 5000, "recurring": True},
    6:  {"name": "Hư Thực", "label": "Anti-Dilution Shield", "price": 10000},
    7:  {"name": "Quân Tranh", "label": "Speed Sprint", "price": 15000},
    8:  {"name": "Cửu Biến", "label": "Pivot Workshop", "price": 5000},
    9:  {"name": "Hành Quân", "label": "OKR Implementation", "price": 3000, "quarterly": True},
    10: {"name": "Địa Hình", "label": "Market Entry", "price": 8000},
    11: {"name": "Cửu Địa", "label": "Crisis Retainer", "price": 5000, "recurring": True},
    12: {"name": "Hỏa Công", "label": "Disruption Strategy", "price": 10000},
    13: {"name": "Dụng Gián", "label": "VC Intelligence", "price": 3000},
}

# Tier-based retainer and equity expectations
TIER_PROFILES = {
    ServiceTier.WARRIOR: {
        "retainer_usd": 2000,
        "equity_range": (5.0, 8.0),
        "success_fee_pct": 2.0
    },
    ServiceTier.GENERAL: {
        "retainer_usd": 5000,
        "equity_range": (3.0, 5.0),
        "success_fee_pct": 1.5
    },
    ServiceTier.TUONG_QUAN: {
        "retainer_usd": 0,
        "equity_range": (15.0, 30.0),
        "success_fee_pct": 0.0
    },
}


@dataclass
class Quote:
    """A detailed financial proposal for a client."""
    id: int
    client_name: str
    services: List[Dict[str, Any]]
    tier: ServiceTier
    one_time_total: float
    monthly_retainer: float
    equity_percent: float = 0.0
    success_fee_percent: float = 0.0
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


class MoneyMaker(BaseEngine):
    """
    💰 Money Maker Engine
    
    Automates the commercial side of agency operations.
    Ensures profitability while maintaining the 'Win Without Fighting' philosophy.
    """

    def __init__(self, data_dir: str = ".antigravity"):
        super().__init__(data_dir)
        self.quotes: List[Quote] = []
        self._next_id = 1

    def generate_quote(
        self,
        client_name: str,
        chapters: List[int],
        tier: Union[ServiceTier, str] = ServiceTier.WARRIOR,
        custom_equity: Optional[float] = None
    ) -> Quote:
        """Constructs a new client proposal based on Binh Pháp modules."""
        if isinstance(tier, str):
            tier = ServiceTier(tier.lower())
            
        service_list = []
        total_one_time = 0.0
        total_recurring = 0.0

        for chapter_id in chapters:
            if chapter_id not in BINH_PHAP_SERVICES: continue
            
            svc = BINH_PHAP_SERVICES[chapter_id].copy()
            svc["chapter"] = chapter_id
            service_list.append(svc)
            
            if svc.get("recurring"):
                total_recurring += svc["price"]
            elif svc.get("quarterly"):
                # Normalize quarterly to ARR contribution
                total_one_time += svc["price"] * 4
            else:
                total_one_time += svc["price"]

        # Apply Tier Logic
        profile = TIER_PROFILES[tier]
        equity = custom_equity if custom_equity is not None else sum(profile["equity_range"]) / 2

        quote = Quote(
            id=self._next_id,
            client_name=client_name,
            services=service_list,
            tier=tier,
            one_time_total=total_one_time,
            monthly_retainer=total_recurring + profile["retainer_usd"],
            equity_percent=equity,
            success_fee_percent=profile["success_fee_pct"]
        )
        
        # Validation before adding to history
        win3 = self.validate_win3(quote)
        quote.win3_validated = win3.is_valid
        
        self.quotes.append(quote)
        self._next_id += 1
        logger.info(f"Generated quote #{quote.id} for {client_name} (Score: {win3.score})")
        return quote

    def validate_win3(self, quote: Quote) -> Win3Result:
        """
        Governance Check: Ensures the deal benefits the Owner, Agency, and Client.
        Based on Hiến Pháp Agency OS.
        """
        warnings = []
        score = 100

        # 1. 👑 OWNER WIN (Equity + Cashflow)
        if quote.equity_percent <= 0 and quote.monthly_retainer < 1000:
            warnings.append("Low owner alignment (no equity + low cashflow)")
            score -= 30
        
        # 2. 🏢 AGENCY WIN (Moat + Retainer)
        if quote.monthly_retainer < 2000 and quote.success_fee_percent < 1.0:
            warnings.append("Agency risk: Recurring revenue below sustainability threshold")
            score -= 20
            
        # 3. 🚀 CLIENT WIN (Outcome + Value)
        if not quote.services:
            warnings.append("Zero client value: No services defined")
            score -= 50
        
        # Ethical Boundaries
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
                "client": f"{len(quote.services)} Modules | ${quote.one_time_total} Project Value"
            },
            warnings=warnings
        )

    def auto_qualify_lead(
        self,
        budget: float,
        authority: int,  # 0-100
        need: int,       # 0-100
        urgency: int     # 0-100
    ) -> Tuple[int, str, ServiceTier]:
        """
        Lead Scoring Engine (BANT-inspired).
        Returns: (Score, Recommended Action, Tier)
        """
        # Weighted scoring
        b_score = min(budget / 10000, 1.0) * 35 # Budget weight 35%
        a_score = (authority / 100) * 20        # Authority weight 20%
        n_score = (need / 100) * 25             # Need weight 25%
        u_score = (urgency / 100) * 20          # Urgency weight 20%
        
        final_score = int(b_score + a_score + n_score + u_score)

        if final_score >= 85:
            return final_score, "🔥 CRITICAL LEAD - Direct phone call", ServiceTier.GENERAL
        if final_score >= 65:
            return final_score, "🌡️ WARM LEAD - Send customized proposal", ServiceTier.WARRIOR
        
        return final_score, "❄️ COLD LEAD - Automate follow-up sequence", ServiceTier.WARRIOR

    def get_pricing_catalog(self) -> str:
        """Renders the 13-Chapter Binh Pháp pricing menu."""
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

    def get_stats(self) -> Dict[str, Any]:
        """Performance metrics for the revenue engine."""
        quoted = sum(q.one_time_total for q in self.quotes)
        return {
            "funnel": {
                "total_quotes": len(self.quotes),
                "total_quoted_value": quoted,
                "avg_quote_value": quoted / len(self.quotes) if self.quotes else 0
            },
            "compliance": {
                "win3_pass_rate": (sum(1 for q in self.quotes if q.win3_validated) / len(self.quotes) * 100) if self.quotes else 0
            }
        }

    def format_quote_visual(self, quote: Quote) -> str:
        """ASCII representation of a proposal for CLI output."""
        win3 = self.validate_win3(quote)
        
        lines = [
            "╔═══════════════════════════════════════════════════════════╗",
            f"║  📜 PROPOSAL #{quote.id:04d}                                     ║",
            f"║  CLIENT: {quote.client_name:<48} ║",
            f"║  TIER:   {quote.tier.value.upper():<48} ║",
            "╠═══════════════════════════════════════════════════════════╣",
            "║  STRATEGIC MODULES                                        ║",
        ]
        
        for svc in quote.services:
            lines.append(f"║    {svc['chapter']:2}️⃣ {svc['label']:<35} ${svc['price']:>8,} ║")
        
        lines.extend([
            "╠═══════════════════════════════════════════════════════════╣",
            f"║  ONE-TIME INVESTMENT:                     ${quote.one_time_total:>12,.0f} ║",
            f"║  MONTHLY RETAINER:                        ${quote.monthly_retainer:>12,.0f} ║",
            f"║  EQUITY COMMITMENT:                       {quote.equity_percent:>12.1f}% ║",
            "╠═══════════════════════════════════════════════════════════╣",
            f"║  WIN-WIN-WIN STATUS:    {'✅ APPROVED' if win3.is_valid else '❌ REJECTED':>30} ║",
            f"║  Alignment Score:       {win3.score}/100                               ║",
            "╚═══════════════════════════════════════════════════════════╝",
        ])
        
        return "\n".join(lines)