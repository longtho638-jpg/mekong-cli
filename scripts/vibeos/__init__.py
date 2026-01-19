"""
VibeOS - Hybrid Vibe Coding + Vibe Marketing + Vibe Agency
==========================================================

One IDE to Rule Them All - Antigravity Powered

Usage:
    from scripts.vibeos import VibeOSOrchestrator

    orchestrator = VibeOSOrchestrator()
    result = await orchestrator.execute("/money")

Commands:
    /money   - Revenue generation
    /build   - Code + Test + Deploy
    /client  - Client onboarding
    /content - Content production
    /win     - WIN-WIN-WIN validation
    /ship    - Ship code
    /help    - Show help
"""

from scripts.vibeos.agency_engine import ClientPackage, VibeAgencyEngine, WinDecision
from scripts.vibeos.coding_engine import BuildResult, VibeCodingEngine
from scripts.vibeos.marketing_engine import ContentPackage, LeadPackage, VibeMarketingEngine
from scripts.vibeos.orchestrator import SimpleOutput, VibeOSOrchestrator

__all__ = [
    "VibeOSOrchestrator",
    "SimpleOutput",
    "VibeCodingEngine",
    "BuildResult",
    "VibeMarketingEngine",
    "ContentPackage",
    "LeadPackage",
    "VibeAgencyEngine",
    "ClientPackage",
    "WinDecision",
]

__version__ = "1.0.0"
