"""
💰 Budget Manager - Financial Planning
========================================

Manage department budgets and expenses.
Control your money!

Features:
- Department budgets
- Expense tracking
- Budget vs Actual
- Variance alerts
"""

from typing import Dict, List, Any, Optional
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from enum import Enum
import uuid


class Department(Enum):
    """Departments."""
    ENGINEERING = "engineering"
    DESIGN = "design"
    MARKETING = "marketing"
    SALES = "sales"
    OPERATIONS = "operations"
    HR = "hr"
    ADMIN = "admin"


class ExpenseCategory(Enum):
    """Expense categories."""
    PAYROLL = "payroll"
    SOFTWARE = "software"
    MARKETING = "marketing"
    OFFICE = "office"
    TRAVEL = "travel"
    PROFESSIONAL = "professional"
    MISC = "misc"


class BudgetStatus(Enum):
    """Budget status."""
    ON_TRACK = "on_track"
    WARNING = "warning"
    OVER_BUDGET = "over_budget"


@dataclass
class Budget:
    """A department budget."""
    id: str
    department: Department
    period: str  # "2024-Q1"
    allocated: float
    spent: float = 0
    status: BudgetStatus = BudgetStatus.ON_TRACK


@dataclass
class Expense:
    """An expense record."""
    id: str
    department: Department
    category: ExpenseCategory
    amount: float
    description: str
    date: datetime = field(default_factory=datetime.now)
    approved: bool = False


class BudgetManager:
    """
    Budget Manager.
    
    Control agency finances.
    """
    
    def __init__(self, agency_name: str):
        self.agency_name = agency_name
        self.budgets: Dict[str, Budget] = {}
        self.expenses: List[Expense] = []
        
        self._init_demo_budgets()
    
    def _init_demo_budgets(self):
        """Initialize demo budgets."""
        period = "2024-Q4"
        allocations = [
            (Department.ENGINEERING, 50000),
            (Department.MARKETING, 30000),
            (Department.SALES, 20000),
            (Department.OPERATIONS, 15000),
            (Department.HR, 10000),
        ]
        
        for dept, amount in allocations:
            self.create_budget(dept, period, amount)
    
    def create_budget(
        self,
        department: Department,
        period: str,
        allocated: float
    ) -> Budget:
        """Create a budget."""
        budget = Budget(
            id=f"BUD-{uuid.uuid4().hex[:6].upper()}",
            department=department,
            period=period,
            allocated=allocated
        )
        self.budgets[budget.id] = budget
        return budget
    
    def add_expense(
        self,
        department: Department,
        category: ExpenseCategory,
        amount: float,
        description: str
    ) -> Expense:
        """Add an expense."""
        expense = Expense(
            id=f"EXP-{uuid.uuid4().hex[:6].upper()}",
            department=department,
            category=category,
            amount=amount,
            description=description,
            approved=True
        )
        self.expenses.append(expense)
        
        # Update corresponding budget
        for budget in self.budgets.values():
            if budget.department == department:
                budget.spent += amount
                self._update_budget_status(budget)
                break
        
        return expense
    
    def _update_budget_status(self, budget: Budget):
        """Update budget status based on spending."""
        utilization = budget.spent / budget.allocated if budget.allocated else 0
        
        if utilization > 1.0:
            budget.status = BudgetStatus.OVER_BUDGET
        elif utilization > 0.85:
            budget.status = BudgetStatus.WARNING
        else:
            budget.status = BudgetStatus.ON_TRACK
    
    def get_budget_utilization(self, budget: Budget) -> float:
        """Get budget utilization percentage."""
        if budget.allocated <= 0:
            return 0
        return (budget.spent / budget.allocated) * 100
    
    def get_stats(self) -> Dict[str, Any]:
        """Get budget statistics."""
        total_allocated = sum(b.allocated for b in self.budgets.values())
        total_spent = sum(b.spent for b in self.budgets.values())
        over_budget = sum(1 for b in self.budgets.values() if b.status == BudgetStatus.OVER_BUDGET)
        warning = sum(1 for b in self.budgets.values() if b.status == BudgetStatus.WARNING)
        
        return {
            "total_allocated": total_allocated,
            "total_spent": total_spent,
            "remaining": total_allocated - total_spent,
            "utilization": (total_spent / total_allocated * 100) if total_allocated else 0,
            "over_budget": over_budget,
            "warning": warning,
            "expense_count": len(self.expenses)
        }
    
    def format_dashboard(self) -> str:
        """Format budget manager dashboard."""
        stats = self.get_stats()
        
        lines = [
            "╔═══════════════════════════════════════════════════════════╗",
            f"║  💰 BUDGET MANAGER                                        ║",
            f"║  ${stats['total_spent']:,.0f} of ${stats['total_allocated']:,.0f} │ {stats['utilization']:.0f}% used  ║",
            "╠═══════════════════════════════════════════════════════════╣",
            "║  📊 DEPARTMENT BUDGETS                                    ║",
            "║  ─────────────────────────────────────────────────────── ║",
        ]
        
        status_icons = {"on_track": "🟢", "warning": "🟡", "over_budget": "🔴"}
        dept_icons = {"engineering": "💻", "marketing": "📢", "sales": "💰",
                     "operations": "⚙️", "hr": "👥", "admin": "📋", "design": "🎨"}
        
        for budget in sorted(self.budgets.values(), key=lambda x: x.allocated, reverse=True)[:5]:
            util = self.get_budget_utilization(budget)
            s_icon = status_icons.get(budget.status.value, "⚪")
            d_icon = dept_icons.get(budget.department.value, "📊")
            bar = "█" * int(util / 10) + "░" * (10 - int(util / 10))
            
            lines.append(f"║  {s_icon} {d_icon} {budget.department.value[:10]:<10} │ {bar} │ {util:>5.0f}%  ║")
        
        lines.extend([
            "║                                                           ║",
            "║  💵 BUDGET SUMMARY                                        ║",
            "║  ─────────────────────────────────────────────────────── ║",
            f"║    💰 Total Allocated:    ${stats['total_allocated']:>12,.0f}              ║",
            f"║    💸 Total Spent:        ${stats['total_spent']:>12,.0f}              ║",
            f"║    💵 Remaining:          ${stats['remaining']:>12,.0f}              ║",
            f"║    📊 Utilization:        {stats['utilization']:>12.0f}%              ║",
            "║                                                           ║",
            "║  ⚠️ ALERTS                                                ║",
            "║  ─────────────────────────────────────────────────────── ║",
            f"║    🔴 Over Budget:        {stats['over_budget']:>12}              ║",
            f"║    🟡 Warning:            {stats['warning']:>12}              ║",
            "║                                                           ║",
            "║  [📊 Budgets]  [💸 Expenses]  [📈 Reports]                ║",
            "╠═══════════════════════════════════════════════════════════╣",
            f"║  🏯 {self.agency_name} - Control your money!              ║",
            "╚═══════════════════════════════════════════════════════════╝",
        ])
        
        return "\n".join(lines)


# Example usage
if __name__ == "__main__":
    bm = BudgetManager("Saigon Digital Hub")
    
    print("💰 Budget Manager")
    print("=" * 60)
    print()
    
    # Add some expenses
    bm.add_expense(Department.ENGINEERING, ExpenseCategory.PAYROLL, 15000, "Developer salaries")
    bm.add_expense(Department.ENGINEERING, ExpenseCategory.SOFTWARE, 3000, "SaaS subscriptions")
    bm.add_expense(Department.MARKETING, ExpenseCategory.MARKETING, 12000, "Ads campaign")
    bm.add_expense(Department.SALES, ExpenseCategory.TRAVEL, 2000, "Client meetings")
    
    print(bm.format_dashboard())
