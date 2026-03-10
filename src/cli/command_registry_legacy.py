"""
Legacy Command Registry

Registers all legacy command modules that have not yet been
migrated to the modern commands_registry pattern.
"""

import typer

# Modern/extracted command modules
from src.cli.binh_phap_commands import app as binh_phap_app
from src.cli.billing_commands import app as billing_app
from src.cli.roi_commands import app as roi_app
from src.cli.update_commands import app as update_app
from src.cli.raas_auth_commands import app as raas_auth_app
from src.cli.diagnostic_commands import app as diagnostic_app
from src.cli.usage_commands import app as usage_app

# Legacy command modules
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
from src.commands.license_commands import app as license_app
from src.commands.license_admin import app as license_admin_app
from src.commands.tier_admin import app as tier_admin_app
from src.commands.license_renewal import app as renewal_app
from src.commands.compliance import app as compliance_app
from src.commands.telemetry_commands import app as telemetry_app
from src.commands.dashboard_commands import app as dashboard_app
from src.commands.security_commands import app as security_commands_app
from src.commands.sync_commands import app as sync_app
from src.commands.sync_raas_commands import app as sync_raas_app
from src.commands.raas_maintenance_commands import app as raas_maintenance_app
from src.commands.license_activation import app as license_activation_app
from src.commands.raas_validate import validate_license, license_status

# Extracted P0-2 command modules
from src.commands.health_commands import app as health_app
from src.commands.phase_commands import app as phase_app
from src.commands.analytics_commands import app as analytics_app


def register_legacy_commands(app: typer.Typer) -> None:
    """Register all legacy command modules with the main app."""
    app.add_typer(binh_phap_app, name="binh-phap", help="Binh Pháp Strategy")
    app.add_typer(agi_app, name="agi", help="Tom Hum AGI daemon")
    app.add_typer(status_app, name="status", help="System health")
    app.add_typer(config_app, name="config", help="Environment config")
    app.add_typer(doctor_app, name="doctor", help="Diagnostics")
    app.add_typer(clean_app, name="clean", help="Clean artifacts")
    app.add_typer(test_app, name="test", help="Run tests")
    app.add_typer(build_app, name="build", help="Build project")
    app.add_typer(deploy_app, name="deploy", help="Deploy")
    app.add_typer(lint_app, name="lint", help="Linting")
    app.add_typer(docs_app, name="docs", help="Documentation")
    app.add_typer(monitor_app, name="monitor", help="Monitoring")
    app.add_typer(security_app, name="security", help="Security")
    app.add_typer(ci_app, name="ci", help="CI/CD")
    app.add_typer(env_app, name="env", help="Environment")
    app.add_typer(test_advanced_app, name="test-advanced", help="Advanced testing")
    app.add_typer(license_app, name="license", help="License management")
    app.add_typer(license_admin_app, name="license-admin", help="License Admin Dashboard")
    app.add_typer(tier_admin_app, name="tier-admin", help="Tier rate limit configuration")
    app.add_typer(renewal_app, name="renewal", help="License renewal flow")
    app.add_typer(compliance_app, name="compliance", help="Compliance reporting & audit export")
    app.add_typer(billing_app, name="billing", help="Billing operations")
    app.add_typer(roi_app, name="roi", help="ROI Unified Command")
    app.add_typer(telemetry_app, name="telemetry", help="Telemetry consent management")
    app.add_typer(dashboard_app, name="dashboard", help="Analytics Dashboard")
    app.add_typer(security_commands_app, name="security-cmd", help="Security hardening commands")
    app.add_typer(sync_app, name="sync", help="RaaS usage metrics sync")
    app.add_typer(update_app, name="update", help="CLI auto-update")
    app.add_typer(raas_auth_app, name="raas-auth", help="RaaS Gateway auth")
    app.add_typer(raas_auth_app, name="auth", help="RaaS Gateway auth")
    app.add_typer(diagnostic_app, name="diagnostic", help="Diagnostic connectivity checks")
    app.add_typer(usage_app, name="usage", help="Usage metering and reporting")
    app.add_typer(sync_raas_app, name="sync-raas", help="Sync with RaaS Gateway")
    app.add_typer(raas_maintenance_app, name="raas-maintenance", help="RaaS Gateway maintenance")
    app.add_typer(license_activation_app, name="license-activation", help="License activation")
    app.add_typer(health_app, name="health", help="Health endpoint server")
    app.add_typer(phase_app, name="phase", help="ROIaaS phase validation")
    app.add_typer(analytics_app, name="analytics-cmd", help="Analytics and debug trace")

    # Register standalone commands directly
    app.command("validate-license")(validate_license)
    app.command("license-status")(license_status)
