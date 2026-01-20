"""
📄 Proposal Generator Models
===========================

Data models for the Proposal Generator system.
"""

from antigravity.core.money_maker import Quote
from dataclasses import dataclass, field
from datetime import datetime, timedelta


@dataclass
class Proposal:
    """A generated client-ready proposal document."""

    id: int
    client_name: str
    client_contact: str
    quote: Quote
    markdown_content: str
    created_at: datetime = field(default_factory=datetime.now)
    valid_until: datetime = field(default_factory=lambda: datetime.now() + timedelta(days=30))
    status: str = "draft"
