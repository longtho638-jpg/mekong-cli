"""
AntigravityKit CLI - Main entry point (Proxy).
"""
import warnings

from .commands import cmd_client_add, cmd_content_generate, cmd_start
from .utils import cmd_help, cmd_stats

# Issue a deprecation warning
warnings.warn(
    "packages.antigravity.cli is deprecated. "
    "Use the new modular structure in packages/antigravity/cli/.",
    DeprecationWarning,
    stacklevel=2
)

def print_banner():
    from .utils import print_banner as pb
    pb()

def main():
    from .commands import main as m
    m()

if __name__ == "__main__":
    main()
