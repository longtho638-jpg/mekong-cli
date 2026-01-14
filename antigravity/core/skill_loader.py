"""
🎯 Skill Loader - Auto-Load Skills for Agents

Maps 41 skills to agents and auto-loads them when needed.

Usage:
    from antigravity.core.skill_loader import load_skills_for_agent, SKILL_MAPPING
    skills = load_skills_for_agent("fullstack-developer")
"""

from typing import Dict, List, Optional
from pathlib import Path


# Skill → Agent Mapping (41 skills)
SKILL_MAPPING: Dict[str, List[str]] = {
    # Development Skills
    "frontend-development": ["fullstack-developer", "ui-ux-designer"],
    "backend-development": ["fullstack-developer", "database-admin"],
    "databases": ["database-admin", "fullstack-developer"],
    "debugging": ["debugger", "fullstack-developer"],
    "code-review": ["code-reviewer"],
    "vibe-development": ["fullstack-developer"],
    "vibe-testing": ["tester"],
    "devops": ["fullstack-developer", "git-manager"],
    "web-frameworks": ["fullstack-developer"],
    "mobile-development": ["fullstack-developer"],
    "threejs": ["ui-ux-designer", "fullstack-developer"],
    "mcp-builder": ["mcp-manager"],
    "mcp-management": ["mcp-manager"],
    
    # Design Skills
    "ui-ux-pro-max": ["ui-ux-designer"],
    "ui-styling": ["ui-ux-designer"],
    "frontend-design": ["ui-ux-designer"],
    
    # Planning & Research Skills
    "planning": ["planner", "project-manager"],
    "brainstorming": ["brainstormer"],
    "research": ["researcher", "scout-external"],
    "sequential-thinking": ["planner", "researcher"],
    "problem-solving": ["debugger", "planner"],
    "context-engineering": ["planner", "researcher"],
    
    # Content Skills
    "document-skills": ["docs-manager", "copywriter"],
    "docs-seeker": ["docs-manager", "researcher"],
    "markdown-novel-viewer": ["docs-manager"],
    
    # AI Skills
    "ai-artist": ["ui-ux-designer", "content-factory"],
    "ai-multimodal": ["researcher", "content-factory"],
    "google-adk-python": ["fullstack-developer"],
    
    # Media Skills
    "media-processing": ["content-factory"],
    "mermaidjs-v11": ["docs-manager", "planner"],
    
    # Business Skills
    "binh-phap-wisdom": ["binh-phap-strategist", "deal-closer", "money-maker"],
    "vietnamese-agency": ["client-magnet", "deal-closer"],
    "payment-integration": ["money-maker", "fullstack-developer"],
    "shopify": ["fullstack-developer"],
    
    # Auth Skills
    "better-auth": ["fullstack-developer"],
    "chrome-devtools": ["debugger", "tester"],
    
    # Project Skills
    "plans-kanban": ["project-manager", "planner"],
    "skill-creator": ["planner"],
    "repomix": ["researcher", "scout"],
}


# Reverse mapping: Agent → Skills
AGENT_SKILLS: Dict[str, List[str]] = {}
for skill, agents in SKILL_MAPPING.items():
    for agent in agents:
        if agent not in AGENT_SKILLS:
            AGENT_SKILLS[agent] = []
        AGENT_SKILLS[agent].append(skill)


def get_skills_for_agent(agent: str) -> List[str]:
    """Get all skills for an agent."""
    return AGENT_SKILLS.get(agent, [])


def get_agents_for_skill(skill: str) -> List[str]:
    """Get all agents that have a skill."""
    return SKILL_MAPPING.get(skill, [])


def load_skills_for_agent(agent: str, base_path: str = ".claude/skills") -> Dict[str, str]:
    """
    Load skill definitions for an agent.
    
    Returns dict of skill_name -> skill_content
    """
    skills = get_skills_for_agent(agent)
    loaded = {}
    
    for skill in skills:
        skill_path = Path(base_path) / skill / "SKILL.md"
        if skill_path.exists():
            loaded[skill] = skill_path.read_text()
        else:
            # Try README.md
            readme_path = Path(base_path) / skill / "README.md"
            if readme_path.exists():
                loaded[skill] = readme_path.read_text()
    
    return loaded


def get_total_skills() -> int:
    """Get total number of skills."""
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
        print(f"   {agent}: {len(skills)} skills")
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
