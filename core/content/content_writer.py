"""
✍️ Content Writer - Professional Writing (Proxy)
===========================================
This file is now a proxy for the modularized version in ./writing/
Please import from core.content.writing instead.
"""
import warnings

from .writing import ContentStatus, ContentType, ContentWriter

# Issue a deprecation warning
warnings.warn(
    "core.content.content_writer is deprecated. "
    "Use core.content.writing instead.",
    DeprecationWarning,
    stacklevel=2
)
