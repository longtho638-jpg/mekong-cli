"""
Backend Agents Package
Quad-Agent System for Marketing Automation
"""

from .community import CommunityAgent, Platform, ScheduledPost
from .director import DirectorAgent, VideoAsset, VideoScript
from .editor import ContentDraft, EditorAgent
from .scout import IntelBrief, ScoutAgent, TrendItem

__all__ = [
    # Scout
    "ScoutAgent",
    "TrendItem",
    "IntelBrief",
    # Editor
    "EditorAgent",
    "ContentDraft",
    # Director
    "DirectorAgent",
    "VideoScript",
    "VideoAsset",
    # Community
    "CommunityAgent",
    "ScheduledPost",
    "Platform",
]
