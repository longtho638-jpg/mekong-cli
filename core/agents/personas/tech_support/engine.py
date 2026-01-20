"""
Technical Support Specialist engine logic.
"""
import uuid
from datetime import datetime
from typing import Dict, List

from .models import IssueCategory, IssuePriority, IssueStatus, TechIssue


class TechSupportEngine:
    def __init__(self, agency_name: str):
        self.agency_name = agency_name
        self.issues: Dict[str, TechIssue] = {}

    def create_issue(self, client: str, title: str, category: IssueCategory, priority: IssuePriority, specialist: str = "") -> TechIssue:
        issue = TechIssue(id=f"TSS-{uuid.uuid4().hex[:6].upper()}", client=client, title=title, category=category, priority=priority, specialist=specialist)
        self.issues[issue.id] = issue
        return issue

    def update_status(self, issue: TechIssue, status: IssueStatus, resolution: str = ""):
        issue.status = status
        if status == IssueStatus.RESOLVED:
            issue.resolved_at = datetime.now()
            issue.resolution = resolution

    def get_open_issues(self) -> List[TechIssue]:
        return [i for i in self.issues.values() if i.status not in [IssueStatus.RESOLVED, IssueStatus.CLOSED]]
