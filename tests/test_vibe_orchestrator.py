"""
Tests for VIBE Orchestrator system.
"""

import sys
import os
import pytest
from datetime import datetime

# Add parent to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from antigravity.core.vibe_orchestrator import VIBEOrchestrator, AgentType

class TestVIBEOrchestrator:
    
    def test_task_creation(self):
        """Test task queuing."""
        orc = VIBEOrchestrator()
        task = orc.create_task(AgentType.PLANNER, "Plan the refactor")
        
        assert len(orc.task_queue) == 1
        assert task.agent == AgentType.PLANNER
        assert task.prompt == "Plan the refactor"

    def test_sequential_execution(self):
        """Test linear agent chaining."""
        orc = VIBEOrchestrator()
        t1 = orc.create_task(AgentType.PLANNER, "P1")
        t2 = orc.create_task(AgentType.IMPLEMENTER, "I1")
        
        result = orc.execute_sequential([t1, t2])
        assert result.success is True
        assert len(result.tasks) == 2
        assert t1.status == "completed"
        assert t2.status == "completed"

    def test_agent_registration(self):
        """Test custom agent handler."""
        orc = VIBEOrchestrator()
        
        def mock_handler(prompt):
            return f"Processed: {prompt}"
            
        orc.register_agent(AgentType.TESTER, mock_handler)
        task = orc.delegate(AgentType.TESTER, "Test the app")
        
        assert task.output == "Processed: Test the app"
        assert task.status == "completed"

if __name__ == "__main__":
    pytest.main([__file__])
