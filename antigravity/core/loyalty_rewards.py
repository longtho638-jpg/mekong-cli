"""
Loyalty Rewards - Tenure-Based Benefits
==========================================

Rewards AgencyEr based on their commitment and duration within the Agency OS
ecosystem. The program encourages long-term retention and growth through
tiered discounts and exclusive operational benefits.

Binh Phap: Tin (Trust) - Rewarding loyalty over time.
"""

import json
import logging
from datetime import datetime
from pathlib import Path
from typing import Optional, Union

from .loyalty_tiers import TIERS, LoyaltyTier, get_tier_by_tenure
from .loyalty_tiers import get_next_tier as _get_next_tier

# Configure logging
logger = logging.getLogger(__name__)


class LoyaltyProgram:
    """
    🎁 Loyalty & Tenure Engine

    Calculates and persists user loyalty status based on start date
    and total ecosystem revenue.
    """

    def __init__(self, storage_path: Union[str, Path] = ".antigravity/loyalty"):
        self.storage_path = Path(storage_path)
        self.storage_path.mkdir(parents=True, exist_ok=True)
        self.data_file = self.storage_path / "loyalty_data.json"

        self.start_date: datetime = datetime.now()
        self.total_revenue_usd: float = 0.0
        self.referral_count: int = 0

        self._load_data()

    def register(self, start_date: Optional[datetime] = None):
        """Sets the baseline start date for tenure calculation."""
        self.start_date = start_date or datetime.now()
        self._save_data()

    def get_tenure_months(self) -> int:
        """Calculates total months elapsed since registration."""
        delta = datetime.now() - self.start_date
        return int(delta.days / 30.44)  # Average month length

    def get_current_tier(self) -> LoyaltyTier:
        """Determines the highest eligible tier based on tenure."""
        return get_tier_by_tenure(self.get_tenure_months())

    def get_next_tier(self) -> Optional[LoyaltyTier]:
        """Identifies the next milestone tier."""
        return _get_next_tier(self.get_tenure_months())

    def record_transaction(self, amount_usd: float):
        """Adds revenue to the total lifetime value (LTV) tracker."""
        self.total_revenue_usd += amount_usd
        self._save_data()

    def calculate_savings(self) -> float:
        """Calculates total lifetime savings based on tier discount."""
        tier = self.get_current_tier()
        return self.total_revenue_usd * tier.discount_rate

    def _save_data(self):
        """Persists loyalty state to JSON."""
        try:
            payload = {
                "start_date": self.start_date.isoformat(),
                "revenue_usd": self.total_revenue_usd,
                "referrals": self.referral_count,
                "last_updated": datetime.now().isoformat(),
            }
            self.data_file.write_text(json.dumps(payload, indent=2), encoding="utf-8")
        except Exception as e:
            logger.error(f"Failed to save loyalty data: {e}")

    def _load_data(self):
        """Loads loyalty state from disk, initializing if missing."""
        if not self.data_file.exists():
            self.register()
            return

        try:
            data = json.loads(self.data_file.read_text(encoding="utf-8"))
            self.start_date = datetime.fromisoformat(data["start_date"])
            self.total_revenue_usd = data.get("revenue_usd", 0.0)
            self.referral_count = data.get("referrals", 0)
        except Exception as e:
            logger.warning(f"Could not load loyalty data: {e}")
            self.register()

    def print_loyalty_dashboard(self):
        """Renders a beautiful status summary for the user."""
        tier = self.get_current_tier()
        next_t = self.get_next_tier()
        months = self.get_tenure_months()

        print("\n" + "═" * 60)
        print("║" + "🎁 AGENCY OS - CHƯƠNG TRÌNH KHÁCH HÀNG THÂN THIẾT".center(52) + "║")
        print("═" * 60)

        print(f"\n  {tier.emoji} HẠNG HIỆN TẠI: {tier.name.upper()}")
        print(f"  📅 Thâm niên: {months} tháng")
        print(f"  💰 Tổng chi tiêu: ${self.total_revenue_usd:,.0f}")
        print(f"  💎 Tổng tiết kiệm: ${self.calculate_savings():,.0f}")

        print("\n  ✅ QUYỀN LỢI ĐANG CÓ:")
        for benefit in tier.benefits:
            print(f"     • {benefit}")

        if next_t:
            remaining = next_t.min_months - months
            print(f"\n  🎯 MỤC TIÊU TIẾP THEO: {next_t.name}")
            print(
                f"     └─Còn {remaining} tháng để nâng cấp lên mức ưu đãi {next_t.discount_rate:.0%}"
            )
        else:
            print("\n  👑 CHÚC MỪNG! Anh đã đạt cấp độ tối cao của Agency OS.")

        print("\n" + "═" * 60 + "\n")


# Global Instance
def get_loyalty_program() -> LoyaltyProgram:
    """Access the shared loyalty system."""
    return LoyaltyProgram()
