"""
🏯 Command Registry - Maps Core Modules to CLI Commands

This registry connects Python modules to their corresponding
command suites and subcommands.

Usage:
    from antigravity.core.registry import COMMAND_REGISTRY, get_command_module
"""

from typing import Dict, Any, Optional

# Core Module → Suite Mapping
COMMAND_REGISTRY: Dict[str, Dict[str, Any]] = {
    # 💰 Revenue Suite
    "revenue": {
        "suite": "revenue",
        "description": "Revenue operations",
        "subcommands": {
            "quote": {
                "module": "antigravity.core.money_maker",
                "class": "MoneyMaker",
                "method": "generate_quote",
            },
            "invoice": {
                "module": "antigravity.core.revenue_engine",
                "class": "RevenueEngine",
                "method": "create_invoice",
            },
            "proposal": {
                "module": "antigravity.core.proposal_generator",
                "class": "ProposalGenerator",
                "method": "generate_proposal",
            },
            "stats": {
                "module": "antigravity.core.revenue_engine",
                "class": "RevenueEngine",
                "method": "get_stats",
            },
        },
    },
    
    # 🛠️ Dev Suite
    "dev": {
        "suite": "dev",
        "description": "Development cycle",
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
            "debug": {
                "agent": "debugger",
            },
            "fix": {
                "agent": "debugger",
            },
        },
    },
    
    # 🏯 Strategy Suite
    "strategy": {
        "suite": "strategy",
        "description": "Binh Pháp planning",
        "subcommands": {
            "analyze": {
                "module": "core.binh_phap",
                "agent": "binh-phap-strategist",
            },
            "plan": {
                "agent": "planner",
            },
            "win3": {
                "module": "antigravity.core.money_maker",
                "class": "MoneyMaker",
                "method": "validate_win3",
            },
        },
    },
    
    # 🧲 CRM Suite
    "crm": {
        "suite": "crm",
        "description": "CRM operations",
        "subcommands": {
            "leads": {
                "module": "core.crm",
                "class": "CRM",
            },
            "pipeline": {
                "module": "antigravity.core.sales_pipeline",
                "class": "SalesPipeline",
            },
            "contacts": {
                "module": "antigravity.core.client_magnet",
                "class": "ClientMagnet",
            },
            "add": {
                "module": "antigravity.core.client_magnet",
                "class": "ClientMagnet",
                "method": "add_lead",
            },
        },
    },
    
    # 🎨 Content Suite
    "content": {
        "suite": "content",
        "description": "Content creation",
        "subcommands": {
            "ideas": {
                "module": "antigravity.core.content_factory",
                "class": "ContentFactory",
                "method": "generate_ideas",
            },
            "write": {
                "module": "core.content_generator",
                "class": "ContentGenerator",
            },
            "calendar": {
                "module": "antigravity.core.content_factory",
                "class": "ContentFactory",
            },
            "enhance": {
                "module": "core.content_marketing",
                "class": "ContentMarketing",
            },
        },
    },
    
    # 📊 Analytics Suite
    "analytics": {
        "suite": "analytics",
        "description": "Data & reporting",
        "subcommands": {
            "dashboard": {
                "module": "core.analytics",
                "class": "Analytics",
            },
            "report": {
                "module": "core.analytics",
                "class": "Analytics",
                "method": "generate_report",
            },
            "export": {
                "module": "core.analytics",
                "class": "Analytics",
                "method": "export_data",
            },
        },
    },
    
    # 🏢 Agency Suite
    "agency": {
        "suite": "agency",
        "description": "Agency management",
        "subcommands": {
            "dna": {
                "module": "antigravity.core.agency_dna",
                "class": "AgencyDNA",
            },
            "scorecard": {
                "module": "core.agency_scorecard",
                "class": "AgencyScorecard",
            },
            "clients": {
                "module": "antigravity.core.client_magnet",
                "class": "ClientMagnet",
                "method": "get_clients",
            },
            "stats": {
                "module": "core.analytics",
                "class": "Analytics",
            },
        },
    },
    
    # 🚀 Startup Suite
    "startup": {
        "suite": "startup",
        "description": "Startup tools",
        "subcommands": {
            "launch": {
                "module": "core.startup_launcher",
                "class": "StartupLauncher",
            },
            "pitch": {
                "module": "core.pitch_deck",
                "class": "PitchDeck",
            },
            "deck": {
                "module": "core.pitch_deck",
                "class": "PitchDeck",
                "method": "generate",
            },
            "vc": {
                "module": "core.vc_hub",
                "class": "VCHub",
            },
        },
    },
}


# Shortcut → Suite mapping
SHORTCUTS: Dict[str, str] = {
    "cook": "dev:cook",
    "test": "dev:test",
    "ship": "dev:ship",
    "quote": "revenue:quote",
    "invoice": "revenue:invoice",
    "proposal": "revenue:proposal",
    "plan": "strategy:plan",
    "binh-phap": "strategy:analyze",
    "debug": "dev:debug",
    "fix": "dev:fix",
}


def get_command_module(suite: str, subcommand: str) -> Optional[Dict[str, Any]]:
    """Get module info for a command."""
    if suite in COMMAND_REGISTRY:
        subs = COMMAND_REGISTRY[suite].get("subcommands", {})
        if subcommand in subs:
            return subs[subcommand]
    return None


def resolve_shortcut(shortcut: str) -> Optional[str]:
    """Resolve a shortcut to its full suite:subcommand form."""
    return SHORTCUTS.get(shortcut)


def list_suites() -> list:
    """List all available suites."""
    return list(COMMAND_REGISTRY.keys())


def list_subcommands(suite: str) -> list:
    """List all subcommands for a suite."""
    if suite in COMMAND_REGISTRY:
        return list(COMMAND_REGISTRY[suite].get("subcommands", {}).keys())
    return []
