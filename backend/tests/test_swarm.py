import pytest
from antigravity.core.swarm.bus import MessageBus
from antigravity.core.swarm.types import AgentMessage, MessageType
from antigravity.core.swarm.agent import BaseSwarmAgent

class TestAgent(BaseSwarmAgent):
    def __init__(self, agent_id, name, bus):
        super().__init__(agent_id, name, bus)
        self.received = []

    def on_message(self, message: AgentMessage):
        self.received.append(message)

def test_message_bus():
    bus = MessageBus()
    agent = TestAgent("test-agent", "Test", bus)

    # Test direct message
    msg = AgentMessage(sender="system", recipient="test-agent", content="Hello")
    bus.publish(msg)

    assert len(agent.received) == 1
    assert agent.received[0].content == "Hello"

def test_broadcast():
    bus = MessageBus()
    agent1 = TestAgent("agent1", "A1", bus)
    agent2 = TestAgent("agent2", "A2", bus)

    msg = AgentMessage(sender="system", recipient="all", content="Broadcast")
    bus.publish(msg) # Bus logic needs to handle 'all'

    # Note: Our simple bus implementation checks "all" subscription
    # BaseSwarmAgent subscribes to "broadcast"?
    # Let's check bus.py logic for 'all'.
