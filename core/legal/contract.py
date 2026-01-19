"""
📄 Contract Generator - Professional Agreements
=================================================

Generate professional agency-client contracts.
Protect your business legally!

Features:
- Service agreement templates
- Scope of work
- Payment terms
- Cancellation policy
"""

import logging
import uuid
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from enum import Enum
from typing import List

# Configure logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)


class ContractType(Enum):
    """Contract types."""

    RETAINER = "retainer"
    PROJECT = "project"
    CONSULTING = "consulting"


class PaymentTerms(Enum):
    """Payment terms configuration."""

    NET_15 = "net_15"
    NET_30 = "net_30"
    DUE_ON_RECEIPT = "due_on_receipt"
    FIFTY_FIFTY = "50_50"


@dataclass
class ContractParty:
    """A party involved in the legal agreement."""

    name: str
    company: str
    email: str
    address: str

    def __post_init__(self):
        if not self.email or "@" not in self.email:
            raise ValueError(f"Invalid email for party {self.company}")


@dataclass
class ServiceScope:
    """Detailed scope of services and deliverables."""

    services: List[str]
    deliverables: List[str]
    exclusions: List[str]
    timeline: str


@dataclass
class Contract:
    """A complete contract document entity."""

    id: str
    type: ContractType
    agency: ContractParty
    client: ContractParty
    scope: ServiceScope
    monthly_fee: float
    payment_terms: PaymentTerms
    start_date: datetime
    duration_months: int
    created_at: datetime = field(default_factory=datetime.now)

    def __post_init__(self):
        if self.monthly_fee < 0:
            raise ValueError("Fees cannot be negative")
        if self.duration_months <= 0:
            raise ValueError("Duration must be at least 1 month")


class ContractGenerator:
    """
    Contract Generator System.

    Automates the creation of professional, legally-aligned service agreements.
    """

    def __init__(self, agency_name: str, agency_email: str, agency_address: str):
        self.agency = ContractParty(
            name=agency_name, company=agency_name, email=agency_email, address=agency_address
        )
        logger.info(f"Contract Generator initialized for {agency_name}")

    def create_contract(
        self,
        client: ContractParty,
        scope: ServiceScope,
        monthly_fee: float,
        contract_type: ContractType = ContractType.RETAINER,
        payment_terms: PaymentTerms = PaymentTerms.NET_30,
        duration_months: int = 6,
    ) -> Contract:
        """Execute the contract generation logic."""
        contract = Contract(
            id=f"AGR-{uuid.uuid4().hex[:6].upper()}",
            type=contract_type,
            agency=self.agency,
            client=client,
            scope=scope,
            monthly_fee=float(monthly_fee),
            payment_terms=payment_terms,
            start_date=datetime.now(),
            duration_months=duration_months,
        )
        logger.info(f"Contract {contract.id} generated for {client.company}")
        return contract

    def format_contract(self, contract: Contract) -> str:
        """Render the contract as a clean, text-based document."""
        contract.start_date + timedelta(days=30 * contract.duration_months)
        total_value = contract.monthly_fee * contract.duration_months

        lines = [
            "╔═══════════════════════════════════════════════════════════╗",
            "║              SERVICE AGREEMENT                            ║",
            f"║  Contract ID: {contract.id:<40}  ║",
            "╚═══════════════════════════════════════════════════════════╝",
            "",
            "═══════════════════════════════════════════════════════════",
            "                      CONTRACT PARTIES",
            "═══════════════════════════════════════════════════════════",
            "",
            'SERVICE PROVIDER ("Agency"):',
            f"  {contract.agency.company}",
            f"  {contract.agency.address}",
            f"  {contract.agency.email}",
            "",
            "CLIENT:",
            f"  {contract.client.company}",
            f"  Contact: {contract.client.name}",
            f"  {contract.client.address}",
            f"  {contract.client.email}",
            "",
            "═══════════════════════════════════════════════════════════",
            "                    SCOPE OF SERVICES",
            "═══════════════════════════════════════════════════════════",
            "",
            "Services Included:",
        ]

        for service in contract.scope.services:
            lines.append(f"  ✓ {service}")

        lines.append("\nDeliverables:")
        for deliverable in contract.scope.deliverables:
            lines.append(f"  • {deliverable}")

        lines.append("\nExclusions:")
        for exclusion in contract.scope.exclusions:
            lines.append(f"  ✗ {exclusion}")

        lines.extend(
            [
                f"\nTimeline: {contract.scope.timeline}",
                "",
                "═══════════════════════════════════════════════════════════",
                "                    FINANCIAL TERMS",
                "═══════════════════════════════════════════════════════════",
                "",
                f"  Contract Type: {contract.type.value.capitalize()}",
                f"  Monthly Fee:   ${contract.monthly_fee:,.0f}",
                f"  Duration:      {contract.duration_months} months",
                f"  Total Value:   ${total_value:,.0f}",
                f"  Payment Terms: {contract.payment_terms.value.replace('_', ' ').title()}",
                "",
                "═══════════════════════════════════════════════════════════",
                "                    TERMS & CONDITIONS",
                "═══════════════════════════════════════════════════════════",
                "1. CANCELLATION: Either party may cancel with 30 days notice.",
                "2. LATE PAYMENT: 1.5% interest per month on overdue amounts.",
                "3. OWNERSHIP: All deliverables become client property upon payment.",
                "",
                "═══════════════════════════════════════════════════════════",
                "                      SIGNATURES",
                "═══════════════════════════════════════════════════════════",
                f"AGENCY: {contract.agency.company}",
                "Signature: _________________________  Date: ______________\n",
                f"CLIENT: {contract.client.company}",
                "Signature: _________________________  Date: ______________",
                "═══════════════════════════════════════════════════════════",
                f'  🏯 {contract.agency.company} - "Không đánh mà thắng"',
                "═══════════════════════════════════════════════════════════",
            ]
        )

        return "\n".join(lines)


# Example usage
if __name__ == "__main__":
    print("📄 Initializing Contract Generator...")
    print("=" * 60)

    try:
        gen = ContractGenerator("Saigon Digital", "hello@saigon.vn", "HCM City")

        c_party = ContractParty("Hoang", "Sunrise Realty", "hoang@sunrise.vn", "District 1")
        c_scope = ServiceScope(
            services=["SEO", "Ads"],
            deliverables=["Reports"],
            exclusions=["Video"],
            timeline="Monthly",
        )

        agreement = gen.create_contract(c_party, c_scope, 2500.0)
        print("\n" + gen.format_contract(agreement))

    except Exception as e:
        logger.error(f"Generation Error: {e}")
