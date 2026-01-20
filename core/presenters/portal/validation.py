"""
Validation logic for Client Portal data.
"""
from typing import Any, Dict, List


class PortalValidator:
    def validate_client_data(self, name: str, email: str, company: str) -> List[str]:
        errors = []
        if not name or len(name.strip()) < 2: errors.append("Client name must be at least 2 characters")
        if not email or "@" not in email: errors.append("Valid email address is required")
        if not company or len(company.strip()) < 2: errors.append("Company name must be at least 2 characters")
        return errors

    def validate_project_data(self, name: str, description: str, budget: float) -> List[str]:
        errors = []
        if not name or len(name.strip()) < 2: errors.append("Project name must be at least 2 characters")
        if not description or len(description.strip()) < 10: errors.append("Project description must be at least 10 characters")
        if budget < 0: errors.append("Budget cannot be negative")
        return errors

    def validate_invoice_data(self, amount: float, items: List[Dict[str, Any]]) -> List[str]:
        errors = []
        if amount <= 0: errors.append("Invoice amount must be greater than 0")
        if not items: errors.append("Invoice must have at least one item")
        total = sum(item.get("amount", 0) for item in items)
        if abs(total - amount) > 0.01: errors.append(f"Item amounts (${total:.2f}) must equal invoice amount (${amount:.2f})")
        return errors
