"""
Backend Agents Package
Quad-Agent System for Marketing Automation
"""

from .scout import ScoutAgent, TrendItem, IntelBrief
from .editor import EditorAgent, ContentDraft
from .director import DirectorAgent, VideoScript, VideoAsset
from .community import CommunityAgent, ScheduledPost, Platform

__all__ = [
    # Scout
    "ScoutAgent", "TrendItem", "IntelBrief",
    # Editor
    "EditorAgent", "ContentDraft",
    # Director
    "DirectorAgent", "VideoScript", "VideoAsset",
    # Community
    "CommunityAgent", "ScheduledPost", "Platform",
]
