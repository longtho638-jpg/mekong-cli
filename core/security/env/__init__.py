"""
🔐 Env Package Exports
"""

from .manager import EnvironmentType, EnvironmentVariable, SecureEnvironmentManager, VariableType


def validate_environment(env_file=None) -> SecureEnvironmentManager:
    """Validate all environment variables and return manager."""
    manager = SecureEnvironmentManager(env_file)
    manager.validate_all()
    return manager
