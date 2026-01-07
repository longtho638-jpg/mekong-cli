"""
Use Case: Create Invoice
Business logic for creating invoice.

Clean Architecture Layer: Use Cases
"""

from core.entities.invoice import Invoice


class CreateInvoiceUseCase:
    """Use case for creating invoice."""
    
    def execute(self, name: str) -> Invoice:
        """Create new invoice."""
        # Add validation here
        return Invoice(name=name)
