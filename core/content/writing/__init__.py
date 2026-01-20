"""
Content Writer Facade.
"""
from .engine import WritingEngine
from .models import ContentPiece, ContentStatus, ContentType


class ContentWriter(WritingEngine):
    def __init__(self, agency_name: str):
        super().__init__(agency_name)

    def format_dashboard(self) -> str:
        return f"✍️ Content Writer Dashboard - {self.agency_name}"

__all__ = ['ContentWriter', 'ContentType', 'ContentStatus', 'ContentPiece']
