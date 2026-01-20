"""
Technical SEO Agent Facade.
"""
from typing import Dict

from .engine import SEOEngine
from .models import CoreWebVitals, IssueSeverity, IssueType, SEOIssue


class TechnicalSEOAgent(SEOEngine):
    """Refactored Technical SEO Agent."""
    def __init__(self):
        super().__init__()
        self.name = "Technical SEO"
        self.status = "ready"

    def get_stats(self) -> Dict:
        return {"total_issues": len(self.issues), "health_score": 85}

__all__ = ['TechnicalSEOAgent', 'IssueSeverity', 'IssueType', 'SEOIssue', 'CoreWebVitals']
精
