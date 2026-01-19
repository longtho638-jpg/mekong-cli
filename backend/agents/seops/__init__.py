"""
SEOps Agents Package
Demo Manager + POC Tracker
"""

from .demo_manager_agent import Demo, DemoManagerAgent, DemoOutcome, DemoType
from .poc_tracker_agent import POC, POCStage, POCTrackerAgent, SuccessCriterion

__all__ = [
    # Demo Manager
    "DemoManagerAgent",
    "Demo",
    "DemoType",
    "DemoOutcome",
    # POC Tracker
    "POCTrackerAgent",
    "POC",
    "POCStage",
    "SuccessCriterion",
]
