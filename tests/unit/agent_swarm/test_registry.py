import pytest
from antigravity.core.agent_swarm.registry import AgentRegistry
from antigravity.core.agent_swarm.enums import AgentRole

class TestAgentRegistry:
    @pytest.fixture
    def registry(self):
        return AgentRegistry()

    def test_register_agent(self, registry):
        def handler(p): return p
        agent_id = registry.register("TestAgent", handler, AgentRole.WORKER, ["test"])
        
        assert agent_id.startswith("agent_")
        assert agent_id in registry.agents
        agent = registry.agents[agent_id]
        assert agent.name == "TestAgent"
        assert agent.role == AgentRole.WORKER
        assert agent.handler == handler
        assert agent.specialties == ["test"]

    def test_get_agent(self, registry):
        def handler(p): return p
        agent_id = registry.register("TestAgent", handler)
        
        retrieved = registry.get_agent(agent_id)
        assert retrieved is not None
        assert retrieved.id == agent_id
        
        assert registry.get_agent("non_existent") is None

    def test_get_all_agents(self, registry):
        def handler(p): return p
        registry.register("Agent1", handler)
        registry.register("Agent2", handler)
        
        all_agents = registry.get_all_agents()
        assert len(all_agents) == 2
        # Verify it's a copy
        all_agents["rogue"] = None
        assert "rogue" not in registry.agents

    def test_get_available_agents(self, registry):
        def handler(p): return p
        
        # Available
        a1 = registry.register("Worker", handler, AgentRole.WORKER)
        a2 = registry.register("Specialist", handler, AgentRole.SPECIALIST)
        
        # Not available (busy)
        a3_id = registry.register("BusyWorker", handler, AgentRole.WORKER)
        registry.agents[a3_id].is_busy = True
        
        # Not available (wrong role for WORKER/SPECIALIST pool)
        a4 = registry.register("Coordinator", handler, AgentRole.COORDINATOR)
        
        available = registry.get_available_agents()
        assert len(available) == 2
        ids = [a.id for a in available]
        assert a1 in ids
        assert a2 in ids
        assert a3_id not in ids
        assert a4 not in ids
