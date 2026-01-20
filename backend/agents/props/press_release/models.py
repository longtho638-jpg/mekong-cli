"""
Press Release Data Models.
"""
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from typing import List, Optional


class ReleaseType(Enum):
    PRODUCT_LAUNCH = "product_launch"
    PARTNERSHIP = "partnership"
    MILESTONE = "milestone"
    FUNDING = "funding"
    FEATURE = "feature"

class ReleaseStatus(Enum):
    DRAFT = "draft"
    REVIEW = "review"
    APPROVED = "approved"
    DISTRIBUTED = "distributed"

@dataclass
class PressRelease:
    id: str
    headline: str
    subheadline: str
    body: str
    boilerplate: str
    release_type: ReleaseType
    status: ReleaseStatus = ReleaseStatus.DRAFT
    distribution_list: List[str] = field(default_factory=list)
    coverage_links: List[str] = field(default_factory=list)
    created_at: datetime = field(default_factory=datetime.now)
    distributed_at: Optional[datetime] = None
