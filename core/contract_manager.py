"""
📋 Contract Manager - Agreements & Contracts
==============================================

Manage client contracts and agreements.
Protect your business!

Features:
- Contract templates (MSA, SOW, NDA)
- Contract lifecycle
- Renewal alerts
- E-signature tracking
"""

from typing import Dict, List, Any, Optional
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from enum import Enum
import uuid


class ContractType(Enum):
    """Contract types."""
    MSA = "msa"  # Master Service Agreement
    SOW = "sow"  # Statement of Work
    NDA = "nda"  # Non-Disclosure Agreement
    SLA = "sla"  # Service Level Agreement
    EMPLOYMENT = "employment"
    VENDOR = "vendor"


class ContractStatus(Enum):
    """Contract status."""
    DRAFT = "draft"
    PENDING_SIGNATURE = "pending_signature"
    ACTIVE = "active"
    EXPIRED = "expired"
    TERMINATED = "terminated"


class SignatureStatus(Enum):
    """Signature status."""
    NOT_SENT = "not_sent"
    SENT = "sent"
    SIGNED = "signed"
    DECLINED = "declined"


@dataclass
class Contract:
    """A contract."""
    id: str
    title: str
    contract_type: ContractType
    client_name: str
    status: ContractStatus = ContractStatus.DRAFT
    value: float = 0
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    signature_status: SignatureStatus = SignatureStatus.NOT_SENT
    auto_renew: bool = False
    created_at: datetime = field(default_factory=datetime.now)


@dataclass
class ContractTemplate:
    """A contract template."""
    id: str
    name: str
    contract_type: ContractType
    content: str
    variables: List[str] = field(default_factory=list)


class ContractManager:
    """
    Contract Manager.
    
    Manage all agency contracts.
    """
    
    def __init__(self, agency_name: str):
        self.agency_name = agency_name
        self.contracts: Dict[str, Contract] = {}
        self.templates: Dict[str, ContractTemplate] = {}
        
        self._init_demo_data()
    
    def _init_templates(self):
        """Initialize contract templates."""
        templates = [
            ("Master Service Agreement", ContractType.MSA, 
             ["client_name", "effective_date", "terms"]),
            ("Statement of Work", ContractType.SOW,
             ["project_name", "deliverables", "timeline", "fee"]),
            ("Non-Disclosure Agreement", ContractType.NDA,
             ["parties", "confidential_info", "duration"]),
            ("Service Level Agreement", ContractType.SLA,
             ["service_levels", "uptime", "response_times"]),
        ]
        
        for name, ctype, vars in templates:
            self.add_template(name, ctype, f"Template for {name}", vars)
    
    def _init_demo_data(self):
        """Initialize demo data."""
        self._init_templates()
        
        # Add demo contracts
        contracts = [
            ("TechStart Inc - MSA", ContractType.MSA, "TechStart Inc", 36000, 365),
            ("GrowthCo - Retainer SOW", ContractType.SOW, "GrowthCo", 24000, 180),
            ("NewBrand - NDA", ContractType.NDA, "NewBrand", 0, 730),
            ("BigCorp - MSA", ContractType.MSA, "BigCorp", 60000, 365),
        ]
        
        for title, ctype, client, value, days in contracts:
            c = self.create_contract(title, ctype, client, value, days)
            c.status = ContractStatus.ACTIVE
            c.signature_status = SignatureStatus.SIGNED
    
    def add_template(
        self,
        name: str,
        contract_type: ContractType,
        content: str,
        variables: List[str]
    ) -> ContractTemplate:
        """Add a contract template."""
        template = ContractTemplate(
            id=f"TPL-{uuid.uuid4().hex[:6].upper()}",
            name=name,
            contract_type=contract_type,
            content=content,
            variables=variables
        )
        self.templates[template.id] = template
        return template
    
    def create_contract(
        self,
        title: str,
        contract_type: ContractType,
        client_name: str,
        value: float = 0,
        duration_days: int = 365
    ) -> Contract:
        """Create a new contract."""
        contract = Contract(
            id=f"CTR-{uuid.uuid4().hex[:6].upper()}",
            title=title,
            contract_type=contract_type,
            client_name=client_name,
            value=value,
            start_date=datetime.now(),
            end_date=datetime.now() + timedelta(days=duration_days)
        )
        self.contracts[contract.id] = contract
        return contract
    
    def send_for_signature(self, contract: Contract):
        """Send contract for e-signature."""
        contract.signature_status = SignatureStatus.SENT
        contract.status = ContractStatus.PENDING_SIGNATURE
    
    def mark_signed(self, contract: Contract):
        """Mark contract as signed."""
        contract.signature_status = SignatureStatus.SIGNED
        contract.status = ContractStatus.ACTIVE
    
    def get_expiring_soon(self, days: int = 30) -> List[Contract]:
        """Get contracts expiring soon."""
        cutoff = datetime.now() + timedelta(days=days)
        return [
            c for c in self.contracts.values()
            if c.status == ContractStatus.ACTIVE
            and c.end_date and c.end_date <= cutoff
        ]
    
    def get_stats(self) -> Dict[str, Any]:
        """Get contract statistics."""
        active = sum(1 for c in self.contracts.values() if c.status == ContractStatus.ACTIVE)
        pending = sum(1 for c in self.contracts.values() if c.status == ContractStatus.PENDING_SIGNATURE)
        total_value = sum(c.value for c in self.contracts.values() if c.status == ContractStatus.ACTIVE)
        expiring = len(self.get_expiring_soon())
        
        return {
            "total": len(self.contracts),
            "active": active,
            "pending_signature": pending,
            "total_value": total_value,
            "expiring_soon": expiring,
            "templates": len(self.templates)
        }
    
    def format_dashboard(self) -> str:
        """Format contract manager dashboard."""
        stats = self.get_stats()
        
        lines = [
            "╔═══════════════════════════════════════════════════════════╗",
            f"║  📋 CONTRACT MANAGER                                      ║",
            f"║  {stats['active']} active │ ${stats['total_value']:,.0f} value │ {stats['expiring_soon']} expiring  ║",
            "╠═══════════════════════════════════════════════════════════╣",
            "║  📄 ACTIVE CONTRACTS                                      ║",
            "║  ─────────────────────────────────────────────────────── ║",
        ]
        
        type_icons = {"msa": "📋", "sow": "📝", "nda": "🔒",
                     "sla": "📊", "employment": "👤", "vendor": "🏢"}
        status_icons = {"draft": "📝", "pending_signature": "✍️",
                       "active": "✅", "expired": "⏰", "terminated": "❌"}
        
        for contract in list(self.contracts.values())[:4]:
            t_icon = type_icons.get(contract.contract_type.value, "📄")
            s_icon = status_icons.get(contract.status.value, "⚪")
            lines.append(f"║    {t_icon} {s_icon} {contract.title[:22]:<22} │ ${contract.value:>8,.0f}  ║")
        
        lines.extend([
            "║                                                           ║",
            "║  📑 CONTRACT TEMPLATES                                    ║",
            "║  ─────────────────────────────────────────────────────── ║",
        ])
        
        for template in list(self.templates.values())[:4]:
            t_icon = type_icons.get(template.contract_type.value, "📄")
            lines.append(f"║    {t_icon} {template.name:<35}  ║")
        
        lines.extend([
            "║                                                           ║",
            "║  ⏰ RENEWAL ALERTS                                        ║",
            "║  ─────────────────────────────────────────────────────── ║",
        ])
        
        expiring = self.get_expiring_soon()
        if expiring:
            for contract in expiring[:3]:
                days_left = (contract.end_date - datetime.now()).days if contract.end_date else 0
                lines.append(f"║    ⚠️ {contract.title[:25]:<25} │ {days_left} days  ║")
        else:
            lines.append("║    ✅ No contracts expiring in next 30 days             ║")
        
        lines.extend([
            "║                                                           ║",
            "║  📊 CONTRACT SUMMARY                                      ║",
            "║  ─────────────────────────────────────────────────────── ║",
            f"║    📄 Total Contracts:    {stats['total']:>12}              ║",
            f"║    ✅ Active:             {stats['active']:>12}              ║",
            f"║    ✍️ Pending Signature:  {stats['pending_signature']:>12}              ║",
            f"║    💰 Total Value:        ${stats['total_value']:>11,.0f}              ║",
            "║                                                           ║",
            "║  [📋 Contracts]  [📑 Templates]  [✍️ Sign]                ║",
            "╠═══════════════════════════════════════════════════════════╣",
            f"║  🏯 {self.agency_name} - Protect your business!           ║",
            "╚═══════════════════════════════════════════════════════════╝",
        ])
        
        return "\n".join(lines)


# Example usage
if __name__ == "__main__":
    cm = ContractManager("Saigon Digital Hub")
    
    print("📋 Contract Manager")
    print("=" * 60)
    print()
    
    print(cm.format_dashboard())
