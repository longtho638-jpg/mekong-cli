"""
🔀 PR Manager - Auto Check & Merge Pull Requests

Automatically checks GitHub for PRs and merges them if:
- All CI checks pass
- No conflicts
- PR is from Jules or approved bots

Usage:
    from antigravity.core.pr_manager import PRManager
    manager = PRManager()
    manager.check_and_merge_all()
"""

import subprocess
import json
from typing import Dict, List, Any, Optional
from dataclasses import dataclass
from datetime import datetime


@dataclass
class PullRequest:
    """Pull Request info."""
    number: int
    title: str
    author: str
    state: str
    mergeable: bool
    checks_passed: bool
    url: str
    created_at: str


class PRManager:
    """
    🔀 PR Manager
    
    Auto-check and merge Pull Requests.
    """
    
    # Trusted authors that can be auto-merged
    TRUSTED_AUTHORS = [
        "jules[bot]",
        "app/google-labs-jules",  # Jules Google Labs
        "google-labs-jules",       # Jules alternative
        "dependabot[bot]",
        "github-actions[bot]",
        "renovate[bot]",
    ]
    
    def __init__(self, repo: str = "longtho638-jpg/mekong-cli"):
        self.repo = repo
    
    def get_open_prs(self) -> List[PullRequest]:
        """Get all open PRs from GitHub."""
        try:
            result = subprocess.run(
                ["gh", "pr", "list", "--json", 
                 "number,title,author,state,mergeable,statusCheckRollup,url,createdAt"],
                capture_output=True,
                text=True,
                timeout=30
            )
            
            if result.returncode != 0:
                print(f"❌ Error getting PRs: {result.stderr}")
                return []
            
            prs_data = json.loads(result.stdout)
            prs = []
            
            for pr in prs_data:
                # Check if all status checks passed
                checks = pr.get("statusCheckRollup", []) or []
                checks_passed = all(
                    c.get("conclusion") == "SUCCESS" or c.get("state") == "SUCCESS"
                    for c in checks
                ) if checks else True  # If no checks, assume passed
                
                prs.append(PullRequest(
                    number=pr["number"],
                    title=pr["title"],
                    author=pr["author"]["login"],
                    state=pr["state"],
                    mergeable=pr.get("mergeable", "UNKNOWN") == "MERGEABLE",
                    checks_passed=checks_passed,
                    url=pr["url"],
                    created_at=pr["createdAt"],
                ))
            
            return prs
            
        except Exception as e:
            print(f"❌ Exception: {e}")
            return []
    
    def can_auto_merge(self, pr: PullRequest) -> tuple[bool, str]:
        """
        Check if a PR can be auto-merged.
        
        Returns:
            (can_merge, reason)
        """
        # Check author
        if pr.author not in self.TRUSTED_AUTHORS:
            return False, f"Author {pr.author} not in trusted list"
        
        # Check mergeable
        if not pr.mergeable:
            return False, "PR has conflicts or is not mergeable"
        
        # Check CI
        if not pr.checks_passed:
            return False, "CI checks have not passed"
        
        return True, "All checks passed ✅"
    
    def merge_pr(self, pr: PullRequest, method: str = "squash") -> bool:
        """
        Merge a PR.
        
        Args:
            pr: The PR to merge
            method: Merge method (merge, squash, rebase)
        
        Returns:
            True if merged successfully
        """
        try:
            result = subprocess.run(
                ["gh", "pr", "merge", str(pr.number), f"--{method}", "--auto"],
                capture_output=True,
                text=True,
                timeout=30
            )
            
            if result.returncode == 0:
                print(f"✅ Merged PR #{pr.number}: {pr.title}")
                return True
            else:
                print(f"❌ Failed to merge PR #{pr.number}: {result.stderr}")
                return False
                
        except Exception as e:
            print(f"❌ Exception merging PR #{pr.number}: {e}")
            return False
    
    def check_and_merge_all(self, dry_run: bool = False) -> Dict[str, Any]:
        """
        Check all PRs and merge eligible ones.
        
        Args:
            dry_run: If True, just report without merging
        
        Returns:
            Report of actions taken
        """
        print("\n🔀 PR MANAGER - Auto Check & Merge")
        print("=" * 50)
        
        prs = self.get_open_prs()
        
        report = {
            "total": len(prs),
            "merged": [],
            "skipped": [],
            "errors": [],
        }
        
        if not prs:
            print("   📭 No open PRs found")
            return report
        
        print(f"   📋 Found {len(prs)} open PR(s)\n")
        
        for pr in prs:
            can_merge, reason = self.can_auto_merge(pr)
            
            print(f"   PR #{pr.number}: {pr.title[:40]}...")
            print(f"      Author: {pr.author}")
            print(f"      Mergeable: {'✅' if pr.mergeable else '❌'}")
            print(f"      CI Passed: {'✅' if pr.checks_passed else '❌'}")
            
            if can_merge:
                if dry_run:
                    print(f"      Action: [DRY RUN] Would merge")
                    report["skipped"].append({"pr": pr.number, "reason": "Dry run"})
                else:
                    if self.merge_pr(pr):
                        print(f"      Action: ✅ MERGED")
                        report["merged"].append(pr.number)
                    else:
                        print(f"      Action: ❌ MERGE FAILED")
                        report["errors"].append(pr.number)
            else:
                print(f"      Action: ⏭️ Skipped - {reason}")
                report["skipped"].append({"pr": pr.number, "reason": reason})
            
            print("")
        
        # Summary
        print("=" * 50)
        print(f"   📊 Summary:")
        print(f"      Total: {report['total']}")
        print(f"      Merged: {len(report['merged'])}")
        print(f"      Skipped: {len(report['skipped'])}")
        print(f"      Errors: {len(report['errors'])}")
        print("=" * 50)
        
        return report
    
    def add_trusted_author(self, author: str):
        """Add an author to trusted list."""
        if author not in self.TRUSTED_AUTHORS:
            self.TRUSTED_AUTHORS.append(author)
            print(f"✅ Added {author} to trusted authors")
    
    def print_status(self):
        """Print PR status summary."""
        prs = self.get_open_prs()
        
        print("\n🔀 OPEN PULL REQUESTS")
        print("=" * 60)
        
        if not prs:
            print("   📭 No open PRs")
        else:
            for pr in prs:
                can_merge, reason = self.can_auto_merge(pr)
                status = "✅ Can auto-merge" if can_merge else f"⏸️ {reason}"
                
                print(f"\n   #{pr.number} {pr.title[:45]}...")
                print(f"      👤 {pr.author}")
                print(f"      📊 {status}")
                print(f"      🔗 {pr.url}")
        
        print("\n" + "=" * 60)


# Quick functions
def check_prs():
    """Quick function to check PRs."""
    manager = PRManager()
    manager.print_status()


def merge_prs(dry_run: bool = True):
    """Quick function to merge PRs."""
    manager = PRManager()
    return manager.check_and_merge_all(dry_run=dry_run)


def auto_merge():
    """Auto-merge all eligible PRs (NOT dry run)."""
    manager = PRManager()
    return manager.check_and_merge_all(dry_run=False)


if __name__ == "__main__":
    import sys
    
    if len(sys.argv) > 1 and sys.argv[1] == "--merge":
        auto_merge()
    else:
        check_prs()
