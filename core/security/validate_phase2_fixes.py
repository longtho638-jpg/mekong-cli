#!/usr/bin/env python3
"""
🔒 Phase 2 Security Validation (Refactored)
=========================================
Legacy entry point for Phase 2 security validation.
Uses the new modular validation engine.
"""

import sys
from pathlib import Path

# Add root to path
root = Path(__file__).parent.parent.parent
if str(root) not in sys.path:
    sys.path.insert(0, str(root))

from core.security.validation import main

if __name__ == "__main__":
    main()
