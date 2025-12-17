"""
💼 IT Manager - IT Operations
===============================

Manage IT operations and team.
Technology that works!

Roles:
- IT budgeting
- Vendor management
- Team supervision
- Project oversight
"""

from typing import Dict, List, Any, Optional
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from enum import Enum
import uuid


class ITProjectStatus(Enum):
    """IT project status."""
    PLANNED = "planned"
    IN_PROGRESS = "in_progress"
    ON_HOLD = "on_hold"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class VendorType(Enum):
    """Vendor types."""
    SOFTWARE = "software"
    HARDWARE = "hardware"
    CLOUD = "cloud"
    CONSULTING = "consulting"
    SUPPORT = "support"


@dataclass
class ITProject:
    """An IT project."""
    id: str
    name: str
    description: str
    budget: float
    status: ITProjectStatus = ITProjectStatus.PLANNED
    progress: int = 0
    manager: str = ""
    start_date: datetime = field(default_factory=datetime.now)
    end_date: Optional[datetime] = None


@dataclass
class Vendor:
    """A vendor/supplier."""
    id: str
    name: str
    vendor_type: VendorType
    contract_value: float
    contract_end: datetime
    rating: int = 5  # 1-5
    contact: str = ""


@dataclass
class ITBudget:
    """IT budget allocation."""
    category: str
    allocated: float
    spent: float = 0


class ITManager:
    """
    IT Manager System.
    
    Manage IT operations.
    """
    
    def __init__(self, agency_name: str):
        self.agency_name = agency_name
        self.projects: Dict[str, ITProject] = {}
        self.vendors: Dict[str, Vendor] = {}
        self.budgets: Dict[str, ITBudget] = {}
    
    def create_project(
        self,
        name: str,
        description: str,
        budget: float,
        manager: str = ""
    ) -> ITProject:
        """Create an IT project."""
        project = ITProject(
            id=f"ITP-{uuid.uuid4().hex[:6].upper()}",
            name=name,
            description=description,
            budget=budget,
            manager=manager
        )
        self.projects[project.id] = project
        return project
    
    def update_project(self, project: ITProject, status: ITProjectStatus, progress: int = 0):
        """Update project status."""
        project.status = status
        project.progress = progress
        if status == ITProjectStatus.COMPLETED:
            project.end_date = datetime.now()
    
    def add_vendor(
        self,
        name: str,
        vendor_type: VendorType,
        contract_value: float,
        contract_months: int = 12,
        contact: str = ""
    ) -> Vendor:
        """Add a vendor."""
        vendor = Vendor(
            id=f"VND-{uuid.uuid4().hex[:6].upper()}",
            name=name,
            vendor_type=vendor_type,
            contract_value=contract_value,
            contract_end=datetime.now() + timedelta(days=contract_months * 30),
            contact=contact
        )
        self.vendors[vendor.id] = vendor
        return vendor
    
    def set_budget(self, category: str, amount: float) -> ITBudget:
        """Set budget for category."""
        budget = ITBudget(category=category, allocated=amount)
        self.budgets[category] = budget
        return budget
    
    def spend_budget(self, category: str, amount: float):
        """Record budget spending."""
        if category in self.budgets:
            self.budgets[category].spent += amount
    
    def get_budget_summary(self) -> Dict[str, Any]:
        """Get budget summary."""
        total_allocated = sum(b.allocated for b in self.budgets.values())
        total_spent = sum(b.spent for b in self.budgets.values())
        
        return {
            "total_allocated": total_allocated,
            "total_spent": total_spent,
            "remaining": total_allocated - total_spent,
            "utilization": (total_spent / total_allocated * 100) if total_allocated else 0
        }
    
    def format_dashboard(self) -> str:
        """Format IT Manager dashboard."""
        budget = self.get_budget_summary()
        active_projects = sum(1 for p in self.projects.values() if p.status == ITProjectStatus.IN_PROGRESS)
        active_vendors = len(self.vendors)
        
        lines = [
            "╔═══════════════════════════════════════════════════════════╗",
            f"║  💼 IT MANAGER                                            ║",
            f"║  {len(self.projects)} projects │ {active_vendors} vendors │ ${budget['total_allocated']:,.0f} budget  ║",
            "╠═══════════════════════════════════════════════════════════╣",
            "║  📋 IT PROJECTS                                           ║",
            "║  ─────────────────────────────────────────────────────── ║",
        ]
        
        status_icons = {"planned": "📋", "in_progress": "🔄", "on_hold": "⏸️",
                       "completed": "✅", "cancelled": "❌"}
        
        for project in list(self.projects.values())[:4]:
            icon = status_icons.get(project.status.value, "⚪")
            bar = "█" * int(project.progress / 20) + "░" * (5 - int(project.progress / 20))
            
            lines.append(f"║  {icon} {project.name[:18]:<18} │ {bar} {project.progress:>3}% │ ${project.budget:>8,.0f}  ║")
        
        lines.extend([
            "║                                                           ║",
            "║  🏢 VENDORS                                               ║",
            "║  ─────────────────────────────────────────────────────── ║",
        ])
        
        type_icons = {"software": "💻", "hardware": "🖥️", "cloud": "☁️",
                     "consulting": "👔", "support": "🔧"}
        
        for vendor in list(self.vendors.values())[:3]:
            icon = type_icons.get(vendor.vendor_type.value, "📦")
            stars = "⭐" * vendor.rating
            lines.append(f"║  {icon} {vendor.name[:15]:<15} │ {stars:<5} │ ${vendor.contract_value:>10,.0f}  ║")
        
        lines.extend([
            "║                                                           ║",
            "║  💰 BUDGET OVERVIEW                                       ║",
            "║  ─────────────────────────────────────────────────────── ║",
        ])
        
        for cat, bud in list(self.budgets.items())[:3]:
            util = (bud.spent / bud.allocated * 100) if bud.allocated else 0
            bar = "█" * int(util / 20) + "░" * (5 - int(util / 20))
            lines.append(f"║    📊 {cat[:12]:<12} │ {bar} │ ${bud.spent:>8,.0f}/${bud.allocated:>8,.0f}  ║")
        
        lines.extend([
            "║                                                           ║",
            "║  [📋 Projects]  [🏢 Vendors]  [💰 Budget]                 ║",
            "╠═══════════════════════════════════════════════════════════╣",
            f"║  🏯 {self.agency_name} - Technology that works!           ║",
            "╚═══════════════════════════════════════════════════════════╝",
        ])
        
        return "\n".join(lines)


# Example usage
if __name__ == "__main__":
    it_mgr = ITManager("Saigon Digital Hub")
    
    print("💼 IT Manager")
    print("=" * 60)
    print()
    
    # Create projects
    p1 = it_mgr.create_project("Cloud Migration", "Move to AWS", 50000, "Alex")
    p2 = it_mgr.create_project("Security Upgrade", "Update firewalls", 25000, "Sam")
    
    it_mgr.update_project(p1, ITProjectStatus.IN_PROGRESS, 45)
    it_mgr.update_project(p2, ITProjectStatus.IN_PROGRESS, 20)
    
    # Add vendors
    it_mgr.add_vendor("AWS", VendorType.CLOUD, 24000, 12, "aws@support.com")
    it_mgr.add_vendor("Microsoft 365", VendorType.SOFTWARE, 6000, 12)
    it_mgr.add_vendor("Cisco", VendorType.HARDWARE, 15000, 24)
    
    # Set budgets
    it_mgr.set_budget("Infrastructure", 100000)
    it_mgr.set_budget("Software", 30000)
    it_mgr.set_budget("Training", 10000)
    
    it_mgr.spend_budget("Infrastructure", 45000)
    it_mgr.spend_budget("Software", 12000)
    
    print(it_mgr.format_dashboard())
