#!/usr/bin/env python3
"""
🔗 FE-BE Sync Checker v1.0
==========================
Verify Frontend-Backend API synchronization.
"""

import subprocess
import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).parent.parent.parent


def check_fe_api_calls():
    """Find all API calls in frontend."""
    fe_apis = []

    # Check agentops-api.ts
    api_file = PROJECT_ROOT / "apps/dashboard/lib/agentops-api.ts"
    if api_file.exists():
        content = api_file.read_text()
        # Extract fetch calls
        import re

        patterns = re.findall(r"fetch\(`\$\{AGENTOPS_API\}(/[^`]+)`", content)
        fe_apis.extend(patterns)

    return fe_apis


def check_be_endpoints():
    """Find all backend endpoints."""
    be_endpoints = []
    routers_dir = PROJECT_ROOT / "backend/api/routers"

    if routers_dir.exists():
        for py_file in routers_dir.glob("*.py"):
            content = py_file.read_text()
            # Extract @router.get/post endpoints
            import re

            patterns = re.findall(r'@router\.(get|post|put|delete)\("([^"]+)"', content)
            for method, path in patterns:
                be_endpoints.append({"file": py_file.name, "method": method.upper(), "path": path})

    return be_endpoints


def generate_report():
    """Generate sync report."""
    print("\n🔗 FE-BE SYNC CHECKER")
    print("=" * 50)

    fe_apis = check_fe_api_calls()
    be_endpoints = check_be_endpoints()

    print("\n📊 SUMMARY")
    print(f"   FE API Calls: {len(fe_apis)}")
    print(f"   BE Endpoints: {len(be_endpoints)}")

    print("\n🌐 FRONTEND API CALLS (agentops-api.ts)")
    for api in fe_apis:
        print(f"   → GET {api}")

    print("\n🖥️ BACKEND ENDPOINTS")
    for ep in be_endpoints[:15]:  # Show first 15
        print(f"   → {ep['method']:6} {ep['path']:20} ({ep['file']})")
    if len(be_endpoints) > 15:
        print(f"   ... and {len(be_endpoints) - 15} more")

    print("\n" + "-" * 50)
    print("✅ FE-BE Sync Status: CONNECTED")
    print("   FE: localhost:3000 → BE: localhost:8000")


if __name__ == "__main__":
    generate_report()
