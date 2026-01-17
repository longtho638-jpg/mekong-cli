from dataclasses import dataclass
from typing import Optional

@dataclass
class ContractTemplate:
    """Defines the structure for a service contract template."""
    key: str
    title: str
    price: int
    term: str
    scope: str
    equity: Optional[str] = None

    @property
    def formatted_price(self) -> str:
        return f"${self.price:,}"
