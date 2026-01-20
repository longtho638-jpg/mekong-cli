#!/usr/bin/env python3
"""
Verification script for Antigravity Phase 2: Knowledge Layer Automation.
"""
import sys
from pathlib import Path

# Add project root to sys.path
project_root = Path(__file__).parent.parent.absolute()
sys.path.insert(0, str(project_root))

from antigravity.core.knowledge.manifest_generator import generate_manifest
from antigravity.core.knowledge.rules import rule_registry


def test_rule_registry():
    print("🔍 Testing Rule Registry...")
    rule_registry.refresh()

    rules_count = len(rule_registry.rules)
    print(f"✅ Found {rules_count} rules.")

    if rules_count == 0:
        print("❌ No rules found in .claude/rules/")
        return False

    # Test retrieval by agent
    agent = "fullstack-developer"
    agent_rules = rule_registry.get_rules_for_agent(agent)
    print(f"✅ Rules for agent '{agent}': {agent_rules}")

    # Test retrieval by tag
    tag = "win-win-win"
    tag_rules = rule_registry.get_relevant_rules([tag])
    print(f"✅ Rules for tag '{tag}': {tag_rules}")

    # Check priority parsing
    strategy_rule = "binh-phap-strategy.md"
    if strategy_rule in rule_registry.rules:
        priority = rule_registry.rules[strategy_rule].get('priority')
        print(f"✅ Priority for '{strategy_rule}': {priority}")
        if priority != "P0":
            print(f"⚠️ Expected P0 for strategy rule, got {priority}")

    return True

def test_manifest_generation():
    print("\n🔮 Testing Manifest Generation...")
    generate_manifest()

    manifest_path = Path(".claude/docs/QUANTUM_MANIFEST.md")
    if manifest_path.exists():
        content = manifest_path.read_text(encoding="utf-8")
        print(f"✅ Manifest generated at {manifest_path}")

        # Verify content contains some expected strings
        expected_strings = [
            "QUANTUM MANIFEST",
            "CONSTITUTION",
            "AGENT ARMY",
            "binh-phap-strategy.md",
            "P0"
        ]

        for s in expected_strings:
            if s not in content:
                print(f"❌ Missing expected string in manifest: {s}")
                return False
        print("✅ Manifest content verified.")
        return True
    else:
        print("❌ Manifest not found at .claude/docs/QUANTUM_MANIFEST.md")
        return False

def main():
    print("🚀 Starting Phase 2 Verification\n" + "="*40)

    success = True
    if not test_rule_registry():
        success = False

    if not test_manifest_generation():
        success = False

    if success:
        print("\n✨ Phase 2 Verification SUCCESSFUL!")
        sys.exit(0)
    else:
        print("\n❌ Phase 2 Verification FAILED!")
        sys.exit(1)

if __name__ == "__main__":
    main()
