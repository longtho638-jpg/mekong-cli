
import asyncio
import logging
import sys
from pathlib import Path

# Add project root to path
sys.path.insert(0, str(Path.cwd()))

from antigravity.core.mcp_orchestrator import MCPOrchestrator

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("verify_solo_revenue")

async def test_solo_revenue_server():
    print("🧪 Testing Solo Revenue MCP Server...")

    orchestrator = MCPOrchestrator()
    orchestrator.start_monitoring()

    # 1. Probe Server
    print("   Probing 'solo_revenue' server...")
    tools = await orchestrator.probe_server("solo_revenue")

    if not tools:
        print("❌ Failed to probe server or no tools found.")
        return False

    print(f"   ✅ Found {len(tools)} tools: {[t['name'] for t in tools]}")

    # 2. Call list_tasks
    print("   Calling 'list_tasks'...")
    list_result = await orchestrator.call_tool("list_tasks", {})

    if not list_result.get("success"):
        print(f"❌ List tasks failed: {list_result.get('error')}")
        return False

    tasks = list_result.get("result", [])
    print(f"   ✅ Found {len(tasks)} tasks: {tasks}")

    # 3. Call execute_task (run a safe one, e.g. weekly_content)
    # We choose one that doesn't side effect too much or requires less setup
    task_to_run = "weekly_content"
    print(f"   Calling 'execute_task' for {task_to_run}...")

    exec_result = await orchestrator.call_tool("execute_task", {
        "task_id": task_to_run,
        "override_config": {"type": "tweet", "niche": "testing"}
    })

    if not exec_result.get("success"):
        print(f"❌ Execution failed: {exec_result.get('error')}")
        return False

    print(f"   ✅ Execution result: {exec_result.get('result')}")

    # 4. Call get_status
    print("   Calling 'get_status'...")
    status_result = await orchestrator.call_tool("get_status", {})

    if not status_result.get("success"):
        print(f"❌ Get status failed: {status_result.get('error')}")
        return False

    state = status_result["result"].get("state", {})
    print(f"   ✅ Status: Tasks Completed={state.get('tasks_completed')}")

    print("\n🎉 MCP Solo Revenue Server Verification Passed!")
    return True

if __name__ == "__main__":
    try:
        success = asyncio.run(test_solo_revenue_server())
        if not success:
            sys.exit(1)
    except KeyboardInterrupt:
        pass
