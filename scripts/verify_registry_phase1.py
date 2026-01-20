
import os
import sys

# Add project root to path
sys.path.append(os.getcwd())

from antigravity.core.registry.api import resolve_command, search_capabilities
from antigravity.core.registry.mcp_catalog import mcp_catalog


def test_registry_integration():
    print("🔌 Testing Registry Bridge...")

    # 1. Register a dummy MCP tool
    print("   Registering dummy MCP server...")
    mcp_catalog.register_server(
        "dummy-server",
        {"command": "echo"},
        [
            {
                "name": "dummy-tool",
                "description": "A tool for testing registry integration",
                "inputSchema": {"type": "object"}
            }
        ]
    )

    # 2. Test resolve_command with 'mcp:' prefix
    print("   Testing resolve_command('mcp:dummy-tool')...")
    suite, cmd, meta = resolve_command("mcp:dummy-tool")
    if suite == "mcp" and cmd == "dummy-tool":
        print("   ✅ Resolved mcp:dummy-tool correctly")
    else:
        print(f"   ❌ Failed to resolve mcp:dummy-tool: {suite}, {cmd}")
        return False

    # 3. Test resolve_command fallback (no prefix)
    print("   Testing resolve_command('dummy-tool')...")
    suite, cmd, meta = resolve_command("dummy-tool")
    if suite == "mcp" and cmd == "dummy-tool":
        print("   ✅ Resolved dummy-tool (fallback) correctly")
    else:
        print(f"   ❌ Failed to resolve dummy-tool (fallback): {suite}, {cmd}")
        return False

    # 4. Test search_capabilities
    print("   Testing search_capabilities('dummy')...")
    results = search_capabilities("dummy")
    mcp_results = results.get("mcp", [])
    if any(r["tool"]["name"] == "dummy-tool" for r in mcp_results):
        print("   ✅ Found dummy-tool in search results")
    else:
        print(f"   ❌ Failed to find dummy-tool in search: {results}")
        return False

    # 5. Test search_capabilities for local command
    print("   Testing search_capabilities('quote')...")
    results = search_capabilities("quote")
    local_results = results.get("local", [])
    if any("quote" in r["name"] for r in local_results):
        print("   ✅ Found quote command in local search results")
    else:
        print(f"   ❌ Failed to find quote in search: {results}")
        return False

    print("\n🎉 Phase 1 Registry Verification Passed!")
    return True

if __name__ == "__main__":
    if test_registry_integration():
        sys.exit(0)
    else:
        sys.exit(1)
