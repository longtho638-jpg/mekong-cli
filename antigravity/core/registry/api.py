"""
Registry API - Command resolution and lookup functions (Facade).
"""
from .mcp_catalog import mcp_catalog
from .metadata import list_subcommands, list_suites
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

    # Show MCP Tools if any
    if mcp_catalog.tools:
        print("\n  [🔌] MCP TOOLS - Dynamically loaded from servers")
        for server, tools in mcp_catalog.tools.items():
            print(f"     - Server: {server}")
            for tool in tools[:5]: # Show first 5
                print(f"       * {tool['name']}")
            if len(tools) > 5:
                print(f"       * ... and {len(tools)-5} more")

    print("\n" + "-" * 60)
    print("  Try using shortcuts: " + ", ".join(list(SHORTCUTS.keys())[:8]) + "...")
    print("=" * 60 + "\n")


def get_agent_for_command(command: str) -> str:
    """Get the ideal AI agent for a command.
    
    Args:
        command: Command name (e.g., 'cook', 'revenue quote')
        
    Returns:
        Agent tag (e.g., 'money_maker', 'system')
    """
    suite, sub, meta = resolve_command(command)
    if meta and "agent" in meta:
        return meta["agent"]
    return "system"


def resolve_command(command: str):
    """Resolve a command to (suite, subcommand, metadata).
    
    Args:
        command: Command name or shortcut
        
    Returns:
        Tuple of (suite_id, subcommand, metadata) or (None, None, None)
    """
    # Check shortcuts first
    if command in SHORTCUTS:
        command = SHORTCUTS[command]
    
    # Parse suite:subcommand or suite.subcommand or just subcommand
    if ":" in command:
        parts = command.split(":", 1)
        suite_id = parts[0]
        sub = parts[1]
    elif "." in command:
        parts = command.split(".")
        suite_id = parts[0]
        sub = ".".join(parts[1:])
    else:
        # Search all suites
        for suite_id, suite_data in COMMAND_REGISTRY.items():
            if command in suite_data.get("subcommands", {}):
                return suite_id, command, suite_data["subcommands"][command]
        return None, None, None
    
    if suite_id in COMMAND_REGISTRY and sub in COMMAND_REGISTRY[suite_id].get("subcommands", {}):
        return suite_id, sub, COMMAND_REGISTRY[suite_id]["subcommands"][sub]
    
    return None, None, None


def get_command_metadata(suite_id: str = None, subcommand: str = None):
    """Get metadata for a command.
    
    Args:
        suite_id: Suite identifier (e.g., 'revenue')
        subcommand: Subcommand name (e.g., 'quote')
        
    Returns:
        Metadata dict or None
    """
    if suite_id and subcommand:
        if suite_id in COMMAND_REGISTRY:
            suite = COMMAND_REGISTRY[suite_id]
            if subcommand in suite.get("subcommands", {}):
                return suite["subcommands"][subcommand]
    return None
