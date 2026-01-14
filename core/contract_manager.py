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

import uuid
import logging
from typing import Dict, List, Any, Optional, Union
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from enum import Enum

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class ContractType(Enum):
    """Common legal agreement types."""
    MSA = "msa"  # Master Service Agreement
    SOW = "sow"  # Statement of Work
    NDA = "nda"  # Non-Disclosure Agreement
    SLA = "sla"  # Service Level Agreement
    EMPLOYMENT = "employment"
    VENDOR = "vendor"


class ContractStatus(Enum):
    """Contract lifecycle status."""
    DRAFT = "draft"
    PENDING_SIGNATURE = "pending_signature"
    ACTIVE = "active"
    EXPIRED = "expired"
    TERMINATED = "terminated"


class SignatureStatus(Enum):
    """E-signature tracking status."""
    NOT_SENT = "not_sent"
    SENT = "sent"
    SIGNED = "signed"
    DECLINED = "declined"


@dataclass
class Contract:
    """A contract record entity."""
    id: str
    title: str
    contract_type: ContractType
    client_name: str
    status: ContractStatus = ContractStatus.DRAFT
    value: float = 0.0
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    signature_status: SignatureStatus = SignatureStatus.NOT_SENT
    auto_renew: bool = False
    created_at: datetime = field(default_factory=datetime.now)

    def __post_init__(self):
        if self.value < 0:
            raise ValueError("Contract value cannot be negative")


@dataclass
class ContractTemplate:
    """A reusable contract template."""
    id: str
    name: str
    contract_type: ContractType
    content: str
    variables: List[str] = field(default_factory=list)


class ContractManager:
    """
    Contract Manager System.
    
    Centralized handling of all legal and professional agreements.
    """
    
    def __init__(self, agency_name: str):
        self.agency_name = agency_name
        self.contracts: Dict[str, Contract] = {}
        self.templates: Dict[str, ContractTemplate] = {}
        
        logger.info(f"Contract Manager initialized for {agency_name}")
        self._init_defaults()
    
    def _init_defaults(self):
        """Pre-populate with templates and sample data."""
        # Initialize templates
        templates_config = [
            ("Master Service Agreement", ContractType.MSA, ["client_name", "effective_date"]),
            ("Statement of Work", ContractType.SOW, ["project_name", "deliverables", "fee"]),
            ("Non-Disclosure Agreement", ContractType.NDA, ["parties", "duration"]),
        ]
        for name, ctype, vars in templates_config:
            self.add_template(name, ctype, f"Content for {name}", vars)
            
        # Add sample active contracts
        samples = [
            ("TechStart - MSA", ContractType.MSA, "TechStart Inc", 36000.0, 365),
            ("GrowthCo - SOW", ContractType.SOW, "GrowthCo", 24000.0, 180),
        ]
        for title, ctype, client, val, days in samples:
            c = self.create_contract(title, ctype, client, val, days)
            c.status = ContractStatus.ACTIVE
            c.signature_status = SignatureStatus.SIGNED
    
    def add_template(
        self,
        name: str,
        contract_type: ContractType,
        content: str,
        variables: List[str]
    ) -> ContractTemplate:
        """Register a new contract template."""
        template = ContractTemplate(
            id=f"TPL-{uuid.uuid4().hex[:6].upper()}",
            name=name,
            contract_type=contract_type,
            content=content,
            variables=variables
        )
        self.templates[template.id] = template
        logger.debug(f"Template added: {name}")
        return template
    
    def create_contract(
        self,
        title: str,
        contract_type: ContractType,
        client_name: str,
        value: float = 0.0,
        duration_days: int = 365
    ) -> Contract:
        """Create a new contract based on a template or custom terms."""
        if not title or not client_name:
            raise ValueError("Title and client name are required")

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
        logger.info(f"Contract record created: {title} for {client_name}")
        return contract
    
    def get_stats(self) -> Dict[str, Any]:
        """Aggregate contract statistics."""
        active = [c for c in self.contracts.values() if c.status == ContractStatus.ACTIVE]
        pending = [c for c in self.contracts.values() if c.status == ContractStatus.PENDING_SIGNATURE]
        
        return {
            "active_count": len(active),
            "pending_count": len(pending),
            "total_value": sum(c.value for c in active),
            "total_records": len(self.contracts)
        }
    
    def format_dashboard(self) -> str:
        """Render ASCII Contract Dashboard."""
        stats = self.get_stats()
        
        lines = [
            "╔═══════════════════════════════════════════════════════════╗",
            f"║  📋 CONTRACT MANAGER DASHBOARD{' ' * 31}║",
            f"║  {stats['active_count']} active │ ${stats['total_value']:,.0f} active value │ {len(self.contracts)} total{' ' * 10}║",
            "╠═══════════════════════════════════════════════════════════╣",
            "║  📄 RECENT CONTRACTS                                      ║",
            "║  ───────────────────────────────────────────────────────  ║",
        ]
        
        type_icons = {
            ContractType.MSA: "📋", ContractType.SOW: "📝", 
            ContractType.NDA: "🔒", ContractType.SLA: "📊", 
            ContractType.EMPLOYMENT: "👤", ContractType.VENDOR: "🏢"
        }
        status_icons = {
            ContractStatus.DRAFT: "📝", ContractStatus.PENDING_SIGNATURE: "✍️",
            ContractStatus.ACTIVE: "✅", ContractStatus.EXPIRED: "⏰", 
            ContractStatus.TERMINATED: "❌"
        }
        
        # Display top 5 active/recent contracts
        for c in list(self.contracts.values())[:5]:
            t_icon = type_icons.get(c.contract_type, "📄")
            s_icon = status_icons.get(c.status, "⚪")
            title_disp = (c.title[:22] + '..') if len(c.title) > 24 else c.title
            lines.append(f"║    {t_icon} {s_icon} {title_disp:<24} │ ${c.value:>10,.0f}  ║")
        
        lines.extend([
            "║                                                           ║",
            "║  [📋 Contracts]  [📑 Templates]  [✍️ Send for Signature]  ║",
            "╠═══════════════════════════════════════════════════════════╣",
            f"║  🏯 {self.agency_name[:40]:<40} - Stability!          ║",
            "╚═══════════════════════════════════════════════════════════╝",
        ])
        
        return "\n".join(lines)


# Example usage
if __name__ == "__main__":
    print("📋 Initializing Contract Manager...")
    print("=" * 60)
    
    try:
        contract_system = ContractManager("Saigon Digital Hub")
        
        # Create a new draft
        contract_system.create_contract("New Project SOW", ContractType.SOW, "Acme Corp", 5000.0)
        
        print("\n" + contract_system.format_dashboard())
        
    except Exception as e:
        logger.error(f"Manager Error: {e}")
