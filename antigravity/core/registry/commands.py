"""
Command Registry - Data Definitions
====================================

Contains the COMMAND_REGISTRY and SHORTCUTS dictionaries that define
the command structure for Agency OS.

Binh Phap: Phap (Process) - Maintaining the chain of command.
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
