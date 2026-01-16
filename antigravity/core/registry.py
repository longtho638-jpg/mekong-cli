"""
🏯 Command Registry - Suite & Agent Mapping
===========================================

The central routing table for Agency OS. It maps CLI commands to their 
backing Python modules, classes, and the ideal AI agents for execution.

Key Hierarchies:
- Suites: Logical groupings of business functions (Revenue, Dev, Strategy).
- Subcommands: Specific tasks within a suite.
- Shortcuts: One-word aliases for common operations.

Binh Pháp: 💂 Pháp (Process) - Maintaining the chain of command.
"""

import logging
from typing import Dict, List, Any, Optional, Tuple

# Configure logging
logger = logging.getLogger(__name__)

# ============================================================
# COMMAND REGISTRY DEFINITION
# ============================================================

COMMAND_REGISTRY: Dict[str, Dict[str, Any]] = {
    # 💰 Revenue Suite: Money and Deals
    "revenue": {
        "suite": "revenue",
        "emoji": "💰",
        "description": "Financial operations and client deals.",
        "subcommands": {
            "quote": {
                "module": "antigravity.core.money_maker",
                "class": "MoneyMaker",
                "method": "generate_quote",
                "agent": "money-maker"
            },
            "invoice": {
                "module": "antigravity.core.revenue_engine",
                "class": "RevenueEngine",
                "method": "create_invoice",
                "agent": "revenue-engine"
            },
            "proposal": {
                "module": "antigravity.core.proposal_generator",
                "class": "ProposalGenerator",
                "method": "generate_proposal",
                "agent": "copywriter"
            },
            "stats": {
                "module": "antigravity.core.cashflow_engine",
                "class": "CashflowEngine",
                "method": "get_stats",
                "agent": "revenue-engine"
            },
        },
    },

    # 🛠️ Dev Suite: Building and Shipping
    "dev": {
        "suite": "dev",
        "emoji": "🛠️",
        "description": "Software development lifecycle.",
        "subcommands": {
            "cook": {
                "module": "antigravity.core.vibe_workflow",
                "class": "VIBEWorkflow",
                "agent": "fullstack-developer",
            },
            "test": {
                "module": "antigravity.core.vibe_workflow",
                "class": "VIBEWorkflow",
                "agent": "tester",
            },
            "ship": {
                "module": "antigravity.core.vibe_workflow",
                "class": "VIBEWorkflow",
                "agent": "git-manager",
            },
            "debug": {"agent": "debugger"},
            "fix": {"agent": "debugger"},
        },
    },

    # 🏯 Strategy Suite: Strategic Binh Pháp Planning
    "strategy": {
        "suite": "strategy",
        "emoji": "🏯",
        "description": "Binh Pháp strategic analysis.",
        "subcommands": {
            "analyze": {
                "module": "core.binh_phap",
                "agent": "binh-phap-strategist",
            },
            "plan": {"agent": "planner"},
            "win3": {
                "module": "antigravity.core.money_maker",
                "class": "MoneyMaker",
                "method": "validate_win3",
                "agent": "deal-closer"
            },
        },
    },

    # 🧲 CRM Suite: Leads and Pipeline
    "crm": {
        "suite": "crm",
        "emoji": "🧲",
        "description": "Customer relationship management.",
        "subcommands": {
            "pipeline": {
                "module": "antigravity.core.client_magnet",
                "class": "ClientMagnet",
                "method": "get_pipeline_summary"
            },
            "add": {
                "module": "antigravity.core.client_magnet",
                "class": "ClientMagnet",
                "method": "add_lead",
                "agent": "client-magnet"
            },
            "stats": {
                "module": "antigravity.core.client_magnet",
                "class": "ClientMagnet",
                "method": "get_stats"
            }
        },
    },

    # 🎨 Content Suite: Media and Viral Hooks
    "content": {
        "suite": "content",
        "emoji": "🎨",
        "description": "Scalable media production.",
        "subcommands": {
            "ideas": {
                "module": "antigravity.core.content_factory",
                "class": "ContentFactory",
                "method": "generate_ideas",
                "agent": "brainstormer"
            },
            "draft": {
                "module": "antigravity.core.content_factory",
                "class": "ContentFactory",
                "method": "create_post",
                "agent": "copywriter"
            },
            "calendar": {
                "module": "antigravity.core.content_factory",
                "class": "ContentFactory",
                "method": "get_calendar",
                "agent": "content-factory"
            }
        },
    },
}


# ============================================================
# SHORTCUTS & ALIASES
# ============================================================

SHORTCUTS: Dict[str, str] = {
    # Dev
    "cook": "dev:cook",
    "test": "dev:test",
    "ship": "dev:ship",
    "fix": "dev:fix",

    # Business
    "quote": "revenue:quote",
    "cash": "revenue:stats",
    "deal": "revenue:proposal",

    # Strategy
    "plan": "strategy:plan",
    "binh-phap": "strategy:analyze",
    "win3": "strategy:win3",

    # CRM
    "lead": "crm:add",
    "pipe": "crm:pipeline"
}


# ============================================================
# REGISTRY API
# ============================================================

def get_command_metadata(suite: str, sub: str) -> Optional[Dict[str, Any]]:
    """Retrieves all configuration data for a specific command."""
    suite_data = COMMAND_REGISTRY.get(suite.lower())
    if not suite_data:
        return None
    return suite_data.get("subcommands", {}).get(sub.lower())


def resolve_command(cmd_input: str) -> Tuple[Optional[str], Optional[str]]:
    """
    Normalizes command input. Supports shortcuts or 'suite:sub' format.
    Returns: (suite, subcommand)
    """
    # 1. Check if it's a direct shortcut
    if cmd_input in SHORTCUTS:
        suite, sub = SHORTCUTS[cmd_input].split(":")
        return suite, sub

    # 2. Check if it's suite:sub format
    if ":" in cmd_input:
        parts = cmd_input.split(":")
        return parts[0], parts[1]

    # 3. Check if it's just a suite (default to list subcommands?)
    if cmd_input in COMMAND_REGISTRY:
        return cmd_input, None

    return None, None


def get_agent_for_command(suite: str, sub: str) -> str:
    """Identifies the best agent to lead a specific command."""
    meta = get_command_metadata(suite, sub)
    if meta and "agent" in meta:
        return meta["agent"]

    # Default fallback agents by suite
    fallbacks = {
        "dev": "fullstack-developer",
        "revenue": "money-maker",
        "strategy": "binh-phap-strategist",
        "crm": "client-magnet",
        "content": "content-factory"
    }
    return fallbacks.get(suite, "assistant")


def list_suites() -> List[str]:
    """Returns all available top-level command categories."""
    return sorted(list(COMMAND_REGISTRY.keys()))


def list_subcommands(suite: str) -> List[str]:
    """Returns all available subcommands for a specific category."""
    suite_data = COMMAND_REGISTRY.get(suite.lower())
    if not suite_data:
        return []
    return sorted(list(suite_data.get("subcommands", {}).keys()))


def print_command_map():
    """Visualizes the command hierarchy for the user."""
    print("\n" + "═" * 60)
    print("║" + "🏯 AGENCY OS - COMMAND REGISTRY".center(58) + "║")
    print("═" * 60)

    for suite_id in list_suites():
        s = COMMAND_REGISTRY[suite_id]
        print(f"\n  {s['emoji']} {suite_id.upper()} - {s['description']}")
        for sub in list_subcommands(suite_id):
            meta = s["subcommands"][sub]
            agent_tag = f"[{meta.get('agent', 'system')}]"
            print(f"     └─ {sub:<15} {agent_tag}")

    print("\n" + "─" * 60)
    print("  💡 Try using shortcuts: " + ", ".join(list(SHORTCUTS.keys())[:8]) + "...")
    print("═" * 60 + "\n")
