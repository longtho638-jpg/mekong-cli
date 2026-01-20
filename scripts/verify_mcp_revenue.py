
import asyncio
import logging
import sys
from pathlib import Path

# Add project root to path
sys.path.insert(0, str(Path.cwd()))

from antigravity.core.mcp_orchestrator import MCPOrchestrator

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("verify_revenue")

async def test_revenue_server():
    print("🧪 Testing Revenue MCP Server...")

    orchestrator = MCPOrchestrator()
    orchestrator.start_monitoring()

    # 1. Probe Server
    print("   Probing 'revenue' server...")
    tools = await orchestrator.probe_server("revenue")

    if not tools:
        print("❌ Failed to probe server or no tools found.")
        return False

    print(f"   ✅ Found {len(tools)} tools: {[t['name'] for t in tools]}")

    # 2. Call check_sales
    print("   Calling 'check_sales'...")
    sales_result = await orchestrator.call_tool("check_sales", {})

    if not sales_result.get("success"):
        print(f"❌ Sales check failed: {sales_result.get('error')}")
        return False

    print(f"   ✅ Sales check successful: {sales_result.get('result')}")

    # 3. Call generate_content
    print("   Calling 'generate_content'...")
    content_result = await orchestrator.call_tool("generate_content", {"count": 2})

    if not content_result.get("success"):
        print(f"❌ Content generation failed: {content_result.get('error')}")
        return False

    ideas = content_result["result"].get("ideas", [])
    print(f"   ✅ Generated {len(ideas)} ideas: {ideas}")

    # 4. Call get_report
    print("   Calling 'get_report'...")
    report_result = await orchestrator.call_tool("get_report", {})

    if not report_result.get("success"):
        print(f"❌ Get report failed: {report_result.get('error')}")
        return False

    print(f"   ✅ Report: {report_result.get('result')}")

    print("\n🎉 MCP Revenue Server Verification Passed!")
    return True

if __name__ == "__main__":
    try:
        success = asyncio.run(test_revenue_server())
        if not success:
            sys.exit(1)
    except KeyboardInterrupt:
        pass
