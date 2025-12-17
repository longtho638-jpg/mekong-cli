"""
🧪 QA Engineer - Quality Assurance
====================================

Ensure software quality and reliability.
Bug-free experiences!

Roles:
- Test planning
- Bug tracking
- Automation testing
- Quality metrics
"""

from typing import Dict, List, Any, Optional
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from enum import Enum
import uuid


class BugSeverity(Enum):
    """Bug severity levels."""
    CRITICAL = "critical"
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"


class BugStatus(Enum):
    """Bug status."""
    NEW = "new"
    CONFIRMED = "confirmed"
    IN_PROGRESS = "in_progress"
    FIXED = "fixed"
    VERIFIED = "verified"
    CLOSED = "closed"


class TestType(Enum):
    """Test types."""
    UNIT = "unit"
    INTEGRATION = "integration"
    E2E = "e2e"
    PERFORMANCE = "performance"
    SECURITY = "security"
    UAT = "uat"


@dataclass
class Bug:
    """A bug report."""
    id: str
    project: str
    title: str
    severity: BugSeverity
    status: BugStatus = BugStatus.NEW
    reported_by: str = ""
    assigned_to: str = ""
    created_at: datetime = field(default_factory=datetime.now)
    resolved_at: Optional[datetime] = None


@dataclass
class TestRun:
    """A test run."""
    id: str
    project: str
    test_type: TestType
    total_tests: int
    passed: int
    failed: int
    skipped: int = 0
    duration_seconds: int = 0
    run_at: datetime = field(default_factory=datetime.now)


class QAEngineer:
    """
    QA Engineer System.
    
    Quality assurance workflow.
    """
    
    def __init__(self, agency_name: str):
        self.agency_name = agency_name
        self.bugs: Dict[str, Bug] = {}
        self.test_runs: List[TestRun] = []
    
    def report_bug(
        self,
        project: str,
        title: str,
        severity: BugSeverity,
        reported_by: str = ""
    ) -> Bug:
        """Report a bug."""
        bug = Bug(
            id=f"BUG-{uuid.uuid4().hex[:6].upper()}",
            project=project,
            title=title,
            severity=severity,
            reported_by=reported_by
        )
        self.bugs[bug.id] = bug
        return bug
    
    def update_bug(self, bug: Bug, status: BugStatus, assigned_to: str = ""):
        """Update bug status."""
        bug.status = status
        if assigned_to:
            bug.assigned_to = assigned_to
        if status == BugStatus.CLOSED:
            bug.resolved_at = datetime.now()
    
    def run_tests(
        self,
        project: str,
        test_type: TestType,
        total: int,
        passed: int,
        failed: int,
        duration: int = 0
    ) -> TestRun:
        """Record a test run."""
        run = TestRun(
            id=f"TST-{uuid.uuid4().hex[:6].upper()}",
            project=project,
            test_type=test_type,
            total_tests=total,
            passed=passed,
            failed=failed,
            skipped=total - passed - failed,
            duration_seconds=duration
        )
        self.test_runs.append(run)
        return run
    
    def get_open_bugs(self) -> List[Bug]:
        """Get open bugs."""
        return [b for b in self.bugs.values() if b.status not in [BugStatus.VERIFIED, BugStatus.CLOSED]]
    
    def get_stats(self) -> Dict[str, Any]:
        """Get QA statistics."""
        open_bugs = len(self.get_open_bugs())
        critical = sum(1 for b in self.bugs.values() if b.severity == BugSeverity.CRITICAL and b.status != BugStatus.CLOSED)
        
        if self.test_runs:
            total_tests = sum(r.total_tests for r in self.test_runs)
            total_passed = sum(r.passed for r in self.test_runs)
            pass_rate = (total_passed / total_tests * 100) if total_tests else 0
        else:
            pass_rate = 0
        
        return {
            "total_bugs": len(self.bugs),
            "open_bugs": open_bugs,
            "critical_bugs": critical,
            "test_runs": len(self.test_runs),
            "pass_rate": pass_rate
        }
    
    def format_dashboard(self) -> str:
        """Format QA dashboard."""
        stats = self.get_stats()
        
        lines = [
            "╔═══════════════════════════════════════════════════════════╗",
            f"║  🧪 QA ENGINEER                                           ║",
            f"║  {stats['total_bugs']} bugs │ {stats['open_bugs']} open │ {stats['pass_rate']:.0f}% pass rate    ║",
            "╠═══════════════════════════════════════════════════════════╣",
            "║  🐛 BUG TRACKER                                           ║",
            "║  ─────────────────────────────────────────────────────── ║",
        ]
        
        severity_icons = {"critical": "🔴", "high": "🟠", "medium": "🟡", "low": "🟢"}
        status_icons = {"new": "🆕", "confirmed": "✅", "in_progress": "🔄", 
                       "fixed": "🔧", "verified": "✅", "closed": "📁"}
        
        for bug in list(self.get_open_bugs())[:5]:
            sev_icon = severity_icons.get(bug.severity.value, "⚪")
            st_icon = status_icons.get(bug.status.value, "⚪")
            
            lines.append(f"║  {sev_icon} {st_icon} {bug.title[:22]:<22} │ {bug.project[:12]:<12}  ║")
        
        lines.extend([
            "║                                                           ║",
            "║  📊 RECENT TEST RUNS                                      ║",
            "║  ─────────────────────────────────────────────────────── ║",
        ])
        
        type_icons = {"unit": "🔬", "integration": "🔗", "e2e": "🌐", 
                     "performance": "⚡", "security": "🔒", "uat": "👤"}
        
        for run in self.test_runs[-4:]:
            t_icon = type_icons.get(run.test_type.value, "🧪")
            pass_rate = (run.passed / run.total_tests * 100) if run.total_tests else 0
            bar = "█" * int(pass_rate / 20) + "░" * (5 - int(pass_rate / 20))
            
            lines.append(f"║  {t_icon} {run.project[:12]:<12} │ {bar} │ {run.passed}/{run.total_tests} ({pass_rate:.0f}%)  ║")
        
        lines.extend([
            "║                                                           ║",
            "║  📊 BY SEVERITY                                           ║",
            "║  ─────────────────────────────────────────────────────── ║",
        ])
        
        for sev in BugSeverity:
            count = sum(1 for b in self.get_open_bugs() if b.severity == sev)
            icon = severity_icons.get(sev.value, "⚪")
            lines.append(f"║    {icon} {sev.value.capitalize():<12} │ {count:>2} open bugs                ║")
        
        lines.extend([
            "║                                                           ║",
            "║  [🐛 Report Bug]  [🧪 Run Tests]  [📊 Metrics]            ║",
            "╠═══════════════════════════════════════════════════════════╣",
            f"║  🏯 {self.agency_name} - Quality first!                   ║",
            "╚═══════════════════════════════════════════════════════════╝",
        ])
        
        return "\n".join(lines)


# Example usage
if __name__ == "__main__":
    qa = QAEngineer("Saigon Digital Hub")
    
    print("🧪 QA Engineer")
    print("=" * 60)
    print()
    
    # Report bugs
    b1 = qa.report_bug("Website", "Login button not working", BugSeverity.CRITICAL, "Sarah")
    b2 = qa.report_bug("Portal", "Slow loading on mobile", BugSeverity.HIGH, "Mike")
    b3 = qa.report_bug("API", "Typo in error message", BugSeverity.LOW, "Alex")
    
    qa.update_bug(b1, BugStatus.IN_PROGRESS, "Tom")
    qa.update_bug(b3, BugStatus.CLOSED)
    
    # Run tests
    qa.run_tests("Website", TestType.UNIT, 150, 145, 5, 30)
    qa.run_tests("Website", TestType.E2E, 50, 48, 2, 180)
    qa.run_tests("API", TestType.INTEGRATION, 80, 80, 0, 60)
    
    print(qa.format_dashboard())
