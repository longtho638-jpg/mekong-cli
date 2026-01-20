"""
CISO Dashboard and Reporting logic.
"""
from .manager import SecurityManager
from .models import IncidentStatus, RiskLevel


class CISODashboard(SecurityManager):
    def get_security_score(self) -> int:
        """Calculate weighted security score (0-100)."""
        if not self.risks and not self.compliance:
            return 100

        total_risk_weight = sum(r.risk_level.weight for r in self.risks.values())
        mitigated_weight = sum(
            r.risk_level.weight for r in self.risks.values() if r.status == "mitigated"
        )

        risk_score = (mitigated_weight / total_risk_weight * 50) if total_risk_weight > 0 else 50

        compliant_count = sum(1 for c in self.compliance.values() if c.status == "compliant")
        compliance_score = (compliant_count / len(self.compliance) * 50) if self.compliance else 50

        return int(risk_score + compliance_score)

    def format_dashboard(self) -> str:
        """Render CISO Dashboard."""
        score = self.get_security_score()
        open_risks = sum(1 for r in self.risks.values() if r.status == "open")
        active_incidents = sum(1 for i in self.incidents if i.status != IncidentStatus.RESOLVED)

        lines = [
            "╔═══════════════════════════════════════════════════════════╗",
            f"║  🔒 CISO DASHBOARD{' ' * 42}║",
            f"║  Security Score: {score:>3}% │ {open_risks:>2} risks │ {active_incidents:>2} active incidents{' ' * 7}║",
            "╠═══════════════════════════════════════════════════════════╣",
            "║  ⚠️ RISK REGISTER                                         ║",
            "║  ───────────────────────────────────────────────────────  ║",
        ]

        risk_icons = {
            RiskLevel.CRITICAL: "🔴", RiskLevel.HIGH: "🟠",
            RiskLevel.MEDIUM: "🟡", RiskLevel.LOW: "🟢",
        }
        status_icons = {"open": "⚡", "mitigated": "✅"}

        sorted_risks = sorted(
            self.risks.values(), key=lambda x: (x.status == "mitigated", -x.risk_level.weight)
        )[:4]
        for r in sorted_risks:
            r_icon = risk_icons.get(r.risk_level, "⚪")
            s_icon = status_icons.get(r.status, "⚪")
            title_display = (r.title[:25] + "..") if len(r.title) > 27 else r.title
            lines.append(f"║  {r_icon} {s_icon} {title_display:<27} │ {r.domain.value[:12]:<12}  ║")

        lines.extend([
            "║                                                           ║",
            "║  🚨 INCIDENT STATUS                                       ║",
            "║  ───────────────────────────────────────────────────────  ║",
        ])

        incident_icons = {
            IncidentStatus.DETECTED: "🆕", IncidentStatus.INVESTIGATING: "🔍",
            IncidentStatus.CONTAINED: "🛡️", IncidentStatus.RESOLVED: "✅",
            IncidentStatus.POST_MORTEM: "📋",
        }

        active_inc = [i for i in self.incidents if i.status != IncidentStatus.RESOLVED][:3]
        if not active_inc:
            lines.append("║    ✅ No active security incidents detected               ║")
        else:
            for inc in active_inc:
                r_icon = risk_icons.get(inc.severity, "⚪")
                s_icon = incident_icons.get(inc.status, "⚪")
                title_display = (inc.title[:25] + "..") if len(inc.title) > 27 else inc.title
                lines.append(f"║  {r_icon} {s_icon} {title_display:<27} │ {len(inc.affected_systems):>2} systems  ║")

        lines.extend([
            "║                                                           ║",
            "║  📋 COMPLIANCE STATUS                                     ║",
            "║  ───────────────────────────────────────────────────────  ║",
        ])

        for c in list(self.compliance.values())[:3]:
            c_status = "✅" if c.status == "compliant" else "⚠️" if c.status == "pending" else "❌"
            req_display = (c.requirement[:28] + "..") if len(c.requirement) > 30 else c.requirement
            lines.append(f"║  {c_status} {c.standard:<12} │ {req_display:<30} ║")

        lines.extend([
            "║                                                           ║",
            "║  [🔍 Audit]  [📊 Report]  [🔐 Policies]                   ║",
            "╠═══════════════════════════════════════════════════════════╣",
            f"║  Castle {self.agency_name[:40]:<40} - Security!            ║",
            "╚═══════════════════════════════════════════════════════════╝",
        ])

        return "\n".join(lines)
