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

from typing import Dict, List, Any, Optional
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from enum import Enum


class ContractType(Enum):
    """Contract types."""
    RETAINER = "retainer"
    PROJECT = "project"
    CONSULTING = "consulting"


class PaymentTerms(Enum):
    """Payment terms."""
    NET_15 = "net_15"
    NET_30 = "net_30"
    DUE_ON_RECEIPT = "due_on_receipt"
    FIFTY_FIFTY = "50_50"


@dataclass
class ContractParty:
    """A party to the contract."""
    name: str
    company: str
    email: str
    address: str


@dataclass
class ServiceScope:
    """Scope of services."""
    services: List[str]
    deliverables: List[str]
    exclusions: List[str]
    timeline: str


@dataclass
class Contract:
    """A contract document."""
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


class ContractGenerator:
    """
    Contract Generator.
    
    Create professional agency-client contracts.
    """
    
    def __init__(self, agency_name: str, agency_email: str, agency_address: str):
        self.agency = ContractParty(
            name=agency_name,
            company=agency_name,
            email=agency_email,
            address=agency_address
        )
    
    def create_contract(
        self,
        client: ContractParty,
        scope: ServiceScope,
        monthly_fee: float,
        contract_type: ContractType = ContractType.RETAINER,
        payment_terms: PaymentTerms = PaymentTerms.NET_30,
        duration_months: int = 6
    ) -> Contract:
        """Create a new contract."""
        import uuid
        
        return Contract(
            id=f"AGR-{uuid.uuid4().hex[:6].upper()}",
            type=contract_type,
            agency=self.agency,
            client=client,
            scope=scope,
            monthly_fee=monthly_fee,
            payment_terms=payment_terms,
            start_date=datetime.now(),
            duration_months=duration_months
        )
    
    def format_contract(self, contract: Contract) -> str:
        """Format contract as text document."""
        end_date = contract.start_date + timedelta(days=30 * contract.duration_months)
        total_value = contract.monthly_fee * contract.duration_months
        
        lines = [
            "╔═══════════════════════════════════════════════════════════╗",
            "║              SERVICE AGREEMENT                            ║",
            f"║  Contract ID: {contract.id:<40}  ║",
            "╚═══════════════════════════════════════════════════════════╝",
            "",
            "═══════════════════════════════════════════════════════════",
            "                      PARTIES",
            "═══════════════════════════════════════════════════════════",
            "",
            f"SERVICE PROVIDER (\"Agency\"):",
            f"  {contract.agency.company}",
            f"  {contract.agency.address}",
            f"  {contract.agency.email}",
            "",
            f"CLIENT:",
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
        
        lines.extend([
            "",
            "Deliverables:",
        ])
        
        for deliverable in contract.scope.deliverables:
            lines.append(f"  • {deliverable}")
        
        lines.extend([
            "",
            "Exclusions:",
        ])
        
        for exclusion in contract.scope.exclusions:
            lines.append(f"  ✗ {exclusion}")
        
        lines.extend([
            "",
            f"Timeline: {contract.scope.timeline}",
            "",
            "═══════════════════════════════════════════════════════════",
            "                    FINANCIAL TERMS",
            "═══════════════════════════════════════════════════════════",
            "",
            f"  Contract Type: {contract.type.value.capitalize()}",
            f"  Monthly Fee: ${contract.monthly_fee:,.0f}",
            f"  Duration: {contract.duration_months} months",
            f"  Total Value: ${total_value:,.0f}",
            f"  Payment Terms: {contract.payment_terms.value.replace('_', ' ').title()}",
            "",
            "═══════════════════════════════════════════════════════════",
            "                    CONTRACT PERIOD",
            "═══════════════════════════════════════════════════════════",
            "",
            f"  Start Date: {contract.start_date.strftime('%B %d, %Y')}",
            f"  End Date: {end_date.strftime('%B %d, %Y')}",
            "",
            "═══════════════════════════════════════════════════════════",
            "                    TERMS & CONDITIONS",
            "═══════════════════════════════════════════════════════════",
            "",
            "1. CANCELLATION: Either party may cancel with 30 days notice.",
            "2. LATE PAYMENT: 1.5% interest per month on overdue amounts.",
            "3. OWNERSHIP: All deliverables become client property upon payment.",
            "4. CONFIDENTIALITY: Both parties agree to keep sensitive info private.",
            "5. LIMITATION: Agency liability limited to fees paid.",
            "",
            "═══════════════════════════════════════════════════════════",
            "                      SIGNATURES",
            "═══════════════════════════════════════════════════════════",
            "",
            f"AGENCY: {contract.agency.company}",
            "",
            "Signature: _________________________  Date: ______________",
            "",
            f"CLIENT: {contract.client.company}",
            "",
            "Signature: _________________________  Date: ______________",
            "",
            "═══════════════════════════════════════════════════════════",
            f"  🏯 {contract.agency.company} - \"Không đánh mà thắng\"",
            "═══════════════════════════════════════════════════════════",
        ])
        
        return "\n".join(lines)


# Example usage
if __name__ == "__main__":
    generator = ContractGenerator(
        agency_name="Saigon Digital Hub",
        agency_email="hello@saigondigitalhub.com",
        agency_address="123 Digital Street, Ho Chi Minh City"
    )
    
    client = ContractParty(
        name="Mr. Hoang",
        company="Sunrise Realty",
        email="hoang@sunriserealty.vn",
        address="456 Business Ave, District 1"
    )
    
    scope = ServiceScope(
        services=[
            "SEO Strategy & Implementation",
            "Content Marketing",
            "Social Media Management",
            "Monthly Analytics Reports"
        ],
        deliverables=[
            "Monthly SEO audit",
            "4 blog posts per month",
            "20 social posts per month",
            "Monthly performance report"
        ],
        exclusions=[
            "Paid advertising spend",
            "Website development",
            "Video production"
        ],
        timeline="Ongoing monthly retainer"
    )
    
    contract = generator.create_contract(
        client=client,
        scope=scope,
        monthly_fee=2500,
        duration_months=6
    )
    
    print("📄 Contract Generator")
    print("=" * 60)
    print()
    print(generator.format_contract(contract))
