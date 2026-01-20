"""
🎨 VIBE UI Utilities
====================
Standardized UI components and formatting for Antigravity CLI tools.
"""

from typing import Tuple

# Colors and Formatting
GREEN = "\033[92m"
RED = "\033[91m"
YELLOW = "\033[93m"
BLUE = "\033[94m"
MAGENTA = "\033[95m"
CYAN = "\033[96m"
RESET = "\033[0m"
BOLD = "\033[1m"
DIM = "\033[2m"
UNDERLINE = "\033[4m"

def print_header(title: str, color: str = BLUE):
    """Print a standardized section header."""
    print(f"\n{BOLD}{color}{'=' * 60}{RESET}")
    print(f"{BOLD}{color}{title}{RESET}")
    print(f"{BOLD}{color}{'=' * 60}{RESET}\n")

def format_status(condition: bool, success_msg: str, error_msg: str) -> str:
    """Format a status message with icons and colors."""
    if condition:
        return f"{GREEN}✅ {success_msg}{RESET}"
    else:
        return f"{RED}❌ {error_msg}{RESET}"

def check_status(condition: bool, success_msg: str, error_msg: str) -> Tuple[bool, str]:
    """Check condition and return status with formatted message."""
    return condition, format_status(condition, success_msg, error_msg)

def print_step(message: str, indent: int = 0):
    """Print a step message."""
    print(f"{' ' * indent}🔹 {message}")

def print_success(message: str, indent: int = 0):
    """Print a success message."""
    print(f"{' ' * indent}{GREEN}✅ {message}{RESET}")

def print_error(message: str, indent: int = 0):
    """Print an error message."""
    print(f"{' ' * indent}{RED}❌ {message}{RESET}")

def print_warning(message: str, indent: int = 0):
    """Print a warning message."""
    print(f"{' ' * indent}{YELLOW}⚠️  {message}{RESET}")

def print_info(message: str, indent: int = 0):
    """Print an info message."""
    print(f"{' ' * indent}{BLUE}ℹ️  {message}{RESET}")
