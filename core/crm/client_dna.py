"""
🧬 Client DNA Passport - Collective Client Intelligence
=========================================================

Part of Agency Guild Protocol.
Know your client before you sign.

Features:
- Payment DNA (Score, Days to Pay)
- Project DNA (Scope Creep, Revisions)
- Relationship DNA (Referrals, Repeat Rate)
- Rate Recommendations
"""

import logging
from dataclasses import dataclass, field
from datetime import datetime
from typing import Any, Dict, List, Optional

# Configure logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)


@dataclass
class ClientDNA:
    """Client DNA passport data entity."""

    id: str
    company_name: str
    company_domain: Optional[str] = None
    industry: Optional[str] = "Unknown"

    # Payment DNA
    payment_score: int = 50  # 0-100
    avg_payment_days: int = 30
    payment_disputes_count: int = 0
    total_spent: float = 0.0

    # Project DNA
    scope_creep_risk: float = 0.5  # 0.0 to 1.0
    avg_revision_requests: float = 2.0
    projects_count: int = 0

    # Relationship DNA
    repeat_rate: float = 0.0
    referrals_given: int = 0

    # Status
    blacklisted: bool = False
    blacklist_reason: Optional[str] = None
    verified_by_count: int = 0
    last_updated: datetime = field(default_factory=datetime.now)


@dataclass
class ClientReport:
    """An individual report submitted by a guild member."""

    id: str
    client_id: str
    reporter_id: str
    report_type: str  # payment, scope, comms, warning, positive
    rating: int = 3  # 1-5
    notes: str = ""
    timestamp: datetime = field(default_factory=datetime.now)


class ClientDNASystem:
    """
    Client DNA Passport System.

    Aggregates peer reports to build behavioral profiles of clients.
    "Biết người biết ta, trăm trận không nguy."
    """

    def __init__(self):
        self.name = "Client DNA System"
        self.reports: List[ClientReport] = []
        logger.info("Client DNA System initialized")

    async def check_client(self, company_name: str) -> str:
        """Fetch summary DNA passport for a client (Demo Mode)."""
        if not company_name:
            return "❌ Error: Company name required."

        logger.info(f"Querying DNA for: {company_name}")

        # Simulated data aggregation
        score = 62
        risk = 87
        rec_rate = 185

        lines = [
            "╔═══════════════════════════════════════════════════════════╗",
            f"║  🧬 CLIENT DNA PASSPORT{' ' * 36}║",
            f"║  Company: {company_name[:40]:<40}         ║",
            "╠═══════════════════════════════════════════════════════════╣",
            f"║  Status: ⚠️ CAUTION │ Industry: Tech Startup {' ' * 14}║",
            "║  ───────────────────────────────────────────────────────  ║",
            "║  💰 PAYMENT DNA                                           ║",
            f"║    Score: {score}/100 ⚠️ │ Avg: 45 days │ Disputes: 2/8      ║",
            "║                                                           ║",
            "║  📋 PROJECT DNA                                           ║",
            f"║    Scope Creep Risk: {risk}% ⚠️ │ Revisions: 4.2x/proj       ║",
            "║                                                           ║",
            "║  🤝 RELATIONSHIP DNA                                      ║",
            "║    Agencies: 5 │ Repeat: 60% │ Referrals: 3               ║",
            "╠═══════════════════════════════════════════════════════════╣",
            "║  ⚠️ GUILD WARNINGS                                         ║",
            "║  ───────────────────────────────────────────────────────  ║",
            '║  "Expects agency pricing, enterprise scope." - Alpha      ║',
            '║  "Endless revisions if scope isn\'t locked."  - Beta       ║',
            "║                                                           ║",
            "║  💰 RATE RECOMMENDATION                                   ║",
            f"║    Standard: $150/hr │ Target: ${rec_rate}/hr (+23%)         ║",
            "║    Requirement: 50% Upfront Deposit                       ║",
            "╠═══════════════════════════════════════════════════════════╣",
            "║  🔒 Verified by 5 Agencies │ Last updated: 3d ago         ║",
            "╚═══════════════════════════════════════════════════════════╝",
        ]

        return "\n".join(lines)

    async def report_client(self, company_name: str) -> str:
        """Submit a new behavioral report (Interactive Template)."""
        logger.info(f"Report initiated for: {company_name}")
        return f"📝 Template generated for {company_name}. Use /client submit to finalize."

    async def get_rate_recommendation(self, client_id: str) -> Dict[str, Any]:
        """Calculate weighted rate recommendation based on DNA risk."""
        # Weighted logic for premiums
        base_rate = 150.0
        # In a real app, these values come from aggregated report data
        scope_risk = 0.87
        payment_lag = 45  # days

        scope_premium = 0.15 if scope_risk > 0.7 else 0.0
        payment_premium = 0.08 if payment_lag > 30 else 0.0

        final_rate = base_rate * (1 + scope_premium + payment_premium)

        return {
            "base_rate": base_rate,
            "recommended_rate": final_rate,
            "premiums": {"scope": scope_premium, "payment": payment_premium},
            "security_required": True if payment_lag > 30 else False,
        }


# Command registration interface
def register_commands() -> Dict[str, Any]:
    """Register system commands with the main CLI orchestrator."""
    system = ClientDNASystem()
    return {
        "/client": {
            "handler": system.check_client,
            "description": "Access Client DNA Passport system",
            "usage": "/client [Company Name]",
        },
        "/client report": {
            "handler": system.report_client,
            "description": "Submit behavioral intelligence on a client",
        },
    }


# Entry point for direct testing
if __name__ == "__main__":
    import asyncio

    print("🧬 Initializing Client DNA System...")
    print("=" * 60)

    async def test():
        system = ClientDNASystem()
        result = await system.check_client("TechStartup XYZ")
        print("\n" + result)

        rec = await system.get_rate_recommendation("cli_123")
        print(f"\n💡 AI Rate Tip: ${rec['recommended_rate']:.2f}/hr")

    asyncio.run(test())
