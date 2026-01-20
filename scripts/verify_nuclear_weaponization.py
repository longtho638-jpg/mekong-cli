import asyncio
import sys
from pathlib import Path

# Add project root to path
sys.path.append(str(Path(__file__).parent.parent))

from antigravity.core.agent_chains import register_chain
from antigravity.core.agent_orchestrator.engine import AgentOrchestrator
from antigravity.core.chains import AgentStep
from antigravity.core.quota_service import quota_service


async def run_verification():
    print("🚀 Starting Nuclear Weaponization Verification...")
    
    # 1. Verify Quota Service
    print("\n💸 Verifying Quota Service...")
    status = quota_service.get_status()
    print(f"Detected {len(status.get('models', []))} models in quota pool.")
    
    optimal = quota_service.get_optimal_model()
    print(f"Optimal model for current task: {optimal}")
    
    report = quota_service.get_cli_report()
    print("\n--- Quota Report ---")
    print(report)
    print("--------------------")

    # 2. Verify Win-Win-Win Gate Enforcement (Global)
    print("\n🏯 Verifying Win-Win-Win Gate Enforcement...")
    orchestrator = AgentOrchestrator(verbose=True)
    
    # Register a dummy test chain
    register_chain("test", "win", [
        AgentStep(agent="planner", action="test", description="Test step")
    ])

    print("\n--- Case A: Missing Win (Should fail) ---")
    context_fail = {"anh_win": "Owner profit", "agency_win": ""} # agency_win is missing
    result_fail = orchestrator.run("test", "win", context_fail)
    
    if not result_fail.success and "BLOCKED" in result_fail.output:
        print("✅ Correctly blocked action with missing WIN.")
    else:
        print("❌ Failed to block action with missing WIN.")

    print("\n--- Case B: Full Win (Should pass) ---")
    context_pass = {
        "anh_win": "Owner profit", 
        "agency_win": "Infrastructure improved", 
        "startup_win": "Client value"
    }
    result_pass = orchestrator.run("test", "win", context_pass)
    
    if result_pass.success:
        print("✅ Correctly allowed action with full WIN-WIN-WIN.")
    else:
        print(f"❌ Blocked valid action. Error: {result_pass.output}")

    # 3. Verify Ops Command Registration
    print("\n⚙️ Verifying Ops Command Registration...")
    from antigravity.core.registry.store import COMMAND_REGISTRY
    if "ops" in COMMAND_REGISTRY and "quota" in COMMAND_REGISTRY["ops"]["subcommands"]:
        print("✅ 'ops:quota' command successfully registered.")
    else:
        print("❌ 'ops:quota' command NOT found in registry.")

    print("\n🎉 Verification Complete!")

if __name__ == "__main__":
    asyncio.run(run_verification())
