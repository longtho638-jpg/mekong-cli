"""
🛡️ Mutual Defense Protocol - Collective Protection System
=========================================================

Part of Agency Guild Protocol.
Provides collective protection against problematic clients through case reporting and voting.

Features:
- Case reporting
- Voting mechanism
- Blacklist management
"""

import logging
import uuid
from typing import Dict, List
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class CaseType(Enum):
    """Types of disputes or violations."""
    NON_PAYMENT = "non_payment"
    FRAUD = "fraud"
    SCOPE_DISPUTE = "scope_dispute"
    CONTRACT_BREACH = "contract_breach"
    OTHER = "other"


class CaseStatus(Enum):
    """Lifecycle status of a defense case."""
    OPEN = "open"
    VOTING = "voting"
    APPROVED = "approved"
    REJECTED = "rejected"
    RESOLVED = "resolved"


@dataclass
class DefenseCase:
    """A formal dispute case entity."""
    id: str
    reporter_id: str
    client_name: str
    case_type: CaseType
    title: str
    description: str
    amount_disputed: float
    status: CaseStatus = CaseStatus.OPEN
    votes_for: int = 0
    votes_against: int = 0
    votes_required: int = 5
    created_at: datetime = field(default_factory=datetime.now)

    def __post_init__(self):
        if self.amount_disputed < 0:
            raise ValueError("Amount cannot be negative")


class MutualDefenseProtocol:
    """
    Mutual Defense System.
    
    Orchestrates the collective defense mechanism for the agency guild network.
    """
    
    def __init__(self):
        self.cases: Dict[str, DefenseCase] = {}
        self.blacklist: List[str] = []
        logger.info("Mutual Defense Protocol initialized.")
        self._init_defaults()
    
    def _init_defaults(self):
        """Seed with sample cases."""
        logger.info("Loading defense case data...")
        self.report_case("AG-1", "BadClient Inc", CaseType.NON_PAYMENT, "Unpaid Invoice", "Refused payment", 15000.0)
    
    def report_case(
        self,
        reporter_id: str,
        client_name: str,
        case_type: CaseType,
        title: str,
        description: str,
        amount: float
    ) -> DefenseCase:
        """File a new defense case."""
        case = DefenseCase(
            id=f"DC-{uuid.uuid4().hex[:6].upper()}",
            reporter_id=reporter_id,
            client_name=client_name,
            case_type=case_type,
            title=title,
            description=description,
            amount_disputed=amount,
            status=CaseStatus.VOTING
        )
        self.cases[case.id] = case
        logger.info(f"Defense case filed: {case.id} against {client_name}")
        return case
    
    def cast_vote(self, case_id: str, vote_for: bool) -> bool:
        """Register a vote on a case."""
        if case_id not in self.cases:
            logger.error(f"Case {case_id} not found")
            return False
            
        case = self.cases[case_id]
        if case.status != CaseStatus.VOTING:
            logger.warning(f"Case {case_id} not open for voting")
            return False
            
        if vote_for:
            case.votes_for += 1
        else:
            case.votes_against += 1
            
        # Check threshold
        if case.votes_for >= case.votes_required:
            case.status = CaseStatus.APPROVED
            self.blacklist.append(case.client_name)
            logger.warning(f"Case {case_id} APPROVED. {case.client_name} blacklisted.")
            
        return True
    
    def format_dashboard(self) -> str:
        """Render the Defense Dashboard."""
        active_cases = [c for c in self.cases.values() if c.status == CaseStatus.VOTING]
        
        lines = [
            "╔═══════════════════════════════════════════════════════════╗",
            f"║  🛡️ MUTUAL DEFENSE PROTOCOL{' ' * 29}║",
            f"║  {len(self.cases)} total cases │ {len(active_cases)} active voting │ {len(self.blacklist)} blacklisted{' ' * 5}║",
            "╠═══════════════════════════════════════════════════════════╣",
            "║  🗳️ ACTIVE VOTING                                         ║",
            "║  ───────────────────────────────────────────────────────  ║",
        ]
        
        for c in active_cases[:3]:
            # Vote bar
            total_votes = c.votes_for + c.votes_against
            bar_len = 10
            fill = int((c.votes_for / c.votes_required) * bar_len) if c.votes_required else 0
            bar = "█" * fill + "░" * (bar_len - fill)
            
            lines.append(f"║  🔴 {c.client_name[:15]:<15} │ {c.case_type.value[:12]:<12} │ {bar} {c.votes_for}/{c.votes_required} ║")
            
        lines.extend([
            "║                                                           ║",
            "║  ⛔ RECENT BLACKLIST                                      ║",
            "║  ───────────────────────────────────────────────────────  ║",
        ])
        
        for name in self.blacklist[-3:]:
            lines.append(f"║    🚫 {name:<50}  ║")
            
        lines.extend([
            "║                                                           ║",
            "║  [🚨 Report Case]  [🗳️ Vote]  [📜 View Blacklist]         ║",
            "╠═══════════════════════════════════════════════════════════╣",
            "║  ⚔️ \"An attack on one is an attack on all.\"                ║",
            "╚═══════════════════════════════════════════════════════════╝",
        ])
        
        return "\n".join(lines)


# Example usage
if __name__ == "__main__":
    print("🛡️ Initializing Defense Protocol...")
    print("=" * 60)
    
    try:
        defense = MutualDefenseProtocol()
        
        # Test voting
        case_id = list(defense.cases.keys())[0]
        defense.cast_vote(case_id, True)
        defense.cast_vote(case_id, True)
        defense.cast_vote(case_id, True)
        defense.cast_vote(case_id, True)
        defense.cast_vote(case_id, True) # Should approve
        
        print("\n" + defense.format_dashboard())
        
    except Exception as e:
        logger.error(f"Defense Error: {e}")
