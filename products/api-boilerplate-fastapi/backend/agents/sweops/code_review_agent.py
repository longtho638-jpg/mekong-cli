"""
Code Review Agent - PR Management & Review Metrics
Manages pull requests, reviews, and merge tracking.
"""

from dataclasses import dataclass, field
from typing import List, Dict, Optional
from datetime import datetime
from enum import Enum
import random


class PRStatus(Enum):
    OPEN = "open"
    IN_REVIEW = "in_review"
    APPROVED = "approved"
    CHANGES_REQUESTED = "changes_requested"
    MERGED = "merged"
    CLOSED = "closed"


class ReviewResult(Enum):
    PENDING = "pending"
    APPROVED = "approved"
    CHANGES_REQUESTED = "changes_requested"


@dataclass
class Review:
    """Code review"""
    id: str
    reviewer: str
    result: ReviewResult = ReviewResult.PENDING
    comments: int = 0
    reviewed_at: Optional[datetime] = None


@dataclass
class PullRequest:
    """Pull request"""
    id: str
    title: str
    author: str
    branch: str
    status: PRStatus = PRStatus.OPEN
    additions: int = 0
    deletions: int = 0
    reviews: List[Review] = field(default_factory=list)
    created_at: datetime = None
    merged_at: Optional[datetime] = None
    
    def __post_init__(self):
        if self.created_at is None:
            self.created_at = datetime.now()
    
    @property
    def time_to_merge(self) -> Optional[float]:
        if self.merged_at:
            return (self.merged_at - self.created_at).total_seconds() / 3600
        return None


class CodeReviewAgent:
    """
    Code Review Agent - Quản lý Code Review
    
    Responsibilities:
    - Manage PRs
    - Assign reviewers
    - Track review metrics
    - Monitor merge times
    """
    
    def __init__(self):
        self.name = "Code Review"
        self.status = "ready"
        self.prs: Dict[str, PullRequest] = {}
        
    def create_pr(
        self,
        title: str,
        author: str,
        branch: str,
        additions: int = 0,
        deletions: int = 0
    ) -> PullRequest:
        """Create pull request"""
        pr_id = f"PR-{random.randint(100,999)}"
        
        pr = PullRequest(
            id=pr_id,
            title=title,
            author=author,
            branch=branch,
            additions=additions,
            deletions=deletions
        )
        
        self.prs[pr_id] = pr
        return pr
    
    def assign_reviewer(self, pr_id: str, reviewer: str) -> PullRequest:
        """Assign reviewer to PR"""
        if pr_id not in self.prs:
            raise ValueError(f"PR not found: {pr_id}")
            
        pr = self.prs[pr_id]
        
        review = Review(
            id=f"review_{random.randint(100,999)}",
            reviewer=reviewer
        )
        
        pr.reviews.append(review)
        pr.status = PRStatus.IN_REVIEW
        
        return pr
    
    def submit_review(
        self,
        pr_id: str,
        reviewer: str,
        result: ReviewResult,
        comments: int = 0
    ) -> PullRequest:
        """Submit review"""
        if pr_id not in self.prs:
            raise ValueError(f"PR not found: {pr_id}")
            
        pr = self.prs[pr_id]
        
        for review in pr.reviews:
            if review.reviewer == reviewer:
                review.result = result
                review.comments = comments
                review.reviewed_at = datetime.now()
        
        # Update PR status
        if result == ReviewResult.APPROVED:
            all_approved = all(r.result == ReviewResult.APPROVED for r in pr.reviews)
            if all_approved:
                pr.status = PRStatus.APPROVED
        elif result == ReviewResult.CHANGES_REQUESTED:
            pr.status = PRStatus.CHANGES_REQUESTED
        
        return pr
    
    def merge_pr(self, pr_id: str) -> PullRequest:
        """Merge PR"""
        if pr_id not in self.prs:
            raise ValueError(f"PR not found: {pr_id}")
            
        pr = self.prs[pr_id]
        pr.status = PRStatus.MERGED
        pr.merged_at = datetime.now()
        
        return pr
    
    def get_stats(self) -> Dict:
        """Get review statistics"""
        prs = list(self.prs.values())
        merged = [p for p in prs if p.status == PRStatus.MERGED]
        
        avg_ttm = sum(p.time_to_merge for p in merged if p.time_to_merge) / len(merged) if merged else 0
        
        return {
            "total_prs": len(prs),
            "open": len([p for p in prs if p.status in [PRStatus.OPEN, PRStatus.IN_REVIEW]]),
            "merged": len(merged),
            "avg_time_to_merge": f"{avg_ttm:.1f}h",
            "total_reviews": sum(len(p.reviews) for p in prs)
        }


# Demo
if __name__ == "__main__":
    agent = CodeReviewAgent()
    
    print("🔃 Code Review Agent Demo\n")
    
    # Create PRs
    pr1 = agent.create_pr("feat: add user auth", "nguyen_a", "feature/auth", additions=250, deletions=30)
    pr2 = agent.create_pr("fix: dashboard bug", "tran_b", "fix/dashboard", additions=15, deletions=8)
    
    print(f"📋 PR: {pr1.id}")
    print(f"   Title: {pr1.title}")
    print(f"   Author: {pr1.author}")
    print(f"   Changes: +{pr1.additions} -{pr1.deletions}")
    
    # Assign and review
    agent.assign_reviewer(pr1.id, "reviewer_1")
    agent.assign_reviewer(pr1.id, "reviewer_2")
    agent.submit_review(pr1.id, "reviewer_1", ReviewResult.APPROVED, comments=3)
    agent.submit_review(pr1.id, "reviewer_2", ReviewResult.APPROVED, comments=1)
    
    print(f"\n✅ Status: {pr1.status.value}")
    print(f"   Reviews: {len(pr1.reviews)}")
    
    # Merge
    agent.merge_pr(pr1.id)
    
    print("\n🎉 Merged!")
    print(f"   Time to merge: {pr1.time_to_merge:.1f}h" if pr1.time_to_merge else "")
