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

import uuid
import logging
from typing import Dict, List, Any, Optional, Union
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

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
    """A salary band entity."""
    grade: PayGrade
    min_salary: float
    mid_salary: float
    max_salary: float
    currency: str = "USD"

    def __post_init__(self):
        if not (self.min_salary < self.mid_salary < self.max_salary):
            raise ValueError(f"Invalid salary band for {self.grade.value}: min < mid < max required")
        if self.min_salary < 0:
            raise ValueError("Salary cannot be negative")


@dataclass
class Benefit:
    """A benefit offering entity."""
    id: str
    name: str
    benefit_type: BenefitType
    cost_monthly: float
    employer_contribution: float  # percentage 0-100
    active: bool = True

    def __post_init__(self):
        if not 0 <= self.employer_contribution <= 100:
            raise ValueError("Employer contribution must be between 0 and 100")
        if self.cost_monthly < 0:
            raise ValueError("Cost cannot be negative")


@dataclass
class EmployeeComp:
    """Employee compensation package record."""
    id: str
    employee_name: str
    grade: PayGrade
    base_salary: float
    bonus_target: float = 0.0  # percentage
    benefit_ids: List[str] = field(default_factory=list)
    equity: float = 0.0

    def __post_init__(self):
        if self.base_salary < 0:
            raise ValueError("Base salary cannot be negative")


class CompensationManager:
    """
    Compensation Manager System.
    
    Handles fair pay structures, benefits distribution, and total rewards tracking.
    """
    
    def __init__(self, agency_name: str):
        self.agency_name = agency_name
        self.salary_bands: Dict[PayGrade, SalaryBand] = {}
        self.benefits: Dict[str, Benefit] = {}
        self.compensation: Dict[str, EmployeeComp] = {}
        
        logger.info(f"Compensation Manager initialized for {agency_name}")
        self._init_defaults()
    
    def _init_defaults(self):
        """Setup default salary bands and standard benefits."""
        # Bands
        bands = [
            (PayGrade.JUNIOR, 1000.0, 1500.0, 2000.0),
            (PayGrade.MID, 2000.0, 2750.0, 3500.0),
            (PayGrade.SENIOR, 3000.0, 4000.0, 5000.0),
            (PayGrade.LEAD, 4000.0, 5000.0, 6000.0),
            (PayGrade.MANAGER, 4500.0, 5500.0, 6500.0),
            (PayGrade.DIRECTOR, 6000.0, 7500.0, 9000.0),
            (PayGrade.EXECUTIVE, 8000.0, 10000.0, 15000.0),
        ]
        for grade, min_s, mid_s, max_s in bands:
            self.salary_bands[grade] = SalaryBand(grade, min_s, mid_s, max_s)
            
        # Standard Benefits
        default_benefits = [
            ("Health Insurance", BenefitType.HEALTH, 300.0, 80.0),
            ("Dental Plan", BenefitType.DENTAL, 50.0, 100.0),
            ("401k Match", BenefitType.RETIREMENT, 0.0, 50.0),
            ("Unlimited PTO", BenefitType.PTO, 0.0, 100.0),
            ("Remote Work", BenefitType.REMOTE, 100.0, 100.0),
        ]
        for name, btype, cost, contrib in default_benefits:
            self.add_benefit(name, btype, cost, contrib)
    
    def add_benefit(
        self,
        name: str,
        benefit_type: BenefitType,
        cost: float,
        employer_contribution: float = 100.0
    ) -> Benefit:
        """Add a new benefit to the catalog."""
        benefit = Benefit(
            id=f"BEN-{uuid.uuid4().hex[:6].upper()}",
            name=name,
            benefit_type=benefit_type,
            cost_monthly=cost,
            employer_contribution=employer_contribution
        )
        self.benefits[benefit.id] = benefit
        logger.info(f"Benefit added: {name} (${cost}/mo)")
        return benefit
    
    def set_employee_comp(
        self,
        name: str,
        grade: PayGrade,
        base_salary: float,
        bonus_target: float = 0.0,
        benefit_ids: Optional[List[str]] = None,
        equity: float = 0.0
    ) -> EmployeeComp:
        """Define or update an employee's total rewards package."""
        if not name:
            raise ValueError("Employee name required")

        comp = EmployeeComp(
            id=f"CMP-{uuid.uuid4().hex[:6].upper()}",
            employee_name=name,
            grade=grade,
            base_salary=base_salary,
            bonus_target=bonus_target,
            benefit_ids=benefit_ids or list(self.benefits.keys()),
            equity=equity
        )
        self.compensation[comp.id] = comp
        logger.info(f"Compensation set for {name} ({grade.value})")
        return comp
    
    def get_total_comp_summary(self, comp_id: str) -> Dict[str, float]:
        """Calculate annualized total compensation including bonuses and benefits."""
        if comp_id not in self.compensation:
            return {"total": 0.0}
            
        c = self.compensation[comp_id]
        base_annual = c.base_salary * 12
        bonus_value = base_annual * (c.bonus_target / 100.0)
        
        benefits_value = 0.0
        for bid in c.benefit_ids:
            ben = self.benefits.get(bid)
            if ben and ben.active:
                benefits_value += ben.cost_monthly * (ben.employer_contribution / 100.0) * 12
        
        return {
            "base": base_annual,
            "bonus": bonus_value,
            "benefits": benefits_value,
            "equity": c.equity,
            "total": base_annual + bonus_value + benefits_value + c.equity
        }
    
    def get_compa_ratio(self, comp_id: str) -> float:
        """Calculate compa-ratio (salary relative to mid-point of band)."""
        c = self.compensation.get(comp_id)
        if not c: return 0.0
        band = self.salary_bands.get(c.grade)
        if not band or band.mid_salary == 0: return 1.0
        return c.base_salary / band.mid_salary
    
    def get_aggregate_stats(self) -> Dict[str, Any]:
        """Aggregate high-level compensation performance metrics."""
        count = len(self.compensation)
        total_salary = sum(c.base_salary for c in self.compensation.values())
        return {
            "total_records": count,
            "avg_salary": total_salary / count if count else 0.0,
            "benefits_count": len(self.benefits)
        }
    
    def format_dashboard(self) -> str:
        """Render Compensation Dashboard."""
        count = len(self.compensation)
        total_salary = sum(c.base_salary for c in self.compensation.values())
        avg_salary = total_salary / count if count else 0.0
        avg_compa = sum(self.get_compa_ratio(cid) for cid in self.compensation) / count if count else 0.0
        
        lines = [
            "╔═══════════════════════════════════════════════════════════╗",
            f"║  💰 COMPENSATION MANAGER{' ' * 42}║",
            f"║  {count} employees │ ${avg_salary:,.0f} avg monthly │ {avg_compa:.0%} avg compa {' ' * 8}║",
            "╠═══════════════════════════════════════════════════════════╣",
            "║  📊 SALARY BANDS (Core)                                   ║",
            "║  ───────────────────────────────────────────────────────  ║",
        ]
        
        grade_icons = {
            PayGrade.JUNIOR: "🌱", PayGrade.MID: "🌿", PayGrade.SENIOR: "🌳",
            PayGrade.LEAD: "⭐", PayGrade.MANAGER: "👔", PayGrade.DIRECTOR: "🎯", PayGrade.EXECUTIVE: "👑"
        }
        
        # Show key bands
        for g in [PayGrade.JUNIOR, PayGrade.MID, PayGrade.SENIOR, PayGrade.LEAD]:
            b = self.salary_bands.get(g)
            if b:
                icon = grade_icons.get(g, "💼")
                lines.append(f"║    {icon} {g.value.title():<10} │ ${b.min_salary:>5,.0f} - ${b.max_salary:>5,.0f} {' ' * 15}║")
        
        lines.extend([
            "║                                                           ║",
            "║  🎁 TOP BENEFITS                                          ║",
            "║  ───────────────────────────────────────────────────────  ║",
        ])
        
        type_icons = {
            BenefitType.HEALTH: "🏥", BenefitType.DENTAL: "🦷", BenefitType.VISION: "👁️",
            BenefitType.RETIREMENT: "🏦", BenefitType.PTO: "🏖️", BenefitType.REMOTE: "🏠"
        }
        
        for ben in list(self.benefits.values())[:4]:
            icon = type_icons.get(ben.benefit_type, "🎁")
            lines.append(f"║    {icon} {ben.name:<18} │ {ben.employer_contribution:>3.0f}% covered{' ' * 14}║")
        
        lines.extend([
            "║                                                           ║",
            "║  👥 EMPLOYEE SNAPSHOT                                     ║",
            "║  ───────────────────────────────────────────────────────  ║",
        ])
        
        for cid, comp in list(self.compensation.items())[:4]:
            ratio = self.get_compa_ratio(cid)
            r_icon = "🟢" if ratio >= 0.9 else "🟡" if ratio >= 0.8 else "🔴"
            name_disp = (comp.employee_name[:14] + '..') if len(comp.employee_name) > 16 else comp.employee_name
            lines.append(f"║    {r_icon} {name_disp:<16} │ ${comp.base_salary:>6,.0f}/mo │ Ratio: {ratio:>4.0%}  ║")
        
        lines.extend([
            "║                                                           ║",
            "║  [📊 Bands]  [🎁 Benefits]  [👥 Employees]                ║",
            "╠═══════════════════════════════════════════════════════════╣",
            f"║  🏯 {self.agency_name[:40]:<40} - Pay Fairly!         ║",
            "╚═══════════════════════════════════════════════════════════╝",
        ])
        
        return "\n".join(lines)


# Example usage
if __name__ == "__main__":
    print("💰 Initializing Compensation Manager...")
    print("=" * 60)
    
    try:
        mgr = CompensationManager("Saigon Digital Hub")
        
        mgr.set_employee_comp("Khoa Vo", PayGrade.EXECUTIVE, 10000.0, 20.0)
        mgr.set_employee_comp("Alex Nguyen", PayGrade.SENIOR, 4000.0, 15.0)
        mgr.set_employee_comp("Sarah Tran", PayGrade.SENIOR, 3500.0, 10.0)
        
        print("\n" + mgr.format_dashboard())
        
    except Exception as e:
        logger.error(f"Manager Error: {e}")
