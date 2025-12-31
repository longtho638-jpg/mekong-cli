"""
🧬 Client DNA Passport - Collective Client Intelligence
Part of Agency Guild Protocol
"""

from typing import Dict, List, Optional, Any
from dataclasses import dataclass, field
from datetime import datetime
import json


@dataclass
class ClientDNA:
    """Client DNA passport data structure"""
    id: str
    company_name: str
    company_domain: Optional[str] = None
    industry: Optional[str] = None
    
    # Payment DNA
    payment_score: int = 50
    avg_payment_days: Optional[int] = None
    payment_disputes_count: int = 0
    total_spent: float = 0
    
    # Project DNA
    scope_creep_risk: float = 0.5
    avg_revision_requests: Optional[float] = None
    projects_count: int = 0
    
    # Relationship DNA
    agencies_worked_with: int = 0
    repeat_rate: float = 0
    referrals_given: int = 0
    
    # Status
    blacklisted: bool = False
    blacklist_reason: Optional[str] = None
    verified_by_count: int = 0


@dataclass
class ClientReport:
    """Individual report on a client"""
    client_id: str
    reporter_id: str
    report_type: str  # payment, scope, communication, warning, positive
    payment_days: Optional[int] = None
    project_value: Optional[float] = None
    scope_creep_occurred: bool = False
    revision_requests: Optional[int] = None
    rating: Optional[int] = None
    notes: Optional[str] = None


class ClientDNASystem:
    """
    Client DNA Passport System
    
    Provides collective intelligence on client behavior patterns,
    payment history, and risk assessment.
    """
    
    def __init__(self):
        self.name = "Client DNA System"
        self.commands = {
            "/client": self.client_command,
            "/client check": self.check_client,
            "/client report": self.report_client,
            "/client verify": self.verify_report,
        }
    
    async def client_command(self, args: str = "") -> str:
        """Main client command router"""
        if not args:
            return self._get_client_menu()
        
        subcommand = args.lower().split()[0]
        rest_args = " ".join(args.split()[1:]) if len(args.split()) > 1 else ""
        
        handlers = {
            "check": lambda: self.check_client(rest_args),
            "report": lambda: self.report_client(rest_args),
            "verify": lambda: self.verify_report(rest_args),
            "history": lambda: self.get_client_history(rest_args),
        }
        
        handler = handlers.get(subcommand)
        if handler:
            return await handler()
        return f"Unknown subcommand: {subcommand}\n\n{self._get_client_menu()}"
    
    def _get_client_menu(self) -> str:
        """Display client command menu"""
        return """
🧬 **CLIENT DNA PASSPORT**
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Check collective intelligence on any client.
Powered by reports from guild members.

**Available Commands:**

🔍 `/client check "Company Name"`  → Check client DNA
📝 `/client report "Company Name"` → Submit a report
✅ `/client verify <report_id>`    → Verify peer report
📜 `/client history "Company"`     → Full report history

**DNA Categories:**

💰 **Payment DNA** - Payment patterns, disputes
📋 **Project DNA** - Scope creep, revisions
🤝 **Relationship DNA** - Repeat rate, referrals

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🛡️ Protect yourself. Contribute to protect others.
"""
    
    async def check_client(self, company_name: str = "") -> str:
        """Check client DNA passport"""
        if not company_name:
            return "Usage: `/client check \"Company Name\"`"
        
        # Clean up company name
        company_name = company_name.strip('"\'')
        
        # In production: Query client_dna table
        # For now, return demo data or "not found"
        
        # Demo: Return sample DNA for demonstration
        return f"""
🧬 **CLIENT DNA PASSPORT**
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**Company:** {company_name}
**Industry:** Technology Startup
**Status:** ⚠️ CAUTION

━━━━━━━━━━━━━━━━━━━━━━━━━━━━

💰 **PAYMENT DNA**
├─ Payment Score: 62/100 ⚠️
├─ Avg Payment: 45 days (slow)
├─ Disputes: 2 of 8 projects
└─ Total Spent: $127,000

📋 **PROJECT DNA**
├─ Scope Creep Risk: HIGH (87%) ⚠️
├─ Avg Revisions: 4.2x per project
└─ Complexity Preference: Enterprise

🤝 **RELATIONSHIP DNA**
├─ Agencies Worked With: 5
├─ Repeat Rate: 60% ✅
└─ Referrals Given: 3

━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⚠️ **GUILD WARNINGS (3):**

> "Expects agency pricing, enterprise scope. 
>  Budget always tight." - Agency Alpha (Worker)

> "Great to work with IF scope is locked in 
>  contract. Otherwise endless revisions." - Agency Beta (Queen)

> "Payment delayed 60 days. Had to send 
>  3 reminders." - Agency Gamma (Worker)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━

💰 **RATE RECOMMENDATION:**

├─ Guild Floor: $150/hr
├─ For this client: **$185/hr** (+23%)
│   └─ Scope creep premium: +15%
│   └─ Payment delay premium: +8%
└─ Require: 50% upfront deposit

🔒 Verified by: 5 Guild agencies
📅 Last updated: 3 days ago

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
"""
    
    async def report_client(self, company_name: str = "") -> str:
        """Submit a client report"""
        if not company_name:
            return "Usage: `/client report \"Company Name\"`"
        
        company_name = company_name.strip('"\'')
        
        return f"""
📝 **SUBMIT CLIENT REPORT**
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**Client:** {company_name}

Fill out the following to contribute:

**1. Report Type:**
├─ 💰 Payment experience
├─ 📋 Scope/project behavior
├─ 💬 Communication style
├─ ⚠️ Warning to others
└─ ✅ Positive recommendation

**2. Project Details:**
├─ Project value: $______
├─ Service type: ________
├─ Duration: ______ weeks

**3. Payment DNA:**
├─ Days to payment: ______
├─ Any disputes? [Y/N]
└─ Payment method: ________

**4. Project DNA:**
├─ Scope creep? [Y/N]
├─ Revision requests: ______
└─ Clear requirements? [Y/N]

**5. Notes/Warnings:**
[Free text for other agencies]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━

To submit via CLI:
```
/client report "{company_name}" \\
  --type payment \\
  --value 15000 \\
  --payment-days 45 \\
  --scope-creep yes \\
  --notes "Slow to pay, scope expanded 2x"
```

Or visit: agencyos.network/guild/report

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
+2 trust points when verified by peer!
"""
    
    async def verify_report(self, report_id: str = "") -> str:
        """Verify a peer's client report"""
        if not report_id:
            return "Usage: `/client verify <report_id>`"
        
        return f"""
✅ **VERIFY REPORT**
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**Report ID:** #{report_id}

**Report Details:**
├─ Client: TechStartup XYZ
├─ Reporter: Agency Alpha (Worker Bee)
├─ Type: Payment Experience
├─ Date: 2024-12-28

**Claim:**
"Payment took 45 days. Had to send 3 reminders.
Eventually paid in full."

━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**Do you have experience with this client?**

If YES and you can confirm this behavior:
  `/client verify {report_id} --confirm`
  → +1 trust for you
  → +2 trust for reporter (verified)

If you have DIFFERENT experience:
  `/client verify {report_id} --dispute`
  → Share your experience

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
"""
    
    async def get_client_history(self, company_name: str = "") -> str:
        """Get full report history for a client"""
        if not company_name:
            return "Usage: `/client history \"Company Name\"`"
        
        company_name = company_name.strip('"\'')
        
        return f"""
📜 **FULL REPORT HISTORY**
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**Client:** {company_name}
**Reports:** 8 total

━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📋 **Report #1** (2024-12-20)
├─ Type: Payment
├─ Reporter: Agency Alpha 🐝
├─ Payment days: 45 ⚠️
├─ Rating: 3/5
├─ Verified by: 2 agencies ✅
└─ Notes: "Slow but eventually paid"

📋 **Report #2** (2024-11-15)
├─ Type: Scope
├─ Reporter: Agency Beta 👑
├─ Scope creep: Yes
├─ Revisions: 6x
├─ Verified by: 1 agency ✅
└─ Notes: "Scope tripled from initial brief"

📋 **Report #3** (2024-10-08)
├─ Type: Positive ✅
├─ Reporter: Agency Gamma 🐝
├─ Payment days: 14
├─ Rating: 5/5
├─ Verified by: 0 ⏳
└─ Notes: "Great when scope is locked"

[...5 more reports...]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Use `/client check "{company_name}"` for summary DNA
"""
    
    async def calculate_dna_score(self, client_id: str) -> Dict[str, Any]:
        """Calculate aggregated DNA scores from reports"""
        # In production: Query and aggregate from client_reports table
        return {
            'payment_score': 62,
            'scope_creep_risk': 0.87,
            'avg_payment_days': 45,
            'avg_revisions': 4.2,
            'overall_rating': 3.2,
            'report_count': 8,
            'verified_count': 5
        }
    
    async def get_rate_recommendation(self, client_id: str, service_type: str) -> Dict[str, float]:
        """Get recommended rate based on client DNA and market benchmarks"""
        # Base rate from pricing benchmarks
        base_rate = 150.0  # Demo: $150/hr floor
        
        # Adjustments based on client DNA
        dna = await self.calculate_dna_score(client_id)
        
        scope_premium = 0.15 if dna['scope_creep_risk'] > 0.7 else 0
        payment_premium = 0.08 if dna['avg_payment_days'] > 30 else 0
        
        recommended_rate = base_rate * (1 + scope_premium + payment_premium)
        
        return {
            'floor_rate': base_rate,
            'recommended_rate': recommended_rate,
            'scope_premium': scope_premium,
            'payment_premium': payment_premium,
            'deposit_recommended': True if dna['payment_score'] < 70 else False
        }


# Command registration
def register_commands() -> Dict[str, Any]:
    """Register Client DNA commands with CLI"""
    system = ClientDNASystem()
    return {
        "/client": {
            "handler": system.client_command,
            "description": "Access Client DNA Passport system",
            "usage": "/client [check|report|verify|history]"
        },
        "/client check": {
            "handler": system.check_client,
            "description": "Check client DNA passport",
            "usage": "/client check \"Company Name\""
        },
        "/client report": {
            "handler": system.report_client,
            "description": "Submit client report",
            "usage": "/client report \"Company Name\""
        }
    }
