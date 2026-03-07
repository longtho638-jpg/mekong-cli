"""
CLI Commands Registry - All subcommand registrations

Centralized registration of all CLI subcommands.
"""

import typer
from pathlib import Path
import importlib.util


def register_all_commands(app: typer.Typer) -> None:
    """Register all subcommands with the main app."""

    # Import command modules
    from src.cli.binh_phap_commands import app as binh_phap_app
    from src.commands.core_commands import app as core_app
    from src.commands.license_commands import app as license_app
    from src.commands.agi import app as agi_app
    from src.commands.status import app as status_app
    from src.commands.config import app as config_app
    from src.commands.doctor import app as doctor_app
    from src.commands.clean import app as clean_app
    from src.commands.test import app as test_app
    from src.commands.build import app as build_app
    from src.commands.deploy import app as deploy_app
    from src.commands.lint import app as lint_app
    from src.commands.docs import app as docs_app
    from src.commands.monitor import app as monitor_app
    from src.commands.security import app as security_app
    from src.commands.ci import app as ci_app
    from src.commands.env import app as env_app
    from src.commands.test_advanced import app as test_advanced_app
    from src.commands.sync_raas import app as sync_raas_app

    # BMAD commands
    spec = importlib.util.spec_from_file_location(
        "bmad_commands", Path(__file__).parent.parent / "cli" / "bmad-commands.py"
    )
    bmad_module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(bmad_module)
    bmad_app = bmad_module.app

    # Register all subcommands
    app.add_typer(bmad_app, name="bmad", help="BMAD workflow management")
    app.add_typer(binh_phap_app, name="binh-phap", help="Binh Pháp Strategy: Infinite loops & Standards")
    app.add_typer(core_app)  # Register core commands
    app.add_typer(license_app, name="license", help="RaaS License Management")
    app.add_typer(agi_app, name="agi", help="Tom Hum AGI daemon management")
    app.add_typer(status_app, name="status", help="System health & API status")
    app.add_typer(config_app, name="config", help="Manage environment variables and API keys")
    app.add_typer(doctor_app, name="doctor", help="Diagnostic tool - check system requirements")
    app.add_typer(clean_app, name="clean", help="Clean cache, temp files, build artifacts")
    app.add_typer(test_app, name="test", help="Run tests with various options")
    app.add_typer(build_app, name="build", help="Build project with various options")
    app.add_typer(deploy_app, name="deploy", help="Deploy applications to various platforms")
    app.add_typer(lint_app, name="lint", help="Static analysis and code quality checks")
    app.add_typer(docs_app, name="docs", help="Generate, serve, and manage documentation")
    app.add_typer(monitor_app, name="monitor", help="Monitor system resources, performance, and application health")
    app.add_typer(security_app, name="security", help="Audit, scan, and secure applications")
    app.add_typer(ci_app, name="ci", help="CI/CD pipeline management")
    app.add_typer(env_app, name="env", help="Environment management")
    app.add_typer(test_advanced_app, name="test-advanced", help="Advanced testing strategies")

    # Swarm sub-commands
    swarm_app = typer.Typer(help="Swarm: multi-node orchestration")
    app.add_typer(swarm_app, name="swarm")

    # Schedule sub-commands
    schedule_app = typer.Typer(help="Schedule: autonomous recurring missions")
    app.add_typer(schedule_app, name="schedule")

    # Memory sub-commands
    memory_app = typer.Typer(help="Memory: execution history & learning")
    app.add_typer(memory_app, name="memory")

    # Telegram sub-commands
    telegram_app = typer.Typer(help="Telegram: remote commander bot")
    app.add_typer(telegram_app, name="telegram")

    # RaaS Integration Commands
    app.add_typer(sync_raas_app, name="sync-raas", help="RaaS Gateway synchronization: validate, register, track usage")

    # Autonomous sub-commands
    autonomous_app = typer.Typer(help="Autonomous: AGI loop control")
    app.add_typer(autonomous_app, name="autonomous")
