"""
🏯 Unified Agentic Dashboard - Complete System Overview
======================================================

Combines all agentic subsystems into one unified strategic view.
Provides visibility into the AI workforce, specialized skills,
governance rules, and long-term learning performance.

Components Analyzed:
- 🤖 Workforce: Agents, Crews, and Chains.
- 🎯 Intellectual Property: Skills and Rules.
- 🧠 Cognitive health: Memory and Success Rates.
- 🎚️ Style control: Coding Level and Persona.

Binh Pháp: 🏯 Hình (Strategic Configuration) - Seeing the whole army.
"""

import logging
from typing import Dict

from .agent_chains import AGENT_CHAINS, AGENT_INVENTORY
from .agent_crews import CREWS
from .agent_memory import get_agent_memory
from .coding_level import get_level
from .hooks_manager import HOOKS
from .rules_loader import get_total_assignments, get_total_rules
from .skill_loader import get_total_mappings, get_total_skills
from .types import AgenticDashboardStatsDict

# Configure logging
logger = logging.getLogger(__name__)


class AgenticDashboard:
    """
    🏯 Unified Agentic Dashboard

    The master control room for the Agency OS AI infrastructure.
    """

    def get_stats(self) -> AgenticDashboardStatsDict:
        """Aggregates statistics from all agentic subsystems."""
        memory = get_agent_memory()
        m_stats = memory.get_stats()
        level = get_level()

        return {
            "inventory": {
                "agents": len(AGENT_INVENTORY),
                "chains": len(AGENT_CHAINS),
                "crews": len(CREWS),
            },
            "ip": {
                "skills": get_total_skills(),
                "skill_mappings": get_total_mappings(),
                "rules": get_total_rules(),
                "rule_assignments": get_total_assignments(),
                "hooks": sum(len(h) for h in HOOKS.values()),
            },
            "cognition": {
                "memories": m_stats["total_records"],
                "patterns": m_stats["total_patterns"],
                "success_rate": m_stats["global_success_rate"],
            },
            "configuration": {"coding_level": level.level, "level_name": level.name},
        }

    def _calculate_integration_score(self, stats: AgenticDashboardStatsDict) -> int:
        """
        Calculates an overall 'Agentic Power' score (0-100%).
        Weights based on system maturity benchmarks.
        """
        # Targets for 100% score
        TARGETS = {"agents": 26, "chains": 34, "crews": 6, "skills": 41, "rules": 6, "hooks": 5}

        score = 0.0
        inv = stats["inventory"]
        ip = stats["ip"]
        cog = stats["cognition"]

        # 1. Workforce Depth (35%)
        score += min(inv["agents"] / TARGETS["agents"], 1.0) * 15
        score += min(inv["chains"] / TARGETS["chains"], 1.0) * 10
        score += min(inv["crews"] / TARGETS["crews"], 1.0) * 10

        # 2. Intellectual Property (35%)
        score += min(ip["skills"] / TARGETS["skills"], 1.0) * 15
        score += min(ip["rules"] / TARGETS["rules"], 1.0) * 10
        score += min(ip["hooks"] / TARGETS["hooks"], 1.0) * 10

        # 3. Learning & Experience (30%)
        score += min(cog["memories"] / 100, 1.0) * 10  # 100 memories baseline
        score += cog["success_rate"] * 20

        return int(min(score, 100))

    def print_full_dashboard(self):
        """Renders the complete visual dashboard to the console."""
        stats = self.get_stats()
        power_score = self._calculate_integration_score(stats)
        level = get_level()

        print("\n" + "═" * 65)
        print("║" + "🏯 AGENCY OS - UNIFIED AGENTIC WORKBENCH".center(63) + "║")
        print("═" * 65)

        # Section 1: Workforce
        print(
            f"\n  🤖 WORKFORCE: {stats['inventory']['agents']} Agents | {stats['inventory']['crews']} Specialized Crews"
        )
        print(f"     └─ Active Chains : {stats['inventory']['chains']}")

        # Section 2: IP
        print("\n  🎯 INTELLECTUAL PROPERTY:")
        print(f"     ├─ Specialized Skills : {stats['ip']['skills']}")
        print(f"     ├─ Governance Rules   : {stats['ip']['rules']}")
        print(f"     └─ Automation Hooks   : {stats['ip']['hooks']}")

        # Section 3: Cognition
        print("\n  🧠 COGNITION & LEARNING:")
        print(f"     ├─ Global History     : {stats['cognition']['memories']} records")
        print(f"     ├─ Learned Patterns   : {stats['cognition']['patterns']}")
        print(f"     └─ System Proficiency : {stats['cognition']['success_rate']:.1%}")

        # Section 4: Configuration
        print(f"\n  🎚️ MODE: {level.name} (Level {level.level})")
        print(f"     └─ {level.description}")

        # Footer: Power Score
        print("\n" + "─" * 65)
        bar_w = 30
        filled = int(bar_w * power_score / 100)
        bar = "█" * filled + "░" * (bar_w - filled)

        print(f"  🏆 AGENTIC POWER SCORE: [{bar}] {power_score}%")

        verdict = (
            "🎊 SUPREME ORCHESTRATION"
            if power_score >= 90
            else "✅ ROBUST INTEGRATION"
            if power_score >= 75
            else "⚠️ EVOLVING SYSTEM"
        )
        print(f"     └─ Verdict: {verdict}")
        print("═" * 65 + "\n")


# Global Interface
def show_agentic_status():
    """Quick console display of the dashboard."""
    dashboard = AgenticDashboard()
    dashboard.print_full_dashboard()
