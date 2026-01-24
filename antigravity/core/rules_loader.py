"""
📜 Rules Loader - Auto-Apply Rules to Agents
============================================

Loads and applies rules from .claude/rules to appropriate agents.
Ensures compliance with AgencyOS governance and coding standards.
"""

import logging
from pathlib import Path
from typing import Dict, List

from .knowledge.rules import rule_registry

logger = logging.getLogger(__name__)

# Base path for rules
RULES_BASE_DIR = Path(".claude/rules")

# Proxy to dynamic registry for backward compatibility with tests
class RuleMappingProxy(dict):
    """Proxy dictionary that reflects the current state of the rule registry."""
    def __getitem__(self, key):
        if key in rule_registry.rules:
            return rule_registry.rules[key].get("agents", ["*"])
        return super().__getitem__(key)

    def items(self):
        return [(name, meta.get("agents", ["*"])) for name, meta in rule_registry.rules.items()]

    def __len__(self):
        return len(rule_registry.rules)

# Global constant expected by some modules/tests
RULE_MAPPING = RuleMappingProxy()

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
                logger.error(f"⚠️ Failed to read rule {rule}: {e}")

    return loaded

def get_total_rules() -> int:
    """Returns the total number of rules in the registry."""
    return len(rule_registry.rules)

def get_total_assignments() -> int:
    """Returns the total number of rule-to-agent assignments."""
    total = 0
    for meta in rule_registry.rules.values():
        total += len(meta.get("agents", ["*"]))
    return total

def print_rules_matrix():
    """Print rule → agent matrix using dynamic registry."""
    print("\n📜 DYNAMIC RULES MATRIX")
    print("═" * 60)
    print(f"   Total Rules: {get_total_rules()}")
    print()

    for name, meta in rule_registry.rules.items():
        agents = meta.get("agents", ["*"])
        agents_str = ", ".join(agents[:3])
        if len(agents) > 3:
            agents_str += f" +{len(agents) - 3} more"
        print(f"   {name}")
        print(f"      └── {agents_str}")
    print()
