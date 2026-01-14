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
    """A health benefit entity."""
    id: str
    name: str
    benefit_type: BenefitType
    coverage_amount: float
    employer_contribution: float  # percentage 0-100
    employees_enrolled: int = 0
    status: BenefitStatus = BenefitStatus.ACTIVE

    def __post_init__(self):
        if not 0 <= self.employer_contribution <= 100:
            raise ValueError("Employer contribution must be between 0 and 100")
        if self.coverage_amount < 0:
            raise ValueError("Coverage amount cannot be negative")


@dataclass
class WellnessAllowance:
    """An employee wellness allowance record."""
    id: str
    employee_name: str
    annual_budget: float
    used: float = 0.0
    claims: List[str] = field(default_factory=list)

    @property
    def remaining(self) -> float:
        return self.annual_budget - self.used


@dataclass
class MentalHealthDays:
    """Mental health days tracking."""
    employee_name: str
    annual_allowance: int = 3
    used: int = 0
    
    @property
    def remaining(self) -> int:
        return max(0, self.annual_allowance - self.used)


class BenefitsTracker:
    """
    Benefits Tracker System.
    
    Manages health insurance, wellness stipends, and mental health leave.
    """
    
    def __init__(self, agency_name: str):
        self.agency_name = agency_name
        self.benefits: Dict[str, HealthBenefit] = {}
        self.allowances: Dict[str, WellnessAllowance] = {}
        self.mental_health_days: Dict[str, MentalHealthDays] = {}
        
        logger.info(f"Benefits Tracker initialized for {agency_name}")
        self._init_demo_data()
    
    def _init_demo_data(self):
        """Setup initial demo data for the system."""
        try:
            benefits = [
                ("Premium Health Plan", BenefitType.HEALTH_INSURANCE, 500.0, 80.0, 5),
                ("Dental Coverage", BenefitType.DENTAL, 100.0, 100.0, 5),
                ("Vision Plan", BenefitType.VISION, 50.0, 100.0, 5),
                ("Mental Health Benefit", BenefitType.MENTAL_HEALTH, 200.0, 100.0, 5),
                ("Gym Membership", BenefitType.FITNESS, 50.0, 100.0, 4),
            ]
            
            for name, btype, coverage, contrib, enrolled in benefits:
                self.add_benefit(name, btype, coverage, contrib, enrolled)
            
            employees = ["Alex Nguyen", "Sarah Tran", "Mike Chen", "Lisa Pham"]
            for emp in employees:
                self.create_allowance(emp, 500.0)
                self.add_mental_health_days(emp)
        except Exception as e:
            logger.error(f"Error initializing demo data: {e}")
    
    def add_benefit(
        self,
        name: str,
        benefit_type: BenefitType,
        coverage: float,
        employer_contribution: float,
        enrolled: int = 0
    ) -> HealthBenefit:
        """Register a new agency-wide benefit."""
        benefit = HealthBenefit(
            id=f"BEN-{uuid.uuid4().hex[:6].upper()}",
            name=name,
            benefit_type=benefit_type,
            coverage_amount=coverage,
            employer_contribution=employer_contribution,
            employees_enrolled=enrolled
        )
        self.benefits[benefit.id] = benefit
        logger.info(f"Benefit added: {name} ({benefit_type.value})")
        return benefit
    
    def create_allowance(
        self,
        employee_name: str,
        annual_budget: float
    ) -> WellnessAllowance:
        """Assign wellness allowance to an employee."""
        if annual_budget < 0:
            raise ValueError("Budget cannot be negative")

        allowance = WellnessAllowance(
            id=f"ALL-{uuid.uuid4().hex[:6].upper()}",
            employee_name=employee_name,
            annual_budget=annual_budget
        )
        self.allowances[employee_name] = allowance
        return allowance
    
    def use_allowance(self, employee_name: str, amount: float, description: str) -> bool:
        """Process an allowance claim."""
        if employee_name not in self.allowances:
            logger.warning(f"Employee {employee_name} not found in allowances")
            return False
            
        allowance = self.allowances[employee_name]
        if amount > allowance.remaining:
            logger.error(f"Insufficient funds for {employee_name}. Claim: ${amount}, Remaining: ${allowance.remaining}")
            return False
            
        allowance.used += amount
        allowance.claims.append(f"{description}: ${amount}")
        logger.info(f"Allowance claim processed for {employee_name}: ${amount}")
        return True
    
    def add_mental_health_days(
        self,
        employee_name: str,
        annual_allowance: int = 3
    ) -> MentalHealthDays:
        """Initialize mental health days for an employee."""
        mhd = MentalHealthDays(
            employee_name=employee_name,
            annual_allowance=annual_allowance
        )
        self.mental_health_days[employee_name] = mhd
        return mhd
    
    def use_mental_health_day(self, employee_name: str) -> bool:
        """Mark a mental health day as used."""
        if employee_name not in self.mental_health_days:
            logger.warning(f"Employee {employee_name} not found in MH days")
            return False
            
        mhd = self.mental_health_days[employee_name]
        if mhd.remaining > 0:
            mhd.used += 1
            logger.info(f"Mental Health Day used by {employee_name}. Remaining: {mhd.remaining}")
            return True
        else:
            logger.warning(f"{employee_name} has no MH days remaining")
            return False
    
    def format_dashboard(self) -> str:
        """Render Benefits Tracker Dashboard."""
        total_coverage = sum(b.coverage_amount for b in self.benefits.values())
        total_allowance = sum(a.annual_budget for a in self.allowances.values())
        used_allowance = sum(a.used for a in self.allowances.values())
        
        lines = [
            "╔═══════════════════════════════════════════════════════════╗",
            f"║  💊 BENEFITS TRACKER{' ' * 41}║",
            f"║  {len(self.benefits)} benefits │ {len(self.allowances)} employees │ ${total_coverage:>7.0f}/mo{' ' * 13}║",
            "╠═══════════════════════════════════════════════════════════╣",
            "║  🏥 HEALTH BENEFITS                                       ║",
            "║  ───────────────────────────────────────────────────────  ║",
        ]
        
        type_icons = {
            BenefitType.HEALTH_INSURANCE: "🏥", 
            BenefitType.DENTAL: "🦷", 
            BenefitType.VISION: "👁️",
            BenefitType.MENTAL_HEALTH: "🧠", 
            BenefitType.FITNESS: "💪", 
            BenefitType.WELLNESS: "❤️"
        }
        
        for b in list(self.benefits.values())[:5]:
            icon = type_icons.get(b.benefit_type, "💊")
            lines.append(f"║    {icon} {b.name[:20]:<20} │ ${b.coverage_amount:>5.0f}/mo │ {b.employer_contribution:>3.0f}%  ║")
        
        lines.extend([
            "║                                                           ║",
            "║  💰 WELLNESS ALLOWANCES                                   ║",
            "║  ───────────────────────────────────────────────────────  ║",
        ])
        
        for name, allowance in list(self.allowances.items())[:4]:
            used_pct = (allowance.used / allowance.annual_budget * 100) if allowance.annual_budget else 0
            bar = "█" * int(used_pct / 10) + "░" * (10 - int(used_pct / 10))
            lines.append(f"║    💵 {name[:14]:<14} │ {bar} │ ${allowance.remaining:>5.0f} left  ║")
        
        lines.extend([
            "║                                                           ║",
            "║  🧠 MENTAL HEALTH DAYS                                    ║",
            "║  ───────────────────────────────────────────────────────  ║",
        ])
        
        for name, mhd in list(self.mental_health_days.items())[:3]:
            days_bar = "█" * mhd.used + "░" * mhd.remaining
            lines.append(f"║    🧠 {name[:14]:<14} │ {days_bar:<5} │ {mhd.remaining}/{mhd.annual_allowance} left       ║")
        
        lines.extend([
            "║                                                           ║",
            "║  [🏥 Benefits]  [💵 Allowances]  [🧠 Mental Health]       ║",
            "╠═══════════════════════════════════════════════════════════╣",
            f"║  🏯 {self.agency_name[:40]:<40} - Wellness!           ║",
            "╚═══════════════════════════════════════════════════════════╝",
        ])
        
        return "\n".join(lines)


# Example usage
if __name__ == "__main__":
    print("💊 Initializing Benefits Tracker...")
    print("=" * 60)
    
    try:
        bt = BenefitsTracker("Saigon Digital Hub")
        
        # Use some allowances
        bt.use_allowance("Alex Nguyen", 100.0, "Gym membership")
        bt.use_allowance("Sarah Tran", 50.0, "Yoga classes")
        bt.use_mental_health_day("Mike Chen")
        
        print("\n" + bt.format_dashboard())
        
    except Exception as e:
        logger.error(f"Runtime Error: {e}")
