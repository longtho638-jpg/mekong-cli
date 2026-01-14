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

import uuid
import logging
from typing import Dict, List, Any, Optional, Union
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

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
    """A department budget entity."""
    id: str
    department: Department
    period: str  # e.g., "2024-Q1"
    allocated: float
    spent: float = 0.0
    status: BudgetStatus = BudgetStatus.ON_TRACK

    def __post_init__(self):
        if self.allocated < 0:
            raise ValueError("Allocated budget cannot be negative")

    @property
    def remaining(self) -> float:
        return self.allocated - self.spent

    @property
    def utilization_rate(self) -> float:
        if self.allocated <= 0:
            return 0.0
        return self.spent / self.allocated


@dataclass
class Expense:
    """An expense record entity."""
    id: str
    department: Department
    category: ExpenseCategory
    amount: float
    description: str
    date: datetime = field(default_factory=datetime.now)
    approved: bool = False


class BudgetManager:
    """
    Budget Manager System.
    
    Controls agency finances by department and period.
    """
    
    WARNING_THRESHOLD = 0.85 # 85% of budget used
    
    def __init__(self, agency_name: str):
        self.agency_name = agency_name
        self.budgets: Dict[str, Budget] = {}
        self.expenses: List[Expense] = []
        
        logger.info(f"Budget Manager initialized for {agency_name}")
        self._init_demo_budgets()
    
    def _init_demo_budgets(self):
        """Setup initial demo budgets."""
        period = "2024-Q4"
        allocations = [
            (Department.ENGINEERING, 50000.0),
            (Department.MARKETING, 30000.0),
            (Department.SALES, 20000.0),
            (Department.OPERATIONS, 15000.0),
            (Department.HR, 10000.0),
        ]
        
        for dept, amount in allocations:
            self.create_budget(dept, period, amount)
    
    def create_budget(
        self,
        department: Department,
        period: str,
        allocated: float
    ) -> Budget:
        """Allocate a new budget."""
        budget = Budget(
            id=f"BUD-{uuid.uuid4().hex[:6].upper()}",
            department=department,
            period=period,
            allocated=allocated
        )
        self.budgets[budget.id] = budget
        logger.info(f"Budget created: {department.value} for {period} (${allocated:,.0f})")
        return budget
    
    def add_expense(
        self,
        department: Department,
        category: ExpenseCategory,
        amount: float,
        description: str
    ) -> Optional[Expense]:
        """Record and approve an expense against a department budget."""
        if amount <= 0:
            logger.error("Expense amount must be positive")
            return None

        expense = Expense(
            id=f"EXP-{uuid.uuid4().hex[:6].upper()}",
            department=department,
            category=category,
            amount=amount,
            description=description,
            approved=True
        )
        self.expenses.append(expense)
        
        # Update matching budget
        budget_found = False
        for budget in self.budgets.values():
            if budget.department == department:
                budget.spent += amount
                self._update_budget_status(budget)
                budget_found = True
                break
        
        if not budget_found:
            logger.warning(f"No active budget found for department: {department.value}")
            
        logger.info(f"Expense recorded: ${amount:,.2f} for {department.value}")
        return expense
    
    def _update_budget_status(self, budget: Budget):
        """Update budget health based on utilization."""
        rate = budget.utilization_rate
        
        if rate > 1.0:
            budget.status = BudgetStatus.OVER_BUDGET
            logger.warning(f"BUDGET OVERSPENT: {budget.department.value} ({rate*100:.1f}%)")
        elif rate > self.WARNING_THRESHOLD:
            budget.status = BudgetStatus.WARNING
            logger.info(f"Budget Warning: {budget.department.value} ({rate*100:.1f}%)")
        else:
            budget.status = BudgetStatus.ON_TRACK
    
    def get_stats(self) -> Dict[str, Any]:
        """Aggregate financial statistics."""
        total_allocated = sum(b.allocated for b in self.budgets.values())
        total_spent = sum(b.spent for b in self.budgets.values())
        
        return {
            "total_allocated": total_allocated,
            "total_spent": total_spent,
            "remaining": total_allocated - total_spent,
            "utilization": (total_spent / total_allocated * 100) if total_allocated else 0.0,
            "over_budget_count": sum(1 for b in self.budgets.values() if b.status == BudgetStatus.OVER_BUDGET),
            "warning_count": sum(1 for b in self.budgets.values() if b.status == BudgetStatus.WARNING),
            "expense_count": len(self.expenses)
        }
    
    def format_dashboard(self) -> str:
        """Render Budget Manager Dashboard."""
        stats = self.get_stats()
        
        lines = [
            "╔═══════════════════════════════════════════════════════════╗",
            f"║  💰 BUDGET MANAGER{' ' * 42}║",
            f"║  ${stats['total_spent']:,.0f} of ${stats['total_allocated']:,.0f} │ {stats['utilization']:>3.0f}% used{' ' * 15}║",
            "╠═══════════════════════════════════════════════════════════╣",
            "║  📊 DEPARTMENT BUDGETS                                    ║",
            "║  ───────────────────────────────────────────────────────  ║",
        ]
        
        status_icons = {
            BudgetStatus.ON_TRACK: "🟢", 
            BudgetStatus.WARNING: "🟡", 
            BudgetStatus.OVER_BUDGET: "🔴"
        }
        dept_icons = {
            Department.ENGINEERING: "💻", 
            Department.MARKETING: "📢", 
            Department.SALES: "💰",
            Department.OPERATIONS: "⚙️", 
            Department.HR: "👥", 
            Department.ADMIN: "📋", 
            Department.DESIGN: "🎨"
        }
        
        # Display top 5 budgets by allocation
        sorted_budgets = sorted(self.budgets.values(), key=lambda x: x.allocated, reverse=True)[:5]
        for b in sorted_budgets:
            rate = b.utilization_rate * 100
            s_icon = status_icons.get(b.status, "⚪")
            d_icon = dept_icons.get(b.department, "📊")
            # Create a 10-segment progress bar
            bar = "█" * int(min(100, rate) / 10) + "░" * (10 - int(min(100, rate) / 10))
            
            lines.append(f"║  {s_icon} {d_icon} {b.department.value[:10]:<10} │ {bar} │ {rate:>5.0f}%  ║")
        
        lines.extend([
            "║                                                           ║",
            "║  💵 BUDGET SUMMARY                                        ║",
            "║  ───────────────────────────────────────────────────────  ║",
            f"║    💰 Total Allocated:    ${stats['total_allocated']:>12,.0f}              ║",
            f"║    💸 Total Spent:        ${stats['total_spent']:>12,.0f}              ║",
            f"║    💵 Remaining:          ${stats['remaining']:>12,.0f}              ║",
            "║                                                           ║",
            "║  ⚠️ ALERTS                                                ║",
            "║  ───────────────────────────────────────────────────────  ║",
            f"║    🔴 Over Budget:        {stats['over_budget_count']:>12}              ║",
            f"║    🟡 Warning:            {stats['warning_count']:>12}              ║",
            "║                                                           ║",
            "║  [📊 Budgets]  [💸 Expenses]  [📈 Reports]                ║",
            "╠═══════════════════════════════════════════════════════════╣",
            f"║  🏯 {self.agency_name[:40]:<40} - Controls!           ║",
            "╚═══════════════════════════════════════════════════════════╝",
        ])
        
        return "\n".join(lines)


# Example usage
if __name__ == "__main__":
    print("💰 Initializing Budget Manager...")
    print("=" * 60)
    
    try:
        bm = BudgetManager("Saigon Digital Hub")
        
        # Add some expenses
        bm.add_expense(Department.ENGINEERING, ExpenseCategory.PAYROLL, 15000.0, "Developer salaries")
        bm.add_expense(Department.ENGINEERING, ExpenseCategory.SOFTWARE, 3000.0, "SaaS subscriptions")
        bm.add_expense(Department.MARKETING, ExpenseCategory.MARKETING, 26000.0, "Ads campaign") # Near limit
        bm.add_expense(Department.SALES, ExpenseCategory.TRAVEL, 2000.0, "Client meetings")
        
        print("\n" + bm.format_dashboard())
        
    except Exception as e:
        logger.error(f"Runtime Error: {e}")
