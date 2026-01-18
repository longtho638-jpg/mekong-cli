"""
📜 Contract Generator Core Logic
================================
Domain logic for generating professional agreements.
"""

import logging
import uuid
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from enum import Enum
from typing import List

logger = logging.getLogger("mekong.legal")


class ContractType(str, Enum):
    """Types of standard agency contracts."""

    RETAINER = "retainer"
    PROJECT = "project"
    CONSULTING = "consulting"
    WIN_WIN = "win_win"


class PaymentTerms(str, Enum):
    """Payment schedule configurations."""

    NET_15 = "net_15"
    NET_30 = "net_30"
    DUE_ON_RECEIPT = "due_on_receipt"
    FIFTY_FIFTY = "50_50"


@dataclass
class ContractParty:
    """Represents a party (Agency or Client) in the contract."""

    name: str
    company: str
    email: str
    address: str

    def __post_init__(self):
        if not self.email or "@" not in self.email:
            logger.warning(f"⚠️  Potential invalid email for {self.company}: {self.email}")


@dataclass
class ServiceScope:
    """Defines what is included and excluded in the agreement."""

    services: List[str]
    deliverables: List[str]
    exclusions: List[str]
    timeline: str


@dataclass
class Contract:
    """The complete contract document."""

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

    @property
    def total_value(self) -> float:
        return self.monthly_fee * self.duration_months

    @property
    def end_date(self) -> datetime:
        return self.start_date + timedelta(days=30 * self.duration_months)


class ContractGenerator:
    """
    Core logic for generating contract documents.
    """

    def __init__(self, agency: ContractParty):
        self.agency = agency

    def generate(
        self,
        client: ContractParty,
        scope: ServiceScope,
        monthly_fee: float,
        contract_type: ContractType,
        payment_terms: PaymentTerms,
        duration_months: int,
    ) -> Contract:
        """Creates a Contract object."""
        contract_id = f"AGR-{uuid.uuid4().hex[:6].upper()}"

        contract = Contract(
            id=contract_id,
            type=contract_type,
            agency=self.agency,
            client=client,
            scope=scope,
            monthly_fee=monthly_fee,
            payment_terms=payment_terms,
            start_date=datetime.now(),
            duration_months=duration_months,
        )
        return contract

    def format_text(self, contract: Contract) -> str:
        """Renders the contract as a text document with ASCII formatting."""

        def format_list(items: List[str], bullet: str) -> str:
            return "\n".join([f"  {bullet} {item}" for item in items]) if items else "  (None)"

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
            f"  Company: {contract.agency.company}",
            f"  Address: {contract.agency.address}",
            f"  Email:   {contract.agency.email}",
            "",
            "CLIENT:",
            f"  Company: {contract.client.company}",
            f"  Contact: {contract.client.name}",
            f"  Address: {contract.client.address}",
            f"  Email:   {contract.client.email}",
            "",
            "═══════════════════════════════════════════════════════════",
            "                    SCOPE OF SERVICES",
            "═══════════════════════════════════════════════════════════",
            "",
            "Services Included:",
            format_list(contract.scope.services, "✓"),
            "",
            "Deliverables:",
            format_list(contract.scope.deliverables, "•"),
            "",
            "Exclusions:",
            format_list(contract.scope.exclusions, "✗"),
            "",
            f"Timeline: {contract.scope.timeline}",
            "",
            "═══════════════════════════════════════════════════════════",
            "                    FINANCIAL TERMS",
            "═══════════════════════════════════════════════════════════",
            "",
            f"  Contract Type: {contract.type.name.replace('_', ' ').title()}",
            f"  Monthly Fee:   ${contract.monthly_fee:,.2f}",
            f"  Duration:      {contract.duration_months} months",
            f"  Total Value:   ${contract.total_value:,.2f}",
            f"  Payment Terms: {contract.payment_terms.name.replace('_', ' ').title()}",
            "",
            "═══════════════════════════════════════════════════════════",
            "                    TERMS & CONDITIONS",
            "═══════════════════════════════════════════════════════════",
            "1. CANCELLATION: Either party may cancel with 30 days written notice.",
            "2. LATE PAYMENT: 1.5% interest per month on overdue amounts.",
            "3. OWNERSHIP: All deliverables become client property upon full payment.",
            "4. CONFIDENTIALITY: Both parties agree to keep proprietary info confidential.",
            "5. GOVERNING LAW: This agreement shall be governed by local laws.",
            "",
            "═══════════════════════════════════════════════════════════",
            "                      SIGNATURES",
            "═══════════════════════════════════════════════════════════",
            "",
            f"AGENCY: {contract.agency.company}",
            "Signature: _________________________  Date: ______________",
            "",
            f"CLIENT: {contract.client.company}",
            "Signature: _________________________  Date: ______________",
            "",
            "═══════════════════════════════════════════════════════════",
            f'  🏯 {contract.agency.company} - "Không đánh mà thắng"',
            "═══════════════════════════════════════════════════════════",
        ]
        return "\n".join(lines)
