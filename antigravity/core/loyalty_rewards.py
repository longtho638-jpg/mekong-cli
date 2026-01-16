'''
🎁 Loyalty Rewards - Tenure-Based Benefits
==========================================

Rewards AgencyEr based on their commitment and duration within the Agency OS
ecosystem. The program encourages long-term retention and growth through
tiered discounts and exclusive operational benefits.

Tiers:
- 🥉 Bronze: Entry level benefits.
- 🥈 Silver: Priority support & 5% Discount.
- 🥇 Gold: Beta access & 10% Discount.
- 💎 Platinum: Strategic advisory & 15% Discount.
- 👑 Diamond: Revenue sharing & 20% Discount.

Binh Pháp: 💎 Tín (Trust) - Rewarding loyalty over time.
'''

import logging
import json
from dataclasses import dataclass
from datetime import datetime
from typing import List, Dict, Optional, Union
from pathlib import Path

# Configure logging
logger = logging.getLogger(__name__)

@dataclass
class LoyaltyTier:
    """Definition of a specific loyalty bracket and its associated perks."""
    id: str
    name: str
    emoji: str
    min_months: int
    discount_rate: float
    benefits: List[str]


# Global Tier Registry
TIERS: Dict[str, LoyaltyTier] = {
    "bronze": LoyaltyTier(
        id="bronze",
        name="Bronze Agent",
        emoji="🥉",
        min_months=0,
        discount_rate=0.0,
        benefits=["Hỗ trợ cơ bản (Email)", "Tham gia cộng đồng Agency OS"]
    ),
    "silver": LoyaltyTier(
        id="silver",
        name="Silver Agent",
        emoji="🥈",
        min_months=12,
        discount_rate=0.05,
        benefits=["Ưu đãi 5% dịch vụ", "Hỗ trợ ưu tiên", "Cập nhật tính năng sớm"]
    ),
    "gold": LoyaltyTier(
        id="gold",
        name="Gold Agent",
        emoji="🥇",
        min_months=24,
        discount_rate=0.10,
        benefits=["Ưu đãi 10% dịch vụ", "VIP support 24/7", "Trải nghiệm bản Beta", "Quảng bá thương hiệu"]
    ),
    "platinum": LoyaltyTier(
        id="platinum",
        name="Platinum Agent",
        emoji="💎",
        min_months=36,
        discount_rate=0.15,
        benefits=["Ưu đãi 15% dịch vụ", "Cố vấn chiến lược 1-1", "Yêu cầu tính năng riêng"]
    ),
    "diamond": LoyaltyTier(
        id="diamond",
        name="Diamond Agent",
        emoji="👑",
        min_months=60,
        discount_rate=0.20,
        benefits=["Ưu đãi 20% dịch vụ", "Chia sẻ doanh thu hệ thống", "Ban cố vấn chiến lược", "Tùy biến module tối cao"]
    ),
}


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
        return int(delta.days / 30.44) # Average month length
    
    def get_current_tier(self) -> LoyaltyTier:
        """Determines the highest eligible tier based on tenure."""
        months = self.get_tenure_months()
        
        # Default to lowest
        current = TIERS["bronze"]
        # Find highest qualifying
        for tier in TIERS.values():
            if months >= tier.min_months:
                if tier.min_months >= current.min_months:
                    current = tier
        return current
    
    def get_next_tier(self) -> Optional[LoyaltyTier]:
        """Identifies the next milestone tier."""
        months = self.get_tenure_months()
        
        # Sort tiers by requirement
        sorted_tiers = sorted(TIERS.values(), key=lambda t: t.min_months)
        for tier in sorted_tiers:
            if tier.min_months > months:
                return tier
        return None
    
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
                "last_updated": datetime.now().isoformat()
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
            print(f"     └─Còn {remaining} tháng để nâng cấp lên mức ưu đãi {next_t.discount_rate:.0%}")
        else:
            print("\n  👑 CHÚC MỪNG! Anh đã đạt cấp độ tối cao của Agency OS.")
            
        print("\n" + "═" * 60 + "\n")


# Global Instance
def get_loyalty_program() -> LoyaltyProgram:
    """Access the shared loyalty system."""
    return LoyaltyProgram()
