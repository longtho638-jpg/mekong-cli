"""BMAD Workflow Validator."""

from typing import Any, Dict, List
from .models import BMADWorkflow


class WorkflowValidator:
    """Validates BMAD workflow structure and prerequisites."""

    @staticmethod
    def validate(workflow: BMADWorkflow) -> Dict[str, Any]:
        """Validate workflow structure and prerequisites.

        Args:
            workflow: BMADWorkflow instance to validate

        Returns:
            Validation result dictionary with 'valid', 'errors', 'warnings'
        """
        errors: List[str] = []
        warnings: List[str] = []

        # Check file exists
        if not workflow.file_path.exists():
            errors.append(f"Workflow file not found: {workflow.file_path}")

        # Check file is readable
        if workflow.file_path.exists():
            try:
                workflow.file_path.read_text()
            except Exception as e:
                errors.append(f"Cannot read workflow file: {e}")

        # Check prerequisites (basic validation)
        if workflow.prerequisites:
            for prereq in workflow.prerequisites:
                if not prereq.strip():
                    warnings.append("Empty prerequisite found")

        # Check required parameters have descriptions
        if workflow.parameters:
            for param, config in workflow.parameters.items():
                if isinstance(config, dict) and not config.get("description"):
                    warnings.append(f"Parameter '{param}' missing description")

        return {
            "valid": len(errors) == 0,
            "errors": errors,
            "warnings": warnings
        }
