
import asyncio
import logging
import sys
from pathlib import Path

# Add project root to path
sys.path.insert(0, str(Path.cwd()))

from antigravity.core.mcp_orchestrator import MCPOrchestrator

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("verify_all")

async def verify_all():
    print("🚀 Verifying All Migrated MCP Servers (P0 & P1)...")

    orchestrator = MCPOrchestrator()
    orchestrator.start_monitoring()

    servers = [
        "workflow",
        "revenue",
        "solo_revenue",
        "commander",
        "quota",
        "marketing",
        "coding",
        "agency",
        "security",
        "network",
        "orchestrator",
        "recovery",
        "sync",
        "ui"
    ]

    results = {}

    for server in servers:
        print(f"\nTesting '{server}'...")
        try:
            tools = await orchestrator.probe_server(server)
            if tools:
                print(f"   ✅ Online. Tools: {len(tools)}")
                results[server] = "PASS"
            else:
                print("   ❌ Failed to probe.")
                results[server] = "FAIL"
        except Exception as e:
            print(f"   ❌ Error: {e}")
            results[server] = "ERROR"

    print("\n" + "="*40)
    print("SUMMARY")
    print("="*40)
    for server, status in results.items():
        icon = "✅" if status == "PASS" else "❌"
        print(f"{icon} {server:<15} {status}")

    if all(s == "PASS" for s in results.values()):
        print("\n🎉 ALL SYSTEMS GO!")
        return True
    else:
        print("\n⚠️ SOME SYSTEMS FAILED")
        return False

if __name__ == "__main__":
    try:
        success = asyncio.run(verify_all())
        if not success:
            sys.exit(1)
    except KeyboardInterrupt:
        pass
