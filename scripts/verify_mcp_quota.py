
import asyncio
import logging
import sys
from pathlib import Path

# Add project root to path
sys.path.insert(0, str(Path.cwd()))

from antigravity.core.mcp_orchestrator import MCPOrchestrator

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("verify_quota")

async def test_quota_server():
    print("🧪 Testing Quota MCP Server...")

    orchestrator = MCPOrchestrator()
    orchestrator.start_monitoring()

    # 1. Probe Server
    print("   Probing 'quota' server...")
    tools = await orchestrator.probe_server("quota")

    if not tools:
        print("❌ Failed to probe server or no tools found.")
        return False

    print(f"   ✅ Found {len(tools)} tools: {[t['name'] for t in tools]}")

    # 2. Call get_status
    print("   Calling 'get_status'...")
    status_result = await orchestrator.call_tool("get_status", {})

    if not status_result.get("success"):
        print(f"❌ Get status failed: {status_result.get('error')}")
        return False

    models = status_result["result"].get("models", [])
    print(f"   ✅ Status retrieved. Found {len(models)} models.")

    # 3. Call get_optimal_model
    print("   Calling 'get_optimal_model'...")
    optimal_result = await orchestrator.call_tool("get_optimal_model", {"task_type": "coding"})

    if not optimal_result.get("success"):
        print(f"❌ Get optimal model failed: {optimal_result.get('error')}")
        return False

    print(f"   ✅ Optimal model: {optimal_result.get('result')}")

    # 4. Call get_cli_report
    print("   Calling 'get_cli_report'...")
    report_result = await orchestrator.call_tool("get_cli_report", {"format_type": "compact"})

    if not report_result.get("success"):
        print(f"❌ Get CLI report failed: {report_result.get('error')}")
        return False

    report_len = len(report_result.get("result", ""))
    print(f"   ✅ Report generated ({report_len} chars)")

    print("\n🎉 MCP Quota Server Verification Passed!")
    return True

if __name__ == "__main__":
    try:
        success = asyncio.run(test_quota_server())
        if not success:
            sys.exit(1)
    except KeyboardInterrupt:
        pass
