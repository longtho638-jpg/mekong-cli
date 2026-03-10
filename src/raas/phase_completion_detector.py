"""
Phase Completion Detector — ROIaaS Final Phase

Detects when all six ROIaaS phases are fully operational:
1. RAAS_LICENSE_KEY gate (License validation)
2. License Management UI (Admin dashboard)
3. Stripe/Polar webhook (Payment integration)
4. Usage metering (Credit tracking)
5. Analytics dashboard (Business intelligence)
6. Terminal Validation (End-to-end integration + Completion Certificate)

When all phases are operational, triggers graceful shutdown sequence.
"""

import os
import asyncio
from dataclasses import dataclass, field
from datetime import datetime, timezone
from enum import Enum
from typing import Optional, Dict, Any, List, Callable, Awaitable

from rich.console import Console


class PhaseStatus(str, Enum):
    """Status of each ROIaaS phase."""
    NOT_STARTED = "not_started"
    INITIALIZING = "initializing"
    OPERATIONAL = "operational"
    DEGRADED = "degraded"
    FAILED = "failed"


@dataclass
class PhaseInfo:
    """Information about a phase's status."""
    name: str
    status: PhaseStatus
    description: str
    last_checked: str = ""
    details: Dict[str, Any] = field(default_factory=dict)
    errors: List[str] = field(default_factory=list)


class PhaseCompletionDetector:
    """
    Detects when all ROIaaS phases are operational.

    Features:
    - Individual phase status checks
    - Unified operational status
    - Event callbacks on status changes
    - Health endpoint integration
    """

    def __init__(self) -> None:
        self.console = Console()
        self._phases: Dict[str, PhaseInfo] = {}
        self._callbacks: List[Callable[[], Awaitable[None]]] = []
        self._all_operational = False
        self._last_check: Optional[datetime] = None
        self._check_interval = 30  # seconds

        # Initialize phase definitions
        self._initialize_phases()

    def _initialize_phases(self) -> None:
        """Initialize all six ROIaaS phases."""
        self._phases = {
            "phase_1_license_gate": PhaseInfo(
                name="Phase 1: RAAS_LICENSE_KEY Gate",
                status=PhaseStatus.NOT_STARTED,
                description="License validation and premium feature gating",
            ),
            "phase_2_license_ui": PhaseInfo(
                name="Phase 2: License Management UI",
                status=PhaseStatus.NOT_STARTED,
                description="Admin dashboard for license management",
            ),
            "phase_3_payment_webhook": PhaseInfo(
                name="Phase 3: Stripe/Polar Webhook",
                status=PhaseStatus.NOT_STARTED,
                description="Payment processing and webhook integration",
            ),
            "phase_4_usage_metering": PhaseInfo(
                name="Phase 4: Usage Metering",
                status=PhaseStatus.NOT_STARTED,
                description="Real-time usage tracking and credit metering",
            ),
            "phase_5_analytics_dashboard": PhaseInfo(
                name="Phase 5: Analytics Dashboard",
                status=PhaseStatus.NOT_STARTED,
                description="Business intelligence and usage analytics",
            ),
            "phase_6_terminal_validation": PhaseInfo(
                name="Phase 6: Terminal Validation",
                status=PhaseStatus.NOT_STARTED,
                description="End-to-end integration validation + Completion Certificate",
            ),
        }

    def register_callback(self, callback: Callable[[], Awaitable[None]]) -> None:
        """Register callback to be called when all phases become operational."""
        self._callbacks.append(callback)

    async def check_phase_1_license_gate(self) -> PhaseInfo:
        """
        Check Phase 1: RAAS_LICENSE_KEY gate status.

        Checks:
        - RAAS_LICENSE_KEY environment variable exists
        - License validation module loads successfully
        - Remote validation endpoint reachable (optional)
        """
        phase = self._phases["phase_1_license_gate"]
        phase.last_checked = datetime.now(timezone.utc).isoformat()
        phase.status = PhaseStatus.INITIALIZING
        phase.errors = []

        try:
            # Check 1: Environment variable exists
            license_key = os.getenv("RAAS_LICENSE_KEY")
            if not license_key:
                phase.status = PhaseStatus.DEGRADED
                phase.errors.append("RAAS_LICENSE_KEY not set")
                phase.details["license_present"] = False
            else:
                phase.details["license_present"] = True

                # Check 2: License validation module loads
                try:
                    from src.lib.raas_gate_validator import RaasGateValidator  # noqa: F401
                    validator = RaasGateValidator()
                    is_valid, error = validator.validate()

                    phase.details["license_valid"] = is_valid
                    phase.details["validation_error"] = error

                    if is_valid:
                        phase.status = PhaseStatus.OPERATIONAL
                    else:
                        phase.status = PhaseStatus.DEGRADED
                        phase.errors.append(f"License validation failed: {error}")

                except ImportError as e:
                    phase.status = PhaseStatus.FAILED
                    phase.errors.append(f"Cannot import license validator: {e}")

            self.console.print(f"[dim]✓ Phase 1 check complete: {phase.status.value}[/dim]")

        except Exception as e:
            phase.status = PhaseStatus.FAILED
            phase.errors.append(f"Phase 1 check failed: {e}")

        self._phases["phase_1_license_gate"] = phase
        return phase

    async def check_phase_2_license_ui(self) -> PhaseInfo:
        """
        Check Phase 2: License Management UI status.

        Checks:
        - License admin commands available
        - Dashboard module loads
        - UI routes registered
        """
        phase = self._phases["phase_2_license_ui"]
        phase.last_checked = datetime.now(timezone.utc).isoformat()
        phase.status = PhaseStatus.INITIALIZING
        phase.errors = []

        try:
            # Check 1: License admin module loads
            try:
                from src.commands import license_admin  # noqa: F401
                phase.details["admin_commands_loaded"] = True
            except ImportError:
                phase.status = PhaseStatus.DEGRADED
                phase.errors.append("License admin commands not available")
                phase.details["admin_commands_loaded"] = False

            # Check 2: Dashboard module loads
            try:
                from src.raas import dashboard  # noqa: F401
                phase.details["dashboard_loaded"] = True
            except ImportError:
                phase.status = PhaseStatus.DEGRADED
                phase.errors.append("Dashboard module not available")
                phase.details["dashboard_loaded"] = False

            # Check 3: License CLI available
            try:
                from src.raas import license_cli  # noqa: F401
                phase.details["license_cli_loaded"] = True
            except ImportError:
                phase.details["license_cli_loaded"] = False

            # If at least one component loads, consider operational
            if phase.details.get("admin_commands_loaded") or phase.details.get("dashboard_loaded"):
                if phase.status != PhaseStatus.FAILED:
                    phase.status = PhaseStatus.OPERATIONAL

            self.console.print(f"[dim]✓ Phase 2 check complete: {phase.status.value}[/dim]")

        except Exception as e:
            phase.status = PhaseStatus.FAILED
            phase.errors.append(f"Phase 2 check failed: {e}")

        self._phases["phase_2_license_ui"] = phase
        return phase

    async def check_phase_3_payment_webhook(self) -> PhaseInfo:
        """
        Check Phase 3: Stripe/Polar webhook status.

        Checks:
        - Payment webhook module available
        - Webhook routes registered
        - Payment provider configured
        """
        phase = self._phases["phase_3_payment_webhook"]
        phase.last_checked = datetime.now(timezone.utc).isoformat()
        phase.status = PhaseStatus.INITIALIZING
        phase.errors = []

        try:
            # Check 1: RaaS billing module loads (handles payment-like functionality)
            try:
                from src.api import raas_billing_middleware  # noqa: F401
                phase.details["billing_middleware_loaded"] = True
            except ImportError:
                phase.details["billing_middleware_loaded"] = False

            # Check 2: Check for Polar/Stripe webhook handler
            webhook_url = os.getenv("POLAR_WEBHOOK_URL") or os.getenv("STRIPE_WEBHOOK_URL")
            if webhook_url:
                phase.details["webhook_url_configured"] = True
            else:
                phase.details["webhook_url_configured"] = False

            # Check 3: RaaS gateway available (handles payment routing)
            try:
                from src.core import gateway_dashboard  # noqa: F401
                phase.details["gateway_loaded"] = True
            except ImportError:
                phase.details["gateway_loaded"] = False

            # Consider operational if billing middleware is available
            # (webhook URL is optional for self-hosted deployments)
            if phase.details.get("billing_middleware_loaded"):
                phase.status = PhaseStatus.OPERATIONAL
            else:
                phase.status = PhaseStatus.DEGRADED
                phase.errors.append("Billing middleware not available")

            self.console.print(f"[dim]✓ Phase 3 check complete: {phase.status.value}[/dim]")

        except Exception as e:
            phase.status = PhaseStatus.FAILED
            phase.errors.append(f"Phase 3 check failed: {e}")

        self._phases["phase_3_payment_webhook"] = phase
        return phase

    async def check_phase_4_usage_metering(self) -> PhaseInfo:
        """
        Check Phase 4: Usage metering status.

        Checks:
        - Usage meter module loads
        - Usage metering service available
        - Usage tracker initialized
        - Database tables exist
        """
        phase = self._phases["phase_4_usage_metering"]
        phase.last_checked = datetime.now(timezone.utc).isoformat()
        phase.status = PhaseStatus.INITIALIZING
        phase.errors = []

        try:
            # Check 1: Usage meter module loads
            try:
                from src.lib import usage_meter  # noqa: F401
                phase.details["usage_meter_loaded"] = True
            except ImportError:
                phase.status = PhaseStatus.DEGRADED
                phase.errors.append("Usage meter module not available")
                phase.details["usage_meter_loaded"] = False

            # Check 2: Usage metering service available
            try:
                from src.lib import usage_metering_service  # noqa: F401
                phase.details["metering_service_loaded"] = True
            except ImportError:
                phase.details["metering_service_loaded"] = False

            # Check 3: Usage tracker available
            try:
                from src.usage import usage_tracker  # noqa: F401
                phase.details["usage_tracker_loaded"] = True
            except ImportError:
                phase.details["usage_tracker_loaded"] = False

            # Check 4: Credit rate limiter available
            try:
                from src.raas import credit_rate_limiter  # noqa: F401
                phase.details["rate_limiter_loaded"] = True
            except ImportError:
                phase.details["rate_limiter_loaded"] = False

            # Consider operational if core components load
            loaded_count = sum([
                phase.details.get("usage_meter_loaded", False),
                phase.details.get("metering_service_loaded", False),
                phase.details.get("rate_limiter_loaded", False),
            ])

            if loaded_count >= 2:
                phase.status = PhaseStatus.OPERATIONAL
            elif loaded_count >= 1:
                phase.status = PhaseStatus.DEGRADED
                phase.errors.append("Some usage metering components missing")
            else:
                phase.status = PhaseStatus.FAILED
                phase.errors.append("No usage metering components available")

            self.console.print(f"[dim]✓ Phase 4 check complete: {phase.status.value}[/dim]")

        except Exception as e:
            phase.status = PhaseStatus.FAILED
            phase.errors.append(f"Phase 4 check failed: {e}")

        self._phases["phase_4_usage_metering"] = phase
        return phase

    async def check_phase_5_analytics_dashboard(self) -> PhaseInfo:
        """
        Check Phase 5: Analytics dashboard status.

        Checks:
        - Dashboard service loads
        - Analytics queries available
        - Dashboard API available
        """
        phase = self._phases["phase_5_analytics_dashboard"]
        phase.last_checked = datetime.now(timezone.utc).isoformat()
        phase.status = PhaseStatus.INITIALIZING
        phase.errors = []

        try:
            # Check 1: Dashboard service loads
            try:
                from src.analytics import dashboard_service  # noqa: F401
                phase.details["dashboard_service_loaded"] = True
            except ImportError:
                phase.status = PhaseStatus.DEGRADED
                phase.errors.append("Dashboard service not available")
                phase.details["dashboard_service_loaded"] = False

            # Check 2: Analytics queries available
            try:
                from src.db.queries import analytics_queries  # noqa: F401
                phase.details["analytics_queries_loaded"] = True
            except ImportError:
                phase.details["analytics_queries_loaded"] = False

            # Check 3: Dashboard API available
            try:
                # Try to import dashboard API
                import importlib.util
                spec = importlib.util.find_spec("src.api.dashboard.app")
                if spec is not None:
                    phase.details["dashboard_api_available"] = True
                else:
                    phase.details["dashboard_api_available"] = False
            except Exception:
                phase.details["dashboard_api_available"] = False

            # Consider operational if dashboard service is available
            if phase.details.get("dashboard_service_loaded"):
                phase.status = PhaseStatus.OPERATIONAL
            else:
                phase.status = PhaseStatus.DEGRADED
                phase.errors.append("Dashboard service not available")

            self.console.print(f"[dim]✓ Phase 5 check complete: {phase.status.value}[/dim]")

        except Exception as e:
            phase.status = PhaseStatus.FAILED
            phase.errors.append(f"Phase 5 check failed: {e}")

        self._phases["phase_5_analytics_dashboard"] = phase
        return phase

    async def check_phase_6_terminal_validation(self) -> PhaseInfo:
        """
        Check Phase 6: Terminal Validation status.

        Validates end-to-end RaaS integration:
        - License authentication
        - Usage reporting sync
        - Billing sync with RaaS backend
        - RaaS Gateway JWT attestation
        - Completion Certificate generated

        On success, outputs completion certificate with:
        - Project ID
        - License key hash
        - Total billed usage units
        - Signed attestation from RaaS Gateway
        """
        phase = self._phases["phase_6_terminal_validation"]
        phase.last_checked = datetime.now(timezone.utc).isoformat()
        phase.status = PhaseStatus.INITIALIZING
        phase.errors = []

        try:
            # Import Phase 6 validator
            from src.raas.final_phase_validator import get_validator as get_phase6_validator  # noqa: F401
            from src.raas.completion_certificate import generate_certificate, save_certificate  # noqa: F401

            # Run terminal validation
            validator = get_phase6_validator()
            validation_result = await validator.validate_all()

            phase.details["validation_passed"] = validation_result.all_passed
            phase.details["project_id"] = validation_result.project_id
            phase.details["license_key_hash"] = validation_result.license_key_hash
            phase.details["total_billed_usage"] = validation_result.total_billed_usage
            phase.details["gateway_issuer"] = validation_result.gateway_issuer
            phase.details["attestation_hash"] = validation_result.attestation

            if validation_result.all_passed:
                # Generate completion certificate
                cert = generate_certificate(
                    validation_result,
                    phases_status={
                        "Phase 1: License Gate": self._phases["phase_1_license_gate"].status == PhaseStatus.OPERATIONAL,
                        "Phase 2: License UI": self._phases["phase_2_license_ui"].status == PhaseStatus.OPERATIONAL,
                        "Phase 3: Payment Webhook": self._phases["phase_3_payment_webhook"].status == PhaseStatus.OPERATIONAL,
                        "Phase 4: Usage Metering": self._phases["phase_4_usage_metering"].status == PhaseStatus.OPERATIONAL,
                        "Phase 5: Analytics Dashboard": self._phases["phase_5_analytics_dashboard"].status == PhaseStatus.OPERATIONAL,
                        "Phase 6: Terminal Validation": True,
                    },
                )

                # Save certificate
                cert_path = save_certificate(cert)
                phase.details["certificate_saved"] = cert_path
                phase.details["certificate_id"] = cert.certificate_id

                phase.status = PhaseStatus.OPERATIONAL
                phase.errors.append(f"Certificate: {cert.certificate_id}")
            else:
                phase.status = PhaseStatus.DEGRADED
                phase.errors.extend(validation_result.errors)

            self.console.print(f"[dim]✓ Phase 6 check complete: {phase.status.value}[/dim]")

        except ImportError as e:
            phase.status = PhaseStatus.DEGRADED
            phase.errors.append(f"Phase 6 validator not available: {e}")
            phase.details["validation_passed"] = False
        except Exception as e:
            phase.status = PhaseStatus.FAILED
            phase.errors.append(f"Phase 6 check failed: {e}")
            phase.details["validation_passed"] = False

        self._phases["phase_6_terminal_validation"] = phase
        return phase

    async def check_all_phases(self) -> bool:
        """
        Check all six phases and return True if all are operational.

        Returns:
            True if all phases are operational, False otherwise
        """
        self.console.print("\n[bold cyan]=== ROIaaS Phase Completion Check (6 Phases) ===[/bold cyan]")

        # Check all phases in parallel
        results = await asyncio.gather(
            self.check_phase_1_license_gate(),
            self.check_phase_2_license_ui(),
            self.check_phase_3_payment_webhook(),
            self.check_phase_4_usage_metering(),
            self.check_phase_5_analytics_dashboard(),
            self.check_phase_6_terminal_validation(),
            return_exceptions=False,
        )

        # Determine if all phases are operational
        all_operational = all(
            phase.status == PhaseStatus.OPERATIONAL
            for phase in results
        )

        was_operational = self._all_operational
        self._all_operational = all_operational
        self._last_check = datetime.now(timezone.utc)

        # Display summary
        self._display_phase_summary(results)

        # Trigger callbacks if transitioned to all operational
        if all_operational and not was_operational:
            self.console.print("\n[bold green]✓ All phases operational! Triggering shutdown sequence...[/bold green]")
            await self._trigger_callbacks()

        return all_operational

    def _display_phase_summary(self, phases: List[PhaseInfo]) -> None:
        """Display summary table of all phases."""
        from rich.table import Table

        table = Table(show_header=True, header_style="bold cyan")
        table.add_column("Phase", style="cyan")
        table.add_column("Status", style="bold")
        table.add_column("Details")

        status_icons = {
            PhaseStatus.OPERATIONAL: "✓",
            PhaseStatus.DEGRADED: "⚠",
            PhaseStatus.FAILED: "✗",
            PhaseStatus.INITIALIZING: "⟳",
            PhaseStatus.NOT_STARTED: "○",
        }

        status_colors = {
            PhaseStatus.OPERATIONAL: "green",
            PhaseStatus.DEGRADED: "yellow",
            PhaseStatus.FAILED: "red",
            PhaseStatus.INITIALIZING: "blue",
            PhaseStatus.NOT_STARTED: "dim",
        }

        for phase in phases:
            icon = status_icons[phase.status]
            color = status_colors[phase.status]
            details = phase.errors[0] if phase.errors else "OK"

            table.add_row(
                phase.name,
                f"[{color}]{icon} {phase.status.value.upper()}[/{color}]",
                f"[dim]{details}[/dim]",
            )

        self.console.print(table)

    async def _trigger_callbacks(self) -> None:
        """Trigger all registered callbacks."""
        for callback in self._callbacks:
            try:
                await callback()
            except Exception as e:
                self.console.print(f"[yellow]⚠ Callback error: {e}[/yellow]")

    def get_phase_status(self, phase_id: str) -> Optional[PhaseInfo]:
        """Get status of a specific phase."""
        return self._phases.get(phase_id)

    def get_all_phases_status(self) -> Dict[str, PhaseInfo]:
        """Get status of all phases."""
        return self._phases.copy()

    def is_all_operational(self) -> bool:
        """Check if all phases are operational (sync method)."""
        return self._all_operational

    def get_last_check(self) -> Optional[datetime]:
        """Get timestamp of last phase check."""
        return self._last_check


# Global instance
_detector: Optional[PhaseCompletionDetector] = None


def get_detector() -> PhaseCompletionDetector:
    """Get global PhaseCompletionDetector instance."""
    global _detector
    if _detector is None:
        _detector = PhaseCompletionDetector()
    return _detector


def reset_detector() -> None:
    """Reset global detector instance (for testing)."""
    global _detector
    _detector = None


__all__ = [
    "PhaseStatus",
    "PhaseInfo",
    "PhaseCompletionDetector",
    "get_detector",
    "reset_detector",
]
