"""
🧠 Secure Environment Manager Core
==================================
Centralized management of security-sensitive environment variables.
"""

import logging
import os
from dataclasses import dataclass
from enum import Enum
from typing import Any, Dict, List, Optional, Tuple

logger = logging.getLogger(__name__)

class EnvironmentType(Enum):
    DEVELOPMENT = "development"
    TESTING = "testing"
    STAGING = "staging"
    PRODUCTION = "production"

class VariableType(Enum):
    STRING = "string"
    INTEGER = "integer"
    FLOAT = "float"
    BOOLEAN = "boolean"
    URL = "url"
    EMAIL = "email"
    API_KEY = "api_key"
    JWT_SECRET = "jwt_secret"
    DATABASE_URL = "database_url"

@dataclass
class EnvironmentVariable:
    name: str
    var_type: VariableType
    required: bool = True
    default: Optional[str] = None
    description: str = ""
    validation_pattern: Optional[str] = None
    min_length: Optional[int] = None
    max_length: Optional[int] = None
    is_secret: bool = False
    auto_generate: bool = False

class SecureEnvironmentManager:
    """Secure environment variable manager facade."""

    def __init__(self, env_file: Optional[Any] = None):
        self.env_file = env_file
        self.variables: Dict[str, EnvironmentVariable] = {}
        self.values: Dict[str, Any] = {}
        self.warnings: List[str] = []
        self.errors: List[str] = []
        self.environment = EnvironmentType(os.getenv("ENVIRONMENT", "development"))

        # Delayed import to avoid circular dependency
        from .definitions import load_default_definitions
        load_default_definitions(self)

    def register(self, var_def: EnvironmentVariable):
        """Register an environment variable definition."""
        self.variables[var_def.name] = var_def

    def validate_all(self) -> Tuple[bool, List[str], List[str]]:
        """Validate all registered environment variables."""
        from .crypto import generate_secret
        from .validator import convert_type, validate_format

        self.warnings.clear()
        self.errors.clear()
        self.values.clear()

        for name, var_def in self.variables.items():
            value = os.getenv(name)
            if value is None:
                if var_def.required:
                    if var_def.auto_generate:
                        value = generate_secret(var_def)
                        os.environ[name] = value
                        self.warnings.append(f"Auto-generated {name}")
                    elif var_def.default is not None:
                        value = var_def.default
                        os.environ[name] = value
                    else:
                        self.errors.append(f"Required variable {name} is not set")
                        continue
                else:
                    continue

            try:
                converted = convert_type(value, var_def.var_type)
                if not validate_format(converted, var_def):
                    self.errors.append(f"Invalid format/length for {name}")
                    continue
                self.values[name] = converted
            except ValueError as e:
                self.errors.append(f"Invalid type for {name}: {e}")

        return len(self.errors) == 0, self.warnings, self.errors

    def get(self, name: str, default: Any = None) -> Any:
        return self.values.get(name, os.getenv(name, default))

    def is_secure(self) -> bool:
        if self.errors: return False
        if self.environment == EnvironmentType.PRODUCTION:
            for var in ["JWT_SECRET_KEY", "API_KEY_MASTER"]:
                if not self.get(var): return False
        return True

    def print_summary(self):
        from core.utils.vibe_ui import format_status, print_header
        print_header("🔒 Environment Security Summary")
        print(f"Environment: {self.environment.value}")
        for error in self.errors: print(f"   - ❌ {error}")
        for warning in self.warnings: print(f"   - ⚠️ {warning}")
        if not self.errors and not self.warnings: print("   - ✅ All secure!")
        print(f"Security Status: {format_status(self.is_secure(), 'SECURE', 'NOT SECURE')}")
