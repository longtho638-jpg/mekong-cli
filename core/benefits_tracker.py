"""
💊 Benefits Tracker - Health Benefits
=======================================

Track employee health benefits.
Take care of your team!

Features:
- Health insurance tracking
- Wellness allowances
- Mental health days
- Fitness stipends
"""

from typing import Dict, List, Any, Optional
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
import uuid


class BenefitType(Enum):
    """Benefit types."""
    HEALTH_INSURANCE = "health_insurance"
    DENTAL = "dental"
    VISION = "vision"
    MENTAL_HEALTH = "mental_health"
    FITNESS = "fitness"
    WELLNESS = "wellness"


class BenefitStatus(Enum):
    """Benefit status."""
    ACTIVE = "active"
    PENDING = "pending"
    EXPIRED = "expired"


@dataclass
class HealthBenefit:
    """A health benefit."""
    id: str
    name: str
    benefit_type: BenefitType
    coverage_amount: float
    employer_contribution: float  # percentage
    employees_enrolled: int = 0
    status: BenefitStatus = BenefitStatus.ACTIVE


@dataclass
class WellnessAllowance:
    """An employee wellness allowance."""
    id: str
    employee_name: str
    annual_budget: float
    used: float = 0
    claims: List[str] = field(default_factory=list)


@dataclass
class MentalHealthDays:
    """Mental health days tracking."""
    employee_name: str
    annual_allowance: int = 3
    used: int = 0
    remaining: int = 3


class BenefitsTracker:
    """
    Benefits Tracker.
    
    Health and wellness benefits management.
    """
    
    def __init__(self, agency_name: str):
        self.agency_name = agency_name
        self.benefits: Dict[str, HealthBenefit] = {}
        self.allowances: Dict[str, WellnessAllowance] = {}
        self.mental_health_days: Dict[str, MentalHealthDays] = {}
        
        self._init_demo_data()
    
    def _init_demo_data(self):
        """Initialize demo data."""
        # Health benefits
        benefits = [
            ("Premium Health Plan", BenefitType.HEALTH_INSURANCE, 500, 80, 5),
            ("Dental Coverage", BenefitType.DENTAL, 100, 100, 5),
            ("Vision Plan", BenefitType.VISION, 50, 100, 5),
            ("Mental Health Benefit", BenefitType.MENTAL_HEALTH, 200, 100, 5),
            ("Gym Membership", BenefitType.FITNESS, 50, 100, 4),
        ]
        
        for name, btype, coverage, contrib, enrolled in benefits:
            self.add_benefit(name, btype, coverage, contrib, enrolled)
        
        # Wellness allowances
        employees = ["Alex Nguyen", "Sarah Tran", "Mike Chen", "Lisa Pham"]
        for emp in employees:
            self.create_allowance(emp, 500)
            self.add_mental_health_days(emp)
    
    def add_benefit(
        self,
        name: str,
        benefit_type: BenefitType,
        coverage: float,
        employer_contribution: float,
        enrolled: int = 0
    ) -> HealthBenefit:
        """Add a health benefit."""
        benefit = HealthBenefit(
            id=f"BEN-{uuid.uuid4().hex[:6].upper()}",
            name=name,
            benefit_type=benefit_type,
            coverage_amount=coverage,
            employer_contribution=employer_contribution,
            employees_enrolled=enrolled
        )
        self.benefits[benefit.id] = benefit
        return benefit
    
    def create_allowance(
        self,
        employee_name: str,
        annual_budget: float
    ) -> WellnessAllowance:
        """Create wellness allowance for employee."""
        allowance = WellnessAllowance(
            id=f"ALL-{uuid.uuid4().hex[:6].upper()}",
            employee_name=employee_name,
            annual_budget=annual_budget
        )
        self.allowances[employee_name] = allowance
        return allowance
    
    def use_allowance(self, employee_name: str, amount: float, description: str):
        """Use wellness allowance."""
        if employee_name in self.allowances:
            allowance = self.allowances[employee_name]
            remaining = allowance.annual_budget - allowance.used
            if amount <= remaining:
                allowance.used += amount
                allowance.claims.append(f"{description}: ${amount}")
    
    def add_mental_health_days(
        self,
        employee_name: str,
        annual_allowance: int = 3
    ) -> MentalHealthDays:
        """Add mental health days for employee."""
        mhd = MentalHealthDays(
            employee_name=employee_name,
            annual_allowance=annual_allowance,
            remaining=annual_allowance
        )
        self.mental_health_days[employee_name] = mhd
        return mhd
    
    def use_mental_health_day(self, employee_name: str):
        """Use a mental health day."""
        if employee_name in self.mental_health_days:
            mhd = self.mental_health_days[employee_name]
            if mhd.remaining > 0:
                mhd.used += 1
                mhd.remaining -= 1
    
    def get_stats(self) -> Dict[str, Any]:
        """Get benefits statistics."""
        total_coverage = sum(b.coverage_amount for b in self.benefits.values())
        total_enrolled = sum(b.employees_enrolled for b in self.benefits.values())
        total_allowance = sum(a.annual_budget for a in self.allowances.values())
        used_allowance = sum(a.used for a in self.allowances.values())
        
        return {
            "benefits": len(self.benefits),
            "total_coverage": total_coverage,
            "enrollments": total_enrolled,
            "allowance_budget": total_allowance,
            "allowance_used": used_allowance,
            "allowance_remaining": total_allowance - used_allowance,
            "employees": len(self.allowances)
        }
    
    def format_dashboard(self) -> str:
        """Format benefits tracker dashboard."""
        stats = self.get_stats()
        
        lines = [
            "╔═══════════════════════════════════════════════════════════╗",
            f"║  💊 BENEFITS TRACKER                                      ║",
            f"║  {stats['benefits']} benefits │ {stats['employees']} employees │ ${stats['total_coverage']}/mo  ║",
            "╠═══════════════════════════════════════════════════════════╣",
            "║  🏥 HEALTH BENEFITS                                       ║",
            "║  ─────────────────────────────────────────────────────── ║",
        ]
        
        type_icons = {"health_insurance": "🏥", "dental": "🦷", "vision": "👁️",
                     "mental_health": "🧠", "fitness": "💪", "wellness": "❤️"}
        
        for benefit in list(self.benefits.values())[:5]:
            icon = type_icons.get(benefit.benefit_type.value, "💊")
            lines.append(f"║    {icon} {benefit.name[:20]:<20} │ ${benefit.coverage_amount:>5}/mo │ {benefit.employer_contribution:>3}%  ║")
        
        lines.extend([
            "║                                                           ║",
            "║  💰 WELLNESS ALLOWANCES                                   ║",
            "║  ─────────────────────────────────────────────────────── ║",
        ])
        
        for name, allowance in list(self.allowances.items())[:4]:
            used_pct = (allowance.used / allowance.annual_budget * 100) if allowance.annual_budget else 0
            remaining = allowance.annual_budget - allowance.used
            bar = "█" * int(used_pct / 10) + "░" * (10 - int(used_pct / 10))
            lines.append(f"║    💵 {name[:14]:<14} │ {bar} │ ${remaining:>5} left  ║")
        
        lines.extend([
            "║                                                           ║",
            "║  🧠 MENTAL HEALTH DAYS                                    ║",
            "║  ─────────────────────────────────────────────────────── ║",
        ])
        
        for name, mhd in list(self.mental_health_days.items())[:3]:
            days_bar = "█" * mhd.used + "░" * mhd.remaining
            lines.append(f"║    🧠 {name[:14]:<14} │ {days_bar:<5} │ {mhd.remaining}/{mhd.annual_allowance} remaining  ║")
        
        lines.extend([
            "║                                                           ║",
            "║  📊 BENEFITS SUMMARY                                      ║",
            "║  ─────────────────────────────────────────────────────── ║",
            f"║    🏥 Active Benefits:    {stats['benefits']:>12}              ║",
            f"║    💵 Allowance Budget:   ${stats['allowance_budget']:>11,.0f}              ║",
            f"║    💰 Allowance Used:     ${stats['allowance_used']:>11,.0f}              ║",
            f"║    📊 Remaining:          ${stats['allowance_remaining']:>11,.0f}              ║",
            "║                                                           ║",
            "║  [🏥 Benefits]  [💵 Allowances]  [🧠 Mental Health]       ║",
            "╠═══════════════════════════════════════════════════════════╣",
            f"║  🏯 {self.agency_name} - Take care of your team!          ║",
            "╚═══════════════════════════════════════════════════════════╝",
        ])
        
        return "\n".join(lines)


# Example usage
if __name__ == "__main__":
    bt = BenefitsTracker("Saigon Digital Hub")
    
    print("💊 Benefits Tracker")
    print("=" * 60)
    print()
    
    # Use some allowances
    bt.use_allowance("Alex Nguyen", 100, "Gym membership")
    bt.use_allowance("Sarah Tran", 50, "Yoga classes")
    bt.use_mental_health_day("Mike Chen")
    
    print(bt.format_dashboard())
