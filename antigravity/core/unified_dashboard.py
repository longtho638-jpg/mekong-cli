"""
🏯 Unified Agentic Dashboard - Complete System Overview

Combines all agentic subsystems into one unified view:
- Agents, Chains, Crews
- Skills, Rules, Hooks
- Memory, Autonomous Mode
- Coding Level

Usage:
    from antigravity.core.unified_dashboard import AgenticDashboard
    dashboard = AgenticDashboard()
    dashboard.print_full()
"""

from typing import Dict, Any

from .agent_chains import AGENT_INVENTORY, AGENT_CHAINS
from .agent_crews import CREWS
from .skill_loader import get_total_skills, get_total_mappings, AGENT_SKILLS
from .rules_loader import get_total_rules, get_total_assignments
from .hooks_manager import HOOKS
from .agent_memory import get_memory
from .coding_level import get_level, LEVELS


class AgenticDashboard:
    """
    🏯 Unified Agentic Dashboard
    
    Complete visibility into the AI workforce.
    """
    
    def get_stats(self) -> Dict[str, Any]:
        """Get complete agentic statistics."""
        memory = get_memory()
        memory_stats = memory.get_stats()
        
        return {
            # Core
            "agents": len(AGENT_INVENTORY),
            "chains": len(AGENT_CHAINS),
            "crews": len(CREWS),
            
            # Skills & Rules
            "skills": get_total_skills(),
            "skill_mappings": get_total_mappings(),
            "rules": get_total_rules(),
            "rule_assignments": get_total_assignments(),
            
            # Hooks
            "hooks": sum(len(h) for h in HOOKS.values()),
            "hook_triggers": len(HOOKS),
            
            # Memory
            "memories": memory_stats["total_memories"],
            "patterns_learned": memory_stats["total_patterns"],
            "success_rate": memory_stats["overall_success_rate"],
            
            # Level
            "coding_level": get_level().level,
            "coding_level_name": get_level().name,
        }
    
    def print_summary(self):
        """Print compact summary."""
        stats = self.get_stats()
        
        print("\n🏯 AGENTIC SUMMARY")
        print("═" * 50)
        print(f"   Agents: {stats['agents']} | Chains: {stats['chains']} | Crews: {stats['crews']}")
        print(f"   Skills: {stats['skills']} ({stats['skill_mappings']} mappings)")
        print(f"   Rules: {stats['rules']} | Hooks: {stats['hooks']}")
        print(f"   Level: {stats['coding_level']} ({stats['coding_level_name']})")
        print("═" * 50)
    
    def print_full(self):
        """Print full dashboard."""
        stats = self.get_stats()
        
        print("\n" + "═" * 60)
        print("║" + "🏯 AGENCYOS AGENTIC DASHBOARD".center(58) + "║")
        print("═" * 60)
        
        # Core Stats
        print("\n📊 CORE COMPONENTS")
        print("─" * 40)
        print(f"   🤖 Agents:     {stats['agents']}")
        print(f"   🔗 Chains:     {stats['chains']}")
        print(f"   👥 Crews:      {stats['crews']}")
        
        # Skills & Rules
        print("\n🎯 SKILLS & RULES")
        print("─" * 40)
        print(f"   🎯 Skills:     {stats['skills']} ({stats['skill_mappings']} mappings)")
        print(f"   📜 Rules:      {stats['rules']} ({stats['rule_assignments']} assignments)")
        print(f"   🪝 Hooks:      {stats['hooks']} ({stats['hook_triggers']} triggers)")
        
        # Memory
        print("\n🧠 MEMORY & LEARNING")
        print("─" * 40)
        print(f"   📝 Memories:   {stats['memories']}")
        print(f"   🎓 Patterns:   {stats['patterns_learned']}")
        print(f"   ✅ Success:    {stats['success_rate']:.0%}")
        
        # Level
        print("\n🎚️ CODING LEVEL")
        print("─" * 40)
        level = get_level()
        print(f"   Level {level.level}: {level.name}")
        print(f"   {level.description}")
        
        # Integration Score
        total_score = self._calculate_integration_score(stats)
        print("\n" + "═" * 60)
        print(f"║ 🏆 INTEGRATION SCORE: {total_score}%".ljust(59) + "║")
        print("═" * 60)
        
        if total_score >= 95:
            print("   🎊 MAXIMUM AGENTIC POWER ACHIEVED!")
        elif total_score >= 80:
            print("   ✅ Excellent integration")
        elif total_score >= 60:
            print("   ⚠️ Good, room for improvement")
        else:
            print("   ❌ Integration incomplete")
        
        print()
    
    def _calculate_integration_score(self, stats: Dict) -> int:
        """Calculate overall integration percentage."""
        max_agents = 26
        max_chains = 34
        max_crews = 6
        max_skills = 41
        max_rules = 6
        max_hooks = 6
        
        score = 0
        score += min(100, (stats['agents'] / max_agents) * 100) * 0.2
        score += min(100, (stats['chains'] / max_chains) * 100) * 0.15
        score += min(100, (stats['crews'] / max_crews) * 100) * 0.15
        score += min(100, (stats['skills'] / max_skills) * 100) * 0.2
        score += min(100, (stats['rules'] / max_rules) * 100) * 0.15
        score += min(100, (stats['hooks'] / max_hooks) * 100) * 0.15
        
        return int(score)
    
    def print_crews_quick(self):
        """Print quick crew summary."""
        print("\n👥 CREWS")
        for name, crew in CREWS.items():
            print(f"   {name}: {len(crew.workers)} workers")
    
    def print_top_agents(self, limit: int = 5):
        """Print top agents by skills."""
        print("\n🏆 TOP AGENTS BY SKILLS")
        top = sorted(AGENT_SKILLS.items(), key=lambda x: len(x[1]), reverse=True)[:limit]
        for agent, skills in top:
            print(f"   {agent}: {len(skills)} skills")


def show_dashboard():
    """Quick function to show dashboard."""
    dashboard = AgenticDashboard()
    dashboard.print_full()


def get_integration_score() -> int:
    """Get current integration score."""
    dashboard = AgenticDashboard()
    return dashboard._calculate_integration_score(dashboard.get_stats())
