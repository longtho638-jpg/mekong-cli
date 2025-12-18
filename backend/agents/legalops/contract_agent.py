"""
Contract Agent - Contract Lifecycle Management
Manages contract drafting, review, and signatures.
"""

from dataclasses import dataclass, field
from typing import List, Dict, Optional
from datetime import datetime, timedelta
from enum import Enum
import random


class ContractStatus(Enum):
    DRAFT = "draft"
    REVIEW = "review"
    NEGOTIATION = "negotiation"
    PENDING_SIGNATURE = "pending_signature"
    SIGNED = "signed"
    EXPIRED = "expired"
    TERMINATED = "terminated"


class ContractType(Enum):
    NDA = "nda"
    MSA = "msa"
    SOW = "sow"
    LICENSE = "license"
    EMPLOYMENT = "employment"
    VENDOR = "vendor"


@dataclass
class Contract:
    """Legal contract"""
    id: str
    name: str
    counterparty: str
    contract_type: ContractType
    value: float = 0.0
    status: ContractStatus = ContractStatus.DRAFT
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    assigned_lawyer: str = ""
    review_notes: str = ""
    created_at: datetime = None
    
    def __post_init__(self):
        if self.created_at is None:
            self.created_at = datetime.now()
    
    @property
    def days_until_expiry(self) -> int:
        if self.end_date:
            return (self.end_date - datetime.now()).days
        return 0


class ContractAgent:
    """
    Contract Agent - Quản lý Hợp đồng
    
    Responsibilities:
    - Draft contracts
    - Manage review workflow
    - Track signatures
    - Handle renewals
    """
    
    def __init__(self):
        self.name = "Contract"
        self.status = "ready"
        self.contracts: Dict[str, Contract] = {}
        
    def create_contract(
        self,
        name: str,
        counterparty: str,
        contract_type: ContractType,
        value: float = 0.0,
        duration_days: int = 365,
        assigned_lawyer: str = ""
    ) -> Contract:
        """Create new contract"""
        contract_id = f"contract_{int(datetime.now().timestamp())}_{random.randint(100,999)}"
        
        contract = Contract(
            id=contract_id,
            name=name,
            counterparty=counterparty,
            contract_type=contract_type,
            value=value,
            start_date=datetime.now(),
            end_date=datetime.now() + timedelta(days=duration_days),
            assigned_lawyer=assigned_lawyer
        )
        
        self.contracts[contract_id] = contract
        return contract
    
    def advance_status(self, contract_id: str, status: ContractStatus) -> Contract:
        """Move contract to next status"""
        if contract_id not in self.contracts:
            raise ValueError(f"Contract not found: {contract_id}")
            
        contract = self.contracts[contract_id]
        contract.status = status
        
        return contract
    
    def add_review_notes(self, contract_id: str, notes: str) -> Contract:
        """Add review notes"""
        if contract_id not in self.contracts:
            raise ValueError(f"Contract not found: {contract_id}")
            
        contract = self.contracts[contract_id]
        contract.review_notes = notes
        
        return contract
    
    def sign(self, contract_id: str) -> Contract:
        """Mark contract as signed"""
        return self.advance_status(contract_id, ContractStatus.SIGNED)
    
    def get_pending_review(self) -> List[Contract]:
        """Get contracts pending review"""
        return [c for c in self.contracts.values() if c.status == ContractStatus.REVIEW]
    
    def get_expiring_soon(self, days: int = 90) -> List[Contract]:
        """Get contracts expiring soon"""
        return [
            c for c in self.contracts.values()
            if c.status == ContractStatus.SIGNED and 0 < c.days_until_expiry <= days
        ]
    
    def get_stats(self) -> Dict:
        """Get contract statistics"""
        contracts = list(self.contracts.values())
        
        return {
            "total_contracts": len(contracts),
            "active": len([c for c in contracts if c.status == ContractStatus.SIGNED]),
            "pending_review": len(self.get_pending_review()),
            "pending_signature": len([c for c in contracts if c.status == ContractStatus.PENDING_SIGNATURE]),
            "total_value": sum(c.value for c in contracts if c.status == ContractStatus.SIGNED),
            "expiring_90_days": len(self.get_expiring_soon(90))
        }


# Demo
if __name__ == "__main__":
    agent = ContractAgent()
    
    print("📄 Contract Agent Demo\n")
    
    # Create contracts
    c1 = agent.create_contract("Enterprise MSA", "BigCorp", ContractType.MSA, 150000, assigned_lawyer="Legal_001")
    c2 = agent.create_contract("NDA - TechCo", "TechCo", ContractType.NDA, assigned_lawyer="Legal_002")
    c3 = agent.create_contract("SOW Phase 1", "StartupX", ContractType.SOW, 50000, assigned_lawyer="Legal_001")
    
    print(f"📋 Contract: {c1.name}")
    print(f"   Type: {c1.contract_type.value}")
    print(f"   Value: ${c1.value:,.0f}")
    
    # Workflow
    agent.advance_status(c1.id, ContractStatus.REVIEW)
    agent.add_review_notes(c1.id, "Reviewed liability clause")
    agent.advance_status(c1.id, ContractStatus.PENDING_SIGNATURE)
    agent.sign(c1.id)
    
    agent.advance_status(c2.id, ContractStatus.REVIEW)
    
    print(f"\n✅ Status: {c1.status.value}")
    
    # Stats
    print("\n📊 Stats:")
    stats = agent.get_stats()
    print(f"   Active: {stats['active']}")
    print(f"   Pending Review: {stats['pending_review']}")
    print(f"   Total Value: ${stats['total_value']:,.0f}")
