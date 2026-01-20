"""
Competitor Analysis Data Models.
"""
from dataclasses import dataclass, field
from enum import Enum
from typing import List


class CompetitorSize(Enum):
    SMALL = "small"
    MEDIUM = "medium"
    LARGE = "large"
    ENTERPRISE = "enterprise"

class ThreatLevel(Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"

@dataclass
class Competitor:
    name: str
    website: str
    size: CompetitorSize
    services: List[str] = field(default_factory=list)
    strengths: List[str] = field(default_factory=list)
    weaknesses: List[str] = field(default_factory=list)
    threat_level: ThreatLevel = ThreatLevel.MEDIUM
