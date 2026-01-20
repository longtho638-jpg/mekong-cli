"""
Technical SEO Agent engine logic.
"""
import random
from typing import Dict, List, Optional

from .models import CoreWebVitals, IssueSeverity, IssueType, SEOIssue


class SEOEngine:
    def __init__(self):
        self.issues: List[SEOIssue] = []
        self.vitals: Optional[CoreWebVitals] = None

    def run_audit(self, domain: str) -> List[SEOIssue]:
        self.issues = []
        for i in range(random.randint(3, 5)):
            self.issues.append(SEOIssue(id=f"issue_{i}", url=f"https://{domain}/p{i}", issue_type=IssueType.BROKEN_LINK, severity=IssueSeverity.WARNING, description="Audit issue"))
        return self.issues

    def check_vitals(self, url: str) -> CoreWebVitals:
        self.vitals = CoreWebVitals(lcp=random.uniform(1.0, 3.0), fid=random.uniform(50, 150), cls=random.uniform(0.01, 0.15))
        return self.vitals
