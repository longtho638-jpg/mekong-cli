"""
🛡️ Mutual Defense Protocol - Collective Protection System
Part of Agency Guild Protocol
"""

from typing import Dict, List, Optional, Any
from dataclasses import dataclass
from datetime import datetime, timedelta
from enum import Enum
import json


class CaseType(Enum):
    NON_PAYMENT = "non_payment"
    FRAUD = "fraud"
    SCOPE_DISPUTE = "scope_dispute"
    CONTRACT_BREACH = "contract_breach"
    OTHER = "other"


class CaseStatus(Enum):
    OPEN = "open"
    VOTING = "voting"
    APPROVED = "approved"
    REJECTED = "rejected"
    RESOLVED = "resolved"


@dataclass
class DefenseCase:
    """Defense case data structure"""
    id: str
    reporter_id: str
    client_id: str
    case_type: CaseType
    title: str
    description: str
    amount_disputed: float
    evidence_urls: List[str]
    status: CaseStatus
    votes_for: int
    votes_against: int
    votes_required: int = 5


class MutualDefenseProtocol:
    """
    Mutual Defense Protocol
    
    Provides collective protection against problematic clients
    through case reporting, voting, and collective action.
    """
    
    def __init__(self):
        self.name = "Mutual Defense Protocol"
        self.commands = {
            "/defense": self.defense_command,
            "/defense report": self.report_case,
            "/defense status": self.get_case_status,
            "/defense vote": self.vote_on_case,
            "/defense blacklist": self.view_blacklist,
        }
    
    async def defense_command(self, args: str = "") -> str:
        """Main defense command router"""
        if not args:
            return self._get_defense_menu()
        
        subcommand = args.lower().split()[0]
        rest_args = " ".join(args.split()[1:]) if len(args.split()) > 1 else ""
        
        handlers = {
            "report": lambda: self.report_case(rest_args),
            "status": lambda: self.get_case_status(rest_args),
            "vote": lambda: self.vote_on_case(rest_args),
            "blacklist": lambda: self.view_blacklist(rest_args),
            "cases": lambda: self.list_active_cases(),
        }
        
        handler = handlers.get(subcommand)
        if handler:
            return await handler()
        return f"Unknown subcommand: {subcommand}\n\n{self._get_defense_menu()}"
    
    def _get_defense_menu(self) -> str:
        """Display defense command menu"""
        return """
🛡️ **MUTUAL DEFENSE PROTOCOL**
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

When a guild member is wronged, we act together.
Collective action protects everyone.

**Available Commands:**

🚨 `/defense report`           → Report a case
📋 `/defense status <case_id>` → Check case status
🗳️ `/defense vote <case_id>`   → Vote on a case
📜 `/defense blacklist`        → View blacklist
📂 `/defense cases`            → List active cases

**How It Works:**

1. Member reports case with evidence
2. Guild members vote (5 votes required)
3. If approved: Client is blacklisted
4. All members warned against client

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚔️ "An attack on one is an attack on all."
"""
    
    async def report_case(self, args: str = "") -> str:
        """Report a defense case"""
        return """
🚨 **REPORT DEFENSE CASE**
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Report a client to initiate collective defense.

**Case Types:**

💸 **Non-Payment** - Failed to pay for work
🎭 **Fraud** - Misrepresentation or scam
📋 **Scope Dispute** - Refused to honor scope
📜 **Contract Breach** - Violated agreement
❓ **Other** - Other issues

━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**Required Information:**

1. **Client Name:** _______________
2. **Case Type:** [Select above]
3. **Amount Disputed:** $___________
4. **Description:** 
   [What happened? Be specific]
5. **Evidence:**
   [Upload contracts, emails, invoices]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**CLI Submission:**
```
/defense report \\
  --client "BadClient Corp" \\
  --type non_payment \\
  --amount 15000 \\
  --description "Delivered web app per spec. \\
    Client refuses to pay final 50%." \\
  --evidence "https://drive.google.com/..."
```

**Or via form:**
agencyos.network/guild/defense/report

━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⚠️ **Important:**
├─ False reports result in -20 trust
├─ Evidence is required
└─ Case will be reviewed by guild

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
"""
    
    async def get_case_status(self, case_id: str = "") -> str:
        """Get status of a defense case"""
        if not case_id:
            return "Usage: `/defense status <case_id>`"
        
        return f"""
📋 **DEFENSE CASE STATUS**
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**Case ID:** #{case_id}
**Status:** 🗳️ VOTING IN PROGRESS

━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**Case Details:**

├─ **Client:** BadClient Corp
├─ **Reporter:** Agency Alpha (Queen Bee)
├─ **Type:** 💸 Non-Payment
├─ **Amount:** $15,000
├─ **Filed:** 2024-12-28

**Description:**
> "Delivered web application per specification.
>  Client approved final version. Now refuses 
>  to pay final 50% claiming 'budget issues.'
>  No prior warning. Contract clearly states
>  payment terms."

**Evidence:** 3 files uploaded ✅

━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🗳️ **VOTING STATUS**

Votes FOR action:     ████████░░ 8
Votes AGAINST:        ██░░░░░░░░ 2
Required to approve:  5 votes ✅

**Threshold reached!**
Awaiting: 24-hour review period

━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**Timeline:**
├─ Filed: Dec 28, 2024
├─ Voting Started: Dec 28, 2024
├─ Votes Received: Dec 28-29
└─ Expected Resolution: Dec 30, 2024

━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**If Approved:**
├─ Client added to blacklist
├─ All guild members notified
├─ Client DNA marked ⛔
└─ Cannot work with guild agencies

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
"""
    
    async def vote_on_case(self, args: str = "") -> str:
        """Vote on a defense case"""
        if not args:
            return """
Usage: `/defense vote <case_id> [for|against]`

Example:
  `/defense vote abc123 for`
  `/defense vote abc123 against --reason "Need more evidence"`
"""
        
        parts = args.split()
        case_id = parts[0]
        vote = parts[1] if len(parts) > 1 else None
        
        if not vote:
            # Show case and ask for vote
            return f"""
🗳️ **VOTE ON CASE #{case_id}**
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**Case Summary:**

├─ Client: BadClient Corp
├─ Type: Non-Payment
├─ Amount: $15,000
├─ Reporter: Agency Alpha (Queen Bee)

**Claim:**
> "Client received completed work but refuses
>  to pay final 50%."

**Evidence Provided:**
├─ ✅ Signed contract
├─ ✅ Delivery confirmation email
├─ ✅ Client approval message
└─ ✅ Payment reminder thread

━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**Your Vote:**

✅ `/defense vote {case_id} for`
   → Support collective action

❌ `/defense vote {case_id} against`
   → Oppose (requires reason)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**Note:** Only Worker and Queen tiers can vote.
"""
        
        vote_is_for = vote.lower() == "for"
        vote_str = "FOR ✅" if vote_is_for else "AGAINST ❌"
        
        return f"""
🗳️ **VOTE RECORDED**
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**Case:** #{case_id}
**Your Vote:** {vote_str}

Your vote has been counted.

**Current Tally:**
├─ FOR: {'9' if vote_is_for else '8'}
├─ AGAINST: {'2' if vote_is_for else '3'}
└─ Required: 5

{'✅ Threshold reached! Case will be resolved.' if vote_is_for else ''}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Thank you for participating in collective defense.
"""
    
    async def view_blacklist(self, args: str = "") -> str:
        """View the guild blacklist"""
        return """
⛔ **GUILD BLACKLIST**
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Clients with verified violations against guild members.
Do NOT accept work from these entities.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**1. BadClient Corp**
├─ Reason: Non-Payment ($15,000)
├─ Added: Dec 30, 2024
├─ Verified by: 8 agencies
└─ Reports: 3 incidents

**2. ScamStartup Inc**
├─ Reason: Fraud
├─ Added: Nov 15, 2024
├─ Verified by: 5 agencies
└─ Reports: 2 incidents

**3. NeverPay LLC**
├─ Reason: Non-Payment ($42,000)
├─ Added: Oct 22, 2024
├─ Verified by: 12 agencies
└─ Reports: 5 incidents

[...20 more entries...]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**Total Blacklisted:** 23 entities
**Total Protected Value:** $127,000+

━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⚠️ **Warning:**
Working with blacklisted clients is at your own risk.
Guild protection does not apply.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
"""
    
    async def list_active_cases(self) -> str:
        """List all active defense cases"""
        return """
📂 **ACTIVE DEFENSE CASES**
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Cases that need your vote (last 30 days):

━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🗳️ **#DC-2024-089** (Voting)
├─ Client: BadClient Corp
├─ Type: Non-Payment ($15,000)
├─ Votes: 8/5 ✅ Threshold met
└─ `/defense vote DC-2024-089`

🗳️ **#DC-2024-088** (Voting)
├─ Client: DelayTech Ltd
├─ Type: Contract Breach
├─ Votes: 3/5 ⏳ Need 2 more
└─ `/defense vote DC-2024-088`

📋 **#DC-2024-087** (Open)
├─ Client: VaporSoft Inc
├─ Type: Non-Payment ($8,500)
├─ Status: Awaiting verification
└─ `/defense status DC-2024-087`

✅ **#DC-2024-086** (Resolved)
├─ Client: GhostStartup
├─ Action: Blacklisted
├─ Resolved: Dec 25, 2024
└─ `/defense status DC-2024-086`

━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**Your Voting Stats:**
├─ Cases voted: 12
├─ Abstained: 2
└─ Trust earned: +6

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
"""
    
    async def execute_collective_action(self, case_id: str) -> Dict[str, Any]:
        """Execute collective action on approved case"""
        # In production: This would:
        # 1. Add client to blacklist
        # 2. Update client_dna.blacklisted = True
        # 3. Notify all guild members
        # 4. Update case status
        
        return {
            'success': True,
            'action': 'blacklisted',
            'case_id': case_id,
            'notification_sent': True
        }


# Command registration
def register_commands() -> Dict[str, Any]:
    """Register Mutual Defense commands with CLI"""
    system = MutualDefenseProtocol()
    return {
        "/defense": {
            "handler": system.defense_command,
            "description": "Access Mutual Defense Protocol",
            "usage": "/defense [report|status|vote|blacklist]"
        },
        "/defense report": {
            "handler": system.report_case,
            "description": "Report a defense case",
            "usage": "/defense report"
        },
        "/defense vote": {
            "handler": system.vote_on_case,
            "description": "Vote on a defense case",
            "usage": "/defense vote <case_id>"
        }
    }
