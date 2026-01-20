"""
Registry API - Command resolution and lookup functions (Facade).
"""
from .discovery import resolve_command
from .metadata import get_agent_for_command, get_command_metadata, list_subcommands, list_suites
from .store import COMMAND_REGISTRY, SHORTCUTS


def print_command_map():
    """Visualizes the command hierarchy for the user."""
    print("\n" + "=" * 60)
    print("|" + "AGENCY OS - COMMAND REGISTRY".center(58) + "|")
    print("=" * 60)

    for suite_id in list_suites():
        s = COMMAND_REGISTRY[suite_id]
        print(f"\n  [{s['emoji']}] {suite_id.upper()} - {s['description']}")
        for sub in list_subcommands(suite_id):
            meta = s["subcommands"][sub]
            agent_tag = f"[{meta.get('agent', 'system')}]"
            print(f"     - {sub:<15} {agent_tag}")

    print("\n" + "-" * 60)
    print("  Try using shortcuts: " + ", ".join(list(SHORTCUTS.keys())[:8]) + "...")
    print("=" * 60 + "\n")
