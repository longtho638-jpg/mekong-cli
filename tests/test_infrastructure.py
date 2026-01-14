"""
Tests for Infrastructure system.
"""

import sys
import os
import pytest

# Add parent to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from antigravity.core.infrastructure import InfrastructureStack, StackLayer

class TestInfrastructure:
    
    def test_stack_initialization(self):
        """Verify all 10 layers are initialized."""
        stack = InfrastructureStack()
        assert len(stack.layers) == 10
        assert StackLayer.DATABASE in stack.layers
        assert StackLayer.BACKUP in stack.layers

    def test_health_score(self):
        """Test health calculation logic."""
        stack = InfrastructureStack()
        score = stack.get_health_score()
        # Default is 'configured' (90) for all 10 layers
        assert score == 90

    def test_layer_update(self):
        """Test updating layer status."""
        stack = InfrastructureStack()
        stack.update_layer(StackLayer.DATABASE, "running")
        
        # 1 layer running (100), 9 layers configured (90)
        # Total = 100 + 810 = 910. 910 / 10 = 91
        assert stack.get_health_score() == 91

if __name__ == "__main__":
    pytest.main([__file__])
