"""
💰 Compensation Manager - Total Rewards
=========================================

Manage salary, benefits, and total compensation.
Pay fairly, retain talent!

Features:
- Salary bands
- Benefits tracking
- Total compensation
- Market benchmarking
"""

from typing import Dict, List, Any, Optional
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
import uuid


class BenefitType(Enum):
    """Benefit types."""
    HEALTH = "health"
    DENTAL = "dental"
    VISION = "vision"
    RETIREMENT = "retirement"
    PTO = "pto"
    REMOTE = "remote"
    LEARNING = "learning"
    WELLNESS = "wellness"


class PayGrade(Enum):
    """Pay grades."""
    JUNIOR = "junior"
    MID = "mid"
    SENIOR = "senior"
    LEAD = "lead"
    MANAGER = "manager"
    DIRECTOR = "director"
    EXECUTIVE = "executive"


@dataclass
class SalaryBand:
    """A salary band."""
    grade: PayGrade
    min_salary: float
    mid_salary: float
    max_salary: float
    currency: str = "USD"


@dataclass
class Benefit:
    """A benefit offering."""
    id: str
    name: str
    benefit_type: BenefitType
    cost_monthly: float
    employer_contribution: float  # percentage 0-100
    active: bool = True


@dataclass
class EmployeeComp:
    """Employee compensation package."""
    id: str
    employee_name: str
    grade: PayGrade
    base_salary: float
    bonus_target: float = 0  # percentage
    benefits: List[str] = field(default_factory=list)
    equity: float = 0


class CompensationManager:
    """
    Compensation Manager.
    
    Fair and competitive pay.
    """
    
    def __init__(self, agency_name: str):
        self.agency_name = agency_name
        self.salary_bands: Dict[PayGrade, SalaryBand] = {}
        self.benefits: Dict[str, Benefit] = {}
        self.compensation: Dict[str, EmployeeComp] = {}
        
        self._init_salary_bands()
        self._init_benefits()
    
    def _init_salary_bands(self):
        """Initialize default salary bands."""
        bands = [
            (PayGrade.JUNIOR, 1000, 1500, 2000),
            (PayGrade.MID, 2000, 2750, 3500),
            (PayGrade.SENIOR, 3000, 4000, 5000),
            (PayGrade.LEAD, 4000, 5000, 6000),
            (PayGrade.MANAGER, 4500, 5500, 6500),
            (PayGrade.DIRECTOR, 6000, 7500, 9000),
            (PayGrade.EXECUTIVE, 8000, 10000, 15000),
        ]
        
        for grade, min_s, mid_s, max_s in bands:
            self.salary_bands[grade] = SalaryBand(grade, min_s, mid_s, max_s)
    
    def _init_benefits(self):
        """Initialize default benefits."""
        default_benefits = [
            ("Health Insurance", BenefitType.HEALTH, 300, 80),
            ("Dental Plan", BenefitType.DENTAL, 50, 100),
            ("401k Match", BenefitType.RETIREMENT, 0, 50),
            ("Unlimited PTO", BenefitType.PTO, 0, 100),
            ("Remote Work", BenefitType.REMOTE, 100, 100),
            ("Learning Budget", BenefitType.LEARNING, 100, 100),
            ("Wellness Stipend", BenefitType.WELLNESS, 50, 100),
        ]
        
        for name, btype, cost, contrib in default_benefits:
            self.add_benefit(name, btype, cost, contrib)
    
    def add_benefit(
        self,
        name: str,
        benefit_type: BenefitType,
        cost: float,
        employer_contribution: float = 100
    ) -> Benefit:
        """Add a benefit."""
        benefit = Benefit(
            id=f"BEN-{uuid.uuid4().hex[:6].upper()}",
            name=name,
            benefit_type=benefit_type,
            cost_monthly=cost,
            employer_contribution=employer_contribution
        )
        self.benefits[benefit.id] = benefit
        return benefit
    
    def set_employee_comp(
        self,
        name: str,
        grade: PayGrade,
        base_salary: float,
        bonus_target: float = 0,
        benefit_ids: List[str] = None,
        equity: float = 0
    ) -> EmployeeComp:
        """Set employee compensation."""
        comp = EmployeeComp(
            id=f"CMP-{uuid.uuid4().hex[:6].upper()}",
            employee_name=name,
            grade=grade,
            base_salary=base_salary,
            bonus_target=bonus_target,
            benefits=benefit_ids or list(self.benefits.keys()),
            equity=equity
        )
        self.compensation[comp.id] = comp
        return comp
    
    def get_total_compensation(self, comp: EmployeeComp) -> Dict[str, float]:
        """Calculate total compensation."""
        base = comp.base_salary * 12
        bonus = base * (comp.bonus_target / 100)
        
        benefits_value = 0
        for ben_id in comp.benefits:
            ben = self.benefits.get(ben_id)
            if ben:
                benefits_value += ben.cost_monthly * (ben.employer_contribution / 100) * 12
        
        total = base + bonus + benefits_value + comp.equity
        
        return {
            "base": base,
            "bonus": bonus,
            "benefits": benefits_value,
            "equity": comp.equity,
            "total": total
        }
    
    def get_compa_ratio(self, comp: EmployeeComp) -> float:
        """Calculate compa-ratio (salary vs mid-point)."""
        band = self.salary_bands.get(comp.grade)
        if not band:
            return 1.0
        return comp.base_salary / band.mid_salary
    
    def get_stats(self) -> Dict[str, Any]:
        """Get compensation statistics."""
        if not self.compensation:
            return {"employees": 0, "avg_salary": 0, "total_payroll": 0, "avg_compa": 0}
        
        total_salary = sum(c.base_salary for c in self.compensation.values())
        avg_salary = total_salary / len(self.compensation)
        avg_compa = sum(self.get_compa_ratio(c) for c in self.compensation.values()) / len(self.compensation)
        
        return {
            "employees": len(self.compensation),
            "avg_salary": avg_salary,
            "total_payroll": total_salary * 12,
            "avg_compa": avg_compa,
            "benefits_count": len(self.benefits)
        }
    
    def format_dashboard(self) -> str:
        """Format compensation manager dashboard."""
        stats = self.get_stats()
        
        lines = [
            "╔═══════════════════════════════════════════════════════════╗",
            f"║  💰 COMPENSATION MANAGER                                  ║",
            f"║  {stats['employees']} employees │ ${stats['avg_salary']:,.0f} avg │ {stats['avg_compa']:.0%} compa  ║",
            "╠═══════════════════════════════════════════════════════════╣",
            "║  📊 SALARY BANDS                                          ║",
            "║  ─────────────────────────────────────────────────────── ║",
        ]
        
        grade_icons = {"junior": "🌱", "mid": "🌿", "senior": "🌳",
                      "lead": "⭐", "manager": "👔", "director": "🎯", "executive": "👑"}
        
        for grade in [PayGrade.JUNIOR, PayGrade.MID, PayGrade.SENIOR, PayGrade.LEAD]:
            band = self.salary_bands.get(grade)
            if band:
                icon = grade_icons.get(grade.value, "💼")
                lines.append(f"║    {icon} {grade.value.title():<10} │ ${band.min_salary:>5,.0f} - ${band.max_salary:>5,.0f}     ║")
        
        lines.extend([
            "║                                                           ║",
            "║  🎁 BENEFITS PACKAGE                                      ║",
            "║  ─────────────────────────────────────────────────────── ║",
        ])
        
        type_icons = {"health": "🏥", "dental": "🦷", "vision": "👁️",
                     "retirement": "🏦", "pto": "🏖️", "remote": "🏠",
                     "learning": "📚", "wellness": "💪"}
        
        for benefit in list(self.benefits.values())[:5]:
            icon = type_icons.get(benefit.benefit_type.value, "🎁")
            contrib = f"{benefit.employer_contribution:.0f}%"
            lines.append(f"║    {icon} {benefit.name:<18} │ {contrib:>5} covered       ║")
        
        lines.extend([
            "║                                                           ║",
            "║  👥 EMPLOYEE COMPENSATION                                 ║",
            "║  ─────────────────────────────────────────────────────── ║",
        ])
        
        for comp in list(self.compensation.values())[:4]:
            total = self.get_total_compensation(comp)
            compa = self.get_compa_ratio(comp)
            compa_icon = "🟢" if compa >= 0.9 else "🟡" if compa >= 0.8 else "🔴"
            lines.append(f"║    {compa_icon} {comp.employee_name[:14]:<14} │ ${comp.base_salary:>6,.0f}/mo │ {compa:.0%}  ║")
        
        lines.extend([
            "║                                                           ║",
            "║  📈 COMPENSATION SUMMARY                                  ║",
            "║  ─────────────────────────────────────────────────────── ║",
            f"║    💰 Annual Payroll:     ${stats['total_payroll']:>12,.0f}              ║",
            f"║    📊 Avg Monthly Salary: ${stats['avg_salary']:>12,.0f}              ║",
            f"║    🎯 Avg Compa-Ratio:    {stats['avg_compa']:>12.0%}              ║",
            "║                                                           ║",
            "║  [📊 Bands]  [🎁 Benefits]  [👥 Employees]                ║",
            "╠═══════════════════════════════════════════════════════════╣",
            f"║  🏯 {self.agency_name} - Pay fairly!                      ║",
            "╚═══════════════════════════════════════════════════════════╝",
        ])
        
        return "\n".join(lines)


# Example usage
if __name__ == "__main__":
    cm = CompensationManager("Saigon Digital Hub")
    
    print("💰 Compensation Manager")
    print("=" * 60)
    print()
    
    cm.set_employee_comp("Khoa Vo", PayGrade.EXECUTIVE, 10000, 20)
    cm.set_employee_comp("Alex Nguyen", PayGrade.SENIOR, 4000, 15)
    cm.set_employee_comp("Sarah Tran", PayGrade.SENIOR, 3500, 10)
    cm.set_employee_comp("Mike Chen", PayGrade.MID, 2500, 10)
    
    print(cm.format_dashboard())
