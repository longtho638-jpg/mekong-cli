"""
📊 HR Analytics - People Insights
===================================

Data-driven HR decisions.
Know your people!

Features:
- Employee metrics
- Attrition risk
- eNPS tracking
- Headcount trends
"""

import uuid
import logging
from typing import Dict, Any
from dataclasses import dataclass
from datetime import datetime, timedelta
from enum import Enum

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class AttritionRisk(Enum):
    """Employee attrition risk levels."""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class Department(Enum):
    """Agency departments."""
    ENGINEERING = "engineering"
    DESIGN = "design"
    MARKETING = "marketing"
    SALES = "sales"
    OPERATIONS = "operations"
    FINANCE = "finance"
    HR = "hr"


@dataclass
class Employee:
    """An employee record entity."""
    id: str
    name: str
    department: Department
    role: str
    hire_date: datetime
    salary: float
    manager: str = ""
    enps_score: int = 0  # -100 to 100
    performance_score: int = 0  # 1-5
    attrition_risk: AttritionRisk = AttritionRisk.LOW

    def __post_init__(self):
        if self.salary < 0:
            raise ValueError("Salary cannot be negative")
        if not -100 <= self.enps_score <= 100:
            raise ValueError("eNPS must be between -100 and 100")


@dataclass
class HRMetric:
    """A specific HR performance indicator snapshot."""
    name: str
    current: float
    previous: float
    target: float
    unit: str = ""


class HRAnalytics:
    """
    HR Analytics System.
    
    Orchestrates people data analysis, performance tracking, and organizational health metrics.
    """
    
    def __init__(self, agency_name: str):
        self.agency_name = agency_name
        self.employees: Dict[str, Employee] = {}
        self.metrics: Dict[str, HRMetric] = {}
        
        logger.info(f"HR Analytics system initialized for {agency_name}")
        self._init_demo_data()
    
    def _init_demo_data(self):
        """Seed the system with sample employee records."""
        logger.info("Loading demo personnel data...")
        demo_staff = [
            ("Alex Nguyen", Department.ENGINEERING, "Dev Lead", 4000.0, 80, 5),
            ("Sarah Tran", Department.DESIGN, "Art Director", 3500.0, 90, 5),
            ("Mike Chen", Department.MARKETING, "Growth Lead", 3200.0, 70, 4),
        ]
        for name, dept, role, sal, enps, perf in demo_staff:
            try:
                self.add_employee(name, dept, role, sal, enps, perf)
            except Exception as e:
                logger.error(f"Failed to add demo employee {name}: {e}")
    
    def add_employee(
        self,
        name: str,
        department: Department,
        role: str,
        salary: float,
        enps: int = 0,
        performance: int = 3
    ) -> Employee:
        """Register a new employee and assess initial risk profile."""
        if not name or not role:
            raise ValueError("Name and role are required")

        emp = Employee(
            id=f"EMP-{uuid.uuid4().hex[:6].upper()}",
            name=name, department=department, role=role,
            hire_date=datetime.now() - timedelta(days=180),
            salary=salary, enps_score=enps, performance_score=performance
        )
        
        # Attrition Risk Logic
        if enps < 20 and performance < 3: emp.attrition_risk = AttritionRisk.CRITICAL
        elif enps < 40: emp.attrition_risk = AttritionRisk.HIGH
        elif enps < 60: emp.attrition_risk = AttritionRisk.MEDIUM
        
        self.employees[emp.id] = emp
        logger.info(f"Employee added: {name} to {department.value}")
        return emp
    
    def get_aggregate_stats(self) -> Dict[str, Any]:
        """Calculate high-level organizational metrics."""
        count = len(self.employees)
        if not count: return {"headcount": 0}
        
        avg_enps = sum(e.enps_score for e in self.employees.values()) / count
        avg_salary = sum(e.salary for e in self.employees.values()) / count
        
        return {
            "headcount": count,
            "avg_enps": avg_enps,
            "avg_salary": avg_salary,
            "tenure_months": 6.0 # Demo constant
        }
    
    def format_dashboard(self) -> str:
        """Render the HR Analytics Dashboard."""
        stats = self.get_aggregate_stats()
        
        lines = [
            "╔═══════════════════════════════════════════════════════════╗",
            f"║  📊 HR ANALYTICS DASHBOARD{' ' * 33}║",
            f"║  {stats['headcount']} employees │ eNPS: {stats.get('avg_enps', 0):>+4.0f} │ ${stats.get('avg_salary', 0):>8,.0f} avg{' ' * 10}║",
            "╠═══════════════════════════════════════════════════════════╣",
            "║  👥 HEADCOUNT BY DEPARTMENT                               ║",
            "║  ───────────────────────────────────────────────────────  ║",
        ]
        
        dept_icons = {"engineering": "💻", "design": "🎨", "marketing": "📢", "sales": "💰", "operations": "⚙️"}
        
        # Aggregate headcount
        counts = {}
        for e in self.employees.values():
            counts[e.department] = counts.get(e.department, 0) + 1
            
        for dept, c in sorted(counts.items(), key=lambda x: x[1], reverse=True):
            icon = dept_icons.get(dept.value, "👤")
            bar = "█" * c + "░" * (10 - min(10, c))
            lines.append(f"║    {icon} {dept.value.title():<12} │ {bar} │ {c:>3}  ║")
        
        lines.extend([
            "║                                                           ║",
            "║  🏆 TOP PERFORMERS                                        ║",
            "║  ───────────────────────────────────────────────────────  ║",
        ])
        
        top_staff = sorted(self.employees.values(), key=lambda x: x.performance_score, reverse=True)[:3]
        for e in top_staff:
            stars = "★" * e.performance_score + "☆" * (5 - e.performance_score)
            lines.append(f"║    {e.name[:18]:<18} │ {stars} │ {e.role[:15]:<15} ║")
            
        lines.extend([
            "║                                                           ║",
            "║  [📊 Full Report]  [👥 Directory]  [📈 Trends]  [⚙️ Setup] ║",
            "╠═══════════════════════════════════════════════════════════╣",
            f"║  🏯 {self.agency_name[:40]:<40} - Culture!           ║",
            "╚═══════════════════════════════════════════════════════════╝",
        ])
        
        return "\n".join(lines)


# Example usage
if __name__ == "__main__":
    print("📊 Initializing HR System...")
    print("=" * 60)
    
    try:
        hr_system = HRAnalytics("Saigon Digital Hub")
        print("\n" + hr_system.format_dashboard())
        
    except Exception as e:
        logger.error(f"HR System Error: {e}")
