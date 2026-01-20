"""
🎨 Content Factory Module
=========================

Automates the generation of strategic, localized content for multiple channels.
"""

from .engine import ContentFactory, get_content_factory
from .models import ContentIdea, ContentPiece, ContentStatus, ContentType

# Create global instance for backward compatibility
content_factory = get_content_factory()

__all__ = [
    "ContentFactory",
    "ContentIdea",
    "ContentPiece",
    "ContentStatus",
    "ContentType",
    "content_factory",
    "get_content_factory",
]
