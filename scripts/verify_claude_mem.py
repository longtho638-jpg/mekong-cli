
import asyncio
import json
import logging
from antigravity.core.mcp_orchestrator import mcp_orchestrator
from antigravity.core.registry.mcp_catalog import mcp_catalog

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("verify_claude_mem")

async def verify():
    server_name = "claude-mem"

    print(f"🔍 Probing server: {server_name}...")

    # Force probe
    tools = await mcp_orchestrator.probe_server(server_name)

    if not tools:
        print(f"❌ Failed to probe {server_name} or no tools found.")
        return

    print(f"✅ Found {len(tools)} tools:")
    for tool in tools:
        print(f"  - {tool['name']}: {tool.get('description', '')[:50]}...")

    # Try to call a tool if available (e.g. create_collection or similar if it's chroma-mcp)
    # or just simple read/search if available.

    # Based on chroma-mcp, likely tools: 'create_collection', 'add_documents', 'query_collection'
    # But claude-mem might wrap them. The installer said "chroma-mcp".

    print("\n💾 Updating catalog...")
    mcp_catalog.mark_probed(server_name, tools)
    print("✅ Catalog updated.")

if __name__ == "__main__":
    asyncio.run(verify())
