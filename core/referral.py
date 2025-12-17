"""
🎁 Referral System - Grow Through Referrals
=============================================

Track client referrals and pay commissions.
Word of mouth is the best marketing!

Features:
- Referral tracking
- Commission calculation
- Payout management
- Leaderboard
"""

from typing import Dict, List, Any, Optional
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
import uuid


class ReferralStatus(Enum):
    """Referral status."""
    PENDING = "pending"
    QUALIFIED = "qualified"
    CONVERTED = "converted"
    PAID = "paid"


@dataclass
class Referral:
    """A client referral."""
    id: str
    referrer_name: str
    referrer_email: str
    referred_name: str
    referred_email: str
    referred_company: str
    status: ReferralStatus
    deal_value: float = 0
    commission_rate: float = 0.10  # 10% default
    commission_amount: float = 0
    created_at: datetime = field(default_factory=datetime.now)
    converted_at: Optional[datetime] = None
    paid_at: Optional[datetime] = None


@dataclass
class ReferralProgram:
    """Referral program settings."""
    name: str
    commission_rate: float
    min_deal_value: float
    max_commission: float
    payout_threshold: float


class ReferralSystem:
    """
    Referral System.
    
    Track referrals and manage commissions.
    """
    
    def __init__(self, agency_name: str):
        self.agency_name = agency_name
        self.referrals: Dict[str, Referral] = {}
        
        # Default program
        self.program = ReferralProgram(
            name="Partner Program",
            commission_rate=0.10,  # 10%
            min_deal_value=500,
            max_commission=2000,
            payout_threshold=100
        )
    
    def create_referral(
        self,
        referrer_name: str,
        referrer_email: str,
        referred_name: str,
        referred_email: str,
        referred_company: str
    ) -> Referral:
        """Create a new referral."""
        referral = Referral(
            id=f"REF-{uuid.uuid4().hex[:6].upper()}",
            referrer_name=referrer_name,
            referrer_email=referrer_email,
            referred_name=referred_name,
            referred_email=referred_email,
            referred_company=referred_company,
            status=ReferralStatus.PENDING,
            commission_rate=self.program.commission_rate
        )
        
        self.referrals[referral.id] = referral
        return referral
    
    def convert_referral(self, referral_id: str, deal_value: float) -> Referral:
        """Mark referral as converted."""
        referral = self.referrals.get(referral_id)
        if not referral:
            raise ValueError(f"Referral {referral_id} not found")
        
        referral.status = ReferralStatus.CONVERTED
        referral.deal_value = deal_value
        referral.converted_at = datetime.now()
        
        # Calculate commission
        commission = deal_value * referral.commission_rate
        referral.commission_amount = min(commission, self.program.max_commission)
        
        return referral
    
    def get_referrer_stats(self, referrer_email: str) -> Dict[str, Any]:
        """Get stats for a specific referrer."""
        referrer_refs = [r for r in self.referrals.values() 
                        if r.referrer_email == referrer_email]
        
        total = len(referrer_refs)
        converted = sum(1 for r in referrer_refs if r.status in [ReferralStatus.CONVERTED, ReferralStatus.PAID])
        total_earned = sum(r.commission_amount for r in referrer_refs if r.status in [ReferralStatus.CONVERTED, ReferralStatus.PAID])
        pending_payout = sum(r.commission_amount for r in referrer_refs if r.status == ReferralStatus.CONVERTED)
        
        return {
            "total_referrals": total,
            "converted": converted,
            "conversion_rate": (converted / total * 100) if total > 0 else 0,
            "total_earned": total_earned,
            "pending_payout": pending_payout
        }
    
    def format_referral(self, referral: Referral) -> str:
        """Format referral details."""
        status_icons = {
            ReferralStatus.PENDING: "⏳",
            ReferralStatus.QUALIFIED: "🔍",
            ReferralStatus.CONVERTED: "✅",
            ReferralStatus.PAID: "💰"
        }
        
        lines = [
            "╔═══════════════════════════════════════════════════════════╗",
            f"║  🎁 REFERRAL: {referral.id:<40}  ║",
            f"║  Status: {status_icons[referral.status]} {referral.status.value.capitalize():<42}  ║",
            "╠═══════════════════════════════════════════════════════════╣",
            f"║  Referrer: {referral.referrer_name:<42}  ║",
            f"║  Email: {referral.referrer_email:<45}  ║",
            "║                                                           ║",
            f"║  Referred: {referral.referred_name:<42}  ║",
            f"║  Company: {referral.referred_company:<43}  ║",
        ]
        
        if referral.status in [ReferralStatus.CONVERTED, ReferralStatus.PAID]:
            lines.extend([
                "║                                                           ║",
                f"║  💰 Deal Value: ${referral.deal_value:>12,.0f}                       ║",
                f"║  💵 Commission ({referral.commission_rate*100:.0f}%): ${referral.commission_amount:>10,.0f}                    ║",
            ])
        
        lines.extend([
            "╠═══════════════════════════════════════════════════════════╣",
            f"║  🏯 {self.agency_name} Partner Program                   ║",
            "╚═══════════════════════════════════════════════════════════╝",
        ])
        
        return "\n".join(lines)
    
    def format_leaderboard(self) -> str:
        """Format referral leaderboard."""
        # Group by referrer
        referrer_stats = {}
        for ref in self.referrals.values():
            if ref.referrer_email not in referrer_stats:
                referrer_stats[ref.referrer_email] = {
                    "name": ref.referrer_name,
                    "referrals": 0,
                    "converted": 0,
                    "earned": 0
                }
            referrer_stats[ref.referrer_email]["referrals"] += 1
            if ref.status in [ReferralStatus.CONVERTED, ReferralStatus.PAID]:
                referrer_stats[ref.referrer_email]["converted"] += 1
                referrer_stats[ref.referrer_email]["earned"] += ref.commission_amount
        
        # Sort by earnings
        sorted_referrers = sorted(referrer_stats.items(), 
                                  key=lambda x: x[1]["earned"], reverse=True)
        
        lines = [
            "╔═══════════════════════════════════════════════════════════╗",
            f"║  🏆 REFERRAL LEADERBOARD                                  ║",
            "╠═══════════════════════════════════════════════════════════╣",
            "║  Rank │ Partner          │ Referrals │ Conv │ Earned     ║",
            "║  ─────────────────────────────────────────────────────── ║",
        ]
        
        medals = ["🥇", "🥈", "🥉"]
        for i, (email, stats) in enumerate(sorted_referrers[:5]):
            rank = medals[i] if i < 3 else f" {i+1}"
            name = stats["name"][:16]
            lines.append(
                f"║  {rank:<4} │ {name:<16} │ {stats['referrals']:>9} │ {stats['converted']:>4} │ ${stats['earned']:>9,.0f} ║"
            )
        
        total_earned = sum(s["earned"] for s in referrer_stats.values())
        lines.extend([
            "║                                                           ║",
            f"║  💰 Total Commissions Paid: ${total_earned:>14,.0f}             ║",
            "╠═══════════════════════════════════════════════════════════╣",
            f"║  🎁 Refer & Earn {self.program.commission_rate*100:.0f}% (up to ${self.program.max_commission:,.0f})             ║",
            "╚═══════════════════════════════════════════════════════════╝",
        ])
        
        return "\n".join(lines)


# Example usage
if __name__ == "__main__":
    system = ReferralSystem("Saigon Digital Hub")
    
    print("🎁 Referral System")
    print("=" * 60)
    print()
    
    # Create referrals
    ref1 = system.create_referral(
        referrer_name="Ms. Mai",
        referrer_email="mai@example.com",
        referred_name="Mr. Tuan",
        referred_email="tuan@techstartup.vn",
        referred_company="Tech Startup VN"
    )
    
    ref2 = system.create_referral(
        referrer_name="Ms. Mai",
        referrer_email="mai@example.com",
        referred_name="Ms. Linh",
        referred_email="linh@coffeelab.vn",
        referred_company="Coffee Lab"
    )
    
    ref3 = system.create_referral(
        referrer_name="Dr. Pham",
        referrer_email="pham@dental.vn",
        referred_name="Mr. Vinh",
        referred_email="vinh@restaurant.vn",
        referred_company="Saigon Restaurant"
    )
    
    # Convert some referrals
    system.convert_referral(ref1.id, 3000)
    system.convert_referral(ref2.id, 2500)
    system.convert_referral(ref3.id, 1500)
    
    print(system.format_referral(ref1))
    print()
    
    print(system.format_leaderboard())
    print()
    
    print(f"✅ {len(system.referrals)} referrals tracked!")
