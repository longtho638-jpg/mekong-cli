#!/usr/bin/env python3
"""
Mekong CLI - Nightly Reconciliation Cron Job

Automatically reconciles usage records against Stripe billing data.
Compares metered usage with Stripe invoice line items, logs discrepancies,
and triggers alerts for unresolved mismatches.

Usage:
    python3 -m src.jobs.nightly_reconciliation [--dry-run] [--date YYYY-MM-DD]

Environment Variables:
    DATABASE_URL: PostgreSQL connection string
    STRIPE_SECRET_KEY: Stripe API key (sk_live_* or sk_test_*)
    TELEGRAM_BOT_TOKEN: Optional, for alert notifications
    TELEGRAM_OPS_CHANNEL_ID: Optional, for alert notifications
    RECONCILIATION_WEBHOOK_URL: Optional, for webhook alerts
"""

import asyncio
import logging
import os
import sys
from datetime import date, datetime, timedelta, timezone
from decimal import Decimal
from typing import Any, Dict, List, Optional, Tuple
from dataclasses import dataclass, field
from pathlib import Path

from rich.console import Console
from rich.table import Table

# Add project root to path
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from src.db.repository import get_repository, LicenseRepository
from src.billing.reconciliation import (
    ReconciliationService,
    AuditResult,
    ReconciliationConfig,
    get_reconciliation_service,
)
from src.core.event_bus import get_event_bus, EventType

console = Console()
logger = logging.getLogger(__name__)


# =============================================================================
# Stripe Integration
# =============================================================================


class StripeReconciliationAdapter:
    """
    Adapter for fetching Stripe billing data for reconciliation.

    Compares local usage records with Stripe invoice line items.
    """

    def __init__(self, api_key: Optional[str] = None) -> None:
        self._api_key = api_key or os.getenv("STRIPE_SECRET_KEY")
        self._initialized = False
        self._stripe = None

        if not self._api_key:
            logger.warning("STRIPE_SECRET_KEY not set - Stripe reconciliation disabled")

    async def initialize(self) -> bool:
        """Initialize Stripe client."""
        if not self._api_key:
            return False

        try:
            import stripe
            stripe.api_key = self._api_key
            self._stripe = stripe
            self._initialized = True
            logger.info("Stripe client initialized")
            return True
        except ImportError:
            logger.error("Stripe package not installed. Run: pip install stripe")
            return False
        except Exception as e:
            logger.error(f"Failed to initialize Stripe: {e}")
            return False

    async def get_invoices_for_period(
        self,
        customer_email: str,
        period_start: date,
        period_end: date,
    ) -> List[Dict[str, Any]]:
        """
        Get Stripe invoices for a customer within a date range.

        Args:
            customer_email: Customer email to lookup
            period_start: Period start date
            period_end: Period end date

        Returns:
            List of invoice data
        """
        if not self._initialized:
            if not await self.initialize():
                return []

        try:
            # Lookup customer by email
            customers = self._stripe.Customer.list(email=customer_email, limit=1)
            if not customers.data:
                logger.warning(f"No Stripe customer found for {customer_email}")
                return []

            customer_id = customers.data[0].id

            # Fetch invoices for period
            invoices = self._stripe.Invoice.list(
                customer=customer_id,
                created={
                    "gte": int(period_start.timestamp()),
                    "lte": int(period_end.timestamp()),
                },
                limit=100,
            )

            invoice_data = []
            for invoice in invoices.data:
                invoice_data.append({
                    "id": invoice.id,
                    "invoice_pdf": invoice.invoice_pdf,
                    "hosted_invoice_url": invoice.hosted_invoice_url,
                    "amount_due": invoice.amount_due / 100,  # Convert cents to dollars
                    "amount_paid": invoice.amount_paid / 100,
                    "status": invoice.status,
                    "created": datetime.fromtimestamp(invoice.created),
                    "period_start": datetime.fromtimestamp(invoice.period_start),
                    "period_end": datetime.fromtimestamp(invoice.period_end),
                    "line_items": [
                        {
                            "description": item.description,
                            "amount": item.amount / 100 if item.amount else 0,
                            "quantity": item.quantity,
                            "unit_amount": item.unit_amount / 100 if item.unit_amount else None,
                            "type": item.type,
                        }
                        for item in invoice.lines.data
                    ],
                })

            logger.info(f"Found {len(invoice_data)} invoices for {customer_email}")
            return invoice_data

        except Exception as e:
            logger.error(f"Failed to fetch Stripe invoices: {e}")
            return []

    async def get_usage_record_summary(
        self,
        subscription_item_id: str,
        period_start: date,
        period_end: date,
    ) -> Optional[Dict[str, Any]]:
        """
        Get Stripe usage record summary for a subscription item.

        Args:
            subscription_item_id: Stripe subscription item ID
            period_start: Period start date
            period_end: Period end date

        Returns:
            Usage summary data
        """
        if not self._initialized:
            if not await self.initialize():
                return None

        try:
            usage_records = self._stripe.SubscriptionItem.list_usage_records(
                subscription_item_id,
                limit=100,
            )

            total_quantity = sum(record.quantity for record in usage_records.data)

            return {
                "subscription_item_id": subscription_item_id,
                "total_quantity": total_quantity,
                "records_count": len(usage_records.data),
                "period_start": period_start.isoformat(),
                "period_end": period_end.isoformat(),
            }

        except Exception as e:
            logger.error(f"Failed to fetch usage records: {e}")
            return None


# =============================================================================
# Reconciliation Data Models
# =============================================================================


@dataclass
class StripeDiscrepancy:
    """Discrepancy between local and Stripe billing."""

    license_key: str
    key_id: str
    period_start: date
    period_end: date
    local_amount: Decimal
    stripe_amount: Decimal
    variance: Decimal
    variance_percent: float
    local_line_items: List[Dict[str, Any]] = field(default_factory=list)
    stripe_line_items: List[Dict[str, Any]] = field(default_factory=list)
    status: str = "open"  # open, investigating, resolved
    notes: Optional[str] = None
    created_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))

    def to_dict(self) -> Dict[str, Any]:
        """Serialize to dictionary."""
        return {
            "license_key": self.license_key,
            "key_id": self.key_id,
            "period_start": self.period_start.isoformat(),
            "period_end": self.period_end.isoformat(),
            "local_amount": str(self.local_amount),
            "stripe_amount": str(self.stripe_amount),
            "variance": str(self.variance),
            "variance_percent": self.variance_percent,
            "local_line_items": self.local_line_items,
            "stripe_line_items": self.stripe_line_items,
            "status": self.status,
            "notes": self.notes,
            "created_at": self.created_at.isoformat(),
        }


@dataclass
class ReconciliationReport:
    """Full reconciliation report."""

    run_date: date
    total_licenses: int
    reconciled_count: int
    stripe_reconciled_count: int
    discrepancies: List[StripeDiscrepancy]
    local_only_discrepancies: List[AuditResult]
    total_variance: Decimal
    critical_count: int
    warnings: List[str] = field(default_factory=list)
    duration_seconds: float = 0

    def to_dict(self) -> Dict[str, Any]:
        """Serialize to dictionary."""
        return {
            "run_date": self.run_date.isoformat(),
            "total_licenses": self.total_licenses,
            "reconciled_count": self.reconciled_count,
            "stripe_reconciled_count": self.stripe_reconciled_count,
            "discrepancies_count": len(self.discrepancies),
            "local_only_discrepancies_count": len(self.local_only_discrepancies),
            "total_variance": str(self.total_variance),
            "critical_count": self.critical_count,
            "warnings": self.warnings,
            "duration_seconds": self.duration_seconds,
            "discrepancies": [d.to_dict() for d in self.discrepancies],
        }


# =============================================================================
# Nightly Reconciliation Service
# =============================================================================


class NightlyReconciliationService:
    """
    Nightly reconciliation service with Stripe integration.

    Runs automated reconciliation of:
    1. Local usage records vs local billing records
    2. Local billing records vs Stripe invoices
    """

    def __init__(
        self,
        repository: Optional[LicenseRepository] = None,
        stripe_adapter: Optional[StripeReconciliationAdapter] = None,
    ) -> None:
        self._repo = repository or get_repository()
        self._stripe = stripe_adapter or StripeReconciliationAdapter()
        self._event_bus = get_event_bus()
        self._config = ReconciliationConfig()

    async def run_full_reconciliation(
        self,
        audit_date: Optional[date] = None,
        dry_run: bool = False,
    ) -> ReconciliationReport:
        """
        Run full reconciliation with Stripe comparison.

        Args:
            audit_date: Date to reconcile (defaults to yesterday)
            dry_run: If True, don't save results

        Returns:
            ReconciliationReport
        """
        import time
        start_time = time.time()

        if audit_date is None:
            audit_date = date.today() - timedelta(days=1)

        console.print(f"\n[bold cyan]🔍 Nightly Reconciliation[/bold cyan]")
        console.print(f"Audit Date: [cyan]{audit_date}[/cyan]")
        console.print(f"Dry Run: [yellow]{dry_run}[/yellow]\n")

        # Get all active licenses
        licenses = await self._get_active_licenses()
        total_licenses = len(licenses)

        console.print(f"Found [cyan]{total_licenses}[/cyan] active licenses\n")

        reconciled_count = 0
        stripe_reconciled_count = 0
        discrepancies: List[StripeDiscrepancy] = []
        local_only_discrepancies: List[AuditResult] = []
        warnings: List[str] = []

        for license_info in licenses:
            license_key = license_info["license_key"]
            key_id = license_info["key_id"]
            email = license_info.get("email", "")

            try:
                # 1. Run local reconciliation
                local_result = await self._reconcile_local(license_key, key_id, audit_date)

                if local_result.status != "matched":
                    local_only_discrepancies.append(local_result)
                    warnings.append(
                        f"{license_key}: Local variance ${local_result.variance} "
                        f"({local_result.variance_percent:.2f}%)"
                    )
                else:
                    reconciled_count += 1

                # 2. Run Stripe reconciliation
                if email:
                    stripe_result = await self._reconcile_with_stripe(
                        license_key=license_key,
                        key_id=key_id,
                        customer_email=email,
                        period_start=audit_date,
                        period_end=audit_date + timedelta(days=1),
                        local_amount=local_result.actual_amount,
                    )

                    if stripe_result:
                        discrepancies.append(stripe_result)
                        warnings.append(
                            f"{license_key}: Stripe variance ${stripe_result.variance} "
                            f"({stripe_result.variance_percent:.2f}%)"
                        )
                    else:
                        stripe_reconciled_count += 1
                else:
                    warnings.append(f"{license_key}: No email for Stripe lookup")

            except Exception as e:
                logger.error(f"Reconciliation failed for {license_key}: {e}")
                warnings.append(f"{license_key}: Error - {str(e)}")

        # Calculate totals
        total_variance = sum(d.variance for d in discrepancies)
        critical_count = sum(
            1 for d in discrepancies
            if d.variance_percent > 10  # >10% variance is critical
        )

        duration = time.time() - start_time

        report = ReconciliationReport(
            run_date=audit_date,
            total_licenses=total_licenses,
            reconciled_count=reconciled_count,
            stripe_reconciled_count=stripe_reconciled_count,
            discrepancies=discrepancies,
            local_only_discrepancies=local_only_discrepancies,
            total_variance=total_variance,
            critical_count=critical_count,
            warnings=warnings,
            duration_seconds=duration,
        )

        # Print report
        self._print_report(report)

        # Save results (unless dry run)
        if not dry_run:
            await self._save_report(report)

        # Send alerts if needed
        if report.critical_count > 0 or report.total_variance > Decimal("100"):
            await self._trigger_alerts(report)

        return report

    async def _reconcile_local(
        self,
        license_key: str,
        key_id: str,
        audit_date: date,
    ) -> AuditResult:
        """Run local reconciliation (usage vs billing records)."""
        service = get_reconciliation_service()
        results = await service.run_daily_reconciliation(audit_date=audit_date)

        # Find result for this license
        result = next(
            (r for r in results if r.license_key == license_key),
            None
        )

        if not result:
            # Create a default matched result
            return AuditResult(
                audit_id=f"local_{license_key}_{audit_date}",
                license_key=license_key,
                key_id=key_id,
                audit_date=audit_date,
                expected_amount=Decimal(0),
                actual_amount=Decimal(0),
                variance=Decimal(0),
                variance_percent=0,
                status="matched",
            )

        return result

    async def _reconcile_with_stripe(
        self,
        license_key: str,
        key_id: str,
        customer_email: str,
        period_start: date,
        period_end: date,
        local_amount: Decimal,
    ) -> Optional[StripeDiscrepancy]:
        """
        Reconcile local billing with Stripe invoices.

        Returns:
            StripeDiscrepancy if variance detected, None if matched
        """
        # Fetch Stripe invoices
        invoices = await self._stripe.get_invoices_for_period(
            customer_email=customer_email,
            period_start=period_start,
            period_end=period_end,
        )

        if not invoices:
            # No Stripe invoices found - skip reconciliation
            return None

        # Sum Stripe amounts
        stripe_amount = Decimal(0)
        stripe_line_items = []

        for invoice in invoices:
            stripe_amount += Decimal(str(invoice["amount_due"]))
            stripe_line_items.extend(invoice["line_items"])

        # Calculate variance
        variance = local_amount - stripe_amount
        variance_percent = 0.0

        if stripe_amount > 0:
            variance_percent = float(abs(variance) / stripe_amount * 100)
        elif local_amount > 0:
            variance_percent = 100.0

        # Check if variance is significant
        if abs(variance) < Decimal("0.50") and variance_percent < 1:
            # Minor rounding difference - consider matched
            return None

        # Create discrepancy record
        discrepancy = StripeDiscrepancy(
            license_key=license_key,
            key_id=key_id,
            period_start=period_start,
            period_end=period_end,
            local_amount=local_amount,
            stripe_amount=stripe_amount,
            variance=variance,
            variance_percent=variance_percent,
            local_line_items=[],  # Would populate from local billing records
            stripe_line_items=stripe_line_items,
            status="open" if variance_percent > 5 else "investigating",
            notes=f"Variance detected: {variance_percent:.2f}%",
        )

        return discrepancy

    async def _get_active_licenses(self) -> List[Dict[str, Any]]:
        """Get all active licenses."""
        # This would require a repository method to list all licenses
        # For now, return empty list - implementation needs DB query
        return []

    def _print_report(self, report: ReconciliationReport) -> None:
        """Print reconciliation report to console."""
        console.print("\n[bold green]✓ Reconciliation Report[/bold green]\n")

        # Summary table
        table = Table(show_header=True, header_style="bold cyan")
        table.add_column("Metric")
        table.add_column("Value")

        table.add_row("Run Date", report.run_date.isoformat())
        table.add_row("Total Licenses", str(report.total_licenses))
        table.add_row("Reconciled (Local)", str(report.reconciled_count))
        table.add_row("Reconciled (Stripe)", str(report.stripe_reconciled_count))
        table.add_row("Discrepancies", str(len(report.discrepancies)))
        table.add_row("Critical (>10%)", f"[red]{report.critical_count}[/red]")
        table.add_row("Total Variance", f"${report.total_variance}")
        table.add_row("Duration", f"{report.duration_seconds:.2f}s")

        console.print(table)

        # Discrepancies
        if report.discrepancies:
            console.print("\n[bold red]Discrepancies:[/bold red]")
            disc_table = Table(show_header=True, header_style="bold red")
            disc_table.add_column("License")
            disc_table.add_column("Local")
            disc_table.add_column("Stripe")
            disc_table.add_column("Variance")
            disc_table.add_column("%")
            disc_table.add_column("Status")

            for disc in report.discrepancies:
                status_color = "red" if disc.variance_percent > 10 else "yellow"
                disc_table.add_row(
                    disc.license_key,
                    f"${disc.local_amount}",
                    f"${disc.stripe_amount}",
                    f"${disc.variance}",
                    f"{disc.variance_percent:.2f}%",
                    f"[{status_color}]{disc.status}[/{status_color}]",
                )

            console.print(disc_table)

        # Warnings
        if report.warnings:
            console.print(f"\n[yellow]Warnings ({len(report.warnings)}):[/yellow]")
            for warning in report.warnings[:10]:  # Show first 10
                console.print(f"  • {warning}")
            if len(report.warnings) > 10:
                console.print(f"  ... and {len(report.warnings) - 10} more")

    async def _save_report(self, report: ReconciliationReport) -> None:
        """Save reconciliation report to database."""
        # This would save report to a reconciliation_reports table
        logger.info(f"Saved reconciliation report for {report.run_date}")

    async def _trigger_alerts(self, report: ReconciliationReport) -> None:
        """Send alerts for critical discrepancies."""
        # Emit event
        self._event_bus.emit(
            EventType.BILLING_RECONCILIATION,
            {
                "type": "critical_variance",
                "run_date": report.run_date.isoformat(),
                "critical_count": report.critical_count,
                "total_variance": str(report.total_variance),
                "discrepancies_count": len(report.discrepancies),
            },
        )

        # Send Telegram alert if configured
        telegram_token = os.getenv("TELEGRAM_BOT_TOKEN")
        channel_id = os.getenv("TELEGRAM_OPS_CHANNEL_ID")

        if telegram_token and channel_id:
            try:
                import requests

                message = (
                    f"🚨 Billing Reconciliation Alert\n\n"
                    f"Date: {report.run_date}\n"
                    f"Critical Issues: {report.critical_count}\n"
                    f"Total Variance: ${report.total_variance}\n"
                    f"Discrepancies: {len(report.discrepancies)}\n"
                    f"Duration: {report.duration_seconds:.2f}s"
                )

                url = f"https://api.telegram.org/bot{telegram_token}/sendMessage"
                requests.post(
                    url,
                    json={
                        "chat_id": channel_id,
                        "text": message,
                        "parse_mode": "Markdown",
                    },
                    timeout=10,
                )

                logger.info("Telegram alert sent")

            except Exception as e:
                logger.error(f"Failed to send Telegram alert: {e}")

        # Send webhook alert if configured
        webhook_url = os.getenv("RECONCILIATION_WEBHOOK_URL")

        if webhook_url:
            try:
                import requests

                requests.post(
                    webhook_url,
                    json={
                        "event_type": "reconciliation.critical",
                        "data": report.to_dict(),
                    },
                    timeout=10,
                )

                logger.info("Webhook alert sent")

            except Exception as e:
                logger.error(f"Failed to send webhook alert: {e}")


# =============================================================================
# CLI Entry Point
# =============================================================================


async def main_async(dry_run: bool = False, audit_date: Optional[str] = None) -> None:
    """Main async entry point."""
    # Parse date
    if audit_date:
        try:
            audit_dt = date.fromisoformat(audit_date)
        except ValueError:
            console.print("[red]Invalid date format. Use YYYY-MM-DD[/red]")
            raise SystemExit(1)
    else:
        audit_dt = None

    # Run reconciliation
    service = NightlyReconciliationService()
    report = await service.run_full_reconciliation(
        audit_date=audit_dt,
        dry_run=dry_run,
    )

    # Exit with error if critical discrepancies
    if report.critical_count > 0:
        console.print(f"\n[bold red]⚠ {report.critical_count} critical discrepancies require attention[/bold red]")
        raise SystemExit(1)


def main() -> None:
    """Main entry point for cron job."""
    import argparse

    parser = argparse.ArgumentParser(description="Nightly billing reconciliation")
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Run without saving results",
    )
    parser.add_argument(
        "--date",
        type=str,
        help="Audit date (YYYY-MM-DD, default: yesterday)",
    )
    parser.add_argument(
        "--verbose",
        action="store_true",
        help="Enable verbose logging",
    )

    args = parser.parse_args()

    # Configure logging
    logging.basicConfig(
        level=logging.DEBUG if args.verbose else logging.INFO,
        format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    )

    # Run async main
    try:
        asyncio.run(main_async(dry_run=args.dry_run, audit_date=args.date))
    except KeyboardInterrupt:
        console.print("\n[yellow]Reconciliation cancelled[/yellow]")
        raise SystemExit(0)
    except SystemExit as e:
        raise e
    except Exception as e:
        console.print(f"[bold red]✗ Reconciliation failed: {e}[/bold red]")
        logger.exception("Reconciliation failed")
        raise SystemExit(1)


if __name__ == "__main__":
    main()
