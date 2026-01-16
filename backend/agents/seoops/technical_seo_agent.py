"""
Technical SEO Agent - Site Audits & Core Web Vitals
Manages technical SEO audits, crawlability, and performance.
"""

from dataclasses import dataclass
from typing import List, Dict, Optional
from enum import Enum
import random


class IssueSeverity(Enum):
    CRITICAL = "critical"
    WARNING = "warning"
    INFO = "info"


class IssueType(Enum):
    BROKEN_LINK = "broken_link"
    REDIRECT_CHAIN = "redirect_chain"
    MISSING_META = "missing_meta"
    SLOW_PAGE = "slow_page"
    MISSING_ALT = "missing_alt"
    DUPLICATE_CONTENT = "duplicate_content"
    MISSING_SCHEMA = "missing_schema"
    MOBILE_ISSUE = "mobile_issue"


@dataclass
class SEOIssue:
    """SEO audit issue"""
    id: str
    url: str
    issue_type: IssueType
    severity: IssueSeverity
    description: str
    is_fixed: bool = False


@dataclass
class CoreWebVitals:
    """Core Web Vitals metrics"""
    lcp: float  # Largest Contentful Paint (seconds)
    fid: float  # First Input Delay (ms)
    cls: float  # Cumulative Layout Shift

    @property
    def lcp_status(self) -> str:
        if self.lcp <= 2.5: return "good"
        if self.lcp <= 4.0: return "needs_improvement"
        return "poor"

    @property
    def fid_status(self) -> str:
        if self.fid <= 100: return "good"
        if self.fid <= 300: return "needs_improvement"
        return "poor"

    @property
    def cls_status(self) -> str:
        if self.cls <= 0.1: return "good"
        if self.cls <= 0.25: return "needs_improvement"
        return "poor"

    @property
    def overall_status(self) -> str:
        statuses = [self.lcp_status, self.fid_status, self.cls_status]
        if all(s == "good" for s in statuses): return "good"
        if "poor" in statuses: return "poor"
        return "needs_improvement"


class TechnicalSEOAgent:
    """
    Technical SEO Agent - Kiểm tra Kỹ thuật SEO
    
    Responsibilities:
    - Site audit (404s, redirects)
    - Crawlability check
    - Core Web Vitals
    - Schema markup validation
    """

    def __init__(self):
        self.name = "Technical SEO"
        self.status = "ready"
        self.issues: List[SEOIssue] = []
        self.vitals: Optional[CoreWebVitals] = None

    def run_audit(self, domain: str) -> List[SEOIssue]:
        """Run site audit"""
        self.issues = []

        # Simulate finding issues
        issue_samples = [
            (IssueType.BROKEN_LINK, IssueSeverity.CRITICAL, "404 Not Found"),
            (IssueType.REDIRECT_CHAIN, IssueSeverity.WARNING, "Multiple redirects detected"),
            (IssueType.MISSING_META, IssueSeverity.WARNING, "Missing meta description"),
            (IssueType.SLOW_PAGE, IssueSeverity.WARNING, "Page load > 3s"),
            (IssueType.MISSING_ALT, IssueSeverity.INFO, "Image missing alt text"),
            (IssueType.MISSING_SCHEMA, IssueSeverity.INFO, "No structured data"),
        ]

        num_issues = random.randint(3, 8)
        for i in range(num_issues):
            sample = random.choice(issue_samples)
            issue = SEOIssue(
                id=f"issue_{i+1}",
                url=f"https://{domain}/page-{random.randint(1,50)}",
                issue_type=sample[0],
                severity=sample[1],
                description=sample[2]
            )
            self.issues.append(issue)

        return self.issues

    def check_core_web_vitals(self, url: str) -> CoreWebVitals:
        """Check Core Web Vitals"""
        self.vitals = CoreWebVitals(
            lcp=random.uniform(1.0, 5.0),
            fid=random.uniform(50, 400),
            cls=random.uniform(0.01, 0.35)
        )
        return self.vitals

    def fix_issue(self, issue_id: str) -> SEOIssue:
        """Mark issue as fixed"""
        issue = next((i for i in self.issues if i.id == issue_id), None)
        if issue:
            issue.is_fixed = True
        return issue

    def get_health_score(self) -> int:
        """Calculate overall site health score 0-100"""
        if not self.issues:
            return 100

        # Deduct points based on severity
        deductions = 0
        for issue in self.issues:
            if issue.is_fixed:
                continue
            if issue.severity == IssueSeverity.CRITICAL:
                deductions += 15
            elif issue.severity == IssueSeverity.WARNING:
                deductions += 5
            else:
                deductions += 2

        return max(0, 100 - deductions)

    def get_stats(self) -> Dict:
        """Get audit statistics"""
        critical = len([i for i in self.issues if i.severity == IssueSeverity.CRITICAL and not i.is_fixed])
        warnings = len([i for i in self.issues if i.severity == IssueSeverity.WARNING and not i.is_fixed])

        return {
            "health_score": self.get_health_score(),
            "total_issues": len(self.issues),
            "critical": critical,
            "warnings": warnings,
            "vitals_status": self.vitals.overall_status if self.vitals else "unknown"
        }


# Demo
if __name__ == "__main__":
    agent = TechnicalSEOAgent()

    print("🔧 Technical SEO Agent Demo\n")

    # Run audit
    issues = agent.run_audit("mekong.io")
    print(f"📋 Audit found: {len(issues)} issues")

    # Show critical issues
    critical = [i for i in issues if i.severity == IssueSeverity.CRITICAL]
    print(f"\n🚨 Critical Issues: {len(critical)}")
    for issue in critical:
        print(f"   [{issue.issue_type.value}] {issue.url}")
        print(f"   → {issue.description}")

    # Check Core Web Vitals
    vitals = agent.check_core_web_vitals("https://mekong.io")
    print(f"\n⚡ Core Web Vitals: {vitals.overall_status.upper()}")
    print(f"   LCP: {vitals.lcp:.2f}s ({vitals.lcp_status})")
    print(f"   FID: {vitals.fid:.0f}ms ({vitals.fid_status})")
    print(f"   CLS: {vitals.cls:.3f} ({vitals.cls_status})")

    # Health score
    print(f"\n💚 Health Score: {agent.get_health_score()}/100")
