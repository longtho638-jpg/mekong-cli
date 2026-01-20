"""
🎨 ContentFactory - High-Velocity Production Engine
===================================================

Automates the generation of strategic, localized content for multiple channels.
Bridges the gap between raw data and audience engagement by applying
specialized templates and regional tones.

Capabilities:
- Viral Idea Ingestion: Niche-specific brainstorming.
- Multi-Platform Mapping: FB, TikTok, Zalo, Blog, Email.
- Script & Copywriting: Template-driven drafting.
- Publishing Orchestration: Calendar scheduling.

Binh Pháp: ⚡ Thế Trận (Momentum) - Maintaining a continuous flow of influence.

NOTE: This is a facade for backward compatibility.
The actual implementation has been moved to antigravity.core.content_factory package.
"""

from antigravity.core.content_factory import (
    ContentFactory,
    ContentIdea,
    ContentPiece,
    ContentStatus,
    ContentType,
    content_factory,
    get_content_factory,
)

__all__ = [
    "ContentFactory",
    "ContentIdea",
    "ContentPiece",
    "ContentStatus",
    "ContentType",
    "content_factory",
    "get_content_factory",
]
