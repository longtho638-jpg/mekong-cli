"""
Error types for AntigravityKit.

Custom exception classes for better error handling.

🏯 "Biết lỗi để sửa" - Know errors to fix
"""

from typing import Optional, Dict, Any


class AntigravityError(Exception):
    """Base exception for all AntigravityKit errors."""

    def __init__(self, message: str, code: str = "UNKNOWN", details: Optional[Dict[str, Any]] = None):
        self.message = message
        self.code = code
        self.details = details or {}
        super().__init__(self.message)

    def to_dict(self) -> Dict[str, Any]:
        """Convert error to dictionary."""
        return {
            "error": self.code,
            "message": self.message,
            "details": self.details
        }


class ValidationError(AntigravityError):
    """Raised when validation fails."""

    def __init__(self, message: str, field: Optional[str] = None):
        super().__init__(
            message=message,
            code="VALIDATION_ERROR",
            details={"field": field} if field else {}
        )
        self.field = field


class PersistenceError(AntigravityError):
    """Raised when data storage fails."""

    def __init__(self, message: str, path: Optional[str] = None):
        super().__init__(
            message=message,
            code="PERSISTENCE_ERROR",
            details={"path": path} if path else {}
        )
        self.path = path


class WinWinWinError(AntigravityError):
    """Raised when WIN-WIN-WIN alignment fails."""

    def __init__(self, message: str, losing_party: Optional[str] = None):
        super().__init__(
            message=message,
            code="WIN_WIN_WIN_ERROR",
            details={"losing_party": losing_party} if losing_party else {}
        )
        self.losing_party = losing_party


class WorkflowError(AntigravityError):
    """Raised when workflow step fails."""

    def __init__(self, message: str, step: Optional[str] = None):
        super().__init__(
            message=message,
            code="WORKFLOW_ERROR",
            details={"step": step} if step else {}
        )
        self.step = step


class ConfigError(AntigravityError):
    """Raised when configuration is invalid."""

    def __init__(self, message: str, key: Optional[str] = None):
        super().__init__(
            message=message,
            code="CONFIG_ERROR",
            details={"key": key} if key else {}
        )
        self.key = key
