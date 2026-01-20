import asyncio
import json
import os
import sys
from pathlib import Path

# Add project root to path (absolute path)
project_root = str(Path(os.getcwd()).absolute())
if project_root not in sys.path:
    sys.path.append(project_root)

from antigravity.core.mcp_manager import MCPServerConfig
from antigravity.core.mcp_orchestrator import mcp_orchestrator
from antigravity.core.registry.mcp_catalog import mcp_catalog


async def run_verification():
    print("🚀 Starting MCP Scaling Verification...")
    
    # 1. Register multiple mock servers
    # We'll use a simple python command that echoes JSON as a mock MCP server
    mock_server_script = """
import sys
import json
for line in sys.stdin:
    try:
        req = json.loads(line)
        if req.get("method") == "tools/list":
            resp = {"jsonrpc": "2.0", "id": req.get("id"), "result": {"tools": [{"name": "echo_tool", "description": "Echoes input"}]}}
        elif req.get("method") == "tools/call":
            resp = {"jsonrpc": "2.0", "id": req.get("id"), "result": {"content": [{"type": "text", "text": f"Echo: {req['params']['arguments'].get('text', '')}"}]}}
        else:
            resp = {"jsonrpc": "2.0", "id": req.get("id"), "error": {"message": "Unknown method"}}
        print(json.dumps(resp), flush=True)
    except Exception as e:
        pass
"""
    mock_script_path = Path("/tmp/mock_mcp_server.py")
    mock_script_path.write_text(mock_server_script)
    
    server_names = [f"server_{i}" for i in range(5)]
    for name in server_names:
        config = MCPServerConfig(
            command=sys.executable,
            args=[str(mock_script_path)]
        )
        mcp_catalog.register_server(name, {"command": config.command, "args": config.args}, None)
        print(f"✅ Registered {name} (unprobed)")

    # 2. Verify Lazy Loading & Probing
    print("\n🔍 Verifying Lazy Probing...")
    unprobed = mcp_catalog.get_unprobed_servers()
    print(f"Unprobed servers: {unprobed}")

    # Set limit BEFORE probing to see eviction during probing
    mcp_orchestrator.max_concurrent = 2
    print(f"Set max_concurrent = {mcp_orchestrator.max_concurrent}")

    for name in server_names:
        tools = await mcp_orchestrator.probe_server(name)
        print(f"Server {name} probed. Tools: {[t['name'] for t in tools]}")
        active = [n for n, p in mcp_orchestrator.processes.items() if p.is_alive()]
        print(f"Active servers: {active}")

    # 3. Verify Max Concurrency usage
    print("\n⚖️ Verifying Max Concurrency usage...")

    # Call tools on different servers
    print("Calling server_0...")
    await mcp_orchestrator.call_tool("echo_tool", {"text": "hello from 0"})
    print("Calling server_4...")
    await mcp_orchestrator.call_tool("echo_tool", {"text": "hello from 4"})

    active = [name for name, proc in mcp_orchestrator.processes.items() if proc.is_alive()]
    print(f"Active servers: {active}")

    if len(active) <= mcp_orchestrator.max_concurrent:
        print(f"✅ Active servers count ({len(active)}) is within limit ({mcp_orchestrator.max_concurrent}).")
    else:
        print(f"❌ Active servers count ({len(active)}) EXCEEDS limit ({mcp_orchestrator.max_concurrent}).")

    # 4. Verify TTL Termination
    print("\n⏱️ Verifying TTL Termination (TTL = 2s)...")
    mcp_orchestrator.ttl = 2
    print("Waiting 3 seconds for idle servers to expire...")
    await asyncio.sleep(3)
    await mcp_orchestrator.cleanup_idle()
    
    active = [name for name, proc in mcp_orchestrator.processes.items() if proc.is_alive()]
    print(f"Active servers after TTL: {active}")
    
    if not active:
        print("✅ All idle servers terminated after TTL.")
    else:
        print(f"❌ Some servers still active: {active}")

    print("\n🎉 Verification Complete!")

if __name__ == "__main__":
    asyncio.run(run_verification())
