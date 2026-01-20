
import asyncio
import logging
import sys
from pathlib import Path

# Add project root to path
sys.path.insert(0, str(Path.cwd()))

from antigravity.core.mcp_orchestrator import MCPOrchestrator

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("verify_commander")

async def test_commander_server():
    print("🧪 Testing Commander MCP Server...")

    orchestrator = MCPOrchestrator()
    orchestrator.start_monitoring()

    # 1. Probe Server
    print("   Probing 'commander' server...")
    tools = await orchestrator.probe_server("commander")

    if not tools:
        print("❌ Failed to probe server or no tools found.")
        return False

    print(f"   ✅ Found {len(tools)} tools: {[t['name'] for t in tools]}")

    # 2. Call check_system (proxy)
    print("   Calling 'check_system' for proxy...")
    proxy_result = await orchestrator.call_tool("check_system", {"system_name": "proxy"})

    if not proxy_result.get("success"):
        print(f"❌ Check proxy failed: {proxy_result.get('error')}")
        # Not failing the whole test because proxy might not be running, but tool call succeeded
    else:
        print(f"   ✅ Proxy status: {proxy_result.get('status')}")

    # 3. Call get_dashboard
    print("   Calling 'get_dashboard'...")
    dashboard_result = await orchestrator.call_tool("get_dashboard", {})

    if not dashboard_result.get("success"):
        print(f"❌ Get dashboard failed: {dashboard_result.get('error')}")
        return False

    summary = dashboard_result["result"].get("summary")
    print(f"   ✅ Dashboard summary: {summary}")

    print("\n🎉 MCP Commander Server Verification Passed!")
    return True

if __name__ == "__main__":
    try:
        success = asyncio.run(test_commander_server())
        if not success:
            sys.exit(1)
    except KeyboardInterrupt:
        pass
