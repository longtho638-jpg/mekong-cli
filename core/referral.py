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

import uuid
import logging
import re
from typing import Dict, List, Any, Optional, Union
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from enum import Enum

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class ReferralStatus(Enum):
    """Lifecycle status of a partner referral."""
    PENDING = "pending"
    QUALIFIED = "qualified"
    CONVERTED = "converted"
    PAID = "paid"


@dataclass
class Referral:
    """A client referral record entity."""
    id: str
    referrer_name: str
    referrer_email: str
    referred_name: str
    referred_email: str
    referred_company: str
    status: ReferralStatus = ReferralStatus.PENDING
    deal_value: float = 0.0
    commission_rate: float = 0.10
    commission_amount: float = 0.0
    created_at: datetime = field(default_factory=datetime.now)
    converted_at: Optional[datetime] = None
    paid_at: Optional[datetime] = None

    def __post_init__(self):
        if not self.referrer_email or not self.referred_email:
            raise ValueError("Emails are required for both parties")


@dataclass
class ReferralProgram:
    """Configuration for agency referral rewards."""
    name: str
    commission_rate: float
    max_commission: float
    payout_threshold: float


class ReferralSystem:
    """
    Referral & Partner System.
    
    Orchestrates the lifecycle of partner referrals, from initial lead capture to commission payout.
    """
    
    def __init__(self, agency_name: str):
        self.agency_name = agency_name
        self.referrals: Dict[str, Referral] = {}
        self.program = ReferralProgram("Standard Partner", 0.10, 2000.0, 100.0)
        logger.info(f"Referral System initialized for {agency_name}")
    
    def register_referral(
        self,
        r_name: str, r_email: str,
        ref_name: str, ref_email: str, ref_company: str
    ) -> Referral:
        """Register a new referral in the system."""
        ref = Referral(
            id=f"REF-{uuid.uuid4().hex[:6].upper()}",
            referrer_name=r_name, referrer_email=r_email,
            referred_name=ref_name, referred_email=ref_email,
            referred_company=ref_company, commission_rate=self.program.commission_rate
        )
        self.referrals[ref.id] = ref
        logger.info(f"Referral registered: {ref_name} via {r_name}")
        return ref
    
    def convert_referral(self, ref_id: str, deal_value: float) -> bool:
        """Mark a referral as successful and calculate commission."""
        if ref_id not in self.referrals: return False
        
        ref = self.referrals[ref_id]
        ref.status = ReferralStatus.CONVERTED
        ref.deal_value = float(deal_value)
        ref.converted_at = datetime.now()
        
        # Calculate capped commission
        raw_comm = ref.deal_value * ref.commission_rate
        ref.commission_amount = min(raw_comm, self.program.max_commission)
        
        logger.info(f"Referral {ref_id} converted! Commission: ${ref.commission_amount:,.2f}")
        return True
    
    def format_dashboard(self) -> str:
        """Render the Referral Leaderboard and Metrics."""
        total_payout = sum(r.commission_amount for r in self.referrals.values() if r.status in [ReferralStatus.CONVERTED, ReferralStatus.PAID])
        
        lines = [
            "╔═══════════════════════════════════════════════════════════╗",
            f"║  🎁 REFERRAL PARTNER DASHBOARD{' ' * 30}║",
            f"║  {len(self.referrals)} total referrals │ ${total_payout:,.0f} earned commissions{' ' * 13}║",
            "╠═══════════════════════════════════════════════════════════╣",
            "║  🏆 TOP REFERRERS                                         ║",
            "║  ───────────────────────────────────────────────────────  ║",
        ]
        
        # Simple list for now
        for r in list(self.referrals.values())[:5]:
            status_icon = "💰" if r.status == ReferralStatus.PAID else "⏳"
            lines.append(f"║  {status_icon} {r.referrer_name[:15]:<15} → {r.referred_name[:15]:<15} │ ${r.commission_amount:>8,.0f} ║")
            
        lines.extend([
            "║                                                           ║",
            "║  [➕ New Referral]  [💸 Payouts]  [📊 Terms]  [⚙️ Setup]  ║",
            "╠═══════════════════════════════════════════════════════════╣",
            f"║  🏯 {self.agency_name[:40]:<40} - Partner!         ║",
            "╚═══════════════════════════════════════════════════════════╝",
        ])
        return "\n".join(lines)


# Example usage
if __name__ == "__main__":
    print("🎁 Initializing Referral System...")
    print("=" * 60)
    
    try:
        sys = ReferralSystem("Saigon Digital Hub")
        # Seed
        r = sys.register_referral("Mai Nguyen", "mai@corp.co", "Hoang", "h@corp.co", "Acme")
        sys.convert_referral(r.id, 5000.0)
        
        print("\n" + sys.format_dashboard())
        
    except Exception as e:
        logger.error(f"Referral Error: {e}")
