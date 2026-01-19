"""
Billing handler for financial operations.
Manages invoices, proposals, and revenue tracking.
"""

from typing import List


class BillingHandler:
    """Handles billing and financial operations."""

    def execute(self, args: List[str]) -> None:
        """Execute billing operations."""
        if not args:
            self._show_menu()
            return

        operation = args[0].lower()

        if operation == "invoice":
            self._create_invoice(args[1:])
        elif operation == "proposal":
            self._create_proposal(args[1:])
        elif operation == "stats":
            self._show_stats()
        else:
            self.print_error(f"Unknown billing operation: {operation}")

    def _show_menu(self) -> None:
        """Show billing menu."""
        print("\n💰 BILLING HUB")
        print("═" * 60)
        print("Commands:")
        print("  billing invoice     → Create invoice")
        print("  billing proposal    → Generate proposal")
        print("  billing stats        → Dashboard")

    def _create_invoice(self, args: List[str]) -> None:
        """Create new invoice."""
        print("\n💳 Invoice Generator")
        print("-" * 50)

        try:
            from core.modules.invoice import InvoiceSystem

            system = InvoiceSystem()
            summary = system.get_summary()

            print(f"Total: {summary['total_invoices']}")
            print(f"Paid: {summary['paid']}")
            print(f"Pending: {summary['pending']}")
        except ImportError:
            print("❌ Invoice module not found.")

    def _create_proposal(self, args: List[str]) -> None:
        """Create new proposal."""
        print("\n📝 Proposal Generator")
        print("-" * 50)

        try:
            from core.modules.proposal import ProposalGenerator, ServiceTier

            generator = ProposalGenerator(
                agency_name="Your Agency",
                niche="Digital Marketing",
                location="Your City",
                skill="Your Skill",
            )

            proposal = generator.create_proposal(
                client_name="Demo Client",
                client_company="Demo Company",
                client_email="demo@example.com",
                tiers=[ServiceTier.GROWTH],
            )

            print(generator.format_proposal(proposal))
        except ImportError:
            print("❌ Proposal module not found.")

    def _show_stats(self) -> None:
        """Show billing statistics."""
        print("\n📊 Billing Statistics")
        print("-" * 50)
        print("MRR: $5,000")
        print("ARR: $60,000")
        print("Growth: +15%")

    def print_error(self, message: str) -> None:
        """Print error message."""
        print(f"❌ {message}")
