"""
MoneyMaker - Revenue Autopilot Engine.

Features:
- 13-chapter Binh Pháp pricing
- Tiered retainer models
- WIN-WIN-WIN validation
- Quote & proposal generation

🏯 Binh Pháp: "Kiếm tiền dễ như ăn kẹo" - Making money as easy as eating candy
"""

from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from typing import Dict, List, Optional, Tuple

from .base import BaseEngine


class ServiceTier(Enum):
    """Client tier levels."""
    WARRIOR = "warrior"      # Pre-Seed/Seed
    GENERAL = "general"      # Series A
    TUONG_QUAN = "tuong_quan"  # Venture Studio


class DealType(Enum):
    """Deal structure types."""
    PROJECT = "project"
    RETAINER = "retainer"
    EQUITY = "equity"
    HYBRID = "hybrid"


# 13-Chapter Binh Pháp Pricing Table
BINH_PHAP_PRICING = {
    1: {"name": "Kế Hoạch", "service": "Strategy Assessment", "price": 5000},
    2: {"name": "Tác Chiến", "service": "Runway Workshop", "price": 3000},
    3: {"name": "Mưu Công", "service": "Win-Without-Fighting", "price": 8000},
    4: {"name": "Hình Thế", "service": "Moat Audit", "price": 5000},
    5: {"name": "Thế Trận", "service": "Growth Consulting", "price": 5000, "recurring": True},
    6: {"name": "Hư Thực", "service": "Anti-Dilution Shield", "price": 10000},
    7: {"name": "Quân Tranh", "service": "Speed Sprint", "price": 15000},
    8: {"name": "Cửu Biến", "service": "Pivot Workshop", "price": 5000},
    9: {"name": "Hành Quân", "service": "OKR Implementation", "price": 3000, "quarterly": True},
    10: {"name": "Địa Hình", "service": "Market Entry", "price": 8000},
    11: {"name": "Cửu Địa", "service": "Crisis Retainer", "price": 5000, "recurring": True},
    12: {"name": "Hỏa Công", "service": "Disruption Strategy", "price": 10000},
    13: {"name": "Dụng Gián", "service": "VC Intelligence", "price": 3000},
}

# Tier-based retainer structure
TIER_PRICING = {
    ServiceTier.WARRIOR: {
        "retainer": 2000,
        "equity_range": (5, 8),
        "success_fee": 0.02,  # 2% of funding
    },
    ServiceTier.GENERAL: {
        "retainer": 5000,
        "equity_range": (3, 5),  # Additional
        "success_fee": 0.015,  # 1.5%
    },
    ServiceTier.TUONG_QUAN: {
        "retainer": 0,  # Deferred
        "equity_range": (15, 30),
        "success_fee": 0,  # Shared exit
    },
}


@dataclass
class Quote:
    """Quote for client."""
    id: int
    client_name: str
    services: List[Dict]
    tier: ServiceTier
    total_amount: float
    equity_percent: float = 0
    recurring_monthly: float = 0
    success_fee_percent: float = 0
    created_at: datetime = field(default_factory=datetime.now)
    status: str = "draft"
    win3_validated: bool = False


@dataclass
class Win3Result:
    """WIN-WIN-WIN validation result."""
    owner_win: str
    agency_win: str
    client_win: str
    is_valid: bool
    alignment_score: int  # 0-100
    warnings: List[str] = field(default_factory=list)


class MoneyMaker(BaseEngine):
    """
    Revenue Autopilot Engine.
    
    Example:
        mm = MoneyMaker()
        quote = mm.generate_quote("ABC Corp", [1, 3, 5], ServiceTier.WARRIOR)
        if mm.validate_win3(quote).is_valid:
            mm.send_quote(quote)
    """

    def __init__(self, data_dir: str = ".antigravity"):
        super().__init__(data_dir)
        self.quotes: List[Quote] = []
        self._next_id = 1

    def generate_quote(
        self,
        client_name: str,
        chapter_ids: List[int],
        tier: ServiceTier = ServiceTier.WARRIOR,
        custom_equity: Optional[float] = None
    ) -> Quote:
        """
        Generate quote using 13-chapter Binh Pháp pricing.
        
        Args:
            client_name: Client company name
            chapter_ids: List of Binh Pháp chapter IDs (1-13)
            tier: Client tier level
            custom_equity: Optional custom equity percentage
        """
        services = []
        total = 0.0
        monthly = 0.0

        for cid in chapter_ids:
            if cid not in BINH_PHAP_PRICING:
                continue
            svc = BINH_PHAP_PRICING[cid].copy()
            svc["chapter"] = cid
            services.append(svc)
            
            if svc.get("recurring"):
                monthly += svc["price"]
            elif svc.get("quarterly"):
                total += svc["price"] * 4  # Annual
            else:
                total += svc["price"]

        # Apply tier pricing
        tier_info = TIER_PRICING[tier]
        equity_range = tier_info["equity_range"]
        equity = custom_equity if custom_equity else (equity_range[0] + equity_range[1]) / 2

        quote = Quote(
            id=self._next_id,
            client_name=client_name,
            services=services,
            tier=tier,
            total_amount=total,
            equity_percent=equity,
            recurring_monthly=monthly + tier_info["retainer"],
            success_fee_percent=tier_info["success_fee"] * 100
        )
        
        self.quotes.append(quote)
        self._next_id += 1
        return quote

    def validate_win3(self, quote: Quote) -> Win3Result:
        """
        Validate WIN-WIN-WIN alignment for a quote.
        
        Returns validation result with alignment score.
        """
        warnings = []
        score = 100

        # Owner WIN: Must have equity or cash flow
        if quote.equity_percent == 0 and quote.recurring_monthly == 0:
            warnings.append("No equity or recurring revenue for owner")
            score -= 30
        
        owner_win = f"Equity {quote.equity_percent}% + ${quote.recurring_monthly}/mo"

        # Agency WIN: Must have retainer or success fee
        if quote.recurring_monthly < 1000 and quote.success_fee_percent == 0:
            warnings.append("Low recurring revenue for agency sustainability")
            score -= 20
        
        agency_win = f"Retainer ${quote.recurring_monthly}/mo + {quote.success_fee_percent}% success"

        # Client WIN: Must have clear value (services > $0)
        if quote.total_amount == 0 and len(quote.services) == 0:
            warnings.append("No services defined for client value")
            score -= 50
        
        client_win = f"{len(quote.services)} services, ${quote.total_amount} project value"

        # Equity red flags
        if quote.equity_percent > 30:
            warnings.append("Equity > 30% may be unfair to founders")
            score -= 20
        
        if quote.equity_percent > 0 and quote.total_amount < 5000:
            warnings.append("Low cash + equity may indicate misaligned incentives")
            score -= 10

        is_valid = score >= 60 and len([w for w in warnings if "No " in w]) == 0

        return Win3Result(
            owner_win=owner_win,
            agency_win=agency_win,
            client_win=client_win,
            is_valid=is_valid,
            alignment_score=max(0, score),
            warnings=warnings
        )

    def auto_qualify_lead(
        self,
        budget: float,
        authority: int,  # 0-100
        need: int,       # 0-100
        timeline: int    # 0-100
    ) -> Tuple[int, str, ServiceTier]:
        """
        Auto-qualify lead using BANT scoring.
        
        Returns (score, action, recommended_tier)
        """
        # Weight factors
        budget_score = min(100, (budget / 5000) * 100) * 0.30
        auth_score = authority * 0.25
        need_score = need * 0.25
        time_score = timeline * 0.20
        
        total = int(budget_score + auth_score + need_score + time_score)

        if total >= 80:
            action = "🔥 HOT LEAD - Close immediately"
            tier = ServiceTier.GENERAL
        elif total >= 60:
            action = "🌡️ WARM LEAD - Nurture with content"
            tier = ServiceTier.WARRIOR
        else:
            action = "❄️ COLD LEAD - Follow up in 30 days"
            tier = ServiceTier.WARRIOR

        return total, action, tier

    def get_pricing_menu(self) -> str:
        """Get formatted 13-chapter pricing menu."""
        lines = [
            "╔═══════════════════════════════════════════════════════════╗",
            "║  🏯 BINH PHÁP 13-CHAPTER PRICING MENU                     ║",
            "╠═══════════════════════════════════════════════════════════╣",
        ]
        
        for cid, info in BINH_PHAP_PRICING.items():
            emoji = "📆" if info.get("recurring") or info.get("quarterly") else "💰"
            price_str = f"${info['price']:,}"
            if info.get("recurring"):
                price_str += "/mo"
            elif info.get("quarterly"):
                price_str += "/qtr"
            
            line = f"║  {cid:2}️⃣ {info['name']:<10} │ {info['service']:<25} │ {price_str:>10} ║"
            lines.append(line)
        
        lines.append("╚═══════════════════════════════════════════════════════════╝")
        return "\n".join(lines)

    def get_stats(self) -> Dict:
        """Get Money Maker statistics."""
        total_quoted = sum(q.total_amount for q in self.quotes)
        validated = sum(1 for q in self.quotes if q.win3_validated)
        
        return {
            "total_quotes": len(self.quotes),
            "total_quoted_value": total_quoted,
            "win3_validated": validated,
            "avg_deal_size": total_quoted / len(self.quotes) if self.quotes else 0,
            "quotes_by_tier": {
                tier.value: sum(1 for q in self.quotes if q.tier == tier)
                for tier in ServiceTier
            }
        }

    def format_quote(self, quote: Quote) -> str:
        """Format quote as displayable text."""
        win3 = self.validate_win3(quote)
        
        lines = [
            f"╔═══════════════════════════════════════════════════════════╗",
            f"║  📜 QUOTE #{quote.id:04d}                                       ║",
            f"║  Client: {quote.client_name:<47} ║",
            f"║  Tier: {quote.tier.value.upper():<49} ║",
            f"╠═══════════════════════════════════════════════════════════╣",
            f"║  SERVICES                                                 ║",
        ]
        
        for svc in quote.services:
            lines.append(f"║    {svc['chapter']:2}️⃣ {svc['service']:<35} ${svc['price']:>8,} ║")
        
        lines.extend([
            f"╠═══════════════════════════════════════════════════════════╣",
            f"║  PROJECT TOTAL:                           ${quote.total_amount:>12,.0f} ║",
            f"║  RECURRING MONTHLY:                       ${quote.recurring_monthly:>12,.0f} ║",
            f"║  EQUITY:                                  {quote.equity_percent:>12.1f}% ║",
            f"║  SUCCESS FEE:                             {quote.success_fee_percent:>12.1f}% ║",
            f"╠═══════════════════════════════════════════════════════════╣",
            f"║  WIN-WIN-WIN ALIGNMENT: {'✅ VALID' if win3.is_valid else '❌ INVALID':>30} ║",
            f"║  Score: {win3.alignment_score}/100                                     ║",
            f"╚═══════════════════════════════════════════════════════════╝",
        ])
        
        return "\n".join(lines)
