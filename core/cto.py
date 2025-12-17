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

from typing import Dict, List, Any, Optional
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from enum import Enum
import uuid


class InitiativeStatus(Enum):
    """Strategic initiative status."""
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
    """A technology initiative."""
    id: str
    name: str
    description: str
    status: InitiativeStatus = InitiativeStatus.IDEATION
    impact: str = ""  # high, medium, low
    owner: str = ""
    target_date: Optional[datetime] = None


@dataclass
class TechDecision:
    """A technology decision record (ADR)."""
    id: str
    title: str
    context: str
    decision: str
    consequences: str
    status: str = "proposed"  # proposed, accepted, deprecated
    decided_at: Optional[datetime] = None


@dataclass
class TechDebt:
    """Technical debt item."""
    id: str
    title: str
    area: TechStack
    severity: str  # critical, high, medium, low
    effort_days: int
    status: str = "identified"  # identified, scheduled, resolved


class CTO:
    """
    Chief Technology Officer.
    
    Lead tech strategy.
    """
    
    def __init__(self, agency_name: str):
        self.agency_name = agency_name
        self.initiatives: Dict[str, TechInitiative] = {}
        self.decisions: List[TechDecision] = []
        self.tech_debt: Dict[str, TechDebt] = {}
        self.tech_stack: Dict[TechStack, List[str]] = {stack: [] for stack in TechStack}
    
    def add_initiative(
        self,
        name: str,
        description: str,
        impact: str = "high",
        owner: str = "",
        months: int = 6
    ) -> TechInitiative:
        """Add a strategic initiative."""
        initiative = TechInitiative(
            id=f"INI-{uuid.uuid4().hex[:6].upper()}",
            name=name,
            description=description,
            impact=impact,
            owner=owner,
            target_date=datetime.now() + timedelta(days=months * 30)
        )
        self.initiatives[initiative.id] = initiative
        return initiative
    
    def update_initiative(self, initiative: TechInitiative, status: InitiativeStatus):
        """Update initiative status."""
        initiative.status = status
    
    def record_decision(
        self,
        title: str,
        context: str,
        decision: str,
        consequences: str
    ) -> TechDecision:
        """Record an architecture decision."""
        adr = TechDecision(
            id=f"ADR-{uuid.uuid4().hex[:6].upper()}",
            title=title,
            context=context,
            decision=decision,
            consequences=consequences
        )
        self.decisions.append(adr)
        return adr
    
    def accept_decision(self, decision: TechDecision):
        """Accept a decision."""
        decision.status = "accepted"
        decision.decided_at = datetime.now()
    
    def add_tech_debt(
        self,
        title: str,
        area: TechStack,
        severity: str,
        effort_days: int
    ) -> TechDebt:
        """Add technical debt."""
        debt = TechDebt(
            id=f"TDB-{uuid.uuid4().hex[:6].upper()}",
            title=title,
            area=area,
            severity=severity,
            effort_days=effort_days
        )
        self.tech_debt[debt.id] = debt
        return debt
    
    def add_to_stack(self, category: TechStack, technology: str):
        """Add technology to stack."""
        if technology not in self.tech_stack[category]:
            self.tech_stack[category].append(technology)
    
    def get_stats(self) -> Dict[str, Any]:
        """Get CTO stats."""
        active_initiatives = sum(1 for i in self.initiatives.values() 
                                if i.status not in [InitiativeStatus.LAUNCHED, InitiativeStatus.SCALED])
        open_debt = sum(1 for d in self.tech_debt.values() if d.status != "resolved")
        debt_days = sum(d.effort_days for d in self.tech_debt.values() if d.status != "resolved")
        
        return {
            "initiatives": len(self.initiatives),
            "active": active_initiatives,
            "decisions": len(self.decisions),
            "tech_debt": open_debt,
            "debt_days": debt_days
        }
    
    def format_dashboard(self) -> str:
        """Format CTO dashboard."""
        stats = self.get_stats()
        
        lines = [
            "╔═══════════════════════════════════════════════════════════╗",
            f"║  🚀 CTO DASHBOARD                                         ║",
            f"║  {stats['initiatives']} initiatives │ {stats['decisions']} ADRs │ {stats['debt_days']} debt days  ║",
            "╠═══════════════════════════════════════════════════════════╣",
            "║  🎯 STRATEGIC INITIATIVES                                 ║",
            "║  ─────────────────────────────────────────────────────── ║",
        ]
        
        status_icons = {"ideation": "💡", "planning": "📋", "development": "🔧",
                       "launched": "🚀", "scaled": "📈"}
        impact_icons = {"high": "🔴", "medium": "🟡", "low": "🟢"}
        
        for ini in list(self.initiatives.values())[:4]:
            s_icon = status_icons.get(ini.status.value, "⚪")
            i_icon = impact_icons.get(ini.impact, "⚪")
            target = ini.target_date.strftime("%b %Y") if ini.target_date else "TBD"
            
            lines.append(f"║  {s_icon} {i_icon} {ini.name[:20]:<20} │ {target:<8} │ {ini.owner[:8]:<8}  ║")
        
        lines.extend([
            "║                                                           ║",
            "║  📋 TECH STACK                                            ║",
            "║  ─────────────────────────────────────────────────────── ║",
        ])
        
        stack_icons = {"frontend": "🎨", "backend": "⚙️", "database": "🗄️",
                      "cloud": "☁️", "ai_ml": "🤖", "devops": "🔧"}
        
        for stack, techs in list(self.tech_stack.items())[:4]:
            if techs:
                icon = stack_icons.get(stack.value, "📦")
                tech_list = ", ".join(techs[:3])
                lines.append(f"║  {icon} {stack.value.upper():<10} │ {tech_list:<35}  ║")
        
        lines.extend([
            "║                                                           ║",
            "║  ⚠️ TECH DEBT                                             ║",
            "║  ─────────────────────────────────────────────────────── ║",
        ])
        
        sev_icons = {"critical": "🔴", "high": "🟠", "medium": "🟡", "low": "🟢"}
        
        for debt in list(self.tech_debt.values())[:3]:
            icon = sev_icons.get(debt.severity, "⚪")
            lines.append(f"║  {icon} {debt.title[:25]:<25} │ {debt.effort_days:>2} days │ {debt.area.value[:8]:<8}  ║")
        
        lines.extend([
            "║                                                           ║",
            "║  [🎯 Strategy]  [📋 ADRs]  [⚠️ Tech Debt]                 ║",
            "╠═══════════════════════════════════════════════════════════╣",
            f"║  🏯 {self.agency_name} - Vision to execution!             ║",
            "╚═══════════════════════════════════════════════════════════╝",
        ])
        
        return "\n".join(lines)


# Example usage
if __name__ == "__main__":
    cto = CTO("Saigon Digital Hub")
    
    print("🚀 CTO Dashboard")
    print("=" * 60)
    print()
    
    # Add initiatives
    i1 = cto.add_initiative("AI Integration", "Add AI to all products", "high", "CTO", 12)
    i2 = cto.add_initiative("Microservices Migration", "Move to microservices", "high", "Architect", 18)
    
    cto.update_initiative(i1, InitiativeStatus.PLANNING)
    cto.update_initiative(i2, InitiativeStatus.DEVELOPMENT)
    
    # Add tech stack
    cto.add_to_stack(TechStack.FRONTEND, "Next.js")
    cto.add_to_stack(TechStack.FRONTEND, "React")
    cto.add_to_stack(TechStack.BACKEND, "FastAPI")
    cto.add_to_stack(TechStack.BACKEND, "Python")
    cto.add_to_stack(TechStack.DATABASE, "PostgreSQL")
    cto.add_to_stack(TechStack.CLOUD, "AWS")
    cto.add_to_stack(TechStack.AI_ML, "OpenAI")
    
    # Add tech debt
    cto.add_tech_debt("Legacy API refactor", TechStack.BACKEND, "high", 15)
    cto.add_tech_debt("Update dependencies", TechStack.FRONTEND, "medium", 3)
    
    # Record decision
    cto.record_decision("Use FastAPI for new APIs", "Need async support", "FastAPI over Flask", "Team training needed")
    
    print(cto.format_dashboard())
