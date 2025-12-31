"""
🏰 Guild Constitution - Membership, Tiers, and Governance
Part of Agency Guild Protocol
"""

from typing import Dict, List, Optional, Any
from dataclasses import dataclass
from enum import Enum
import json


class GuildTier(Enum):
    LARVAE = "larvae"
    WORKER = "worker"
    QUEEN = "queen"


@dataclass
class GuildMember:
    """Guild member data structure"""
    id: str
    email: str
    agency_name: str
    tier: GuildTier
    trust_score: int
    contributions_count: int
    referrals_count: int
    status: str
    specialties: List[str]


TIER_CONFIG = {
    GuildTier.LARVAE: {
        'min_trust': 0,
        'can_vote': False,
        'can_verify': False,
        'referral_fee_share': 0.0,
        'icon': '🥚',
        'label': 'Larvae'
    },
    GuildTier.WORKER: {
        'min_trust': 50,
        'can_vote': True,
        'can_verify': True,
        'referral_fee_share': 0.10,
        'icon': '🐝',
        'label': 'Worker Bee'
    },
    GuildTier.QUEEN: {
        'min_trust': 85,
        'can_vote': True,
        'can_verify': True,
        'referral_fee_share': 0.20,
        'icon': '👑',
        'label': 'Queen Bee'
    }
}


class GuildConstitution:
    """
    Guild Constitution: Membership management, tier system, voting
    
    Trust Score Components:
    - Base: 50
    - Verified Reports: +2 each (max 20)
    - Completed Referrals: +5 each (max 25)
    - Tenure: +1 per month (max 12)
    - Verifications Given: +1 each (max 10)
    - Violations: -10 each
    """
    
    def __init__(self):
        self.name = "Guild Constitution"
        self.commands = {
            "/guild join": self.apply_membership,
            "/guild tier": self.check_tier,
            "/guild upgrade": self.request_upgrade,
            "/guild vote": self.cast_vote,
            "/guild violations": self.view_violations,
        }
    
    async def apply_membership(self, agency_data: Dict) -> str:
        """Apply for guild membership"""
        # Validate required fields
        required = ['agency_name', 'email', 'website']
        missing = [f for f in required if f not in agency_data]
        if missing:
            return f"❌ Missing required fields: {', '.join(missing)}"
        
        # In production: Insert into guild_members table
        return f"""
🏰 **GUILD APPLICATION SUBMITTED**
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**Agency:** {agency_data.get('agency_name')}
**Email:** {agency_data.get('email')}
**Website:** {agency_data.get('website')}
**Specialties:** {', '.join(agency_data.get('specialties', []))}

**Status:** ⏳ Pending Review

**What's Next:**
1. Your application will be reviewed (24-48 hours)
2. You'll receive email confirmation
3. Start as 🥚 Larvae tier with trust score: 50
4. Contribute data to increase trust and tier

**Pro Tip:** Submit your first client report 
to fast-track verification!

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
"""
    
    async def calculate_trust_score(self, member_id: str) -> int:
        """Calculate trust score based on contributions"""
        # In production: Query Supabase and use calculate_trust_score() function
        base_score = 50
        
        # Demo calculation
        contributions_bonus = 10  # 5 verified reports * 2
        referral_bonus = 5       # 1 completed * 5
        tenure_bonus = 2         # 2 months
        verification_bonus = 3   # 3 verifications given
        violation_penalty = 0
        
        total = base_score + contributions_bonus + referral_bonus + tenure_bonus + verification_bonus - violation_penalty
        return min(total, 100)  # Cap at 100
    
    def get_tier_for_score(self, trust_score: int) -> GuildTier:
        """Determine tier based on trust score"""
        if trust_score >= 85:
            return GuildTier.QUEEN
        elif trust_score >= 50:
            return GuildTier.WORKER
        else:
            return GuildTier.LARVAE
    
    async def check_tier(self, member_id: str = "") -> str:
        """Check current tier and progress to next"""
        trust_score = await self.calculate_trust_score(member_id)
        current_tier = self.get_tier_for_score(trust_score)
        tier_config = TIER_CONFIG[current_tier]
        
        # Calculate next tier
        if current_tier == GuildTier.LARVAE:
            next_tier = GuildTier.WORKER
            points_needed = 50 - trust_score
        elif current_tier == GuildTier.WORKER:
            next_tier = GuildTier.QUEEN
            points_needed = 85 - trust_score
        else:
            next_tier = None
            points_needed = 0
        
        tier_progress = f"""
🎖️ **YOUR GUILD TIER**
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**Current Tier:** {tier_config['icon']} {tier_config['label']}
**Trust Score:** {trust_score}/100

**Tier Privileges:**
├─ Can Vote: {'✅' if tier_config['can_vote'] else '❌'}
├─ Can Verify: {'✅' if tier_config['can_verify'] else '❌'}
└─ Referral Fee Share: {int(tier_config['referral_fee_share'] * 100)}%
"""
        
        if next_tier:
            next_config = TIER_CONFIG[next_tier]
            tier_progress += f"""
**Next Tier:** {next_config['icon']} {next_config['label']}
├─ Required: {next_config['min_trust']} trust
├─ You need: +{points_needed} points
└─ Referral Fee: {int(next_config['referral_fee_share'] * 100)}%

**How to Earn Points:**
├─ Submit verified client report: +2
├─ Complete a referral: +5
├─ Verify peer reports: +1
└─ Stay active (monthly): +1

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
"""
        else:
            tier_progress += """
🏆 **You've reached the highest tier!**

As a Queen Bee, you can:
├─ Mentor new members
├─ Create Guild templates
├─ Access premium network data
└─ Earn highest referral share

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
"""
        return tier_progress
    
    async def request_upgrade(self, member_id: str = "") -> str:
        """Request tier upgrade evaluation"""
        trust_score = await self.calculate_trust_score(member_id)
        current_tier = self.get_tier_for_score(trust_score)
        
        return f"""
🔄 **TIER UPGRADE CHECK**
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Your trust score: {trust_score}

Checking eligibility...

{'✅ You qualify for upgrade!' if trust_score >= TIER_CONFIG[GuildTier.WORKER]['min_trust'] and current_tier == GuildTier.LARVAE else ''}
{'✅ You qualify for Queen Bee!' if trust_score >= TIER_CONFIG[GuildTier.QUEEN]['min_trust'] and current_tier == GuildTier.WORKER else ''}
{'⏳ Keep contributing to reach next tier' if trust_score < TIER_CONFIG[GuildTier.WORKER]['min_trust'] else ''}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
"""
    
    async def cast_vote(self, case_id: str, vote: bool, reason: str = "") -> str:
        """Cast vote on a defense case"""
        # Check voting eligibility
        trust_score = 67  # Demo
        current_tier = self.get_tier_for_score(trust_score)
        
        if not TIER_CONFIG[current_tier]['can_vote']:
            return f"""
❌ **VOTING NOT ALLOWED**

Your tier ({TIER_CONFIG[current_tier]['label']}) cannot vote.
Reach {TIER_CONFIG[GuildTier.WORKER]['label']} tier to unlock voting.

Current trust: {trust_score}
Required: {TIER_CONFIG[GuildTier.WORKER]['min_trust']}
"""
        
        vote_str = "FOR ✅" if vote else "AGAINST ❌"
        return f"""
🗳️ **VOTE RECORDED**
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**Case:** #{case_id}
**Your Vote:** {vote_str}
**Reason:** {reason or 'No reason provided'}

Your vote has been counted.
Case will be resolved when threshold is reached.

Use `/defense status {case_id}` to track progress.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
"""
    
    async def view_violations(self, member_id: str = "") -> str:
        """View member's violation history"""
        # In production: Query violations from database
        return """
📋 **VIOLATION HISTORY**
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**Your Violations:** 0 ✅

You have a clean record!

**Violation Types & Penalties:**
├─ False client report: -10 trust
├─ Rate floor violation: -10 trust
├─ Stolen referral: -20 trust
├─ Confidentiality breach: -20 trust
└─ 3+ violations: ⛔ Expulsion review

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
"""


# Command registration
def register_commands() -> Dict[str, Any]:
    """Register Constitution commands with CLI"""
    constitution = GuildConstitution()
    return {
        "/guild tier": {
            "handler": constitution.check_tier,
            "description": "Check your guild tier and progress",
            "usage": "/guild tier"
        },
        "/guild vote": {
            "handler": constitution.cast_vote,
            "description": "Vote on a defense case",
            "usage": "/guild vote <case_id> [for|against]"
        }
    }
