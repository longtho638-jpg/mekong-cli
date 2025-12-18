"""
Tax Filing Agent - Tax Submission & Deadlines
Manages tax filings, deadlines, and submissions.
"""

from dataclasses import dataclass, field
from typing import List, Dict, Optional
from datetime import datetime, timedelta
from enum import Enum
import random


class FilingStatus(Enum):
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    SUBMITTED = "submitted"
    ACCEPTED = "accepted"
    REJECTED = "rejected"
    AMENDED = "amended"


class FilingType(Enum):
    CORPORATE_INCOME = "corporate_income"
    VAT = "vat"
    PAYROLL = "payroll"
    WITHHOLDING = "withholding"
    ANNUAL_REPORT = "annual_report"
    QUARTERLY = "quarterly"


@dataclass
class TaxFiling:
    """Tax filing"""
    id: str
    name: str
    filing_type: FilingType
    period: str  # e.g., "Q4 2024", "2024"
    due_date: datetime
    status: FilingStatus = FilingStatus.PENDING
    amount_due: float = 0.0
    amount_paid: float = 0.0
    submitted_at: Optional[datetime] = None
    notes: str = ""
    created_at: datetime = None
    
    def __post_init__(self):
        if self.created_at is None:
            self.created_at = datetime.now()
    
    @property
    def days_until_due(self) -> int:
        return (self.due_date - datetime.now()).days
    
    @property
    def is_overdue(self) -> bool:
        return datetime.now() > self.due_date and self.status not in [FilingStatus.SUBMITTED, FilingStatus.ACCEPTED]


class TaxFilingAgent:
    """
    Tax Filing Agent - Quản lý Kê khai Thuế
    
    Responsibilities:
    - Track filing deadlines
    - Manage submissions
    - Handle documents
    - Process amendments
    """
    
    def __init__(self):
        self.name = "Tax Filing"
        self.status = "ready"
        self.filings: Dict[str, TaxFiling] = {}
        
    def create_filing(
        self,
        name: str,
        filing_type: FilingType,
        period: str,
        due_date: datetime,
        amount_due: float = 0.0
    ) -> TaxFiling:
        """Create new tax filing"""
        filing_id = f"filing_{int(datetime.now().timestamp())}_{random.randint(100,999)}"
        
        filing = TaxFiling(
            id=filing_id,
            name=name,
            filing_type=filing_type,
            period=period,
            due_date=due_date,
            amount_due=amount_due
        )
        
        self.filings[filing_id] = filing
        return filing
    
    def update_status(self, filing_id: str, status: FilingStatus) -> TaxFiling:
        """Update filing status"""
        if filing_id not in self.filings:
            raise ValueError(f"Filing not found: {filing_id}")
            
        filing = self.filings[filing_id]
        filing.status = status
        
        if status == FilingStatus.SUBMITTED:
            filing.submitted_at = datetime.now()
        
        return filing
    
    def submit(self, filing_id: str, amount_paid: float = 0.0) -> TaxFiling:
        """Submit filing"""
        if filing_id not in self.filings:
            raise ValueError(f"Filing not found: {filing_id}")
            
        filing = self.filings[filing_id]
        filing.status = FilingStatus.SUBMITTED
        filing.submitted_at = datetime.now()
        filing.amount_paid = amount_paid
        
        return filing
    
    def get_upcoming(self, days: int = 30) -> List[TaxFiling]:
        """Get upcoming deadlines"""
        return [
            f for f in self.filings.values()
            if 0 <= f.days_until_due <= days and f.status == FilingStatus.PENDING
        ]
    
    def get_overdue(self) -> List[TaxFiling]:
        """Get overdue filings"""
        return [f for f in self.filings.values() if f.is_overdue]
    
    def get_stats(self) -> Dict:
        """Get filing statistics"""
        filings = list(self.filings.values())
        
        return {
            "total_filings": len(filings),
            "pending": len([f for f in filings if f.status == FilingStatus.PENDING]),
            "submitted": len([f for f in filings if f.status in [FilingStatus.SUBMITTED, FilingStatus.ACCEPTED]]),
            "overdue": len(self.get_overdue()),
            "total_due": sum(f.amount_due for f in filings),
            "total_paid": sum(f.amount_paid for f in filings),
            "upcoming_30_days": len(self.get_upcoming(30))
        }


# Demo
if __name__ == "__main__":
    agent = TaxFilingAgent()
    
    print("🧾 Tax Filing Agent Demo\n")
    
    # Create filings
    f1 = agent.create_filing("Corporate Tax Q4", FilingType.CORPORATE_INCOME, "Q4 2024", datetime.now() + timedelta(days=15), 25000)
    f2 = agent.create_filing("VAT Monthly", FilingType.VAT, "Dec 2024", datetime.now() + timedelta(days=5), 8500)
    f3 = agent.create_filing("Payroll Tax", FilingType.PAYROLL, "Dec 2024", datetime.now() + timedelta(days=10), 12000)
    
    print(f"📋 Filing: {f1.name}")
    print(f"   Type: {f1.filing_type.value}")
    print(f"   Due: {f1.days_until_due} days")
    print(f"   Amount: ${f1.amount_due:,.0f}")
    
    # Submit
    agent.submit(f2.id, 8500)
    
    print(f"\n✅ Submitted: {f2.name}")
    
    # Stats
    print("\n📊 Stats:")
    stats = agent.get_stats()
    print(f"   Pending: {stats['pending']}")
    print(f"   Total Due: ${stats['total_due']:,.0f}")
    print(f"   Upcoming 30d: {stats['upcoming_30_days']}")
