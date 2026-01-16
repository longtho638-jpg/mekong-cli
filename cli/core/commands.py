"""
Register all CLI commands.
This file automatically registers all available commands.
"""

from cli.core.command_registry import registry

# Core Commands
from cli.commands.core.help import HelpCommand
from cli.commands.core.guide import GuideCommand
from cli.commands.core.status import StatusCommand
from cli.commands.core.demo import DemoCommand
from cli.commands.core.crm import CRMCommand

# Development Commands
from cli.commands.development.cook import CookCommand
from cli.commands.development.test import TestCommand
from cli.commands.development.ship import ShipCommand
from cli.commands.development.monitor import MonitorCommand
from cli.commands.development.deploy import DeployCommand

# Strategy Commands
from cli.commands.strategy.binh_phap import BinhPhapCommand
from cli.commands.strategy.plan import PlanCommand
from cli.commands.strategy.strategy import StrategyCommand


def register_commands():
    """Register all commands with the global registry."""
    # Core Commands
    registry.register("help", HelpCommand)
    registry.register("guide", GuideCommand)
    registry.register("status", StatusCommand)
    registry.register("demo", DemoCommand)
    registry.register("crm", CRMCommand)
    
    # Development Commands
    registry.register("cook", CookCommand)
    registry.register("test", TestCommand)
    registry.register("ship", ShipCommand)
    registry.register("monitor", MonitorCommand)
    registry.register("deploy", DeployCommand)
    
    # Strategy Commands
    registry.register("binh-phap", BinhPhapCommand)
    registry.register("plan", PlanCommand)
    registry.register("strategy", StrategyCommand)


# Auto-register on import
register_commands()