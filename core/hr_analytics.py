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

from typing import Dict, List, Any, Optional
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from enum import Enum
import uuid


class AttritionRisk(Enum):
    """Attrition risk levels."""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class Department(Enum):
    """Departments."""
    ENGINEERING = "engineering"
    DESIGN = "design"
    MARKETING = "marketing"
    SALES = "sales"
    OPERATIONS = "operations"
    FINANCE = "finance"
    HR = "hr"


@dataclass
class Employee:
    """An employee record."""
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


@dataclass
class HRMetric:
    """An HR metric snapshot."""
    name: str
    current: float
    previous: float
    target: float
    unit: str = ""


class HRAnalytics:
    """
    HR Analytics System.
    
    Data-driven people insights.
    """
    
    def __init__(self, agency_name: str):
        self.agency_name = agency_name
        self.employees: Dict[str, Employee] = {}
        self.metrics: Dict[str, HRMetric] = {}
        
        self._init_demo_data()
    
    def _init_demo_data(self):
        """Initialize demo employees."""
        demo = [
            ("Alex Nguyen", Department.ENGINEERING, "Senior Developer", 3500, 8, 4),
            ("Sarah Tran", Department.DESIGN, "UI Lead", 3000, 9, 5),
            ("Mike Chen", Department.MARKETING, "Marketing Manager", 2800, 7, 4),
            ("Lisa Pham", Department.SALES, "Account Executive", 2500, 6, 3),
            ("Khoa Vo", Department.ENGINEERING, "CTO", 5000, 9, 5),
        ]
        
        for name, dept, role, salary, enps, perf in demo:
            self.add_employee(name, dept, role, salary, enps * 10 - 10, perf)
    
    def add_employee(
        self,
        name: str,
        department: Department,
        role: str,
        salary: float,
        enps: int = 0,
        performance: int = 3
    ) -> Employee:
        """Add an employee."""
        employee = Employee(
            id=f"EMP-{uuid.uuid4().hex[:6].upper()}",
            name=name,
            department=department,
            role=role,
            hire_date=datetime.now() - timedelta(days=180),  # Simulated
            salary=salary,
            enps_score=enps,
            performance_score=performance
        )
        
        # Calculate attrition risk
        if enps < 20 and performance < 3:
            employee.attrition_risk = AttritionRisk.CRITICAL
        elif enps < 40 or performance < 3:
            employee.attrition_risk = AttritionRisk.HIGH
        elif enps < 60:
            employee.attrition_risk = AttritionRisk.MEDIUM
        
        self.employees[employee.id] = employee
        return employee
    
    def update_enps(self, employee: Employee, score: int):
        """Update employee eNPS score."""
        employee.enps_score = max(-100, min(100, score))
    
    def update_performance(self, employee: Employee, score: int):
        """Update performance score."""
        employee.performance_score = max(1, min(5, score))
    
    def get_enps(self) -> float:
        """Calculate overall eNPS."""
        if not self.employees:
            return 0
        return sum(e.enps_score for e in self.employees.values()) / len(self.employees)
    
    def get_headcount(self) -> Dict[str, int]:
        """Get headcount by department."""
        counts = {}
        for dept in Department:
            counts[dept.value] = sum(1 for e in self.employees.values() if e.department == dept)
        return counts
    
    def get_attrition_risk_counts(self) -> Dict[str, int]:
        """Get attrition risk distribution."""
        counts = {}
        for risk in AttritionRisk:
            counts[risk.value] = sum(1 for e in self.employees.values() if e.attrition_risk == risk)
        return counts
    
    def get_avg_salary(self) -> float:
        """Get average salary."""
        if not self.employees:
            return 0
        return sum(e.salary for e in self.employees.values()) / len(self.employees)
    
    def get_avg_tenure(self) -> float:
        """Get average tenure in months."""
        if not self.employees:
            return 0
        total_days = sum((datetime.now() - e.hire_date).days for e in self.employees.values())
        return (total_days / len(self.employees)) / 30
    
    def get_stats(self) -> Dict[str, Any]:
        """Get HR analytics stats."""
        return {
            "headcount": len(self.employees),
            "enps": self.get_enps(),
            "avg_salary": self.get_avg_salary(),
            "avg_tenure": self.get_avg_tenure(),
            "attrition": self.get_attrition_risk_counts()
        }
    
    def format_dashboard(self) -> str:
        """Format HR analytics dashboard."""
        stats = self.get_stats()
        headcount = self.get_headcount()
        attrition = stats['attrition']
        
        lines = [
            "╔═══════════════════════════════════════════════════════════╗",
            f"║  📊 HR ANALYTICS                                          ║",
            f"║  {stats['headcount']} employees │ eNPS: {stats['enps']:.0f} │ ${stats['avg_salary']:,.0f} avg  ║",
            "╠═══════════════════════════════════════════════════════════╣",
            "║  👥 HEADCOUNT BY DEPARTMENT                               ║",
            "║  ─────────────────────────────────────────────────────── ║",
        ]
        
        dept_icons = {"engineering": "💻", "design": "🎨", "marketing": "📢",
                     "sales": "💰", "operations": "⚙️", "finance": "💵", "hr": "👥"}
        
        for dept, count in sorted(headcount.items(), key=lambda x: x[1], reverse=True):
            if count > 0:
                icon = dept_icons.get(dept, "👤")
                bar = "█" * count + "░" * (10 - min(10, count))
                lines.append(f"║    {icon} {dept.title():<12} │ {bar} │ {count:>3}  ║")
        
        lines.extend([
            "║                                                           ║",
            "║  📈 KEY METRICS                                           ║",
            "║  ─────────────────────────────────────────────────────── ║",
        ])
        
        enps = stats['enps']
        enps_icon = "🟢" if enps >= 50 else "🟡" if enps >= 20 else "🔴"
        enps_bar = "█" * int((enps + 100) / 20) + "░" * (10 - int((enps + 100) / 20))
        
        lines.append(f"║    {enps_icon} eNPS Score      │ {enps_bar} │ {enps:>+4.0f}  ║")
        lines.append(f"║    💰 Avg Salary      │ ${stats['avg_salary']:>10,.0f}              ║")
        lines.append(f"║    ⏰ Avg Tenure      │ {stats['avg_tenure']:>10.1f} months         ║")
        
        lines.extend([
            "║                                                           ║",
            "║  ⚠️ ATTRITION RISK                                        ║",
            "║  ─────────────────────────────────────────────────────── ║",
        ])
        
        risk_icons = {"low": "🟢", "medium": "🟡", "high": "🟠", "critical": "🔴"}
        
        for risk in AttritionRisk:
            count = attrition.get(risk.value, 0)
            icon = risk_icons.get(risk.value, "⚪")
            bar = "█" * count + "░" * (10 - min(10, count))
            lines.append(f"║    {icon} {risk.value.title():<12} │ {bar} │ {count:>3}  ║")
        
        lines.extend([
            "║                                                           ║",
            "║  🏆 TOP PERFORMERS                                        ║",
            "║  ─────────────────────────────────────────────────────── ║",
        ])
        
        top = sorted(self.employees.values(), key=lambda x: x.performance_score, reverse=True)[:3]
        for emp in top:
            stars = "⭐" * emp.performance_score
            lines.append(f"║    {emp.name[:18]:<18} │ {stars:<10}  ║")
        
        lines.extend([
            "║                                                           ║",
            "║  [📊 Reports]  [👥 Employees]  [📈 Trends]                ║",
            "╠═══════════════════════════════════════════════════════════╣",
            f"║  🏯 {self.agency_name} - Know your people!                ║",
            "╚═══════════════════════════════════════════════════════════╝",
        ])
        
        return "\n".join(lines)


# Example usage
if __name__ == "__main__":
    hr = HRAnalytics("Saigon Digital Hub")
    
    print("📊 HR Analytics")
    print("=" * 60)
    print()
    
    print(hr.format_dashboard())
