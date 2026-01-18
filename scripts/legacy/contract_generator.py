#!/usr/bin/env python3
"""
📜 CONTRACT GENERATOR - Auto-Generate Service Agreements
========================================================
Shim for the new modular contract generator package.
See scripts/contract_gen/ for the implementation.
"""

import sys
from pathlib import Path

# Ensure the script can see the local package
sys.path.append(str(Path(__file__).parent.parent))

from scripts.contract_gen.cli import main

if __name__ == "__main__":
    main()