"""
Verify Command Router.
Tests that commands map correctly to MCP servers.
"""
import os
import sys
from pathlib import Path

# Add project root to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from antigravity.core.command_router import CommandRouter


def test_router():
    router = CommandRouter()

    test_cases = [
        ("revenue", "revenue_server", "get_revenue_report"),
        ("ship", "coding_server", "ship_feature"),
        ("recover", "recovery_server", "auto_recover"),
        ("sync", "sync_server", "check_sync_status"),
        ("ui-check", "ui_server", "check_ui_version"),
        ("binh-phap", "agency_server", "analyze_strategy"),
    ]

    failed = 0
    print("🧪 Verifying Command Router...")
    print("-" * 50)

    for cmd, server, tool in test_cases:
        route = router.get_route(cmd)
        if not route:
            print(f"❌ {cmd}: No route found")
            failed += 1
            continue

        if route.server != server:
            print(f"❌ {cmd}: Wrong server. Expected {server}, got {route.server}")
            failed += 1
            continue

        if route.tool != tool:
            print(f"❌ {cmd}: Wrong tool. Expected {tool}, got {route.tool}")
            failed += 1
            continue

        print(f"✅ {cmd} -> {server}.{tool}")

    print("-" * 50)
    if failed == 0:
        print("✨ All routes verified successfully!")
        sys.exit(0)
    else:
        print(f"💥 {failed} tests failed")
        sys.exit(1)

if __name__ == "__main__":
    test_router()
