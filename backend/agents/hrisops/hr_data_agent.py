"""
HR Data Agent - Employee Records & System Management
Manages employee data, records, and system integrations.
"""

from dataclasses import dataclass, field
from typing import List, Dict, Optional
from datetime import datetime, date
from enum import Enum
import random


class RecordStatus(Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"
    PENDING = "pending"
    ARCHIVED = "archived"


class DataType(Enum):
    PERSONAL = "personal"
    EMPLOYMENT = "employment"
    COMPENSATION = "compensation"
    EMERGENCY = "emergency"
    DOCUMENTS = "documents"


@dataclass
class EmployeeRecord:
    """Employee HRIS record"""
    id: str
    employee_id: str
    name: str
    email: str
    department: str
    position: str
    hire_date: date
    status: RecordStatus = RecordStatus.ACTIVE
    manager_id: str = ""
    location: str = ""
    data_complete: float = 0.0  # 0-100 completeness
    last_updated: datetime = None
    
    def __post_init__(self):
        if self.last_updated is None:
            self.last_updated = datetime.now()


class HRDataAgent:
    """
    HR Data Agent - Quản lý Dữ liệu Nhân sự
    
    Responsibilities:
    - Manage employee records
    - Validate data integrity
    - System integrations
    - Generate reports
    """
    
    def __init__(self):
        self.name = "HR Data"
        self.status = "ready"
        self.records: Dict[str, EmployeeRecord] = {}
        
    def create_record(
        self,
        employee_id: str,
        name: str,
        email: str,
        department: str,
        position: str,
        hire_date: date,
        manager_id: str = "",
        location: str = ""
    ) -> EmployeeRecord:
        """Create employee record"""
        record_id = f"rec_{int(datetime.now().timestamp())}_{random.randint(100,999)}"
        
        record = EmployeeRecord(
            id=record_id,
            employee_id=employee_id,
            name=name,
            email=email,
            department=department,
            position=position,
            hire_date=hire_date,
            manager_id=manager_id,
            location=location,
            data_complete=self._calculate_completeness(name, email, department, position, manager_id, location)
        )
        
        self.records[record_id] = record
        return record
    
    def _calculate_completeness(self, *fields) -> float:
        """Calculate data completeness"""
        filled = sum(1 for f in fields if f)
        return (filled / len(fields)) * 100
    
    def update_record(self, record_id: str, **updates) -> EmployeeRecord:
        """Update employee record"""
        if record_id not in self.records:
            raise ValueError(f"Record not found: {record_id}")
            
        record = self.records[record_id]
        for key, value in updates.items():
            if hasattr(record, key):
                setattr(record, key, value)
        record.last_updated = datetime.now()
        
        return record
    
    def deactivate(self, record_id: str) -> EmployeeRecord:
        """Deactivate employee record"""
        if record_id not in self.records:
            raise ValueError(f"Record not found: {record_id}")
            
        record = self.records[record_id]
        record.status = RecordStatus.INACTIVE
        record.last_updated = datetime.now()
        
        return record
    
    def get_by_department(self, department: str) -> List[EmployeeRecord]:
        """Get records by department"""
        return [r for r in self.records.values() if r.department == department and r.status == RecordStatus.ACTIVE]
    
    def get_incomplete(self, threshold: float = 80) -> List[EmployeeRecord]:
        """Get records with incomplete data"""
        return [r for r in self.records.values() if r.data_complete < threshold]
    
    def get_stats(self) -> Dict:
        """Get data statistics"""
        records = list(self.records.values())
        active = [r for r in records if r.status == RecordStatus.ACTIVE]
        
        return {
            "total_records": len(records),
            "active": len(active),
            "avg_completeness": sum(r.data_complete for r in records) / len(records) if records else 0,
            "incomplete": len(self.get_incomplete()),
            "departments": len(set(r.department for r in active))
        }


# Demo
if __name__ == "__main__":
    agent = HRDataAgent()
    
    print("🖥️ HR Data Agent Demo\n")
    
    # Create records
    r1 = agent.create_record("EMP001", "Nguyen A", "a@company.vn", "Engineering", "Senior Engineer", date(2022, 1, 15), "MGR001", "Ho Chi Minh")
    r2 = agent.create_record("EMP002", "Tran B", "b@company.vn", "Product", "Product Manager", date(2023, 3, 1), "MGR002", "Ha Noi")
    r3 = agent.create_record("EMP003", "Le C", "c@company.vn", "Sales", "Account Executive", date(2024, 6, 1))
    
    print(f"📋 Record: {r1.name}")
    print(f"   Employee ID: {r1.employee_id}")
    print(f"   Department: {r1.department}")
    print(f"   Completeness: {r1.data_complete:.0f}%")
    
    # Stats
    print("\n📊 Stats:")
    stats = agent.get_stats()
    print(f"   Active: {stats['active']}")
    print(f"   Avg Completeness: {stats['avg_completeness']:.0f}%")
    print(f"   Incomplete: {stats['incomplete']}")
