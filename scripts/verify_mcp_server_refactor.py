"""
Verification script for MCP Server Refactor.
Tests the internal logic of AntigravityMCPServer without requiring the full MCP SDK transport.
"""
import sys
import os
import asyncio
import json
from dataclasses import asdict

# Add project root to path
sys.path.insert(0, os.getcwd())

from antigravity.mcp_server import AntigravityMCPServer, MCPResponse

async def test_mcp_server_logic():
    print("Testing MCP Server Refactor...")

    # 1. Initialize Server
    print("\n1. Initializing Server...")
    server = AntigravityMCPServer()
    print(f"   Server Name: {server.name}")
    print(f"   Version: {server.version}")

    if server.name != "antigravity":
        print(f"❌ Expected name 'antigravity', got {server.name}")
        return False

    # 2. Test get_tools
    print("\n2. Testing get_tools()...")
    tools = server.get_tools()
    print(f"   Tools found: {len(tools)}")

    tool_names = [t["name"] for t in tools]
    expected_tools = [
        "antigravity_status",
        "get_agency_dna",
        "get_revenue_metrics",
        "get_vc_score",
        "generate_content",
        "add_lead",
        "win_win_win_check"
    ]

    for expected in expected_tools:
        if expected not in tool_names:
            print(f"❌ Missing tool: {expected}")
            return False

    print("   All expected tools present ✅")

    # 3. Test antigravity_status
    print("\n3. Testing antigravity_status...")
    response = await server.handle_tool("antigravity_status", {})
    print(f"   Success: {response.success}")
    print(f"   Message: {response.message}")

    if not response.success:
        print("❌ antigravity_status failed")
        return False

    if "modules" not in response.data:
        print("❌ Response data missing 'modules'")
        return False

    print("   Status check passed ✅")

    # 4. Test win_win_win_check (Validation Logic)
    print("\n4. Testing win_win_win_check...")

    # Case A: Missing wins
    print("   Case A: Incomplete wins...")
    res_incomplete = await server.handle_tool("win_win_win_check", {
        "decision": "Hire new dev",
        "anh_win": "Less work"
    })

    if res_incomplete.data["approved"]:
        print("❌ Should verify false when wins are missing")
        return False

    # Case B: All wins present
    print("   Case B: Complete wins...")
    res_complete = await server.handle_tool("win_win_win_check", {
        "decision": "Hire new dev",
        "anh_win": "Scale faster",
        "agency_win": "More capacity",
        "startup_win": "Better product"
    })

    if not res_complete.data["approved"]:
        print("❌ Should verify true when all wins present")
        return False

    print("   WIN-WIN-WIN logic passed ✅")

    # 5. Test Facade Import
    print("\n5. Testing Facade Import...")
    try:
        from antigravity.mcp_server import AntigravityMCPServer as FacadeServer
        f_server = FacadeServer()
        if f_server.name != "antigravity":
            print("❌ Facade import failed integrity check")
            return False
        print("   Facade import works ✅")
    except ImportError as e:
        print(f"❌ Failed to import from facade: {e}")
        return False

    print("\n✅ Verification Successful!")
    return True

if __name__ == "__main__":
    try:
        if asyncio.run(test_mcp_server_logic()):
            sys.exit(0)
        else:
            sys.exit(1)
    except Exception as e:
        print(f"\n❌ Exception during verification: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
