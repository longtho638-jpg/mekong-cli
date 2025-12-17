"""
🏢 Virtual Office Manager - Remote Ops
========================================

Manage virtual office operations.
Remote-first excellence!

Roles:
- Workspace management
- Resource booking
- Vendor coordination
- Office expenses
"""

from typing import Dict, List, Any, Optional
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from enum import Enum
import uuid


class ResourceType(Enum):
    """Resource types."""
    MEETING_ROOM = "meeting_room"
    COWORKING = "coworking"
    EQUIPMENT = "equipment"
    SOFTWARE = "software"
    SUBSCRIPTION = "subscription"


class BookingStatus(Enum):
    """Booking status."""
    PENDING = "pending"
    CONFIRMED = "confirmed"
    CANCELLED = "cancelled"
    COMPLETED = "completed"


class ExpenseCategory(Enum):
    """Expense categories."""
    SOFTWARE = "software"
    HARDWARE = "hardware"
    COWORKING = "coworking"
    TRAVEL = "travel"
    SUPPLIES = "supplies"
    SERVICES = "services"


@dataclass
class VirtualResource:
    """A virtual/physical resource."""
    id: str
    name: str
    resource_type: ResourceType
    monthly_cost: float
    is_active: bool = True
    users: int = 0
    renewal_date: Optional[datetime] = None


@dataclass
class ResourceBooking:
    """A resource booking."""
    id: str
    resource_id: str
    booked_by: str
    start_time: datetime
    end_time: datetime
    purpose: str = ""
    status: BookingStatus = BookingStatus.PENDING


@dataclass
class OfficeExpense:
    """An office expense."""
    id: str
    description: str
    category: ExpenseCategory
    amount: float
    vendor: str
    date: datetime = field(default_factory=datetime.now)
    approved: bool = False


class VirtualOfficeManager:
    """
    Virtual Office Manager.
    
    Remote-first operations.
    """
    
    def __init__(self, agency_name: str):
        self.agency_name = agency_name
        self.resources: Dict[str, VirtualResource] = {}
        self.bookings: List[ResourceBooking] = []
        self.expenses: List[OfficeExpense] = []
    
    def add_resource(
        self,
        name: str,
        resource_type: ResourceType,
        monthly_cost: float,
        users: int = 0
    ) -> VirtualResource:
        """Add a virtual resource."""
        resource = VirtualResource(
            id=f"RES-{uuid.uuid4().hex[:6].upper()}",
            name=name,
            resource_type=resource_type,
            monthly_cost=monthly_cost,
            users=users,
            renewal_date=datetime.now() + timedelta(days=30)
        )
        self.resources[resource.id] = resource
        return resource
    
    def book_resource(
        self,
        resource: VirtualResource,
        booked_by: str,
        hours: int = 1,
        purpose: str = ""
    ) -> ResourceBooking:
        """Book a resource."""
        booking = ResourceBooking(
            id=f"BKG-{uuid.uuid4().hex[:6].upper()}",
            resource_id=resource.id,
            booked_by=booked_by,
            start_time=datetime.now(),
            end_time=datetime.now() + timedelta(hours=hours),
            purpose=purpose,
            status=BookingStatus.CONFIRMED
        )
        self.bookings.append(booking)
        return booking
    
    def add_expense(
        self,
        description: str,
        category: ExpenseCategory,
        amount: float,
        vendor: str
    ) -> OfficeExpense:
        """Add an expense."""
        expense = OfficeExpense(
            id=f"EXP-{uuid.uuid4().hex[:6].upper()}",
            description=description,
            category=category,
            amount=amount,
            vendor=vendor
        )
        self.expenses.append(expense)
        return expense
    
    def approve_expense(self, expense: OfficeExpense):
        """Approve an expense."""
        expense.approved = True
    
    def get_monthly_costs(self) -> Dict[str, Any]:
        """Get monthly cost breakdown."""
        by_type = {}
        for rtype in ResourceType:
            cost = sum(r.monthly_cost for r in self.resources.values() 
                      if r.resource_type == rtype and r.is_active)
            by_type[rtype.value] = cost
        
        total = sum(by_type.values())
        expenses_total = sum(e.amount for e in self.expenses)
        
        return {
            "by_type": by_type,
            "total_subscriptions": total,
            "total_expenses": expenses_total,
            "grand_total": total + expenses_total
        }
    
    def format_dashboard(self) -> str:
        """Format virtual office dashboard."""
        costs = self.get_monthly_costs()
        
        lines = [
            "╔═══════════════════════════════════════════════════════════╗",
            f"║  🏢 VIRTUAL OFFICE MANAGER                                ║",
            f"║  {len(self.resources)} resources │ ${costs['grand_total']:,.0f}/mo total   ║",
            "╠═══════════════════════════════════════════════════════════╣",
            "║  💻 VIRTUAL RESOURCES                                     ║",
            "║  ─────────────────────────────────────────────────────── ║",
        ]
        
        type_icons = {"meeting_room": "🏠", "coworking": "🏢", "equipment": "🖥️",
                     "software": "💻", "subscription": "📱"}
        
        for resource in list(self.resources.values())[:5]:
            icon = type_icons.get(resource.resource_type.value, "📦")
            status = "🟢" if resource.is_active else "🔴"
            
            lines.append(f"║  {status} {icon} {resource.name[:18]:<18} │ ${resource.monthly_cost:>6,.0f}/mo │ {resource.users:>2} users  ║")
        
        lines.extend([
            "║                                                           ║",
            "║  💰 COST BREAKDOWN                                        ║",
            "║  ─────────────────────────────────────────────────────── ║",
        ])
        
        for rtype, cost in costs['by_type'].items():
            if cost > 0:
                icon = type_icons.get(rtype, "📦")
                pct = (cost / costs['total_subscriptions'] * 100) if costs['total_subscriptions'] else 0
                lines.append(f"║    {icon} {rtype.replace('_', ' ').title():<15} │ ${cost:>8,.0f} │ {pct:>5.1f}%          ║")
        
        lines.extend([
            "║                                                           ║",
            "║  📋 RECENT BOOKINGS                                       ║",
            "║  ─────────────────────────────────────────────────────── ║",
        ])
        
        status_icons = {"pending": "⏳", "confirmed": "✅", "cancelled": "❌", "completed": "✔️"}
        
        for booking in self.bookings[-3:]:
            icon = status_icons.get(booking.status.value, "⚪")
            resource = self.resources.get(booking.resource_id)
            res_name = resource.name if resource else "Unknown"
            
            lines.append(f"║  {icon} {res_name[:15]:<15} │ {booking.booked_by[:12]:<12} │ {booking.purpose[:10]:<10}  ║")
        
        lines.extend([
            "║                                                           ║",
            "║  💸 PENDING EXPENSES                                      ║",
            "║  ─────────────────────────────────────────────────────── ║",
        ])
        
        pending = [e for e in self.expenses if not e.approved][:3]
        for expense in pending:
            status = "⏳"
            lines.append(f"║  {status} {expense.description[:18]:<18} │ ${expense.amount:>8,.0f} │ {expense.vendor[:8]:<8}  ║")
        
        if not pending:
            lines.append("║    ✅ No pending expenses                                 ║")
        
        lines.extend([
            "║                                                           ║",
            "║  [💻 Resources]  [📅 Book]  [💸 Expenses]                 ║",
            "╠═══════════════════════════════════════════════════════════╣",
            f"║  🏯 {self.agency_name} - Remote-first excellence!         ║",
            "╚═══════════════════════════════════════════════════════════╝",
        ])
        
        return "\n".join(lines)


# Example usage
if __name__ == "__main__":
    vom = VirtualOfficeManager("Saigon Digital Hub")
    
    print("🏢 Virtual Office Manager")
    print("=" * 60)
    print()
    
    r1 = vom.add_resource("Slack Business", ResourceType.SOFTWARE, 150, 15)
    r2 = vom.add_resource("Notion Team", ResourceType.SOFTWARE, 120, 15)
    r3 = vom.add_resource("Zoom Pro", ResourceType.SUBSCRIPTION, 50, 10)
    r4 = vom.add_resource("WeWork HCMC", ResourceType.COWORKING, 500, 5)
    r5 = vom.add_resource("MacBook Pro M3", ResourceType.EQUIPMENT, 100, 1)
    
    vom.book_resource(r4, "Alex", 4, "Client Meeting")
    vom.book_resource(r4, "Sarah", 2, "Team Workshop")
    
    e1 = vom.add_expense("Adobe Creative Cloud", ExpenseCategory.SOFTWARE, 600, "Adobe")
    e2 = vom.add_expense("Team Lunch", ExpenseCategory.SUPPLIES, 150, "Local Restaurant")
    vom.approve_expense(e1)
    
    print(vom.format_dashboard())
