"""
CTO Persona Facade and Dashboard.
"""
from typing import Any, Dict

from .manager import CTOManager
from .models import InitiativeStatus, TechDebt, TechDecision, TechInitiative, TechStack


class CTO(CTOManager):
    """
    Chief Technology Officer System.
    Manages technical strategy, architecture decisions, and debt reduction.
    """
    def __init__(self, agency_name: str):
        super().__init__(agency_name)

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
            "debt_days": debt_effort,
        }

    def format_dashboard(self) -> str:
        """Render the CTO Dashboard."""
        stats = self.get_stats()
        lines = [
            "╔═══════════════════════════════════════════════════════════╗",
            f"║  🚀 CTO DASHBOARD{' ' * 43}║",
            f"║  {stats['active']} active initiatives │ {stats['decisions']} ADRs │ {stats['debt_days']} debt days{' ' * 8}║",
            "╠═══════════════════════════════════════════════════════════╣",
            "║  🎯 STRATEGIC INITIATIVES                                 ║",
            "║  ───────────────────────────────────────────────────────  ║",
        ]

        for ini in list(self.initiatives.values())[:4]:
            s_icon = {"ideation": "💡", "planning": "📋", "development": "🔧", "launched": "🚀"}.get(ini.status.value, "⚪")
            impact_icon = {"high": "🔴", "medium": "🟡", "low": "🟢"}.get(ini.impact, "⚪")
            name_disp = (ini.name[:20] + "..") if len(ini.name) > 22 else ini.name
            lines.append(f"║  {s_icon} {impact_icon} {name_disp:<22} │ {ini.owner[:8]:<8}  ║")

        lines.extend(["║                                                           ║", "║  📋 AGENCY TECH STACK                                     ║", "║  ───────────────────────────────────────────────────────  ║"])
        for stack, techs in list(self.tech_stack.items())[:3]:
            if techs:
                tech_list = ", ".join(techs[:3])
                lines.append(f"║    📦 {stack.value.upper():<10} │ {tech_list:<35}  ║")

        lines.extend(["║                                                           ║", "║  ⚠️ PRIORITY TECH DEBT                                    ║", "║  ───────────────────────────────────────────────────────  ║"])
        open_debt = [d for d in self.tech_debt.values() if d.status != "resolved"]
        for debt in sorted(open_debt, key=lambda x: x.effort_days, reverse=True)[:3]:
            sev_icon = {"critical": "🔴", "high": "🟠", "medium": "🟡"}.get(debt.severity, "⚪")
            lines.append(f"║    {sev_icon} {debt.title[:25]:<25} │ {debt.effort_days:>2} days effort  ║")

        lines.extend([
            "║                                                           ║",
            "║  [🎯 Strategy]  [📋 ADRs]  [⚠️ Tech Debt]  [📦 Stack]     ║",
            "╠═══════════════════════════════════════════════════════════╣",
            f"║  Castle {self.agency_name[:40]:<40} - Execution!         ║",
            "╚═══════════════════════════════════════════════════════════╝",
        ])
        return "\n".join(lines)
