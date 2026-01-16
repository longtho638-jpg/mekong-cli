"""
SEOps Agents Package
Demo Manager + POC Tracker
"""

from .demo_manager_agent import DemoManagerAgent, Demo, DemoType, DemoOutcome
from .poc_tracker_agent import POCTrackerAgent, POC, POCStage, SuccessCriterion

__all__ = [
    # Demo Manager
    "DemoManagerAgent", "Demo", "DemoType", "DemoOutcome",
    # POC Tracker
    "POCTrackerAgent", "POC", "POCStage", "SuccessCriterion",
]
