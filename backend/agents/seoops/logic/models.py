"""
Technical SEO Agent Data Models.
"""
from dataclasses import dataclass
from enum import Enum
from typing import List, Optional


class IssueSeverity(Enum):
    CRITICAL = "critical"
    WARNING = "warning"
    INFO = "info"

class IssueType(Enum):
    BROKEN_LINK = "broken_link"
    REDIRECT_CHAIN = "redirect_chain"
    MISSING_META = "missing_meta"
    SLOW_PAGE = "slow_page"

@dataclass
class SEOIssue:
    id: str
    url: str
    issue_type: IssueType
    severity: IssueSeverity
    description: str
    is_fixed: bool = False

@dataclass
class CoreWebVitals:
    lcp: float
    fid: float
    cls: float

    @property
    def overall_status(self) -> str:
        if self.lcp <= 2.5 and self.fid <= 100 and self.cls <= 0.1: return "good"
        return "needs_improvement"
