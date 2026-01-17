"""
🏰 Guild Constitution - Membership, Tiers, and Governance
=========================================================

Part of Agency Guild Protocol.
Defines rights, trust scores, and rewards for network members.

Features:
- Trust score calculation
- Tier system (Larvae, Worker, Queen)
- Privileges & Perks
- Violation tracking
"""

import logging
from typing import Dict, List, Any
from dataclasses import dataclass, field
from enum import Enum

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class GuildTier(Enum):
    """Guild membership levels."""
    LARVAE = "larvae"
    WORKER = "worker"
    QUEEN = "queen"


@dataclass
class GuildMember:
    """A guild member entity."""
    id: str
    email: str
    agency_name: str
    tier: GuildTier
    trust_score: int = 50 # 0-100
    contributions_count: int = 0
    referrals_count: int = 0
    status: str = "active"
    specialties: List[str] = field(default_factory=list)

    def __post_init__(self):
        if not 0 <= self.trust_score <= 100:
            raise ValueError("Trust score must be 0-100")


class GuildConstitution:
    """
    Guild Constitution System.
    
    Manages membership governance, tier progression, and trust-based rewards.
    """

    TIER_CONFIG = {
        GuildTier.LARVAE: {'min': 0, 'vote': False, 'share': 0.0, 'icon': '🥚', 'label': 'Larvae'},
        GuildTier.WORKER: {'min': 50, 'vote': True, 'share': 0.10, 'icon': '🐝', 'label': 'Worker Bee'},
        GuildTier.QUEEN: {'min': 85, 'vote': True, 'share': 0.20, 'icon': '👑', 'label': 'Queen Bee'}
    }

    def __init__(self):
        self.members: Dict[str, GuildMember] = {}
        logger.info("Guild Constitution initialized.")

    async def apply_membership(self, agency_name: str, email: str, web: str) -> str:
        """Process a new guild application."""
        if not agency_name or not email:
            raise ValueError("Agency name and email are mandatory")

        logger.info(f"New application received: {agency_name}")
        return f"🏰 Application for {agency_name} is PENDING REVIEW."

    def calculate_trust(self, member: GuildMember) -> int:
        """Derive trust score from contributions and history."""
        # Weighted calculation logic
        base = 50
        bonus = (member.contributions_count * 2) + (member.referrals_count * 5)
        return min(100, base + bonus)

    def determine_tier(self, trust_score: int) -> GuildTier:
        """Map trust score to its corresponding tier."""
        if trust_score >= 85: return GuildTier.QUEEN
        if trust_score >= 50: return GuildTier.WORKER
        return GuildTier.LARVAE

    def format_tier_status(self, member_id: str) -> str:
        """Render ASCII tier status report."""
        # Simulated lookup
        score = 67
        tier = self.determine_tier(score)
        cfg = self.TIER_CONFIG[tier]

        lines = [
            "╔═══════════════════════════════════════════════════════════╗",
            f"║  🎖️ GUILD TIER STATUS{' ' * 38}║",
            "╠═══════════════════════════════════════════════════════════╣",
            f"║  Current: {cfg['icon']} {cfg['label']:<15} Trust: {score:>3}/100 {' ' * 14}║",
            "║  ───────────────────────────────────────────────────────  ║",
            "║  Privileges:                                              ║",
            f"║    • Voting Rights: {'✅' if cfg['vote'] else '❌'}                                ",
            f"║    • Referral Fee:  {int(cfg['share']*100):>2}%                                 ║",
            "╠═══════════════════════════════════════════════════════════╣",
            "║  [🏆 Leaderboard]  [🛡️ Protection]  [💎 Rewards]          ║",
            "╚═══════════════════════════════════════════════════════════╝",
        ]
        return "\n".join(lines)


# Command registration interface
def register_commands() -> Dict[str, Any]:
    """Register constitution commands with the main CLI."""
    system = GuildConstitution()
    return {
        "/guild tier": {
            "handler": system.format_tier_status,
            "description": "Check current guild standing"
        }
    }

# Example usage
if __name__ == "__main__":
    print("🏰 Initializing Constitution...")
    print("=" * 60)

    try:
        constitution = GuildConstitution()
        print("\n" + constitution.format_tier_status("M1"))

    except Exception as e:
        logger.error(f"Governance Error: {e}")
