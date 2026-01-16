#!/usr/bin/env python3
"""
🏯 AGENCY OS - Server Entry Point
=================================

Wrapper for the Unified Backend API.

Run: python3 server.py
"""

import uvicorn
import os
import sys

# Ensure module visibility
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from backend.api.main import app

if __name__ == "__main__":
    print("\n🏯 Starting Agency OS Unified API...")
    print("   -> Loaded modules: i18n, Vietnam, CRM, Franchise, Agents, Hybrid Router")
    print("   -> Docs: http://localhost:8000/docs\n")

    uvicorn.run(app, host="0.0.0.0", port=8000)
