"""
🔀 PR Manager - Automated Change Integration
============================================

Orchestrates the automated merging of Pull Requests from trusted sources. 
Ensures system stability by enforcing CI pass requirements and conflict 
checks before any merge operation.

Key Sources:
- 🤖 Jules [bot]: Primary autonomous agent.
- 📦 Dependabot / Renovate: Automated dependency updates.
- 🛠️ GitHub Actions: System-generated maintenance.

Binh Pháp: ⚡ Quân Tranh (Unity) - Seamlessly integrating improvements.
"""

import logging
import subprocess
import json
from dataclasses import dataclass, field
from datetime import datetime
from typing import Dict, List, Any, Tuple, Set

# Configure logging
logger = logging.getLogger(__name__)

@dataclass
class PullRequest:
    """Detailed information for a single GitHub Pull Request."""
    number: int
    title: str
    author: str
    state: str
    mergeable: bool
    checks_passed: bool
    url: str
    created_at: datetime
    raw_data: Dict[str, Any] = field(default_factory=dict)


class PRManager:
    """
    🔀 PR Orchestration Engine
    
    Automates the 'Ship' phase of the Agency OS workflow.
    Uses the GitHub CLI ('gh') for reliable remote operations.
    """
    
    # Defaults for trusted autonomous contributors
    DEFAULT_TRUSTED_AUTHORS: Set = {
        "jules[bot]",
        "app/google-labs-jules",
        "google-labs-jules",
        "dependabot[bot]",
        "github-actions[bot]",
        "renovate[bot]",
    }
    
    def __init__(self, repo: str = "longtho638-jpg/mekong-cli"):
        self.repo = repo
        self.trusted_authors = self.DEFAULT_TRUSTED_AUTHORS.copy()
    
    def get_open_prs(self) -> List[PullRequest]:
        """Queries GitHub for all currently open pull requests."""
        try:
            cmd = [
                "gh", "pr", "list", 
                "--repo", self.repo,
                "--json", "number,title,author,state,mergeable,statusCheckRollup,url,createdAt"
            ]
            result = subprocess.run(cmd, capture_output=True, text=True, timeout=30)
            
            if result.returncode != 0:
                logger.error(f"GitHub CLI failure: {result.stderr}")
                return []
            
            data = json.loads(result.stdout)
            prs = []
            
            for item in data:
                # CI Validation Logic
                checks = item.get("statusCheckRollup", []) or []
                # If no checks defined, we pass (assume simple repo or non-blocking)
                checks_ok = True
                if checks:
                    checks_ok = all(
                        c.get("conclusion") == "SUCCESS" or c.get("state") == "SUCCESS"
                        for c in checks
                    )
                
                prs.append(PullRequest(
                    number=item["number"],
                    title=item["title"],
                    author=item["author"]["login"],
                    state=item["state"],
                    mergeable=(item.get("mergeable") == "MERGEABLE"),
                    checks_passed=checks_ok,
                    url=item["url"],
                    created_at=datetime.fromisoformat(item["createdAt"].replace('Z', '+00:00')),
                    raw_data=item
                ))
            return prs
            
        except FileNotFoundError:
            logger.warning("GitHub CLI ('gh') not found. PR management disabled.")
            return []
        except Exception as e:
            logger.exception(f"Unexpected error fetching PRs: {e}")
            return []
    
    def can_auto_merge(self, pr: PullRequest) -> Tuple[bool, str]:
        """Evaluates if a PR meets the safety and trust criteria for automation."""
        # 1. Trust Check
        if pr.author not in self.trusted_authors:
            return False, f"Author '{pr.author}' is not in the trusted automation list."
        
        # 2. Conflict Check
        if not pr.mergeable:
            return False, "PR has merge conflicts or is currently blocked."
        
        # 3. Quality Check (CI)
        if not pr.checks_passed:
            return False, "CI/CD checks have not passed or are still in progress."
        
        return True, "Safety criteria met."
    
    def merge_pr(self, pr_number: int, method: str = "squash") -> bool:
        """Executes the merge operation on GitHub."""
        try:
            cmd = ["gh", "pr", "merge", str(pr_number), f"--{method}", "--auto", "--delete-branch"]
            result = subprocess.run(cmd, capture_output=True, text=True, timeout=30)
            
            if result.returncode == 0:
                logger.info(f"Successfully merged PR #{pr_number}")
                return True
            else:
                logger.error(f"Merge failed for PR #{pr_number}: {result.stderr}")
                return False
        except Exception as e:
            logger.error(f"Critical error during merge of PR #{pr_number}: {e}")
            return False
    
    def check_and_merge_all(self, dry_run: bool = False) -> Dict[str, Any]:
        """Bulk operation to process and integrate all eligible changes."""
        prs = self.get_open_prs()
        report = {"total": len(prs), "merged": [], "eligible": [], "skipped": [], "errors": []}
        
        for pr in prs:
            eligible, reason = self.can_auto_merge(pr)
            if eligible:
                report["eligible"].append(pr.number)
                if not dry_run:
                    if self.merge_pr(pr.number):
                        report["merged"].append(pr.number)
                    else:
                        report["errors"].append(pr.number)
            else:
                report["skipped"].append({"id": pr.number, "reason": reason})
                
        return report

    def add_trusted_author(self, username: str):
        """Whitelists a new contributor for automated merging."""
        self.trusted_authors.add(username)
        logger.info(f"Contributor '{username}' added to trusted list.")


# --- Integration Helpers ---

def get_pr_report() -> str:
    """Standardized visual status report for the CLI."""
    mgr = PRManager()
    prs = mgr.get_open_prs()
    
    if not prs:
        return "📭 No pending changes found."
        
    lines = [f"📂 OPEN PULL REQUESTS ({len(prs)})", "═" * 50]
    for pr in prs:
        eligible, reason = mgr.can_auto_merge(pr)
        status = "✅ READY" if eligible else f"⏸️ BLOCKED: {reason}"
        lines.append(f"#{pr.number:<4} | {pr.title[:40]}")
        lines.append(f"      └─ Author: {pr.author} | {status}")
        
    return "\n".join(lines)