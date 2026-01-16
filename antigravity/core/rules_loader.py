"""
📜 Rules Loader - Auto-Apply Rules to Agents
============================================

Loads and applies rules from .claude/rules to appropriate agents.
Ensures compliance with AgencyOS governance and coding standards.

Usage:
    from antigravity.core.rules_loader import load_rules_for_agent
    
    # Get rules as text
    rules_dict = load_rules_for_agent("fullstack-developer")
    
    # Print matrix
    print_rules_matrix()
"""

from typing import Dict, List, Set
from pathlib import Path

# Base path for rules
RULES_BASE_DIR = Path(".claude/rules")

# Rule → Agent Mapping
# Defines which rules apply to which agents
RULE_MAPPING: Dict[str, List[str]] = {
    "binh-phap-strategy.md": [
        "binh-phap-strategist",
        "deal-closer",
        "money-maker",
        "growth-strategist",
        "client-magnet",
        "revenue-engine"
    ],
    "development-rules.md": [
        "fullstack-developer",
        "tester",
        "debugger",
        "code-reviewer",
        "database-admin",
        "mcp-manager",
        "git-manager"
    ],
    "documentation-management.md": [
        "docs-manager",
        "journal-writer",
        "content-factory"
    ],
    "orchestration-protocol.md": [
        "project-manager",
        "planner",
        "scout",
        "brainstormer"
    ],
    "primary-workflow.md": [
        # Applied to ALL agents
        "*",
    ],
    "vibe-development-rules.md": [
        "fullstack-developer",
        "ui-ux-designer",
        "tester",
        "frontend-developer" # Future agent
    ],
}

# Reverse mapping: Agent → Rules (Computed once)
AGENT_RULES: Dict[str, Set[str]] = {}

def _build_reverse_mapping():
    """Build the AGENT_RULES cache."""
    for rule, agents in RULE_MAPPING.items():
        for agent in agents:
            if agent not in AGENT_RULES:
                AGENT_RULES[agent] = set()
            AGENT_RULES[agent].add(rule)

# Initialize mapping on import
_build_reverse_mapping()


def get_rules_for_agent(agent: str) -> List[str]:
    """
    Get all rule filenames for an agent.
    Includes global rules (assigned to "*").
    """
    rules = AGENT_RULES.get(agent, set()).copy()
    # Add global rules
    rules.update(AGENT_RULES.get("*", set()))
    return sorted(list(rules))


def load_rules_for_agent(agent: str, base_path: Path = RULES_BASE_DIR) -> Dict[str, str]:
    """
    Load rule content for an agent.
    
    Args:
        agent: Agent ID (e.g. 'fullstack-developer')
        base_path: Directory containing rule files
        
    Returns:
        Dict[rule_filename, rule_content]
    """
    rule_names = get_rules_for_agent(agent)
    loaded = {}

    # Ensure base_path is a Path object
    if isinstance(base_path, str):
        base_path = Path(base_path)

    for rule in rule_names:
        rule_path = base_path / rule
        if rule_path.exists():
            try:
                loaded[rule] = rule_path.read_text(encoding="utf-8")
            except Exception as e:
                print(f"⚠️ Failed to read rule {rule}: {e}")
        else:
            # Silent fail or log warning if strict mode?
            pass

    return loaded


def get_rule_summary(rule_name: str, base_path: Path = RULES_BASE_DIR) -> str:
    """Get first 3 lines of a rule as summary."""
    if isinstance(base_path, str):
        base_path = Path(base_path)

    rule_path = base_path / rule_name
    if rule_path.exists():
        try:
            lines = rule_path.read_text(encoding="utf-8").split('\n')[:3]
            return '\n'.join(lines)
        except Exception:
            return "Error reading rule"
    return "Rule not found"


def get_total_rules() -> int:
    """Get total number of configured rules."""
    return len(RULE_MAPPING)


def get_total_assignments() -> int:
    """Get total agent-rule assignments."""
    return sum(len(agents) for agents in RULE_MAPPING.values())


def print_rules_matrix():
    """Print rule → agent matrix."""
    print("\n📜 RULES MATRIX")
    print("═" * 60)
    print(f"   Total Rules: {get_total_rules()}")
    print(f"   Total Assignments: {get_total_assignments()}")
    print()

    print("📋 RULES BY FILE:")
    for rule, agents in RULE_MAPPING.items():
        # Handle wildcard
        if "*" in agents:
             agents_display = ["ALL AGENTS"]
        else:
            agents_display = agents

        agents_str = ", ".join(agents_display[:3])
        if len(agents_display) > 3:
            agents_str += f' +{len(agents_display)-3} more'
        print(f"   {rule}")
        print(f"      └── {agents_str}")
    print()


def print_agent_rules(agent: str):
    """Print rules for a specific agent."""
    rules = get_rules_for_agent(agent)
    print(f"\n📜 RULES FOR: {agent}")
    print("─" * 40)
    if rules:
        for rule in rules:
            summary = get_rule_summary(rule).split('\n')[0].strip('# ').strip()
            print(f"   • {rule:<30} | {summary}")
    else:
        print("   No rules assigned")
    print()
