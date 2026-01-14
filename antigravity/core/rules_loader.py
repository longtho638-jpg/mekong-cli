"""
📜 Rules Loader - Auto-Apply Rules to Agents

Loads and applies rules from .claude/rules to appropriate agents.

Usage:
    from antigravity.core.rules_loader import load_rules_for_agent, RULE_MAPPING
    rules = load_rules_for_agent("fullstack-developer")
"""

from typing import Dict, List, Optional
from pathlib import Path


# Rule → Agent Mapping
RULE_MAPPING: Dict[str, List[str]] = {
    "binh-phap-strategy.md": [
        "binh-phap-strategist", 
        "deal-closer", 
        "money-maker",
        "growth-strategist",
    ],
    "development-rules.md": [
        "fullstack-developer",
        "tester",
        "debugger",
        "code-reviewer",
        "database-admin",
    ],
    "documentation-management.md": [
        "docs-manager",
        "journal-writer",
    ],
    "orchestration-protocol.md": [
        "project-manager",
        "planner",
    ],
    "primary-workflow.md": [
        # Applied to ALL agents
        "*",
    ],
    "vibe-development-rules.md": [
        "fullstack-developer",
        "ui-ux-designer",
        "tester",
    ],
}


# Reverse mapping: Agent → Rules
AGENT_RULES: Dict[str, List[str]] = {}
for rule, agents in RULE_MAPPING.items():
    for agent in agents:
        if agent not in AGENT_RULES:
            AGENT_RULES[agent] = []
        AGENT_RULES[agent].append(rule)


def get_rules_for_agent(agent: str) -> List[str]:
    """Get all rules for an agent."""
    rules = AGENT_RULES.get(agent, [])
    # Add rules that apply to all agents
    rules.extend(AGENT_RULES.get("*", []))
    return list(set(rules))


def load_rules_for_agent(agent: str, base_path: str = ".claude/rules") -> Dict[str, str]:
    """
    Load rule content for an agent.
    
    Returns dict of rule_name -> rule_content
    """
    rule_names = get_rules_for_agent(agent)
    loaded = {}
    
    for rule in rule_names:
        rule_path = Path(base_path) / rule
        if rule_path.exists():
            loaded[rule] = rule_path.read_text()
    
    return loaded


def get_rule_summary(rule_name: str, base_path: str = ".claude/rules") -> str:
    """Get first 3 lines of a rule as summary."""
    rule_path = Path(base_path) / rule_name
    if rule_path.exists():
        lines = rule_path.read_text().split('\n')[:3]
        return '\n'.join(lines)
    return "Rule not found"


def get_total_rules() -> int:
    """Get total number of rules."""
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
        agents_str = ', '.join(agents[:3])
        if len(agents) > 3:
            agents_str += f' +{len(agents)-3} more'
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
            print(f"   • {rule}")
    else:
        print("   No rules assigned")
    print()
