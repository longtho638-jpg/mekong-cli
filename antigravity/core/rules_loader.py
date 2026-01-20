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

from pathlib import Path
from typing import Dict, List, Set
from .knowledge.rule_registry import rule_registry

# Base path for rules
RULES_BASE_DIR = Path(".claude/rules")

def get_rules_for_agent(agent: str) -> List[str]:
    """
    Get all rule filenames for an agent using the RuleRegistry.
    """
    return rule_registry.get_rules_for_agent(agent)

def load_rules_for_agent(agent: str, base_path: Path = RULES_BASE_DIR) -> Dict[str, str]:
    """
    Load rule content for an agent.
    """
    rule_names = get_rules_for_agent(agent)
    loaded = {}

    if isinstance(base_path, str):
        base_path = Path(base_path)

    for rule in rule_names:
        rule_path = base_path / rule
        if rule_path.exists():
            try:
                loaded[rule] = rule_path.read_text(encoding="utf-8")
            except Exception as e:
                print(f"⚠️ Failed to read rule {rule}: {e}")

    return loaded

def print_rules_matrix():
    """Print rule → agent matrix using dynamic registry."""
    print("\n📜 DYNAMIC RULES MATRIX")
    print("═" * 60)
    print(f"   Total Rules: {len(rule_registry.rules)}")
    print()

    for name, meta in rule_registry.rules.items():
        agents = meta.get("agents", ["*"])
        agents_str = ", ".join(agents[:3])
        if len(agents) > 3:
            agents_str += f" +{len(agents) - 3} more"
        print(f"   {name}")
        print(f"      └── {agents_str}")
    print()
