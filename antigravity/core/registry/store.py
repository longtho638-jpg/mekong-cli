"""
Command Registry Store - Data Definitions.
"""
from typing import Any, Dict

# ============================================================
# COMMAND REGISTRY DEFINITION
# ============================================================

COMMAND_REGISTRY: Dict[str, Dict[str, Any]] = {
    # Revenue Suite: Money and Deals
    "revenue": {
        "suite": "revenue",
        "emoji": "money_bag",
        "description": "Financial operations and client deals.",
        "subcommands": {
            "quote": {
                "module": "antigravity.core.money_maker",
                "class": "MoneyMaker",
                "method": "generate_quote",
                "agent": "money-maker",
            },
            "invoice": {
                "module": "antigravity.core.revenue_engine",
                "class": "RevenueEngine",
                "method": "create_invoice",
                "agent": "revenue-engine",
            },
            "proposal": {
                "module": "antigravity.core.proposal_generator",
                "class": "ProposalGenerator",
                "method": "generate_proposal",
                "agent": "copywriter",
            },
            "stats": {
                "module": "antigravity.core.cashflow_engine",
                "class": "CashflowEngine",
                "method": "get_stats",
                "agent": "revenue-engine",
            },
        },
    },
    # Dev Suite: Building and Shipping
    "dev": {
        "suite": "dev",
        "emoji": "hammer_and_wrench",
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
    # Strategy Suite: Strategic Binh Phap Planning
    "strategy": {
        "suite": "strategy",
        "emoji": "japanese_castle",
        "description": "Binh Phap strategic analysis.",
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
                "agent": "deal-closer",
            },
        },
    },
    # CRM Suite: Leads and Pipeline
    "crm": {
        "suite": "crm",
        "emoji": "magnet",
        "description": "Customer relationship management.",
        "subcommands": {
            "pipeline": {
                "module": "antigravity.core.client_magnet",
                "class": "ClientMagnet",
                "method": "get_pipeline_summary",
            },
            "add": {
                "module": "antigravity.core.client_magnet",
                "class": "ClientMagnet",
                "method": "add_lead",
                "agent": "client-magnet",
            },
            "stats": {
                "module": "antigravity.core.client_magnet",
                "class": "ClientMagnet",
                "method": "get_stats",
            },
        },
    },
    # Content Suite: Media and Viral Hooks
    "content": {
        "suite": "content",
        "emoji": "art",
        "description": "Scalable media production.",
        "subcommands": {
            "ideas": {
                "module": "antigravity.core.content_factory",
                "class": "ContentFactory",
                "method": "generate_ideas",
                "agent": "brainstormer",
            },
            "draft": {
                "module": "antigravity.core.content_factory",
                "class": "ContentFactory",
                "method": "create_post",
                "agent": "copywriter",
            },
            "calendar": {
                "module": "antigravity.core.content_factory",
                "class": "ContentFactory",
                "method": "get_calendar",
                "agent": "content-factory",
            },
        },
    },
}

# ============================================================
# DYNAMIC REGISTRY INTERFACE
# ============================================================

def register_command(suite: str, sub: str, metadata: Dict[str, Any]):
    """Registers a new subcommand dynamically."""
    if suite not in COMMAND_REGISTRY:
        COMMAND_REGISTRY[suite] = {
            "suite": suite,
            "emoji": "package",
            "description": f"Dynamic suite for {suite}",
            "subcommands": {},
        }
    COMMAND_REGISTRY[suite]["subcommands"][sub] = metadata

def register_suite(suite: str, emoji: str, description: str):
    """Registers a new command suite."""
    if suite not in COMMAND_REGISTRY:
        COMMAND_REGISTRY[suite] = {
            "suite": suite,
            "emoji": emoji,
            "description": description,
            "subcommands": {},
        }
    else:
        COMMAND_REGISTRY[suite]["emoji"] = emoji
        COMMAND_REGISTRY[suite]["description"] = description



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
    "pipe": "crm:pipeline",
}
