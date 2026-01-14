"""
🎁 Loyalty Rewards - Tenure-Based Benefits

Rewards AgencyEr based on how long they've been with AgencyOS.
The longer they stay, the more valuable it becomes.

Usage:
    from antigravity.core.loyalty_rewards import LoyaltyProgram
    program = LoyaltyProgram()
    program.print_status()
"""

from typing import Dict, Any, List, Optional
from dataclasses import dataclass
from datetime import datetime, timedelta
from pathlib import Path
import json


@dataclass
class LoyaltyTier:
    """Loyalty tier definition."""
    name: str
    emoji: str
    min_months: int
    discount: float
    benefits: List[str]


# Loyalty Tiers
TIERS: Dict[str, LoyaltyTier] = {
    "bronze": LoyaltyTier(
        name="Bronze Agent",
        emoji="🥉",
        min_months=0,
        discount=0.0,
        benefits=["Basic support", "Community access"],
    ),
    "silver": LoyaltyTier(
        name="Silver Agent",
        emoji="🥈",
        min_months=12,
        discount=0.05,
        benefits=["5% discount", "Priority support", "Early updates"],
    ),
    "gold": LoyaltyTier(
        name="Gold Agent",
        emoji="🥇",
        min_months=24,
        discount=0.10,
        benefits=["10% discount", "VIP support", "Beta access", "Agency spotlight"],
    ),
    "platinum": LoyaltyTier(
        name="Platinum Agent",
        emoji="💎",
        min_months=36,
        discount=0.15,
        benefits=["15% discount", "Dedicated support", "Feature requests", "Co-marketing"],
    ),
    "diamond": LoyaltyTier(
        name="Diamond Agent",
        emoji="👑",
        min_months=60,
        discount=0.20,
        benefits=["20% discount", "Revenue share", "Advisory board", "Custom features"],
    ),
}


class LoyaltyProgram:
    """
    🎁 Loyalty Program
    
    Tracks tenure and rewards long-term AgencyEr.
    """
    
    def __init__(self, storage_path: str = ".antigravity/loyalty"):
        self.storage_path = Path(storage_path)
        self.storage_path.mkdir(parents=True, exist_ok=True)
        self.start_date: Optional[datetime] = None
        self.total_revenue: float = 0
        self.referrals: int = 0
        self._load_data()
    
    def register(self, start_date: datetime = None):
        """Register start date for loyalty tracking."""
        if start_date is None:
            start_date = datetime.now()
        self.start_date = start_date
        self._save_data()
    
    def get_tenure_months(self) -> int:
        """Get tenure in months."""
        if not self.start_date:
            return 0
        delta = datetime.now() - self.start_date
        return int(delta.days / 30)
    
    def get_current_tier(self) -> LoyaltyTier:
        """Get current loyalty tier."""
        months = self.get_tenure_months()
        
        # Find highest tier they qualify for
        current = TIERS["bronze"]
        for tier in TIERS.values():
            if months >= tier.min_months:
                current = tier
        
        return current
    
    def get_next_tier(self) -> Optional[LoyaltyTier]:
        """Get next tier to achieve."""
        months = self.get_tenure_months()
        
        for tier in TIERS.values():
            if months < tier.min_months:
                return tier
        
        return None  # Already at highest
    
    def get_months_to_next_tier(self) -> int:
        """Get months until next tier."""
        next_tier = self.get_next_tier()
        if not next_tier:
            return 0
        return next_tier.min_months - self.get_tenure_months()
    
    def add_revenue(self, amount: float):
        """Track revenue through AgencyOS."""
        self.total_revenue += amount
        self._save_data()
    
    def add_referral(self):
        """Track referral."""
        self.referrals += 1
        self._save_data()
    
    def calculate_savings(self) -> float:
        """Calculate savings from loyalty discount."""
        tier = self.get_current_tier()
        return self.total_revenue * tier.discount
    
    def _save_data(self):
        """Save loyalty data."""
        data = {
            "start_date": self.start_date.isoformat() if self.start_date else None,
            "total_revenue": self.total_revenue,
            "referrals": self.referrals,
        }
        path = self.storage_path / "loyalty.json"
        path.write_text(json.dumps(data, indent=2))
    
    def _load_data(self):
        """Load loyalty data."""
        try:
            path = self.storage_path / "loyalty.json"
            if path.exists():
                data = json.loads(path.read_text())
                if data.get("start_date"):
                    self.start_date = datetime.fromisoformat(data["start_date"])
                self.total_revenue = data.get("total_revenue", 0)
                self.referrals = data.get("referrals", 0)
            else:
                # First time - register now
                self.register()
        except Exception:
            self.register()
    
    def print_status(self):
        """Print loyalty status."""
        tier = self.get_current_tier()
        next_tier = self.get_next_tier()
        months = self.get_tenure_months()
        
        print("\n" + "═" * 50)
        print("║" + "🎁 LOYALTY PROGRAM STATUS".center(48) + "║")
        print("═" * 50)
        
        print(f"\n{tier.emoji} CURRENT TIER: {tier.name}")
        print(f"   Tenure: {months} months")
        print(f"   Discount: {tier.discount:.0%}")
        print(f"   Benefits:")
        for benefit in tier.benefits:
            print(f"   • {benefit}")
        
        if next_tier:
            months_left = self.get_months_to_next_tier()
            print(f"\n🎯 NEXT TIER: {next_tier.name}")
            print(f"   {months_left} months to unlock")
            print(f"   New discount: {next_tier.discount:.0%}")
        else:
            print(f"\n👑 MAXIMUM TIER ACHIEVED!")
        
        print(f"\n💰 STATS:")
        print(f"   Total Revenue: ${self.total_revenue:,.0f}")
        print(f"   Savings: ${self.calculate_savings():,.0f}")
        print(f"   Referrals: {self.referrals}")
        
        print("═" * 50)


def get_loyalty_program() -> LoyaltyProgram:
    """Get global loyalty program instance."""
    return LoyaltyProgram()
