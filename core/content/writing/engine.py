"""
Content Writer engine logic.
"""
import logging
import uuid
from datetime import datetime, timedelta
from typing import Dict

from .models import ContentPiece, ContentStatus, ContentType


class WritingEngine:
    def __init__(self, agency_name: str):
        self.agency_name = agency_name
        self.content: Dict[str, ContentPiece] = {}

    def create_content(self, title: str, client: str, c_type: ContentType, word_count: int) -> ContentPiece:
        p = ContentPiece(id=f"CNT-{uuid.uuid4().hex[:6].upper()}", title=title, client=client, content_type=c_type, word_count=word_count)
        self.content[p.id] = p
        return p
