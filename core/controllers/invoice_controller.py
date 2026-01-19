"""
Controller: Invoice
Handles HTTP requests for invoice operations.

Clean Architecture Layer: Controllers
"""

from typing import Any, Dict

from core.use_cases.create_invoice import CreateInvoiceUseCase


class InvoiceController:
    """Controller for invoice operations."""

    def __init__(self):
        self.create_use_case = CreateInvoiceUseCase()

    def create(self, request_data: Dict[str, Any]) -> Dict[str, Any]:
        """Handle create request."""
        try:
            name = request_data.get("name", "")
            entity = self.create_use_case.execute(name)

            return {"success": True, "data": {"id": entity.id, "name": entity.name}}
        except Exception as e:
            return {"success": False, "error": str(e)}
