"""
⚠️ AntigravityKit - Unified Error Handling
==========================================

Defines custom exception classes for the Agency OS ecosystem. 
Enables semantic error reporting, automated recovery logic, and 
consistent telemetry across modules.

Hierarchy:
- AntigravityError (Base)
  - ValidationError (Data issues)
  - PersistenceError (Storage issues)
  - WinWinWinError (Governance issues)
  - WorkflowError (Orchestration issues)
  - ConfigError (Setup issues)

Binh Pháp: 🏰 Pháp (Process) - Correcting errors systematically.
"""

import logging
from typing import Optional, Dict, Any, Union

# Configure logging
logger = logging.getLogger(__name__)


class AntigravityError(Exception):
    """
    ⚠️ Base Exception
    
    The root of all Agency OS errors. Supports status codes 
    and detailed metadata for agent debugging.
    """

    def __init__(
        self, 
        message: str, 
        code: str = "SYSTEM_ERROR", 
        status_code: int = 500,
        details: Optional[Dict[str, Any]] = None
    ):
        self.message = message
        self.code = code
        self.status_code = status_code
        self.details = details or {}
        
        # Log error automatically on creation
        logger.error(f"[{code}] {message} | Details: {self.details}")
        
        super().__init__(self.message)

    def to_dict(self) -> Dict[str, Any]:
        """Serializable representation for API and agent context."""
        return {
            "error": True,
            "code": self.code,
            "message": self.message,
            "status_code": self.status_code,
            "details": self.details
        }


class ValidationError(AntigravityError):
    """Raised when data input or state validation fails."""

    def __init__(self, message: str, field: Optional[str] = None, value: Any = None):
        details = {}
        if field: details["field"] = field
        if value: details["value"] = str(value)
        
        super().__init__(
            message=message,
            code="VALIDATION_FAILED",
            status_code=400,
            details=details
        )
        self.field = field


class PersistenceError(AntigravityError):
    """Raised when disk or database operations fail."""

    def __init__(self, message: str, operation: str = "write", path: Optional[Union[str, Any]] = None):
        super().__init__(
            message=message,
            code="STORAGE_FAILURE",
            status_code=507,
            details={"op": operation, "path": str(path)}
        )


class WinWinWinError(AntigravityError):
    """
    Raised when a strategic proposal fails the mandatory 3-way alignment check.
    Required by Hiến Pháp Agency OS.
    """

    def __init__(self, message: str, failing_party: str = "unknown"):
        super().__init__(
            message=message,
            code="WIN_WIN_WIN_MISALIGNMENT",
            status_code=403,
            details={"losing_party": failing_party}
        )
        self.losing_party = failing_party


class WorkflowError(AntigravityError):
    """Raised when an agent chain or crew mission encounters a terminal failure."""

    def __init__(self, message: str, agent: str, task: str):
        super().__init__(
            message=message,
            code="ORCHESTRATION_ERROR",
            status_code=422,
            details={"agent": agent, "task": task}
        )


class ConfigError(AntigravityError):
    """Raised when environment variables or config files are missing or corrupt."""

    def __init__(self, message: str, key: str):
        super().__init__(
            message=message,
            code="CONFIGURATION_MISSING",
            status_code=500,
            details={"missing_key": key}
        )