"""
Entity: Invoice
Core data structure for invoice.

Clean Architecture Layer: Entities
"""

from dataclasses import dataclass
from typing import Optional


@dataclass
class Invoice:
    """Core invoice entity."""

    id: Optional[int] = None
    name: str = ""
    # Add your fields here
