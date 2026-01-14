"""
🎯 Skill Loader - Auto-Load Skills for Agents
=============================================

Maps skills to agents and auto-loads them when needed.
Manages the distribution of 40+ specialized skills across the agent workforce.

Usage:
    from antigravity.core.skill_loader import load_skills_for_agent
    
    # Get skills as text
    skills_dict = load_skills_for_agent("fullstack-developer")
    
    # Print matrix
    print_skill_matrix()
"""

from typing import Dict, List, Set, Optional
from pathlib import Path

# Base path for skills
SKILLS_BASE_DIR = Path(".claude/skills")

# Skill → Agent Mapping
# Defines which agents possess which skills
SKILL_MAPPING: Dict[str, List[str]] = {
    # 🛠️ Development Skills
    "frontend-development": ["fullstack-developer", "ui-ux-designer"],
    "backend-development":  ["fullstack-developer", "database-admin"],
    "databases":            ["database-admin", "fullstack-developer"],
    "debugging":            ["debugger", "fullstack-developer"],
    "code-review":          ["code-reviewer"],
    "vibe-development":     ["fullstack-developer"],
    "vibe-testing":         ["tester"],
    "devops":               ["fullstack-developer", "git-manager"],
    "web-frameworks":       ["fullstack-developer"],
    "mobile-development":   ["fullstack-developer"],
    "threejs":              ["ui-ux-designer", "fullstack-developer"],
    "mcp-builder":          ["mcp-manager"],
    "mcp-management":       ["mcp-manager"],
    
    # 🎨 Design Skills
    "ui-ux-pro-max":   ["ui-ux-designer"],
    "ui-styling":      ["ui-ux-designer"],
    "frontend-design": ["ui-ux-designer"],
    
    # 🧠 Planning & Research Skills
    "planning":            ["planner", "project-manager"],
    "brainstorming":       ["brainstormer"],
    "research":            ["researcher", "scout-external"],
    "sequential-thinking": ["planner", "researcher"],
    "problem-solving":     ["debugger", "planner"],
    "context-engineering": ["planner", "researcher"],
    
    # 📄 Content Skills
    "document-skills":       ["docs-manager", "copywriter"],
    "docs-seeker":           ["docs-manager", "researcher"],
    "markdown-novel-viewer": ["docs-manager"],
    
    # 🤖 AI Skills
    "ai-artist":           ["ui-ux-designer", "content-factory"],
    "ai-multimodal":       ["researcher", "content-factory"],
    "google-adk-python":   ["fullstack-developer"],
    
    # 🎥 Media Skills
    "media-processing": ["content-factory"],
    "mermaidjs-v11":    ["docs-manager", "planner"],
    
    # 💰 Business Skills
    "binh-phap-wisdom":    ["binh-phap-strategist", "deal-closer", "money-maker"],
    "vietnamese-agency":   ["client-magnet", "deal-closer"],
    "payment-integration": ["money-maker", "fullstack-developer"],
    "shopify":             ["fullstack-developer"],
    
    # 🔐 Auth Skills
    "better-auth":     ["fullstack-developer"],
    "chrome-devtools": ["debugger", "tester"],
    
    # 📂 Project Skills
    "plans-kanban":  ["project-manager", "planner"],
    "skill-creator": ["planner"],
    "repomix":       ["researcher", "scout"],
}


# Reverse mapping: Agent → Skills (Computed once)
AGENT_SKILLS: Dict[str, Set[str]] = {}

def _build_reverse_mapping():
    """Build the AGENT_SKILLS cache."""
    for skill, agents in SKILL_MAPPING.items():
        for agent in agents:
            if agent not in AGENT_SKILLS:
                AGENT_SKILLS[agent] = set()
            AGENT_SKILLS[agent].add(skill)

# Initialize mapping on import
_build_reverse_mapping()


def get_skills_for_agent(agent: str) -> List[str]:
    """Get all skills for an agent."""
    return sorted(list(AGENT_SKILLS.get(agent, set())))


def get_agents_for_skill(skill: str) -> List[str]:
    """Get all agents that have a skill."""
    return SKILL_MAPPING.get(skill, [])


def load_skills_for_agent(agent: str, base_path: Path = SKILLS_BASE_DIR) -> Dict[str, str]:
    """
    Load skill content for an agent.
    Checks SKILL.md first, then README.md.
    
    Args:
        agent: Agent ID
        base_path: Directory containing skill folders
        
    Returns:
        Dict[skill_name, skill_content]
    """
    skills = get_skills_for_agent(agent)
    loaded = {}
    
    if isinstance(base_path, str):
        base_path = Path(base_path)
    
    for skill in skills:
        skill_dir = base_path / skill
        
        # Priority 1: SKILL.md
        skill_file = skill_dir / "SKILL.md"
        # Priority 2: README.md
        readme_file = skill_dir / "README.md"
        
        try:
            if skill_file.exists():
                loaded[skill] = skill_file.read_text(encoding="utf-8")
            elif readme_file.exists():
                loaded[skill] = readme_file.read_text(encoding="utf-8")
            else:
                # Skill folder exists but no md file?
                pass
        except Exception as e:
            print(f"⚠️ Failed to read skill {skill}: {e}")
            
    return loaded


def get_total_skills() -> int:
    """Get total number of configured skills."""
    return len(SKILL_MAPPING)


def get_total_mappings() -> int:
    """Get total agent-skill mappings."""
    return sum(len(agents) for agents in SKILL_MAPPING.values())


def print_skill_matrix():
    """Print skill → agent matrix."""
    print("\n🎯 SKILL MATRIX")
    print("═" * 60)
    print(f"   Total Skills: {get_total_skills()}")
    print(f"   Total Mappings: {get_total_mappings()}")
    print()
    
    # Show agents with most skills
    top_agents = sorted(AGENT_SKILLS.items(), key=lambda x: len(x[1]), reverse=True)[:10]
    print("📊 TOP AGENTS BY SKILLS:")
    for agent, skills in top_agents:
        print(f"   {agent:<25}: {len(skills)} skills")
    print()


def print_agent_skills(agent: str):
    """Print skills for a specific agent."""
    skills = get_skills_for_agent(agent)
    print(f"\n🎯 SKILLS FOR: {agent}")
    print("─" * 40)
    if skills:
        for skill in skills:
            print(f"   • {skill}")
    else:
        print("   No skills assigned")
    print()