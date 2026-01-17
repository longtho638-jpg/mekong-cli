"""
License Shim
============
Redirects to core.licensing.
"""
import sys
from pathlib import Path

# Add parent path to allow imports from core
sys.path.append(str(Path(__file__).parent))

from core.licensing import LicenseTier, LicenseValidator