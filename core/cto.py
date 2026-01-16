"""
🚀 Chief Technology Officer (CTO)
===================================

Lead technology strategy and innovation.
Vision to execution!

Roles:
- Tech strategy
- Innovation leadership
- Architecture decisions
- Team scaling
"""

import uuid
import logging
from typing import Dict, List, Any, Optional
from dataclasses import dataclass
from datetime import datetime, timedelta
from enum import Enum

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class InitiativeStatus(Enum):
    """Strategic technology initiative status."""
    IDEATION = "ideation"
    PLANNING = "planning"
    DEVELOPMENT = "development"
    LAUNCHED = "launched"
    SCALED = "scaled"


class TechStack(Enum):
    """Technology stack categories."""
    FRONTEND = "frontend"
    BACKEND = "backend"
    DATABASE = "database"
    CLOUD = "cloud"
    AI_ML = "ai_ml"
    DEVOPS = "devops"


@dataclass
class TechInitiative:
    """A high-level technology project entity."""
    id: str
    name: str
    description: str
    status: InitiativeStatus = InitiativeStatus.IDEATION
    impact: str = "medium"  # high, medium, low
    owner: str = ""
    target_date: Optional[datetime] = None


@dataclass
class TechDecision:
    """An Architecture Decision Record (ADR)."""
    id: str
    title: str
    context: str
    decision: str
    consequences: str
    status: str = "proposed"  # proposed, accepted, deprecated
    decided_at: Optional[datetime] = None


@dataclass
class TechDebt:
    """Technical debt tracking record."""
    id: str
    title: str
    area: TechStack
    severity: str  # critical, high, medium, low
    effort_days: int
    status: str = "identified"  # identified, scheduled, resolved

    def __post_init__(self):
        if self.effort_days < 0:
            raise ValueError("Effort days cannot be negative")


class CTO:
    """
    Chief Technology Officer System.
    
    Manages technical strategy, architecture decisions, and debt reduction.
    """
    
    def __init__(self, agency_name: str):
        self.agency_name = agency_name
        self.initiatives: Dict[str, TechInitiative] = {}
        self.decisions: List[TechDecision] = []
        self.tech_debt: Dict[str, TechDebt] = {}
        self.tech_stack: Dict[TechStack, List[str]] = {stack: [] for stack in TechStack}
        logger.info(f"CTO System initialized for {agency_name}")
    
    def add_initiative(
        self,
        name: str,
        description: str,
        impact: str = "high",
        owner: str = "CTO",
        months: int = 6
    ) -> TechInitiative:
        """Register a new strategic technology initiative."""
        if not name:
            raise ValueError("Initiative name is required")

        initiative = TechInitiative(
            id=f"INI-{uuid.uuid4().hex[:6].upper()}",
            name=name,
            description=description,
            impact=impact,
            owner=owner,
            target_date=datetime.now() + timedelta(days=months * 30)
        )
        self.initiatives[initiative.id] = initiative
        logger.info(f"New Initiative: {name} (Target: {months}mo)")
        return initiative
    
    def record_decision(
        self,
        title: str,
        context: str,
        decision: str,
        consequences: str
    ) -> TechDecision:
        """Document an architectural decision record (ADR)."""
        adr = TechDecision(
            id=f"ADR-{uuid.uuid4().hex[:6].upper()}",
            title=title,
            context=context,
            decision=decision,
            consequences=consequences
        )
        self.decisions.append(adr)
        logger.info(f"ADR recorded: {title}")
        return adr
    
    def add_tech_debt(
        self,
        title: str,
        area: TechStack,
        severity: str,
        effort_days: int
    ) -> TechDebt:
        """Track identifying technical debt."""
        debt = TechDebt(
            id=f"TDB-{uuid.uuid4().hex[:6].upper()}",
            title=title,
            area=area,
            severity=severity,
            effort_days=effort_days
        )
        self.tech_debt[debt.id] = debt
        logger.warning(f"TECH DEBT LOGGED: {title} ({severity})")
        return debt
    
    def add_to_stack(self, category: TechStack, technology: str):
        """Standardize a technology into the agency stack."""
        if technology not in self.tech_stack[category]:
            self.tech_stack[category].append(technology)
            logger.debug(f"Stack Update: {category.value} -> {technology}")
    
    def get_stats(self) -> Dict[str, Any]:
        """Aggregate high-level technology performance metrics."""
        active_ini = [i for i in self.initiatives.values() if i.status != InitiativeStatus.SCALED]
        open_debt = [d for d in self.tech_debt.values() if d.status != "resolved"]
        debt_effort = sum(d.effort_days for d in open_debt)
        
        return {
            "initiatives": len(self.initiatives),
            "active": len(active_ini),
            "decisions": len(self.decisions),
            "tech_debt": len(open_debt),
            "debt_days": debt_effort
        }
    
    def format_dashboard(self) -> str:
        """Render the CTO Dashboard."""
        active_ini = [i for i in self.initiatives.values() if i.status != InitiativeStatus.SCALED]
        open_debt = [d for d in self.tech_debt.values() if d.status != "resolved"]
        debt_effort = sum(d.effort_days for d in open_debt)
        
        lines = [
            "╔═══════════════════════════════════════════════════════════╗",
            f"║  🚀 CTO DASHBOARD{' ' * 43}║",
            f"║  {len(active_ini)} active initiatives │ {len(self.decisions)} ADRs │ {debt_effort} debt days{' ' * 8}║",
            "╠═══════════════════════════════════════════════════════════╣",
            "║  🎯 STRATEGIC INITIATIVES                                 ║",
            "║  ───────────────────────────────────────────────────────  ║",
        ]
        
        # Display latest 4 initiatives
        for ini in list(self.initiatives.values())[:4]:
            s_icon = {"ideation": "💡", "planning": "📋", "development": "🔧", "launched": "🚀"}.get(ini.status.value, "⚪")
            impact_icon = {"high": "🔴", "medium": "🟡", "low": "🟢"}.get(ini.impact, "⚪")
            name_disp = (ini.name[:20] + '..') if len(ini.name) > 22 else ini.name
            lines.append(f"║  {s_icon} {impact_icon} {name_disp:<22} │ {ini.owner[:8]:<8}  ║")
        
        lines.extend([
            "║                                                           ║",
            "║  📋 AGENCY TECH STACK                                     ║",
            "║  ───────────────────────────────────────────────────────  ║",
        ])
        
        for stack, techs in list(self.tech_stack.items())[:3]:
            if techs:
                tech_list = ", ".join(techs[:3])
                lines.append(f"║    📦 {stack.value.upper():<10} │ {tech_list:<35}  ║")
        
        lines.extend([
            "║                                                           ║",
            "║  ⚠️ PRIORITY TECH DEBT                                    ║",
            "║  ───────────────────────────────────────────────────────  ║",
        ])
        
        for debt in sorted(open_debt, key=lambda x: x.effort_days, reverse=True)[:3]:
            sev_icon = {"critical": "🔴", "high": "🟠", "medium": "🟡"}.get(debt.severity, "⚪")
            lines.append(f"║    {sev_icon} {debt.title[:25]:<25} │ {debt.effort_days:>2} days effort  ║")
        
        lines.extend([
            "║                                                           ║",
            "║  [🎯 Strategy]  [📋 ADRs]  [⚠️ Tech Debt]  [📦 Stack]     ║",
            "╠═══════════════════════════════════════════════════════════╣",
            f"║  🏯 {self.agency_name[:40]:<40} - Execution!         ║",
            "╚═══════════════════════════════════════════════════════════╝",
        ])
        
        return "\n".join(lines)


# Example usage
if __name__ == "__main__":
    print("🚀 Initializing CTO Dashboard...")
    print("=" * 60)
    
    try:
        cto_system = CTO("Saigon Digital Hub")
        
        # Seed data
        cto_system.add_initiative("AI Integration", "Embed AI into workflows", "high")
        cto_system.add_to_stack(TechStack.BACKEND, "FastAPI")
        cto_system.add_to_stack(TechStack.AI_ML, "OpenAI")
        cto_system.add_tech_debt("Legacy API cleanup", TechStack.BACKEND, "high", 10)
        
        print("\n" + cto_system.format_dashboard())
        
    except Exception as e:
        logger.error(f"CTO System Error: {e}")
