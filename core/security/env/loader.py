"""
📁 Environment Variable Loader
==============================
Handles loading and exporting .env files.
"""

import logging
from datetime import datetime
from pathlib import Path
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from .manager import SecureEnvironmentManager

logger = logging.getLogger(__name__)

def export_env_file(manager: 'SecureEnvironmentManager', output_path: Path) -> bool:
    """Export environment variables to .env file."""
    try:
        import os
        with open(output_path, "w") as f:
            f.write("# Auto-generated secure environment variables\n")
            f.write(f"# Environment: {manager.environment.value}\n")
            f.write(f"# Generated: {datetime.now().isoformat()}\n\n")

            for name, var_def in manager.variables.items():
                if name in os.environ:
                    value = os.environ[name]
                    f.write(f"# {var_def.description}\n")
                    f.write(f"{name}={value}\n\n")

        # Set secure permissions (read/write for owner only)
        output_path.chmod(0o600)
        return True

    except Exception as e:
        logger.error(f"Failed to export env file: {e}")
        return False
