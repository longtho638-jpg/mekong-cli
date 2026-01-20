import asyncio
import os
import sys
from pathlib import Path

# Add project root to path
sys.path.append(str(Path(__file__).parent.parent))

from antigravity.core.agent_memory.blackboard import blackboard
from antigravity.core.agent_orchestrator.engine import AgentOrchestrator
from antigravity.core.chains.loader import AgentStep, Chain


def setup_mock_chains(orchestrator):
    # Mocking get_chain_obj to return our test chains
    def mock_get_chain_obj(suite, subcommand):
        if suite == "test" and subcommand == "graph":
            return Chain(
                name="test:graph",
                description="Test graph execution",
                agents=[
                    AgentStep(id="start", agent="planner", action="plan", description="Start planning"),
                    AgentStep(
                        id="parallel_work",
                        description="Do things in parallel",
                        parallel=[
                            AgentStep(agent="researcher", action="research", description="Sub-research"),
                            AgentStep(agent="copywriter", action="draft", description="Sub-draft")
                        ]
                    ),
                    AgentStep(
                        id="check",
                        agent="tester",
                        action="verify",
                        description="Conditional check",
                        condition="is_ready"
                    ),
                    AgentStep(
                        id="finish",
                        agent="git-manager",
                        action="commit",
                        description="Final step"
                    )
                ]
            )
        return None
    
    import antigravity.core.agent_orchestrator.engine as engine_mod
    engine_mod.get_chain_obj = mock_get_chain_obj

async def run_verification():
    print("🚀 Starting Agent Swarm Expansion Verification...")
    
    orchestrator = AgentOrchestrator(verbose=True)
    setup_mock_chains(orchestrator)
    
    # 1. Test Blackboard Scoped access
    print("\n🧠 Testing Blackboard Scoped Access...")
    with blackboard.scope("test_ns"):
        blackboard.set("key1", "val1", "test_ns")
        print(f"Set key1=val1 in test_ns. Read back: {blackboard.get('key1', 'test_ns')}")
    
    # 2. Test Parallel & Conditional Execution
    print("\n🌿 Testing Graph Execution (Parallel & Conditional)...")
    
    print("--- First run: condition 'is_ready' is FALSE (should skip step 'check') ---")
    blackboard.set("is_ready", False)
    result1 = orchestrator.run("test", "graph")
    
    step_ids = [s.action for s in result1.steps]
    print(f"Executed actions: {step_ids}")
    
    if "verify" not in step_ids:
        print("✅ Condition 'is_ready=False' correctly skipped the 'check' step.")
    else:
        print("❌ Condition 'is_ready=False' failed to skip step.")

    print("\n--- Second run: condition 'is_ready' is TRUE (should include step 'check') ---")
    blackboard.set("is_ready", True)
    result2 = orchestrator.run("test", "graph")
    
    step_ids = [s.action for s in result2.steps]
    print(f"Executed actions: {step_ids}")
    
    if "verify" in step_ids:
        print("✅ Condition 'is_ready=True' correctly included the 'check' step.")
    else:
        print("❌ Condition 'is_ready=True' failed to include step.")

    # 3. Test Mermaid Export
    print("\n📊 Testing Mermaid Export...")
    mermaid = orchestrator.reporting.export_mermaid(result2)
    print("Generated Mermaid Diagram:")
    print("-" * 20)
    print(mermaid)
    print("-" * 20)
    
    if "graph TD" in mermaid and "tester" in mermaid:
        print("✅ Mermaid export successful.")
    else:
        print("❌ Mermaid export failed or missing data.")

    print("\n🎉 Verification Complete!")

if __name__ == "__main__":
    asyncio.run(run_verification())
