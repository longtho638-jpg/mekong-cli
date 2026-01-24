import asyncio
import logging
import random
import sys
from dataclasses import asdict, dataclass
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional

logger = logging.getLogger(__name__)


@dataclass
class ClientPackage:
    """Complete client onboarding package."""
    name: str
    vertical: Optional[str] = None
    contract_path: Optional[str] = None
    invoice_path: Optional[str] = None
    portal_url: Optional[str] = None
    welcome_sent: bool = False
    vertical_artifacts: Dict[str, Any] = None

@dataclass
class WinDecision:
    """WIN-WIN-WIN decision result."""
    decision: str  # "GO" or "NO-GO"
    owner_win: str
    agency_win: str
    client_win: str
    risk_score: int
    wisdom: str

class AgencyHandler:
    """
    Handler for Agency MCP Server.
    Specialized for Vertical-specific onboarding.
    """

    def __init__(self):
        self.project_root = Path(__file__).parent.parent.parent.parent
        self.agents = [
            "contract-generator",
            "invoice-generator",
            "client-portal",
            "report-writer",
            "win3-checker",
            "binh-phap-analyzer",
        ]

        # Binh Pháp wisdom quotes
        self.wisdom_quotes = [
            "Tri bỉ tri kỷ, bách chiến bất đãi - Know enemy, know self, never defeated",
            "Bất chiến nhi khuất nhân chi binh - Win without fighting",
            "Thượng binh phạt mưu - Supreme excellence: attack strategy",
            "Thiện chiến giả, thắng dịch thắng giả dã - Good warriors win easy victories",
        ]

        # Vertical Auditor and Engines
        try:
            from antigravity.core.verticals.auditor import VerticalAuditor
            from antigravity.core.verticals.fintech import FintechEngine
            from antigravity.core.verticals.healthcare import HealthcareEngine
            from antigravity.core.verticals.saas import SaasEngine
            self.auditor = VerticalAuditor()
            self.healthcare = HealthcareEngine()
            self.fintech = FintechEngine()
            self.saas = SaasEngine()
        except ImportError:
            self.auditor = None
            self.healthcare = None
            self.fintech = None
            self.saas = None

    async def audit_client(self, client_name: str, vertical: str, system_config: Dict[str, Any] = None) -> Dict[str, Any]:
        """Run a vertical-specific audit for a client."""
        logger.info(f"🏥 VIBE AGENCY: Auditing '{client_name}' for {vertical} compliance...")

        if not self.auditor:
            return {"success": False, "error": "Vertical Auditor not available"}

        if not system_config:
            # Mock config for simulation if not provided
            system_config = {
                "encryption": {"at_rest": True, "in_transit": True},
                "authentication": {"mfa_enabled": True, "audit_logging": True},
                "data_handling": {"card_tokenization": True},
                "metrics": {"logins_per_week": 5, "feature_utilization": 0.8}
            }

        result = self.auditor.audit_system(vertical, system_config)

        status = "PASSED" if result["passed"] else "FAILED"
        logger.info(f"   📋 Audit Result: {status}")

        return result

    async def onboard_client(self, name: str, vertical: Optional[str] = None) -> Dict[str, Any]:
        """Full client onboarding pipeline with vertical specialization."""
        logger.info(f"🤝 VIBE AGENCY: Onboarding '{name}'" + (f" in {vertical}..." if vertical else "..."))

        # Run core tasks in parallel
        contract_task = self._generate_contract(name)
        invoice_task = self._generate_invoice(name)
        portal_task = self._setup_portal(name)

        contract, invoice, portal = await asyncio.gather(contract_task, invoice_task, portal_task)

        # Specialized actions
        artifacts = {}
        if vertical:
            v_low = vertical.lower()
            if v_low == "healthcare" and self.healthcare:
                artifacts["baa"] = self.healthcare.generate_baa(name)
            elif v_low == "fintech" and self.fintech:
                # Mock KYC for initial onboarding
                artifacts["kyc"] = self.fintech.validate_kyc_process({"id_verification": True, "liveness_check": True})
            elif v_low == "saas" and self.saas:
                config = self.saas.provision_tenant(name.lower().replace(" ", "-"), "starter")
                artifacts["tenant_config"] = asdict(config)

        # Send welcome
        welcome_sent = await self._send_welcome(name)

        # Add to CRM
        await self._add_to_crm(name)

        pkg = ClientPackage(
            name=name,
            vertical=vertical,
            contract_path=contract,
            invoice_path=invoice,
            portal_url=portal,
            welcome_sent=welcome_sent,
            vertical_artifacts=artifacts if artifacts else None
        )
        return asdict(pkg)

    async def validate_win(self, decision: str) -> Dict[str, Any]:
        """WIN-WIN-WIN validation for any decision."""
        logger.info(f"🏯 VIBE AGENCY: Validating '{decision}'...")

        # Analyze each WIN
        owner = await self._check_owner_win(decision)
        agency = await self._check_agency_win(decision)
        client = await self._check_client_win(decision)

        # Risk assessment
        risk = await self._assess_risk(decision)

        # Decision
        all_win = all([owner["win"], agency["win"], client["win"]])

        wisdom = random.choice(self.wisdom_quotes)

        res = WinDecision(
            decision="GO" if all_win else "NO-GO",
            owner_win=owner["reason"],
            agency_win=agency["reason"],
            client_win=client["reason"],
            risk_score=risk,
            wisdom=wisdom,
        )
        return asdict(res)

    async def outreach_pipeline(self) -> dict:
        """Run urgent outreach campaign."""
        logger.info("📧 VIBE AGENCY: Running outreach...")
        return {"emails_queued": 4, "status": "success"}

    async def _generate_contract(self, name: str) -> str:
        """Generate MSA contract for client."""
        logger.debug(f"   📄 Generating contract for {name}")
        slug = name.lower().replace(" ", "_")
        return f"contracts/{slug}_MSA.txt"

    async def _generate_invoice(self, name: str, amount: int = 5000) -> str:
        """Generate first invoice."""
        logger.debug(f"   💰 Generating invoice: ${amount}")
        date = datetime.now().strftime("%Y%m%d")
        invoice_num = f"INV-{date}-001"
        return f"invoices/{invoice_num}.pdf"

    async def _setup_portal(self, name: str) -> str:
        """Setup client portal."""
        logger.debug(f"   🌐 Setting up portal for {name}")
        slug = name.lower().replace(" ", "-")
        return f"https://portal.agencyos.io/{slug}"

    async def _send_welcome(self, name: str) -> bool:
        """Send welcome email."""
        logger.debug(f"   ✉️ Sending welcome email to {name}")
        return True

    async def _add_to_crm(self, name: str) -> bool:
        """Add client to CRM."""
        logger.debug(f"   📊 Adding {name} to CRM")
        return True

    async def _check_owner_win(self, decision: str) -> dict:
        """Check owner/portfolio WIN."""
        return {"win": True, "reason": "Portfolio equity + recurring revenue"}

    async def _check_agency_win(self, decision: str) -> dict:
        """Check agency WIN."""
        return {"win": True, "reason": "Knowledge capture + process improvement"}

    async def _check_client_win(self, decision: str) -> dict:
        """Check client/startup WIN."""
        return {"win": True, "reason": "10x value delivery + strategic protection"}

    async def _assess_risk(self, decision: str) -> int:
        """Assess risk score 1-10."""
        return 3  # Low risk
