
import asyncio
import logging
import sys
from pathlib import Path

# Add project root to path
sys.path.insert(0, str(Path.cwd()))

from antigravity.core.mcp_orchestrator import MCPOrchestrator
from antigravity.core.registry.mcp_catalog import mcp_catalog

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("verify_mcp")

async def test_workflow_server():
    print("🧪 Testing Workflow MCP Server...")

    orchestrator = MCPOrchestrator()
    orchestrator.start_monitoring()

    # 1. Probe Server
    print("   Probing 'workflow' server...")
    tools = await orchestrator.probe_server("workflow")

    if not tools:
        print("❌ Failed to probe server or no tools found.")
        return False

    print(f"   ✅ Found {len(tools)} tools: {[t['name'] for t in tools]}")

    # 2. Call list_workflows
    print("   Calling 'list_workflows'...")
    result = await orchestrator.call_tool("list_workflows", {})

    if not result.get("success"):
        print(f"❌ Call failed: {result.get('error')}")
        return False

    workflows = result.get("result", [])
    print(f"   ✅ Call successful. Found {len(workflows)} workflows.")

    # 3. Call create_workflow
    print("   Calling 'create_workflow'...")
    new_wf_name = "Test Workflow via MCP"
    create_result = await orchestrator.call_tool("create_workflow", {
        "name": new_wf_name,
        "trigger_type": "manual"
    })

    if not create_result.get("success"):
        print(f"❌ Create failed: {create_result.get('error')}")
        return False

    wf_id = create_result["result"]["workflow_id"]
    print(f"   ✅ Created workflow: {wf_id}")

    # 4. Execute workflow
    print(f"   Executing workflow {wf_id}...")
    exec_result = await orchestrator.call_tool("execute_workflow", {
        "workflow_id": wf_id
    })

    if not exec_result.get("success"):
        print(f"❌ Execution failed: {exec_result.get('error')}")
        return False

    print("   ✅ Execution successful.")

    print("\n🎉 MCP Workflow Server Verification Passed!")
    return True

if __name__ == "__main__":
    try:
        success = asyncio.run(test_workflow_server())
        if not success:
            sys.exit(1)
    except KeyboardInterrupt:
        pass
