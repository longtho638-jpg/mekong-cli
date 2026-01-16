"""
Architect Module - Entities
"""
from dataclasses import dataclass
from enum import Enum
from typing import List

class ArchitectureType(Enum):
    SIMPLE_MODULAR = "Simple Modular"
    CLEAN_ARCHITECTURE = "Clean Architecture"
    HEXAGONAL_DDD = "Hexagonal DDD"

@dataclass
class ProjectProfile:
    """Analyzed profile of the user's request."""
    raw_request: str
    complexity_score: int  # 1-10
    detected_keywords: List[str]
    recommended_arch: ArchitectureType
    reasoning: str

@dataclass
class ArchitectureBlueprint:
    """The output blueprint for the AI."""
    type: ArchitectureType
    folder_structure: str
    core_rules: List[str]
    system_prompt_snippet: str
