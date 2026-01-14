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

import uuid
import logging
from typing import Dict, List, Any, Optional, Union
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from enum import Enum

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class BugSeverity(Enum):
    """Degrees of critical impact for reported issues."""
    CRITICAL = "critical"
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"


class BugStatus(Enum):
    """Lifecycle status of a bug report."""
    NEW = "new"
    CONFIRMED = "confirmed"
    IN_PROGRESS = "in_progress"
    FIXED = "fixed"
    VERIFIED = "verified"
    CLOSED = "closed"


class TestType(Enum):
    """Methodologies for software validation."""
    UNIT = "unit"
    INTEGRATION = "integration"
    E2E = "e2e"
    PERFORMANCE = "performance"
    SECURITY = "security"
    UAT = "uat"


@dataclass
class Bug:
    """A software defect record entity."""
    id: str
    project: str
    title: str
    severity: BugSeverity
    status: BugStatus = BugStatus.NEW
    reported_by: str = ""
    assigned_to: str = ""
    created_at: datetime = field(default_factory=datetime.now)
    resolved_at: Optional[datetime] = None

    def __post_init__(self):
        if not self.title or not self.project:
            raise ValueError("Title and project name are mandatory")


@dataclass
class TestRun:
    """A single execution of a test suite record."""
    id: str
    project: str
    test_type: TestType
    total_tests: int
    passed: int
    failed: int
    skipped: int = 0
    duration_seconds: int = 0
    run_at: datetime = field(default_factory=datetime.now)

    def __post_init__(self):
        if self.total_tests < 0:
            raise ValueError("Test count cannot be negative")


class QAEngineer:
    """
    QA Engineer System.
    
    Orchestrates the quality control process, encompassing bug tracking, test execution, and release validation.
    """
    
    def __init__(self, agency_name: str):
        self.agency_name = agency_name
        self.bugs: Dict[str, Bug] = {}
        self.test_runs: List[TestRun] = []
        logger.info(f"QA System initialized for {agency_name}")
    
    def report_defect(
        self,
        project: str,
        title: str,
        severity: BugSeverity,
        reporter: str = "Tester AI"
    ) -> Bug:
        """Register a new software bug into the tracking system."""
        bug = Bug(
            id=f"BUG-{uuid.uuid4().hex[:6].upper()}",
            project=project, title=title,
            severity=severity, reported_by=reporter
        )
        self.bugs[bug.id] = bug
        logger.warning(f"Defect Reported: {title} [{severity.value}] in {project}")
        return bug
    
    def run_suite(
        self,
        project: str,
        t_type: TestType,
        passed: int,
        failed: int,
        duration: int = 0
    ) -> TestRun:
        """Log the results of a suite execution."""
        total = passed + failed
        run = TestRun(
            id=f"TST-{uuid.uuid4().hex[:6].upper()}",
            project=project, test_type=t_type,
            total_tests=total, passed=passed, failed=failed,
            duration_seconds=duration
        )
        self.test_runs.append(run)
        logger.info(f"Test Suite Finished: {project} ({t_type.value}) - {passed}/{total} passed")
        return run
    
    def get_stats(self) -> Dict[str, Any]:
        """Aggregate high-level quality performance metrics."""
        open_b = [b for b in self.bugs.values() if b.status not in [BugStatus.VERIFIED, BugStatus.CLOSED]]
        
        passed_t = sum(r.passed for r in self.test_runs)
        total_t = sum(r.total_tests for r in self.test_runs)
        
        return {
            "total_bugs": len(self.bugs),
            "open_count": len(open_b),
            "pass_rate": (passed_t / total_t * 100.0) if total_t > 0 else 0.0,
            "test_run_count": len(self.test_runs)
        }
    
    def format_dashboard(self) -> str:
        """Render the QA Quality Dashboard."""
        s = self.get_stats()
        
        lines = [
            "╔═══════════════════════════════════════════════════════════╗",
            f"║  🧪 QA ENGINEER DASHBOARD{' ' * 35}║",
            f"║  {s['open_count']} open bugs │ {s['pass_rate']:.1f}% avg pass rate │ {s['test_run_count']} runs{' ' * 10}║",
            "╠═══════════════════════════════════════════════════════════╣",
            "║  🐛 ACTIVE DEFECT QUEUE                                   ║",
            "║  ───────────────────────────────────────────────────────  ║",
        ]
        
        for b in list(self.bugs.values())[:5]:
            sev_icon = {"critical": "🔴", "high": "🟠", "medium": "🟡"}.get(b.severity.value, "⚪")
            lines.append(f"║  {sev_icon} {b.title[:22]:<22} │ {b.project[:12]:<12} │ {b.status.value:<10} ║")
            
        lines.extend([
            "║                                                           ║",
            "║  🧪 RECENT TEST EXECUTIONS                                ║",
            "║  ───────────────────────────────────────────────────────  ║",
        ])
        
        for r in self.test_runs[-3:]:
            rate = (r.passed / r.total_tests * 100) if r.total_tests else 0
            lines.append(f"║    🔬 {r.project[:15]:<15} │ {r.test_type.value:<12} │ {rate:>5.1f}% pass  ║")
            
        lines.extend([
            "║                                                           ║",
            "║  [🐛 Report Bug]  [🧪 Run Suite]  [📊 Coverage]  [⚙️]     ║",
            "╠═══════════════════════════════════════════════════════════╣",
            f"║  🏯 {self.agency_name[:40]:<40} - Quality!          ║",
            "╚═══════════════════════════════════════════════════════════╝",
        ])
        return "\n".join(lines)


# Example usage
if __name__ == "__main__":
    print("🧪 Initializing QA System...")
    print("=" * 60)
    
    try:
        qa_system = QAEngineer("Saigon Digital Hub")
        # Seed
        qa_system.report_defect("Main Web", "Login Timeout", BugSeverity.HIGH)
        qa_system.run_suite("Portal", TestType.UNIT, 95, 5)
        
        print("\n" + qa_system.format_dashboard())
        
    except Exception as e:
        logger.error(f"QA Error: {e}")
