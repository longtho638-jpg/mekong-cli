"""BMAD Workflow Pydantic Models."""

from pydantic import BaseModel, ConfigDict, Field
from typing import List, Dict, Any
from pathlib import Path


class BMADWorkflow(BaseModel):
    """Represents a BMAD workflow."""

    id: str = Field(..., description="Unique workflow identifier")
    name: str = Field(..., description="Human-readable workflow name")
    description: str = Field(default="", description="Workflow description")
    agent_type: str = Field(..., description="Agent type (pm, architect, developer, qa, etc.)")
    file_path: Path = Field(..., description="Path to workflow markdown file")
    parameters: Dict[str, Any] = Field(default_factory=dict, description="Workflow parameters")
    prerequisites: List[str] = Field(default_factory=list, description="Required prerequisites")
    outputs: List[str] = Field(default_factory=list, description="Expected outputs")

    model_config = ConfigDict(arbitrary_types_allowed=True)


class WorkflowCatalog(BaseModel):
    """Catalog of all BMAD workflows."""

    workflows: List[BMADWorkflow] = Field(..., description="List of workflows")
    total_count: int = Field(..., description="Total workflow count")
    agent_types: List[str] = Field(..., description="Available agent types")

    @classmethod
    def build_from_directory(cls, bmad_path: Path) -> "WorkflowCatalog":
        """Build catalog by scanning BMAD directory.

        Args:
            bmad_path: Path to BMAD directory

        Returns:
            WorkflowCatalog instance
        """
        from .loader import BMADWorkflowLoader

        loader = BMADWorkflowLoader(str(bmad_path))
        return loader.catalog
